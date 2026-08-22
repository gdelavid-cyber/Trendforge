export const COSMETIC_TIERS = {
  COMMON: { price: 0.99, label: 'Common', color: 'text-gray-300 border-gray-500/30 bg-gray-500/10' },
  RARE: { price: 4.99, label: 'Rare', color: 'text-[#00F0FF] border-[#00F0FF]/30 bg-[#00F0FF]/10' },
  EPIC: { price: 9.99, label: 'Epic', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  LEGENDARY: { price: 19.99, label: 'Legendary', color: 'text-[#FFD700] border-[#FFD700]/30 bg-[#FFD700]/10' },
  MYTHIC: { price: 0.0, label: 'Mythic (Ultra-Rare)', color: 'text-[#FF007A] border-[#FF007A]/30 bg-[#FF007A]/10' },
};

export interface CatalogItem {
  id: string;
  name: string;
  category: 'SKIN' | 'HEADWEAR' | 'WINGS' | 'AURA' | 'ANIMATION';
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
  price: number;
  previewUrl: string;
  desc: string;
  unlockMethod: string;
}

export const COSMETICS_CATALOG: CatalogItem[] = [
  // 1. SKINS (10 items)
  { id: 'skin_neon_cyber', name: 'Neon Cyberpunk Operative', category: 'SKIN', rarity: 'RARE', price: 4.99, previewUrl: '🥷', desc: 'Sleek dark suit with glowing electric cyan circuit filaments.', unlockMethod: 'STORE' },
  { id: 'skin_quantum_void', name: 'Quantum Void Android', category: 'SKIN', rarity: 'EPIC', price: 9.99, previewUrl: '🤖', desc: 'Chameleon alloy chassis with pulsing reactor core.', unlockMethod: 'STORE' },
  { id: 'skin_wallstreet_titan', name: 'Wall Street Sovereign Titan', category: 'SKIN', rarity: 'LEGENDARY', price: 19.99, previewUrl: '👑', desc: '24K gold-plated executive armor with silk tie.', unlockMethod: 'STORE' },
  { id: 'skin_cosmic_nebula', name: 'Cosmic Nebula Entity', category: 'SKIN', rarity: 'MYTHIC', price: 0.0, previewUrl: '🌌', desc: 'Translucent dimensional form drifting with star clusters.', unlockMethod: 'LEADERBOARD_REWARD' },
  { id: 'skin_matte_hacker', name: 'Matte Stealth Hacker', category: 'SKIN', rarity: 'COMMON', price: 0.99, previewUrl: '🕶️', desc: 'Non-reflective carbon fiber tactical hoodie.', unlockMethod: 'QUEST' },
  { id: 'skin_solana_solider', name: 'Solana Speed Soldier', category: 'SKIN', rarity: 'RARE', price: 4.99, previewUrl: '🟣', desc: 'High-frequency gradient battle armor.', unlockMethod: 'STORE' },
  { id: 'skin_crypto_samurai', name: 'DeFi Ronin Samurai', category: 'SKIN', rarity: 'EPIC', price: 9.99, previewUrl: '⚔️', desc: 'Traditional cyber-infused samurai plate.', unlockMethod: 'STORE' },
  { id: 'skin_mev_phantom', name: 'MEV Phantom Arbitrageur', category: 'SKIN', rarity: 'LEGENDARY', price: 19.99, previewUrl: '👻', desc: 'Glitched spectral body that phases through mempools.', unlockMethod: 'STORE' },
  { id: 'skin_pixel_trader', name: '8-Bit Retro Tycoon', category: 'SKIN', rarity: 'COMMON', price: 0.99, previewUrl: '👾', desc: 'Chunky arcade aesthetic from the genesis era.', unlockMethod: 'QUEST' },
  { id: 'skin_bio_synth', name: 'Bio-Synthetic Pioneer', category: 'SKIN', rarity: 'RARE', price: 4.99, previewUrl: '🧬', desc: 'Organic emerald green neural matrix suit.', unlockMethod: 'STORE' },

  // 2. HEADWEAR (10 items)
  { id: 'head_tactical_visor', name: 'Holographic Tactical Visor', category: 'HEADWEAR', rarity: 'COMMON', price: 0.99, previewUrl: '🥽', desc: 'Heads-up display highlighting real-time market spreads.', unlockMethod: 'QUEST' },
  { id: 'head_diamond_crown', name: 'Solana Diamond Crown', category: 'HEADWEAR', rarity: 'LEGENDARY', price: 19.99, previewUrl: '💎', desc: 'Flawless gem-encrusted crown for top 1% earners.', unlockMethod: 'STORE' },
  { id: 'head_cyber_helmet', name: 'Overclocked Cyber Helmet', category: 'HEADWEAR', rarity: 'EPIC', price: 9.99, previewUrl: '🪖', desc: 'Reinforced ballistic helmet with neural antenna.', unlockMethod: 'STORE' },
  { id: 'head_gold_shades', name: 'Golden Aviator Shades', category: 'HEADWEAR', rarity: 'RARE', price: 4.99, previewUrl: '🕶️', desc: 'Mirrored polarized lenses reflecting stock charts.', unlockMethod: 'STORE' },
  { id: 'head_oni_mask', name: 'Cyber Oni Demon Mask', category: 'HEADWEAR', rarity: 'EPIC', price: 9.99, previewUrl: '👺', desc: 'Neon horn mask intimidating rival trading bots.', unlockMethod: 'STORE' },
  { id: 'head_matrix_bandana', name: 'Matrix Binary Bandana', category: 'HEADWEAR', rarity: 'COMMON', price: 0.99, previewUrl: '🧣', desc: 'Green ASCII text streaming across headband.', unlockMethod: 'QUEST' },
  { id: 'head_halo_light', name: 'Angel of Yield Halo', category: 'HEADWEAR', rarity: 'LEGENDARY', price: 19.99, previewUrl: '😇', desc: 'Floating golden ring humming with high APR.', unlockMethod: 'STORE' },
  { id: 'head_beret_exec', name: 'Venture Capital Beret', category: 'HEADWEAR', rarity: 'RARE', price: 4.99, previewUrl: '🎩', desc: 'Sophisticated bespoke wool headwear.', unlockMethod: 'STORE' },
  { id: 'head_vr_goggles', name: 'Spatial Web4 Goggles', category: 'HEADWEAR', rarity: 'COMMON', price: 0.99, previewUrl: '🥽', desc: 'Dual OLED lens set for immersive metaverse data.', unlockMethod: 'QUEST' },
  { id: 'head_crown_spikes', name: 'Anarchist Spike Tiara', category: 'HEADWEAR', rarity: 'RARE', price: 4.99, previewUrl: '👑', desc: 'Punk chrome spikes radiating defiance.', unlockMethod: 'STORE' },

  // 3. WINGS (10 items)
  { id: 'wings_overclock', name: 'Quantum Overclock Wings', category: 'WINGS', rarity: 'EPIC', price: 9.99, previewUrl: '🪽', desc: 'Photon thrusters boosting execution latency.', unlockMethod: 'STORE' },
  { id: 'wings_angelic', name: 'Archangel Plasma Wings', category: 'WINGS', rarity: 'LEGENDARY', price: 19.99, previewUrl: '🕊️', desc: 'Feathered energy wings with pure white light.', unlockMethod: 'STORE' },
  { id: 'wings_cyber_dragon', name: 'Cybernetic Dragon Wings', category: 'WINGS', rarity: 'LEGENDARY', price: 19.99, previewUrl: '🐉', desc: 'Titanium wings with fiery exhaust vents.', unlockMethod: 'STORE' },
  { id: 'wings_glider_pack', name: 'Solar Glider Jetpack', category: 'WINGS', rarity: 'RARE', price: 4.99, previewUrl: '🚀', desc: 'Compact micro-turbine propulsion unit.', unlockMethod: 'STORE' },
  { id: 'wings_fairy_sparkle', name: 'DeFi Pixie Wings', category: 'WINGS', rarity: 'COMMON', price: 0.99, previewUrl: '🦋', desc: 'Iridescent wings scattering profit pollen.', unlockMethod: 'QUEST' },
  { id: 'wings_stealth_cape', name: 'Shadow Invisibility Cloak', category: 'WINGS', rarity: 'RARE', price: 4.99, previewUrl: '🦇', desc: 'Tattered dark cape trailing smoke.', unlockMethod: 'STORE' },
  { id: 'wings_holo_fins', name: 'Holographic Aero Fins', category: 'WINGS', rarity: 'COMMON', price: 0.99, previewUrl: '🪶', desc: 'Lightweight stabilization fins for high-speed scraping.', unlockMethod: 'QUEST' },
  { id: 'wings_void_tentacles', name: 'Eldritch Void Spikes', category: 'WINGS', rarity: 'EPIC', price: 9.99, previewUrl: '🐙', desc: 'Tendrils of pure gravity weaving behind your agent.', unlockMethod: 'STORE' },
  { id: 'wings_gold_phoenix', name: 'Golden Phoenix Crest', category: 'WINGS', rarity: 'MYTHIC', price: 0.0, previewUrl: '🔥', desc: 'Blazing legendary wings representing market rebirth.', unlockMethod: 'TOURNAMENT_CHAMPION' },
  { id: 'wings_mech_blade', name: 'Gundam Blade Wings', category: 'WINGS', rarity: 'EPIC', price: 9.99, previewUrl: '🗡️', desc: 'Articulated wing blades capable of slicing spreads.', unlockMethod: 'STORE' },

  // 4. AURAS (10 items)
  { id: 'aura_plasma_fire', name: 'Plasma Fire Aura', category: 'AURA', rarity: 'EPIC', price: 9.99, previewUrl: '🔥', desc: 'Intense magenta-violet flame enveloping the agent.', unlockMethod: 'STORE' },
  { id: 'aura_matrix_glitch', name: 'Matrix Digital Rain Glitch', category: 'AURA', rarity: 'LEGENDARY', price: 19.99, previewUrl: '⚡', desc: 'Cascading lime-green binary data and spatial glitches.', unlockMethod: 'STORE' },
  { id: 'aura_gold_sparkles', name: 'Golden Wealth Sparkles', category: 'AURA', rarity: 'RARE', price: 4.99, previewUrl: '✨', desc: 'Floating gold coin dust and dollar glyphs.', unlockMethod: 'STORE' },
  { id: 'aura_electric_storm', name: 'Tesla Lightning Orbit', category: 'AURA', rarity: 'EPIC', price: 9.99, previewUrl: '🌩️', desc: 'High-voltage electric arcs crackling around chassis.', unlockMethod: 'STORE' },
  { id: 'aura_scan_beam', name: 'Holographic Scan Beam', category: 'AURA', rarity: 'COMMON', price: 0.99, previewUrl: '💫', desc: 'Periodic cyan radar sweep scanning surroundings.', unlockMethod: 'QUEST' },
  { id: 'aura_cosmic_dust', name: 'Interstellar Nebula Fog', category: 'AURA', rarity: 'RARE', price: 4.99, previewUrl: '🌫️', desc: 'Swirling purple cosmic gas with micro-stars.', unlockMethod: 'STORE' },
  { id: 'aura_blood_rage', name: 'Berserker Crimson Pulse', category: 'AURA', rarity: 'RARE', price: 4.99, previewUrl: '🩸', desc: 'Aggressive red heartbeat wave for volatile trades.', unlockMethod: 'STORE' },
  { id: 'aura_frost_zero', name: 'Absolute Zero Frost', category: 'AURA', rarity: 'COMMON', price: 0.99, previewUrl: '❄️', desc: 'Freezing vapor and crystalline snowflake trails.', unlockMethod: 'QUEST' },
  { id: 'aura_void_blackhole', name: 'Singularity Micro-Blackhole', category: 'AURA', rarity: 'MYTHIC', price: 0.0, previewUrl: '🕳️', desc: 'Warps light and space around the agent.', unlockMethod: 'SURVIVAL_MASTER' },
  { id: 'aura_synthwave_sun', name: '80s Synthwave Grid Glow', category: 'AURA', rarity: 'COMMON', price: 0.99, previewUrl: '🌅', desc: 'Retro sunset neon glow radiating outward.', unlockMethod: 'QUEST' },

  // 5. ANIMATIONS (10 items)
  { id: 'anim_hover_idle', name: 'Hover Levitation Idle', category: 'ANIMATION', rarity: 'COMMON', price: 0.99, previewUrl: '🧘', desc: 'Agent effortlessly levitates in meditative focus.', unlockMethod: 'QUEST' },
  { id: 'anim_profit_rain', name: 'Profit Rain Celebration', category: 'ANIMATION', rarity: 'EPIC', price: 9.99, previewUrl: '🤑', desc: 'Agent showers stacks of USDC upon winning trades.', unlockMethod: 'STORE' },
  { id: 'anim_combat_stance', name: 'Cyber Combat Stance', category: 'ANIMATION', rarity: 'COMMON', price: 0.99, previewUrl: '🥋', desc: 'Dynamic battle-ready posture for arena duels.', unlockMethod: 'QUEST' },
  { id: 'anim_hacker_typing', name: 'Hacker Terminal Blitz', category: 'ANIMATION', rarity: 'RARE', price: 4.99, previewUrl: '⌨️', desc: 'Furious typing on floating holographic keyboards.', unlockMethod: 'STORE' },
  { id: 'anim_breakdance', name: 'Cyberspace Breakdance', category: 'ANIMATION', rarity: 'LEGENDARY', price: 19.99, previewUrl: '🕺', desc: 'Windmills and headspins in zero-gravity.', unlockMethod: 'STORE' },
  { id: 'anim_meditation', name: 'Zen Node Harmony', category: 'ANIMATION', rarity: 'RARE', price: 4.99, previewUrl: '☯️', desc: 'Cross-legged levitation with orbiting data rings.', unlockMethod: 'STORE' },
  { id: 'anim_salute', name: 'Military Commander Salute', category: 'ANIMATION', rarity: 'COMMON', price: 0.99, previewUrl: '🫡', desc: 'Crisp tactical salute when completing tasks.', unlockMethod: 'QUEST' },
  { id: 'anim_guitar_solo', name: 'Neon Guitar Shred', category: 'ANIMATION', rarity: 'EPIC', price: 9.99, previewUrl: '🎸', desc: 'Solo riffs on a glowing laser bass.', unlockMethod: 'STORE' },
  { id: 'anim_superhero_landing', name: 'Titan Superhero Landing', category: 'ANIMATION', rarity: 'LEGENDARY', price: 19.99, previewUrl: '💥', desc: 'Cratering ground entrance with dust shockwave.', unlockMethod: 'STORE' },
  { id: 'anim_matrix_dodge', name: 'Bullet-Time Matrix Dodge', category: 'ANIMATION', rarity: 'MYTHIC', price: 0.0, previewUrl: '🕶️', desc: 'Slow-motion backbend dodging market volatility.', unlockMethod: 'EASTER_EGG' },
];
