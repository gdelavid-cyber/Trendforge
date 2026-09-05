import { prisma } from '@/lib/core/db';
import { getTreasuryAgent } from './treasury';
import type { Prisma } from '@prisma/client';
import type { LedgerType } from './ledger';

export class SettlementError extends Error {
  constructor(
    public code:
      | 'INSUFFICIENT_FUNDS'
      | 'AGENT_NOT_FOUND'
      | 'INVALID_AMOUNT'
      | 'SELF_TRANSFER'
      | 'DUPLICATE_SETTLEMENT'
      | 'LISTING_NOT_ACTIVE',
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SettlementError';
  }
}

export interface TransferFundsParams {
  fromAgentId: string;
  toAgentId: string;
  amountUsdc: number;
  type?: 'MARKETPLACE' | 'LICENSE' | 'COSMETIC';
  ref: string;
  note?: string;
  rakePercent?: number; // e.g. 0.10 for 10% platform fee
}

export interface SettlementResult {
  ok: boolean;
  ref: string;
  totalAmount: number;
  rakeAmount: number;
  sellerPayout: number;
  fromAgentBalance: number;
  toAgentBalance: number;
  treasuryAgentId: string;
}

/**
 * Atomic settlement primitive: transfers real USDC between two agents via LedgerEntry rows
 * and updates denormalized walletBalance caches in the same interactive transaction.
 *
 * Enforces:
 * 1. In-transaction balance checks (no TOCTOU).
 * 2. Strict fail-closed on insufficient balance (throws SettlementError).
 * 3. Floor-rounded platform rake (seller gets the remainder).
 * 4. Rake distribution to the system treasury agent.
 * 5. Append-only ledger entries for all parties.
 * 6. Idempotency guard on [agentId, type, ref].
 */
export async function transferFunds(
  tx: Prisma.TransactionClient,
  params: TransferFundsParams
): Promise<SettlementResult> {
  const {
    fromAgentId,
    toAgentId,
    amountUsdc,
    type = 'MARKETPLACE',
    ref,
    note,
    rakePercent = 0.10,
  } = params;

  if (amountUsdc <= 0) {
    throw new SettlementError('INVALID_AMOUNT', `Transfer amount must be positive, got ${amountUsdc}`);
  }

  if (fromAgentId === toAgentId) {
    throw new SettlementError('SELF_TRANSFER', 'Cannot transfer funds to the same agent');
  }

  // Determine ledger types based on transaction category
  const debitType: LedgerType = type === 'LICENSE' ? 'LICENSE_FEE' : 'MARKETPLACE_BUY';
  const creditType: LedgerType = type === 'LICENSE' ? 'LICENSE_FEE' : 'MARKETPLACE_SALE';
  const rakeType: LedgerType = 'MARKETPLACE_RAKE';

  // Idempotency check on the debit entry
  const existingDebit = await tx.ledgerEntry.findUnique({
    where: {
      agentId_type_ref: {
        agentId: fromAgentId,
        type: debitType,
        ref,
      },
    },
  });

  if (existingDebit) {
    const fromAgent = await tx.web4Agent.findUniqueOrThrow({ where: { id: fromAgentId } });
    const toAgent = await tx.web4Agent.findUniqueOrThrow({ where: { id: toAgentId } });
    const treasury = await getTreasuryAgent(tx);

    const rake = Math.floor(amountUsdc * rakePercent * 100) / 100;
    const payout = Math.round((amountUsdc - rake) * 100) / 100;

    return {
      ok: true,
      ref,
      totalAmount: amountUsdc,
      rakeAmount: rake,
      sellerPayout: payout,
      fromAgentBalance: fromAgent.walletBalance,
      toAgentBalance: toAgent.walletBalance,
      treasuryAgentId: treasury.id,
    };
  }

  // Read buyer agent within transaction to prevent race conditions / TOCTOU
  const fromAgent = await tx.web4Agent.findUnique({
    where: { id: fromAgentId },
    select: { id: true, userId: true, walletBalance: true },
  });

  if (!fromAgent) {
    throw new SettlementError('AGENT_NOT_FOUND', `Buyer agent ${fromAgentId} not found`);
  }

  // Fail closed if buyer does not hold sufficient real funds
  if (fromAgent.walletBalance < amountUsdc) {
    throw new SettlementError(
      'INSUFFICIENT_FUNDS',
      `Agent ${fromAgentId} has insufficient funds ($${fromAgent.walletBalance.toFixed(2)} available, $${amountUsdc.toFixed(2)} required)`,
      { available: fromAgent.walletBalance, required: amountUsdc }
    );
  }

  // Read recipient seller agent
  const toAgent = await tx.web4Agent.findUnique({
    where: { id: toAgentId },
    select: { id: true, userId: true, walletBalance: true },
  });

  if (!toAgent) {
    throw new SettlementError('AGENT_NOT_FOUND', `Recipient seller agent ${toAgentId} not found`);
  }

  // Calculate rake with floor rounding to 2 decimals, seller gets remainder
  const rakeAmount = rakePercent > 0 ? Math.floor(amountUsdc * rakePercent * 100) / 100 : 0;
  const sellerPayout = Math.round((amountUsdc - rakeAmount) * 100) / 100;

  // 1. Debit buyer agent
  const updatedFrom = await tx.web4Agent.update({
    where: { id: fromAgentId },
    data: { walletBalance: { decrement: amountUsdc } },
    select: { walletBalance: true },
  });

  await tx.ledgerEntry.create({
    data: {
      agentId: fromAgentId,
      userId: fromAgent.userId,
      type: debitType,
      amountUsdc: -amountUsdc,
      ref,
      note: note || `Purchase payment for ${ref}`,
    },
  });

  // 2. Credit seller agent with remainder
  const updatedTo = await tx.web4Agent.update({
    where: { id: toAgentId },
    data: { walletBalance: { increment: sellerPayout } },
    select: { walletBalance: true },
  });

  await tx.ledgerEntry.create({
    data: {
      agentId: toAgentId,
      userId: toAgent.userId,
      type: creditType,
      amountUsdc: sellerPayout,
      ref,
      note: note || `Sale payout for ${ref} (after ${Math.round(rakePercent * 100)}% platform rake)`,
    },
  });

  // 3. Credit treasury agent with platform rake if applicable
  const treasuryAgent = await getTreasuryAgent(tx);
  if (rakeAmount > 0) {
    await tx.web4Agent.update({
      where: { id: treasuryAgent.id },
      data: { walletBalance: { increment: rakeAmount } },
    });

    await tx.ledgerEntry.create({
      data: {
        agentId: treasuryAgent.id,
        userId: treasuryAgent.userId,
        type: rakeType,
        amountUsdc: rakeAmount,
        ref,
        note: `Platform fee (${Math.round(rakePercent * 100)}%) from settlement ${ref}`,
      },
    });
  }

  return {
    ok: true,
    ref,
    totalAmount: amountUsdc,
    rakeAmount,
    sellerPayout,
    fromAgentBalance: updatedFrom.walletBalance,
    toAgentBalance: updatedTo.walletBalance,
    treasuryAgentId: treasuryAgent.id,
  };
}

/**
 * Convenience wrapper to execute transferFunds inside an isolated interactive transaction.
 */
export async function executeSettlement(params: TransferFundsParams): Promise<SettlementResult> {
  return prisma.$transaction(async (tx) => {
    return transferFunds(tx, params);
  });
}
