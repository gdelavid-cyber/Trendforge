import { prisma } from '@/lib/core/db';
import { logExecutionEvent } from '@/lib/execution/logger';

export interface EscrowReleaseResult {
  ok: boolean;
  saleId: string;
  userPayoutCents: number;
  platformFeeCents: number;
  kycRequired?: boolean;
  error?: string;
}

/**
 * Ownership gate shared by all escrow mutations. The seller
 * (sale.userId) or an ADMIN may act; everyone else gets a 403-style error.
 */
export function assertSaleAccess(
  sale: { userId: string },
  caller: { userId: string; isAdmin: boolean }
): void {
  if (caller.isAdmin) return;
  if (sale.userId !== caller.userId) {
    const err = new Error('Not your sale.') as Error & { status?: number };
    err.status = 403;
    throw err;
  }
}

/**
 * Creates an escrow transaction record for a sale.
 */
export async function createEscrowForSale(
  saleId: string,
  stripePaymentIntentId?: string,
  caller?: { userId: string; isAdmin: boolean }
) {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
  });

  if (!sale) throw new Error('Sale not found');
  if (caller) assertSaleAccess(sale, caller);

  const updated = await prisma.sale.update({
    where: { id: saleId },
    data: {
      escrowStatus: 'HELD',
      stripePaymentIntentId: stripePaymentIntentId || sale.stripePaymentIntentId,
    },
  });

  await logExecutionEvent({
    taskId: sale.taskId,
    logType: 'payment_event',
    actor: 'system',
    actorId: 'escrow_service',
    actionDescription: `Buyer deposited $${(sale.saleAmountCents / 100).toFixed(2)} into escrow for sale #${sale.id.slice(-6)}.`,
    inputs: { saleId, amountCents: sale.saleAmountCents },
    outputs: { escrowStatus: 'HELD' },
  });

  return updated;
}

/**
 * Releases funds held in escrow to the user after delivery confirmation.
 * Enforces KYC verification if the payout exceeds $500.00 (50,000 cents).
 */
export async function releaseEscrowPayout(
  saleId: string,
  caller?: { userId: string; isAdmin: boolean }
): Promise<EscrowReleaseResult> {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { user: true },
  });

  if (!sale) return { ok: false, saleId, userPayoutCents: 0, platformFeeCents: 0, error: 'Sale not found' };
  if (caller) {
    try {
      assertSaleAccess(sale, caller);
    } catch (e: any) {
      return { ok: false, saleId, userPayoutCents: 0, platformFeeCents: 0, error: e?.message ?? 'Not permitted' };
    }
  }

  if (sale.escrowStatus === 'RELEASED') {
    return { ok: true, saleId, userPayoutCents: sale.userPayoutCents, platformFeeCents: sale.platformFeeCents };
  }

  // KYC Threshold Check: Payouts >= $500 (50,000 cents) require verified compliance agreement
  const KYC_THRESHOLD_CENTS = 50000;
  if (sale.userPayoutCents >= KYC_THRESHOLD_CENTS) {
    const compliance = await prisma.complianceAgreement.findFirst({
      where: { userId: sale.userId },
    });

    if (!compliance || !compliance.termsAccepted) {
      return {
        ok: false,
        saleId,
        userPayoutCents: sale.userPayoutCents,
        platformFeeCents: sale.platformFeeCents,
        kycRequired: true,
        error: 'KYC identity verification required for payouts exceeding $500.00.',
      };
    }
  }

  // Release escrow funds
  const updatedSale = await prisma.sale.update({
    where: { id: saleId },
    data: {
      escrowStatus: 'RELEASED',
      releasedAt: new Date(),
      deliveredAt: sale.deliveredAt || new Date(),
    },
  });

  // Log in immutable audit trail
  await logExecutionEvent({
    taskId: sale.taskId,
    logType: 'payment_event',
    actor: 'system',
    actorId: 'escrow_service',
    actionDescription: `Escrow released. Transferred $${(sale.userPayoutCents / 100).toFixed(2)} to user account (Platform fee: $${(sale.platformFeeCents / 100).toFixed(2)}).`,
    inputs: { saleId, userPayoutCents: sale.userPayoutCents },
    outputs: { escrowStatus: 'RELEASED' },
  });

  return {
    ok: true,
    saleId,
    userPayoutCents: updatedSale.userPayoutCents,
    platformFeeCents: updatedSale.platformFeeCents,
  };
}

/**
 * Refunds buyer and marks escrow as refunded.
 */
export async function refundEscrowToBuyer(
  saleId: string,
  reason: string,
  caller?: { userId: string; isAdmin: boolean }
) {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
  });

  if (!sale) throw new Error('Sale not found');
  if (caller) assertSaleAccess(sale, caller);

  const updated = await prisma.sale.update({
    where: { id: saleId },
    data: {
      escrowStatus: 'REFUNDED',
    },
  });

  await logExecutionEvent({
    taskId: sale.taskId,
    logType: 'payment_event',
    actor: 'system',
    actorId: 'escrow_service',
    actionDescription: `Escrow refunded to buyer (${sale.buyerName}). Reason: ${reason}.`,
    inputs: { saleId, reason },
    outputs: { escrowStatus: 'REFUNDED' },
  });

  return updated;
}
