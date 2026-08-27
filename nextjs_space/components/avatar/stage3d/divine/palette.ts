/**
 * Divine final-form palettes.
 *
 * The android has no skin, no cloth and no paint — every colour here feeds a
 * physical property (iridescence film thickness, plasma emission, transmission
 * attenuation) rather than an albedo swatch. Shell colours are deliberately
 * near-black: a metalness-1 surface takes its colour from the environment, so a
 * bright base tint would flatten the reflections into plastic.
 */

export type ArchKey = 'cyber_humanoid' | 'quantum_android' | 'wall_street_titan' | 'cosmic_entity';

export interface DivinePalette {
  /** near-black base tint of the nano-crystal shell */
  shell: string;
  /** darker inner shell for recessed forms — reads as depth without a seam */
  shellDeep: string;
  /** thin-film interference strength, 0..1 */
  iridescence: number;
  /** film thickness sweep in nm — controls which hues the interference lands on */
  irisRange: [number, number];
  /** star-core plasma, outer */
  core: string;
  /** star-core plasma, hottest centre */
  coreHot: string;
  /** halo-visor emissive */
  halo: string;
  /** rim kicker light A (cool side) */
  rimCool: string;
  /** rim kicker light B (warm side) */
  rimWarm: string;
  /** energy-field shell */
  aura: string;
  /** transmissive attenuation tint — what light picks up crossing the body */
  attenuation: string;
}

export const DIVINE_PALETTES: Record<ArchKey, DivinePalette> = {
  cyber_humanoid: {
    shell: '#0a0e18',
    shellDeep: '#04060c',
    iridescence: 1,
    irisRange: [180, 640],
    core: '#00F0FF',
    coreHot: '#DFFBFF',
    halo: '#00F0FF',
    rimCool: '#7DF9FF',
    rimWarm: '#FFB066',
    aura: '#2FD8FF',
    attenuation: '#0A5C7A',
  },
  quantum_android: {
    shell: '#100b1c',
    shellDeep: '#07040f',
    iridescence: 1,
    irisRange: [240, 780],
    core: '#A855F7',
    coreHot: '#F3E4FF',
    halo: '#C084FC',
    rimCool: '#B48CFF',
    rimWarm: '#FF7DD8',
    aura: '#9B6BFF',
    attenuation: '#3B1D6E',
  },
  wall_street_titan: {
    shell: '#14100a',
    shellDeep: '#0a0703',
    iridescence: 0.85,
    irisRange: [120, 480],
    core: '#FFD700',
    coreHot: '#FFF6D0',
    halo: '#FFD700',
    rimCool: '#8FE8FF',
    rimWarm: '#FFC24D',
    aura: '#FFC53D',
    attenuation: '#6E4E06',
  },
  cosmic_entity: {
    shell: '#0d0a1c',
    shellDeep: '#050310',
    iridescence: 1,
    irisRange: [300, 900],
    core: '#EC4899',
    coreHot: '#FFE1F3',
    halo: '#FF8AD8',
    rimCool: '#6D5BD0',
    rimWarm: '#FF6EA8',
    aura: '#C34BFF',
    attenuation: '#5A1247',
  },
};

const ARCH_KEYS = Object.keys(DIVINE_PALETTES) as ArchKey[];

/** Falls back to the cyber archetype rather than throwing — avatarId comes from the DB. */
export function resolveArch(avatarId?: string): ArchKey {
  if (avatarId && (ARCH_KEYS as string[]).includes(avatarId)) return avatarId as ArchKey;
  return 'cyber_humanoid';
}

export function paletteFor(avatarId?: string): DivinePalette {
  return DIVINE_PALETTES[resolveArch(avatarId)];
}

/**
 * BODY-slot cosmetics repaint the crystal. Keyed off the catalog id so a new
 * skin only needs an entry here, not a change to the rig.
 */
const SKIN_OVERRIDES: Record<string, Partial<DivinePalette>> = {
  skin_neon_cyber: { core: '#00FF9C', coreHot: '#E6FFF6', halo: '#00FF9C', aura: '#00FF9C', attenuation: '#046B47' },
  skin_quantum_void: { shell: '#07060f', core: '#8B5CF6', halo: '#A78BFA', irisRange: [320, 960] },
  skin_wallstreet_titan: { shell: '#161208', core: '#FFD700', coreHot: '#FFFBE8', halo: '#FFD700', aura: '#FFD700' },
  skin_cosmic_nebula: { core: '#FF5FA2', coreHot: '#FFE9F4', halo: '#FF8AD8', irisRange: [360, 1020] },
  skin_matte_hacker: { shell: '#0b0b0b', iridescence: 0.25, core: '#39FF6A', coreHot: '#E9FFEF', halo: '#39FF6A', aura: '#39FF6A' },
  skin_solana_solider: { core: '#14F195', coreHot: '#E6FFF7', halo: '#9945FF', aura: '#14F195' },
  skin_crypto_samurai: { shell: '#160709', core: '#FF3B30', coreHot: '#FFE4E1', halo: '#FF6A4D', rimWarm: '#FF8A5C', aura: '#FF4530' },
  skin_mev_phantom: { shell: '#050505', iridescence: 0.55, core: '#7C3AED', coreHot: '#EFE4FF', halo: '#8B5CF6', aura: '#6D28D9' },
  skin_pixel_trader: { core: '#FFA800', coreHot: '#FFF3D6', halo: '#FFC53D', iridescence: 0.4 },
  skin_bio_synth: { shell: '#08120d', core: '#5CFFB1', coreHot: '#EAFFF5', halo: '#5CFFB1', aura: '#2FFFA0', attenuation: '#0B6B44' },
};

/** AURA-slot cosmetics only retint the energy field, never the shell. */
const AURA_TINTS: Record<string, string> = {
  aura_plasma_fire: '#FF6B2C',
  aura_matrix_glitch: '#39FF6A',
  aura_gold_sparkles: '#FFD700',
  aura_electric_storm: '#6FC3FF',
  aura_scan_beam: '#00F0FF',
  aura_cosmic_dust: '#C084FC',
  aura_blood_rage: '#FF2D3F',
  aura_frost_zero: '#A8ECFF',
  aura_void_blackhole: '#7A2BFF',
  aura_synthwave_sun: '#FF4FA3',
};

export interface LoadoutTint {
  BODY?: string;
  AURA?: string;
  HEAD?: string;
  EYEWEAR?: string;
}

/** Composes archetype palette + equipped cosmetics into the final render palette. */
export function composePalette(avatarId?: string, ids?: LoadoutTint): DivinePalette {
  const base = paletteFor(avatarId);
  const skin = ids?.BODY ? SKIN_OVERRIDES[ids.BODY] : undefined;
  const auraTint = ids?.AURA ? AURA_TINTS[ids.AURA] : undefined;
  if (!skin && !auraTint) return base;
  return { ...base, ...(skin ?? {}), ...(auraTint ? { aura: auraTint } : {}) };
}
