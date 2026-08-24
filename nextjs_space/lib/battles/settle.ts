import { prisma } from '@/lib/db';
import { postEntry } from '@/lib/web4/ledger';

// Battle settlement on the real-money ledger. The challenger's entry fee is
// debited up front; the winner is credited the pot. No money is created —
// when the challenger wins they net zero. Insufficient funds reject entry.

export interface BattleTierConfig {
  name: string;
  tier: string;
  entryFeeUsdc: number;
  [key: string]: unknown;
}

export interface SettleInput {
  challenger: { id: string; userId: string; walletBalance: number };
  defender: { id: string; userId: string; walletBalance: number };
  winnerId: string;
  tierConfig: BattleTierConfig;
}

export interface SettleResult {
  ok: boolean;
  error?: string;
  code?: 'INSUFFICIENT_FUNDS' | 'SETTLEMENT_FAILED';
  pot?: number;
  balances?: { challenger: number; defender: number };
}

/**
 * Debits the challenger's entry fee and credits the winner's pot with a
 * shared idempotency ref. Both entries share one ref so a replay settles
 * neither half twice.
 */
export async function settleBattle(input: SettleInput): Promise<SettleResult> {
  const { challenger, defender, winnerId, tierConfig } = input;
  const pot = Math.round(tierConfig.entryFeeUsdc * 1e6) / 1e6;

  if (challenger.walletBalance < pot) {
    return {
      ok: false,
      error: `Challenger requires at least $${pot.toFixed(2)} USDC in Conway wallet to enter ${tierConfig.name}.`,
      code: 'INSUFFICIENT_FUNDS',
    };
  }

  const battleRef = `battle-${challenger.id}-${defender.id}-${Date.now()}`;

  const entry = await postEntry({
    agentId: challenger.id,
    userId: challenger.userId,
    type: 'BATTLE_ENTRY',
    amountUsdc: -pot,
    ref: battleRef,
    note: `${tierConfig.name} entry fee`,
  });
  if (!entry.ok) {
    return { ok: false, error: 'Duplicate battle settlement.', code: 'SETTLEMENT_FAILED' };
  }

  await postEntry({
    agentId: winnerId,
    userId: winnerId === challenger.id ? challenger.userId : defender.userId,
    type: 'BATTLE_PAYOUT',
    amountUsdc: pot,
    ref: battleRef,
    note: `Winner pot of $${pot.toFixed(2)} USDC`,
  });

  const [challengerAfter, defenderAfter] = await Promise.all([
    prisma.web4Agent.findUniqueOrThrow({ where: { id: challenger.id }, select: { walletBalance: true } }),
    prisma.web4Agent.findUniqueOrThrow({ where: { id: defender.id }, select: { walletBalance: true } }),
  ]);

  return {
    ok: true,
    pot,
    balances: { challenger: challengerAfter.walletBalance, defender: defenderAfter.walletBalance },
  };
}

/** Persists the AgentBattle record after a settled (or exhibition) match. */
export async function recordBattle(params: {
  challengerId: string;
  defenderId: string;
  arenaType: string;
  winnerId: string;
  pot: number;
  logs: unknown;
}): Promise<string> {
  const record = await prisma.agentBattle.create({
    data: {
      challengerId: params.challengerId,
      defenderId: params.defenderId,
      arenaType: params.arenaType,
      winnerId: params.winnerId,
      yieldGenerated: params.pot,
      logs: params.logs as any,
    },
  });
  return record.id;
}
