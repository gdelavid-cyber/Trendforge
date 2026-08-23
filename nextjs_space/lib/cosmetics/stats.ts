import { COSMETICS_CATALOG, CombatSlot, StatModifiers } from './catalog';
import type { Web4Agent } from '@prisma/client';

export interface FighterLoadout {
  HEAD?: string;
  BODY?: string;
  AURA?: string;
  TRAIL?: string;
  FINISHER?: string;
}

export interface FighterStats {
  pwr: number; // 0-100 (Power: Trade Volume & Yield Capacity)
  spd: number; // 0-100 (Speed: Execution Velocity & Low Latency)
  def: number; // 0-100 (Defense: Darwinian Survival Resilience)
  syn: number; // 0-100 (Synergy: Neural Intelligence & DAG Skills)
}

export type AgentStatSource =
  | (Pick<Web4Agent, 'profit' | 'totalEarnings' | 'riskExposure' | 'survivalScore' | 'generation'> & {
      skills?: any;
    })
  | null
  | undefined;

export function getLoadoutModifiers(loadout?: FighterLoadout): StatModifiers {
  if (!loadout) return { pwr: 0, spd: 0, def: 0, syn: 0 };

  const totalMods: StatModifiers = { pwr: 0, spd: 0, def: 0, syn: 0 };

  Object.entries(loadout).forEach(([slot, itemId]) => {
    if (!itemId) return;
    const item = COSMETICS_CATALOG.find((c) => c.id === itemId || c.name === itemId);
    if (item && item.statModifiers) {
      totalMods.pwr = (totalMods.pwr || 0) + (item.statModifiers.pwr || 0);
      totalMods.spd = (totalMods.spd || 0) + (item.statModifiers.spd || 0);
      totalMods.def = (totalMods.def || 0) + (item.statModifiers.def || 0);
      totalMods.syn = (totalMods.syn || 0) + (item.statModifiers.syn || 0);
    }
  });

  return totalMods;
}

export function calculateFighterStats(
  agent?: AgentStatSource | null,
  loadout?: FighterLoadout
): FighterStats {
  const profit = Number(agent?.profit) || 0;
  const totalEarnings = Number(agent?.totalEarnings) || 0;
  const riskExposure = Number(agent?.riskExposure) || 0.2;
  const survivalScore = Number(agent?.survivalScore) || 85;
  const generation = Number(agent?.generation) || 1;
  const skillCount = agent && Array.isArray(agent.skills) ? agent.skills.length : 3;

  const basePwr = Math.min(92, Math.floor(48 + profit / 25 + totalEarnings / 60));
  const baseSpd = Math.min(92, Math.floor(52 + riskExposure * 30 + generation * 2));
  const baseDef = Math.min(95, Math.floor(survivalScore));
  const baseSyn = Math.min(92, Math.floor(56 + skillCount * 6));

  const mods = getLoadoutModifiers(loadout);

  return {
    pwr: Math.min(100, basePwr + (mods.pwr || 0)),
    spd: Math.min(100, baseSpd + (mods.spd || 0)),
    def: Math.min(100, baseDef + (mods.def || 0)),
    syn: Math.min(100, baseSyn + (mods.syn || 0)),
  };
}
