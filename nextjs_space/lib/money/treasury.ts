import { prisma } from '@/lib/core/db';
import type { Prisma, Web4Agent } from '@prisma/client';

export const TREASURY_AGENT_NAME = 'TRENDLY_TREASURY';
export const TREASURY_WALLET_ADDRESS = 'TRENDLY_TREASURY_RESERVE_WALLET';
export const TREASURY_SYSTEM_USER_EMAIL = 'system-treasury@trendly.local';

/**
 * Resolves the platform treasury agent that collects platform commissions/rakes.
 * Respects PLATFORM_TREASURY_AGENT_ID if configured, otherwise falls back to
 * querying or lazily provisioning TRENDLY_TREASURY.
 */
export async function getTreasuryAgent(
  client: Prisma.TransactionClient | typeof prisma = prisma
): Promise<Web4Agent> {
  const envTreasuryId = process.env.PLATFORM_TREASURY_AGENT_ID;
  if (envTreasuryId) {
    const agent = await client.web4Agent.findUnique({
      where: { id: envTreasuryId },
    });
    if (agent) return agent;
  }

  // Look up by designated system name or unique treasury wallet
  const existing = await client.web4Agent.findFirst({
    where: {
      OR: [
        { name: TREASURY_AGENT_NAME },
        { walletAddress: TREASURY_WALLET_ADDRESS },
      ],
    },
  });

  if (existing) return existing;

  // Lazily seed system treasury user and agent if not yet present
  let systemUser = await client.user.findUnique({
    where: { email: TREASURY_SYSTEM_USER_EMAIL },
  });

  if (!systemUser) {
    systemUser = await client.user.create({
      data: {
        email: TREASURY_SYSTEM_USER_EMAIL,
        name: 'Trendly System Treasury',
        passwordHash: 'system_reserved_non_interactive',
      },
    });
  }

  return client.web4Agent.create({
    data: {
      userId: systemUser.id,
      name: TREASURY_AGENT_NAME,
      archetype: 'GENERALIST',
      walletAddress: TREASURY_WALLET_ADDRESS,
      walletBalance: 0,
      skills: [],
      status: 'ACTIVE',
      personality: 'Official Trendly Platform Treasury Agent for protocol commissions and rakes.',
    },
  });
}
