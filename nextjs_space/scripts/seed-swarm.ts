import { prisma } from '../lib/core/db';
import { redis } from '../lib/core/redis';
import { ensureSpeciesSeeded, reconcileInstances } from '../lib/swarm/registry';
import { enqueueJob } from '../lib/swarm/queue';
import { JobStage } from '@prisma/client';

async function seedSwarm() {
  console.log('=== FORGE SWARM SEEDING INITIALIZATION ===');

  // 1. Seed Species Registry with A2 approved budgets
  console.log('Seeding species registry & reconciling instances...');
  await ensureSpeciesSeeded();
  await reconcileInstances();
  console.log('Species registry and instances reconciled.');

  // 2. Enqueue jobs for TWO reference catalog items:
  // Item 1: Geometric (HEAD slot: head_diamond_crown)
  // Item 2: Dynamic (AURA slot: aura_plasma_fire)
  const targetItems = [
    { id: 'head_diamond_crown', slot: 'HEAD', rarity: 'LEGENDARY' },
    { id: 'aura_plasma_fire', slot: 'AURA', rarity: 'EPIC' },
  ];

  for (const item of targetItems) {
    // Check if job exists
    let job = await prisma.assetJob.findFirst({
      where: { catalogItemId: item.id },
    });

    if (!job) {
      job = await prisma.assetJob.create({
        data: {
          catalogItemId: item.id,
          slot: item.slot,
          rarity: item.rarity,
          stage: JobStage.SPEC_DESIGN,
          priority: 0, // High priority test seed
          attempts: 0,
        },
      });
      console.log(`Created AssetJob for ${item.id} (Stage: ${job.stage}, ID: ${job.id})`);
    } else {
      job = await prisma.assetJob.update({
        where: { id: job.id },
        data: {
          rarity: item.rarity,
          stage: JobStage.SPEC_DESIGN,
          attempts: 0,
        },
      });
      console.log(`Reset AssetJob for ${item.id} (Stage: ${job.stage}, ID: ${job.id})`);
    }

    await enqueueJob(job.id, 0);
  }

  console.log('=== FORGE SWARM SEEDING COMPLETE ===');
}

seedSwarm()
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  })
  .finally(async () => {
    redis.disconnect();
    await prisma.$disconnect();
  });
