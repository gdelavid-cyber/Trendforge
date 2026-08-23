import { AssetJob, AgentInstance, JobStage, QAVerdict } from '@prisma/client';

export interface SpeciesContext {
  instance?: AgentInstance;
  dryRun?: boolean;
}

export interface ProviderMetadata {
  provider: string;
  model: string;
  seed?: number;
  syntheticFallback?: boolean;
}

export interface SpeciesResult {
  success: boolean;
  nextStage?: JobStage;
  costUsd?: number;
  errorMessage?: string;
  data?: any;
}

export interface AssetPromptSpec {
  catalogItemId: string;
  name: string;
  slot: string;
  rarity: string;
  theme: string;
  colorPalette: string[];
  prompt2D: string;
  negativePrompt: string;
  procedural3D?: {
    archetype: 'crown' | 'visor' | 'blade' | 'ring' | 'wings' | 'core' | 'generic';
    baseColor: string;
    emissiveColor: string;
    emissiveIntensity: number;
    metalness: number;
    roughness: number;
    scale: [number, number, number];
    position: [number, number, number];
    rotation: [number, number, number];
  };
}
