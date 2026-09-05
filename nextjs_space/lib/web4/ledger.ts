import { prisma } from '@/lib/db';

// Append-only real-money ledger. Every walletBalance change on a Web4Agent
// goes through here so balance stays a denormalized cache of the entry sum.
// Idempotency: [agentId, type, ref] unique — replayed refs are no-ops.

export type LedgerType =
  | 'DEPOSIT'
  | 'TRADE_ALLOCATION'
  | 'TRADE_PROCEEDS'
  | 'BATTLE_ENTRY'
  | 'BATTLE_PAYOUT'
  | 'MISSION_BURN'
  | 'WITHDRAWAL'
  | 'ADJUSTMENT'
  | 'MARKETPLACE_BUY'
  | 'MARKETPLACE_SALE'
  | 'MARKETPLACE_RAKE'
  | 'LICENSE_FEE';

/** Entry types that count as REAL earnings (money that actually came in). */
export const REAL_CREDIT_TYPES: string[] = [
  'DEPOSIT',
  'TRADE_PROCEEDS',
  'BATTLE_PAYOUT',
  'MARKETPLACE_SALE',
  'LICENSE_FEE',
];

export interface MoveResult {
  ok: boolean;
  reason?: 'duplicate';
  balance: number;
}

async function move(params: {
  agentId: string;
  userId: string;
  type: LedgerType;
  amountUsdc: number;
  ref: string;
  note?: string;
}): Promise<MoveResult> {
  const { agentId, userId, type, ref, note } = params;
  const amount = Math.round(params.amountUsdc * 1e6) / 1e6; // kill float dust
  return prisma.$transaction(async (tx) => {
    const dup = await tx.ledgerEntry.findUnique({
      where: { agentId_type_ref: { agentId, type, ref } },
    });
    if (dup) {
      const agent = await tx.web4Agent.findUniqueOrThrow({
        where: { id: agentId },
        select: { walletBalance: true },
      });
      return { ok: false, reason: 'duplicate' as const, balance: agent.walletBalance };
    }
    const agent = await tx.web4Agent.update({
      where: { id: agentId },
      data: { walletBalance: { increment: amount } },
      select: { walletBalance: true },
    });
    await tx.ledgerEntry.create({
      data: { agentId, userId, type, amountUsdc: amount, ref, note },
    });
    return { ok: true, balance: agent.walletBalance };
  });
}

/** Credit (positive) or debit (negative) an agent, idempotently by ref. */
export function postEntry(params: {
  agentId: string;
  userId: string;
  type: LedgerType;
  amountUsdc: number;
  ref: string;
  note?: string;
}): Promise<MoveResult> {
  return move(params);
}

/** Balance as the sum of ledger entries — the source of truth. */
export async function ledgerBalance(agentId: string): Promise<number> {
  const agg = await prisma.ledgerEntry.aggregate({
    where: { agentId },
    _sum: { amountUsdc: true },
  });
  return agg._sum.amountUsdc ?? 0;
}

/** Real earnings = sum of real credit types (deposits, trade proceeds, battle pots). */
export async function realEarningsUsdc(agentId: string): Promise<number> {
  const agg = await prisma.ledgerEntry.aggregate({
    where: { agentId, type: { in: REAL_CREDIT_TYPES }, amountUsdc: { gt: 0 } },
    _sum: { amountUsdc: true },
  });
  return agg._sum.amountUsdc ?? 0;
}

/**
 * Real income for a USER across all their agents — the only legitimate source
 * for any "$ earned" surface. Self-reported task claims are not income and are
 * never counted here.
 */
export async function userRealIncomeUsdc(userId: string): Promise<number> {
  const agg = await prisma.ledgerEntry.aggregate({
    where: { userId, type: { in: REAL_CREDIT_TYPES }, amountUsdc: { gt: 0 } },
    _sum: { amountUsdc: true },
  });
  return agg._sum.amountUsdc ?? 0;
}

/** An agent is funded once it has at least one ledger entry (legacy backfill counts). */
export async function isFunded(agentId: string): Promise<boolean> {
  const count = await prisma.ledgerEntry.count({ where: { agentId } });
  return count > 0;
}
