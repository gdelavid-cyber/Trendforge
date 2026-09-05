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

/**
 * Imports an agent JSON package and creates a new active sovereign agent in the database
 */
export async function importAgentFromJSON(userId: string, pkg: StandardAgentExportPackage) {
  if (pkg.formatVersion !== 'WEB4-AGENT-1.0') {
    throw new Error('Unsupported agent export format version.');
  }

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
