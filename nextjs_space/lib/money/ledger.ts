import { prisma } from '@/lib/core/db';
import { stationBus } from '@/lib/station/bus';

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
  reason?: 'duplicate' | 'blocked';
  balance: number;
  confidence?: number;
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

  // Jev Honesty Verification Gate
  let verificationProb = 1.0;
  let verificationConf = 1.0;
  try {
    const { askJev: askJevGateway } = await import('../intelligence/decision/jev');
    const { instrumentedJevCall } = await import('../observability/collector');
    const res = await instrumentedJevCall(
      {
        gateType: 'ledger_verification',
        agentId,
        userId,
        threshold: 0.85,
        state: { agentId, userId, type, amountUsdc: params.amountUsdc, ref, note },
        questions: {
          is_verifiable_operation: { type: 'noul', description: 'Is this a verifiable operation, or should it be reported as blocked?' },
          confidence: { type: 'score', description: 'Confidence in transaction audit trail 0-100', min: 0, max: 100 },
        },
      },
      () =>
        askJevGateway(
          { agentId, userId, type, amountUsdc: params.amountUsdc, ref, note },
          {
            is_verifiable_operation: { type: 'noul', description: 'Is this a verifiable operation, or should it be reported as blocked?' },
            confidence: { type: 'score', description: 'Confidence in transaction audit trail 0-100', min: 0, max: 100 },
          }
        )
    );
    if (res.decision) {
      verificationProb = res.decision?.is_verifiable_operation?.probability ?? 1.0;
      verificationConf = res.decision?.is_verifiable_operation?.confidence ?? 1.0;
      if (verificationConf < 0.85 || verificationProb < 0.85) {
        const agent = await prisma.web4Agent.findUnique({ where: { id: agentId }, select: { walletBalance: true } });
        return { ok: false, reason: 'blocked' as const, balance: agent?.walletBalance ?? 0, confidence: verificationConf };
      }
    }
  } catch {}

  // Cent invariant: every ledger value is whole cents. Float64 holds integer
  // cents exactly (no drift to $90T), so rounding once here — rather than
  // migrating every money column — permanently ends dust accumulation.
  // Any fractional-cent input is rounded, never truncated silently: callers
  // computing fees must round before posting (see settlement.ts).
  const amount = Math.round(params.amountUsdc * 100) / 100;
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
    try {
      stationBus.emitEvent({
        runId: ref,
        type: 'step',
        timestamp: Date.now(),
        payload: {
          event: 'ledger.entry',
          agentId,
          userId,
          type,
          amountUsdc: amount,
          ref,
          note,
        },
      });
    } catch (_) {}
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
