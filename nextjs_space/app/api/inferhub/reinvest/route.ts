export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/core/db';
import { validatePipelineKey } from '@/lib/pipeline';
import { requireAdminUser } from '@/lib/core/route-auth';

const INFERHUB_BASE = 'https://inferhub.dev/api';

async function fetchInferHub<T>(path: string, init: RequestInit = {}): Promise<T> {
  const resp = await fetch(`${INFERHUB_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.INFERHUB_API_KEY}`,
      ...(init.headers || {}),
    },
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`HTTP ${resp.status}: ${text.slice(0, 200)}`);
  }
  return resp.json() as Promise<T>;
}

/**
 * GET  → current earnings + recent transfers (signed-in users)
 * POST → manual reinvest cycle (PIPELINE_API_KEY or ADMIN session)
 */

export async function GET() {
  try {
    let earnings = null;
    let error: string | null = null;

    if (process.env.INFERHUB_API_KEY) {
      try {
        earnings = await fetchInferHub<{
          publisher_balance_usd: number;
          pending_usd?: number;
          paid_out_usd?: number;
        }>('/publisher/earnings');
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
      }
    } else {
      error = 'INFERHUB_API_KEY not configured';
    }

    const recentTransfers = await prisma.inferHubTransfer.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const totalReinvested = await prisma.inferHubTransfer.aggregate({
      where: { status: 'success' },
      _sum: { amountUsd: true },
      _count: true,
    });

    return NextResponse.json({
      earnings,
      error,
      totalReinvestedUsd: totalReinvested._sum.amountUsd || 0,
      totalSuccessfulTransfers: totalReinvested._count,
      recentTransfers: recentTransfers.map((t) => ({
        id: t.id,
        amountUsd: t.amountUsd,
        publisherBalance: t.publisherBalance,
        consumerBalance: t.consumerBalance,
        status: t.status,
        transactionId: t.transactionId,
        errorMessage: t.errorMessage,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Pipeline key (automation) or admin session (dashboard button).
  if (!validatePipelineKey(request)) {
    const admin = await requireAdminUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const minTransfer = parseFloat(process.env.INFERHUB_REINVEST_MIN_USD || '1.00');

  try {
    if (!process.env.INFERHUB_API_KEY) {
      return NextResponse.json({ error: 'INFERHUB_API_KEY not configured' }, { status: 400 });
    }

    // 1. Fetch balance
    const earnings = await fetchInferHub<{ publisher_balance_usd: number }>('/publisher/earnings');
    const balance = earnings.publisher_balance_usd || 0;

    // 2. Threshold check
    if (balance < minTransfer) {
      const record = await prisma.inferHubTransfer.create({
        data: {
          amountUsd: 0,
          publisherBalance: balance,
          consumerBalance: 0,
          status: 'skipped_below_threshold',
          metadata: { threshold: minTransfer },
        },
      });
      return NextResponse.json({
        success: true,
        action: 'skipped',
        reason: `Balance $${balance.toFixed(4)} below threshold $${minTransfer}`,
        transferId: record.id,
      });
    }

    // 3. Transfer
    const amount = Math.floor(balance * 100) / 100;
    const transferResult = await fetchInferHub<{
      success: boolean;
      transaction_id?: string;
      amount_transferred_usd?: number;
      new_publisher_balance_usd?: number;
      new_consumer_balance_usd?: number;
      error?: string;
    }>('/publisher/earnings/transfer', {
      method: 'POST',
      body: JSON.stringify({ amount_usd: amount }),
    });

    if (!transferResult.success) {
      const record = await prisma.inferHubTransfer.create({
        data: {
          amountUsd: amount,
          publisherBalance: balance,
          consumerBalance: 0,
          status: 'failed',
          errorMessage: transferResult.error || 'API returned success:false',
          metadata: transferResult as unknown as Prisma.InputJsonObject,
        },
      });
      return NextResponse.json(
        { success: false, error: transferResult.error || 'Transfer failed', transferId: record.id },
        { status: 502 }
      );
    }

    const record = await prisma.inferHubTransfer.create({
      data: {
        amountUsd: transferResult.amount_transferred_usd || amount,
        publisherBalance: balance,
        consumerBalance: transferResult.new_consumer_balance_usd || 0,
        status: 'success',
        transactionId: transferResult.transaction_id,
        metadata: transferResult as unknown as Prisma.InputJsonObject,
      },
    });

    return NextResponse.json({
      success: true,
      action: 'transferred',
      amountUsd: transferResult.amount_transferred_usd,
      transactionId: transferResult.transaction_id,
      newConsumerBalanceUsd: transferResult.new_consumer_balance_usd,
      transferId: record.id,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await prisma.inferHubTransfer.create({
      data: {
        amountUsd: 0,
        publisherBalance: 0,
        consumerBalance: 0,
        status: 'failed',
        errorMessage: msg,
      },
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
