import { prisma } from '@/lib/core/db';
import { AssetJob, JobStage } from '@prisma/client';
import { SpeciesContext, SpeciesResult } from './types';
import { invalidateServerCatalogCache } from '@/lib/experience/cosmetics/server-catalog';

export async function runPublisher(
  job: AssetJob,
  ctx: SpeciesContext = {}
): Promise<SpeciesResult> {
  try {
    const isSyntheticFallback: boolean =
      (job.renderConfig as any)?.providerMetadata?.syntheticFallback === true;

    const assetUrl = `/cosmetics/${job.catalogItemId}.png`;
    const existingRenderConfig: Record<string, unknown> =
      (job.renderConfig as Record<string, unknown>) || {};

    let renderConfig: Record<string, unknown> | null;
    if (isSyntheticFallback) {
      renderConfig = Object.keys(existingRenderConfig).length > 0 ? existingRenderConfig : null;
    } else {
      if (Object.keys(existingRenderConfig).length === 0) {
        renderConfig = {
          kind: '2d_only',
          realArt: true,
          realArtAt: new Date().toISOString(),
          providerMetadata: (job.renderConfig as any)?.providerMetadata
        };
      } else {
        renderConfig = {
          ...existingRenderConfig,
          realArt: true,
          realArtAt: new Date().toISOString(),
        };
      }
    }

    if (!ctx.dryRun) {
      const existing = await prisma.cosmetic.findUnique({
        where: { id: job.catalogItemId },
      });

      if (existing) {
        await prisma.cosmetic.update({
          where: { id: existing.id },
          data: {
            assetUrl,
            renderConfig: renderConfig as any,
          },
        });
      } else {
        await prisma.cosmetic.create({
          data: {
            id: job.catalogItemId,
            name: job.catalogItemId,
            description: `${job.catalogItemId} (${job.slot} - ${job.rarity})`,
            category: 'ACCESSORY',
            rarity: (job.rarity as any) || 'COMMON',
            previewUrl: assetUrl,
            thumbnailUrl: assetUrl,
            assetUrl,
            renderConfig: renderConfig as any,
            price: 50.0,
            marketable: true,
          },
        });
      }

      await prisma.assetJob.update({
        where: { id: job.id },
        data: { stage: JobStage.COMPLETED },
      });

      invalidateServerCatalogCache();
    }

    return {
      success: true,
      nextStage: JobStage.COMPLETED,
      costUsd: 0.0,
      data: {
        publishedItem: job.catalogItemId,
        assetUrl,
        renderConfig,
        isSyntheticFallback,
      },
    };
  } catch (error: any) {
    await prisma.assetJob.update({
      where: { id: job.id },
      data: {
        stage: JobStage.FAILED,
        errorMessage: `Publisher error: ${error.message || error}`,
      },
    });

    return {
      success: false,
      errorMessage: error.message,
    };
  }
}

