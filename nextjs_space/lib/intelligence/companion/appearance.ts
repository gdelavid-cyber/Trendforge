// Maps a Companion config into concrete rig/material parameters.
// Pure data — shared by The World renderer and (later) Studio preview.

export type BaseModel =
  | 'cyber-humanoid'
  | 'void-android'
  | 'sovereign-titan'
  | 'cosmic-entity'
  | 'animal'
  | 'abstract';

export type Proportions = 'slim' | 'athletic' | 'average' | 'heavy';
export type SkinPattern = 'solid' | 'gradient' | 'metallic' | 'glowing' | 'matte';

export interface CompanionAppearanceConfig {
  baseModel?: BaseModel | string;
  body?: { proportions?: Proportions; stance?: string };
  skin?: { primary?: string; secondary?: string; pattern?: SkinPattern };
}

export interface RigMaterials {
  color: string;
  metalness: number;
  roughness: number;
  emissiveIntensity: number;
}

const PROPORTIONS_SCALE: Record<Proportions, { width: number; height: number }> = {
  slim: { width: 0.85, height: 1.06 },
  athletic: { width: 1.0, height: 1.0 },
  average: { width: 1.05, height: 0.98 },
  heavy: { width: 1.22, height: 0.94 },
};

const BASE_MODEL_TINT: Record<string, string> = {
  'cyber-humanoid': '#151722',
  'void-android': '#0D0D16',
  'sovereign-titan': '#1A1408',
  'cosmic-entity': '#14102A',
  animal: '#12141F',
  abstract: '#0A1220',
};

export function resolveRig(config?: CompanionAppearanceConfig): {
  variant: 'humanoid' | 'animal' | 'abstract';
  scale: { width: number; height: number };
  materials: RigMaterials;
} {
  const baseModel = String(config?.baseModel ?? 'cyber-humanoid');
  const proportions: Proportions = (config?.body?.proportions as Proportions) ?? 'athletic';
  const pattern: SkinPattern = (config?.skin?.pattern as SkinPattern) ?? 'metallic';
  const primary = config?.skin?.primary;

  const variant = baseModel === 'animal' ? 'animal' : baseModel === 'abstract' ? 'abstract' : 'humanoid';

  const materials: RigMaterials = {
    color: primary ?? BASE_MODEL_TINT[baseModel] ?? BASE_MODEL_TINT['cyber-humanoid'],
    metalness: pattern === 'metallic' ? 0.9 : pattern === 'glowing' ? 0.4 : 0.55,
    roughness:
      pattern === 'matte' ? 0.85 : pattern === 'glowing' ? 0.25 : pattern === 'solid' ? 0.6 : 0.3,
    emissiveIntensity: pattern === 'glowing' ? 0.9 : pattern === 'gradient' ? 0.35 : 0,
  };

  return {
    variant,
    scale: PROPORTIONS_SCALE[proportions] ?? PROPORTIONS_SCALE.athletic,
    materials,
  };
}
