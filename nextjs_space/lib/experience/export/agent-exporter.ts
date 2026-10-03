import { prisma } from '@/lib/core/db';
import { generateConwayWallet } from '@/lib/money/wallet';
import { generateEIP8004Identity } from '@/lib/core/eip8004';

export interface StandardAgentExportPackage {
  formatVersion: 'WEB4-AGENT-1.0';
  exportedAt: string;
  metadata: {
    name: string;
    description: string;
    archetype: string;
    generation: number;
  };
  skillsDag: any[];
  avatarConfiguration: any;
  financialHistory: {
    totalEarnings: number;
    totalCosts: number;
    netProfit: number;
    survivalScore: number;
  };
  documentation: {
    operationalGuide: string;
    license: string;
  };
}

/**
 * Exports a full Web4 agent into a standardized portable JSON package
 */
export async function exportAgentToJSON(agentId: string): Promise<StandardAgentExportPackage> {
  const agent = await prisma.web4Agent.findUnique({
    where: { id: agentId },
  });

  if (!agent) throw new Error('Agent not found for export.');

  return {
    formatVersion: 'WEB4-AGENT-1.0',
    exportedAt: new Date().toISOString(),
    metadata: {
      name: agent.name,
      description: agent.description || '',
      archetype: agent.archetype,
      generation: agent.generation,
    },
    skillsDag: Array.isArray(agent.skills) ? agent.skills : [],
    avatarConfiguration: agent.avatarConfig || {},
    financialHistory: {
      totalEarnings: agent.totalEarnings,
      totalCosts: agent.totalCosts,
      netProfit: agent.profit,
      survivalScore: agent.survivalScore,
    },
    documentation: {
      operationalGuide: `Operational manual for ${agent.name}. Autonomous Web4 Sovereign Economic Agent.`,
      license: 'MIT-WEB4-OPEN-AGENT',
    },
  };
}

export interface StarNetAgentExport {
  agentId?: string;
  name?: string;
  class?: string;
  role?: string;
  persona?: string;
  systemPrompt?: string;
  model?: string;
  provider?: string;
  skills?: any[];
  dossier?: {
    name?: string;
    personality?: string;
    beliefs?: string[];
    goals?: string[];
  };
}

/**
 * Converts a StarNet agent export JSON (from StarNet's EXPORT AGENT button)
 * into a Trendly WEB4-AGENT-1.0 package.
 */
export function convertStarNetExportToWeb4(raw: any): StandardAgentExportPackage {
  if (raw && raw.formatVersion === 'WEB4-AGENT-1.0') {
    return raw as StandardAgentExportPackage;
  }

  const name = String(raw?.name || raw?.dossier?.name || raw?.agentId || 'StarNet Crew Specialist').trim();
  const description = String(
    raw?.persona ||
      raw?.dossier?.personality ||
      raw?.systemPrompt ||
      raw?.role ||
      'Imported from StarNet Station'
  ).trim();
  const rawClass = String(raw?.class || raw?.role || '').toUpperCase();
  const archetype = rawClass.includes('TRADER') || rawClass.includes('FINANCE')
    ? 'ARBITRAGE_TRADER'
    : rawClass.includes('BUILD') || rawClass.includes('CODE')
    ? 'SAAS_ARCHITECT'
    : 'DATA_MINER';

  return {
    formatVersion: 'WEB4-AGENT-1.0',
    exportedAt: new Date().toISOString(),
    metadata: {
      name,
      description,
      archetype,
      generation: 1,
    },
    skillsDag: Array.isArray(raw?.skills) ? raw.skills : [],
    avatarConfiguration: {
      source: 'starnet-station',
      model: raw?.model || 'starnet-agent',
      provider: raw?.provider || 'starnet',
    },
    financialHistory: {
      totalEarnings: 0,
      totalCosts: 0,
      netProfit: 0,
      survivalScore: 85,
    },
    documentation: {
      operationalGuide: `Imported from StarNet Station dossier (${name}).`,
      license: 'MIT-WEB4-OPEN-AGENT',
    },
  };
}

/**
 * Imports a WEB4-AGENT-1.0 or StarNet Agent Export JSON package and creates a new sovereign agent
 */
export async function importAgentFromJSON(userId: string, rawPkg: StandardAgentExportPackage | StarNetAgentExport) {
  const isWeb4 = (rawPkg as any)?.formatVersion === 'WEB4-AGENT-1.0';
  const isStarNet =
    !isWeb4 &&
    typeof rawPkg === 'object' &&
    rawPkg !== null &&
    Boolean((rawPkg as any).agentId || (rawPkg as any).dossier || (rawPkg as any).persona || (rawPkg as any).name);

  if (!isWeb4 && !isStarNet) {
    throw new Error('Unsupported agent export format version. Expected WEB4-AGENT-1.0 or StarNet Agent Export.');
  }

  const pkg = isWeb4 ? (rawPkg as StandardAgentExportPackage) : convertStarNetExportToWeb4(rawPkg);

  const tempId = `import-${Date.now()}`;
  const wallet = generateConwayWallet(tempId);
  const identity = generateEIP8004Identity({
    agentId: tempId,
    creatorAddress: `imported-user-${userId}`,
    archetype: pkg.metadata.archetype || 'DATA_MINER',
    skillsDigest: JSON.stringify(pkg.skillsDag || []),
    creationTimestamp: Date.now(),
  });

  const agent = await prisma.web4Agent.create({
    data: {
      userId,
      name: `${pkg.metadata.name} (Imported)`,
      description: pkg.metadata.description || 'Imported Web4 Sovereign Agent',
      archetype: pkg.metadata.archetype || 'DATA_MINER',
      walletAddress: wallet.address,
      walletBalance: 0.0, // Dormant until funded
      status: 'DORMANT',
      skills: pkg.skillsDag as any,
      avatarConfig: pkg.avatarConfiguration as any,
      eip8004Hash: identity.identityHash,
      generation: (pkg.metadata.generation || 1) + 1,
      survivalScore: 85,
    },
  });

  return agent;
}
