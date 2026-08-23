import { prisma } from '@/lib/db';
import { COSMETICS_CATALOG } from '@/lib/cosmetics/catalog';
import { AssetJob, JobStage } from '@prisma/client';
import { AssetPromptSpec, SpeciesContext, SpeciesResult } from './types';

/**
 * Builds structured 2D prompt spec and 3D procedural geometric specifications.
 */
export async function runDesigner(job: AssetJob, ctx: SpeciesContext = {}): Promise<SpeciesResult> {
  const catalogItem = COSMETICS_CATALOG.find((c) => c.id === job.catalogItemId);
  if (!catalogItem) {
    return {
      success: false,
      errorMessage: `Catalog item ${job.catalogItemId} not found`,
    };
  }

  // Derive theme and color palettes based on item slot and rarity
  const rarityColors: Record<string, { primary: string; emissive: string }> = {
    COMMON: { primary: '#00F0FF', emissive: '#00F0FF' },
    RARE: { primary: '#7928CA', emissive: '#B829E3' },
    EPIC: { primary: '#FF007A', emissive: '#FF0055' },
    LEGENDARY: { primary: '#FFD700', emissive: '#FFA500' },
    MYTHIC: { primary: '#00FF66', emissive: '#00F0FF' },
  };

  const palette = rarityColors[job.rarity.toUpperCase()] || { primary: '#00F0FF', emissive: '#00F0FF' };

  // Archetype mapping for procedural 3D generation (HEAD and BODY geometric items only)
  let procedural3D: AssetPromptSpec['procedural3D'] = undefined;

  if (job.slot.toUpperCase() === 'HEAD') {
    const archetype = catalogItem.name.toLowerCase().includes('crown') ? 'crown' : 'visor';
    procedural3D = {
      archetype,
      baseColor: palette.primary,
      emissiveColor: palette.emissive,
      emissiveIntensity: 1.5,
      metalness: 0.85,
      roughness: 0.2,
      scale: [0.45, 0.45, 0.45],
      position: [0, 1.45, 0],
      rotation: [0, 0, 0],
    };
  } else if (job.slot.toUpperCase() === 'BODY' && (catalogItem.name.toLowerCase().includes('katana') || catalogItem.name.toLowerCase().includes('blade') || catalogItem.name.toLowerCase().includes('armor') || catalogItem.name.toLowerCase().includes('skin'))) {
    procedural3D = {
      archetype: 'blade',
      baseColor: palette.primary,
      emissiveColor: palette.emissive,
      emissiveIntensity: 1.5,
      metalness: 0.85,
      roughness: 0.2,
      scale: [0.5, 0.5, 0.5],
      position: [0.65, 0.2, 0.1],
      rotation: [0, 0, 0.35],
    };
  }

  const promptSpec: AssetPromptSpec = {
    catalogItemId: catalogItem.id,
    name: catalogItem.name,
    slot: job.slot,
    rarity: job.rarity,
    theme: `${catalogItem.slot} cosmetic with cyberpunk neon aesthetics`,
    colorPalette: [palette.primary, palette.emissive, '#07070C'],
    prompt2D: `Isometric transparent game cosmetic icon of ${catalogItem.name}, ${job.slot} slot, ${job.rarity} tier, glowing neon sci-fi aesthetic, clean edges, isolated on transparent background, high resolution 3D render, digital art`,
    negativePrompt: `blurry, low quality, solid background, background scene, person wearing it, cropped, distorted`,
    procedural3D,
  };

  const estimatedCost = 0.005; // Standard LLM spec compilation unit cost

  if (!ctx.dryRun) {
    await prisma.assetJob.update({
      where: { id: job.id },
      data: {
        promptSpec: promptSpec as any,
        stage: JobStage.ART_GENERATION, // Advance to Art Worker
      },
    });
  }

  return {
    success: true,
    nextStage: JobStage.ART_GENERATION,
    costUsd: estimatedCost,
    data: promptSpec,
  };
}
