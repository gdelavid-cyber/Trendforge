import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/core/db';
import { COSMETICS_CATALOG } from '@/lib/experience/cosmetics/catalog';
import { enqueueJob } from '@/lib/swarm/queue';
import { JobStage, SpeciesRole } from '@prisma/client';
import { SpeciesContext, SpeciesResult } from './types';

/**
 * Scans catalog for unfulfilled artPending items and enqueues up to 10 jobs per pulse.
 * Path A: new items not yet in-flight and not yet published.
 * Path B: published items with artPending=true (placeholder art) not actively in-flight,
 *         bounded by poison guard (max 4 total AssetJob rows per item).
 */
export async function runScout(ctx: SpeciesContext = {}): Promise<SpeciesResult> {
  const cosmeticsDir = path.join(process.cwd(), 'public', 'cosmetics');
  if (!fs.existsSync(cosmeticsDir)) {
    fs.mkdirSync(cosmeticsDir, { recursive: true });
  }

  // A8 fix: active in-flight excludes COMPLETED so re-art Path B can fire
  const activeInFlightJobs = await prisma.assetJob.findMany({
    where: {
      stage: { notIn: [JobStage.FAILED, JobStage.DEAD_LETTER, JobStage.COMPLETED] },
    },
    select: { catalogItemId: true },
  });
  const activeInFlightIds = new Set(activeInFlightJobs.map((j) => j.catalogItemId));

  // Find all DB cosmetics with existing published assets; also track which have real art
  // (renderConfig.realArt === true) so Path B skips already re-arted items.
  const existingDbCosmetics = await prisma.cosmetic.findMany({
    where: {
      OR: [{ renderConfig: { not: null as any } }, { assetUrl: { not: null as any } }],
    },
    select: { id: true, name: true, renderConfig: true },
  });
  const publishedIds = new Set(existingDbCosmetics.map((c) => c.id || c.name));
  // Items where renderConfig already carries realArt: true are done — Path B must skip them
  const realArtIds = new Set(
    existingDbCosmetics
      .filter((c) => (c.renderConfig as any)?.realArt === true)
      .map((c) => c.id || c.name)
  );


  let enqueuedCount = 0;
  let reArtCount = 0;
  const maxPerPulse = 10;
  const maxReArtPerPulse = 2;
  const newlyCreatedJobs: string[] = [];

  for (const item of COSMETICS_CATALOG) {
    if (enqueuedCount >= maxPerPulse) break;

    const isActiveInFlight = activeInFlightIds.has(item.id);
    const isPublished = publishedIds.has(item.id);

    // ------------------------------------------------------------------
    // Path A: new items — not active in-flight, not published
    // ------------------------------------------------------------------
    if (!isActiveInFlight && !isPublished) {
      const diskPng = path.join(cosmeticsDir, `${item.id}.png`);
      const hasDiskAsset = fs.existsSync(diskPng);

      if (item.artPending || !hasDiskAsset) {
        if (ctx.dryRun) {
          enqueuedCount++;
          newlyCreatedJobs.push(item.id);
          continue;
        }

        const job = await prisma.assetJob.create({
          data: {
            catalogItemId: item.id,
            slot: item.slot,
            rarity: item.rarity,
            stage: JobStage.SPEC_DESIGN,
            priority: 1,
            attempts: 0,
          },
        });

        await enqueueJob(job.id, 1);
        activeInFlightIds.add(item.id);
        newlyCreatedJobs.push(job.id);
        enqueuedCount++;
      }
      continue;
    }

    // ------------------------------------------------------------------
    // Path B: published items with placeholder art needing re-art.
    // Eligibility: catalog marks artPending=true AND DB renderConfig has no realArt yet.
    // ------------------------------------------------------------------
    if (
      isPublished &&
      !isActiveInFlight &&
      item.artPending === true &&
      !realArtIds.has(item.id) &&
      reArtCount < maxReArtPerPulse
    ) {
      // Poison/churn guard: skip if >= 4 non-DEAD_LETTER rows already exist
      const existingRowCount = await prisma.assetJob.count({
        where: {
          catalogItemId: item.id,
          stage: { not: JobStage.DEAD_LETTER },
        },
      });
      if (existingRowCount >= 4) continue;

      if (ctx.dryRun) {
        reArtCount++;
        enqueuedCount++;
        newlyCreatedJobs.push(`reArt:${item.id}`);
        continue;
      }

      // Fetch most recent non-null promptSpec from prior job rows
      const priorJob = await prisma.assetJob.findFirst({
        where: {
          catalogItemId: item.id,
          promptSpec: { not: null as any },
        },
        orderBy: { createdAt: 'desc' },
        select: { promptSpec: true },
      });

      const entryStage = priorJob?.promptSpec ? JobStage.ART_GENERATION : JobStage.SPEC_DESIGN;

      const job = await prisma.assetJob.create({
        data: {
          catalogItemId: item.id,
          slot: item.slot,
          rarity: item.rarity,
          stage: entryStage,
          priority: 2,
          attempts: 0,
          promptSpec: priorJob?.promptSpec ?? undefined,
        },
      });

      await enqueueJob(job.id, 2);
      activeInFlightIds.add(item.id);
      newlyCreatedJobs.push(job.id);
      reArtCount++;
      enqueuedCount++;
    }
  }

  return {
    success: true,
    costUsd: 0.0,
    data: {
      scannedItems: COSMETICS_CATALOG.length,
      enqueuedJobs: enqueuedCount,
      reArtJobs: reArtCount,
      jobIds: newlyCreatedJobs,
    },
  };
}

