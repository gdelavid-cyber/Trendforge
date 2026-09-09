/**
 * InferHub Publisher Earnings → Consumer Balance Auto-Reinvestment
 *
 * Modes:
 *   npx tsx scripts/reinvest-inferhub-earnings.ts            → one-shot
 *   npx tsx scripts/reinvest-inferhub-earnings.ts --daemon   → poll forever
 *   npx tsx scripts/reinvest-inferhub-earnings.ts --dry-run  → simulate only
 *
 * Environment:
 *   INFERHUB_API_KEY               (required — same key used for inference)
 *   INFERHUB_REINVEST_MIN_USD      (optional, default 1.00)
 *   INFERHUB_REINVEST_INTERVAL_MIN (optional, default 60 minutes)
 *   INFERHUB_ALERT_WEBHOOK         (optional — POSTs JSON on failure)
 */

import 'dotenv/config';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/core/db';

// ---------- Config ----------

const INFERHUB_BASE = 'https://inferhub.dev/api';
const API_KEY = process.env.INFERHUB_API_KEY || '';
const MIN_TRANSFER_USD = parseFloat(process.env.INFERHUB_REINVEST_MIN_USD || '1.00');
const INTERVAL_MIN = parseInt(process.env.INFERHUB_REINVEST_INTERVAL_MIN || '60', 10);
const ALERT_WEBHOOK = process.env.INFERHUB_ALERT_WEBHOOK || '';

const DAEMON = process.argv.includes('--daemon');
const DRY_RUN = process.argv.includes('--dry-run');

// ---------- Types ----------

interface EarningsResponse {
  publisher_balance_usd: number;
  pending_usd?: number;
  paid_out_usd?: number;
  last_updated?: string;
}

interface TransferResponse {
  success: boolean;
  transaction_id?: string;
  amount_transferred_usd?: number;
  new_publisher_balance_usd?: number;
  new_consumer_balance_usd?: number;
  error?: string;
}

interface BalanceResponse {
  consumer_balance_usd: number;
}

// ---------- Utils ----------

function log(level: 'info' | 'warn' | 'error', msg: string, extra?: unknown) {
  const ts = new Date().toISOString();
  const prefix = `[reinvest ${ts}]`;
  const line = extra
    ? `${prefix} ${level.toUpperCase()} ${msg} ${JSON.stringify(extra)}`
    : `${prefix} ${level.toUpperCase()} ${msg}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const resp = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      ...(init.headers || {}),
    },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`HTTP ${resp.status} from ${url}: ${text.slice(0, 300)}`);
  }
  return resp.json() as Promise<T>;
}

async function alertFailure(reason: string, details: Record<string, unknown>) {
  if (!ALERT_WEBHOOK) return;
  try {
    await fetch(ALERT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: 'trendly-inferhub-reinvest',
        severity: 'error',
        reason,
        details,
        at: new Date().toISOString(),
      }),
    });
  } catch (err) {
    log('warn', 'Alert webhook failed', { err: String(err) });
  }
}

// ---------- Core actions ----------

async function getPublisherEarnings(): Promise<EarningsResponse> {
  return fetchJson<EarningsResponse>(`${INFERHUB_BASE}/publisher/earnings`);
}

async function getConsumerBalance(): Promise<number> {
  try {
    const data = await fetchJson<BalanceResponse>(`${INFERHUB_BASE}/consumer/balance`);
    return data.consumer_balance_usd;
  } catch {
    return 0;
  }
}

async function transferEarnings(amountUsd: number): Promise<TransferResponse> {
  return fetchJson<TransferResponse>(`${INFERHUB_BASE}/publisher/earnings/transfer`, {
    method: 'POST',
    body: JSON.stringify({ amount_usd: amountUsd }),
  });
}

// ---------- Main cycle ----------

async function runOnce(): Promise<'success' | 'skipped' | 'failed'> {
  if (!API_KEY) {
    log('error', 'INFERHUB_API_KEY is not set — cannot proceed');
    return 'failed';
  }

  log('info', 'Cycle starting', { minTransferUsd: MIN_TRANSFER_USD, dryRun: DRY_RUN });

  // 1. Fetch current publisher balance
  let earnings: EarningsResponse;
  try {
    earnings = await getPublisherEarnings();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log('error', 'Failed to fetch publisher earnings', { err: msg });
    await prisma.inferHubTransfer.create({
      data: {
        amountUsd: 0,
        publisherBalance: 0,
        consumerBalance: 0,
        status: 'failed',
        errorMessage: `earnings fetch failed: ${msg}`,
      },
    });
    await alertFailure('earnings_fetch_failed', { error: msg });
    return 'failed';
  }

  const publisherBalance = earnings.publisher_balance_usd || 0;
  log('info', 'Publisher balance retrieved', {
    balance: publisherBalance,
    pending: earnings.pending_usd,
    paidOut: earnings.paid_out_usd,
  });

  // 2. Check threshold
  if (publisherBalance < MIN_TRANSFER_USD) {
    log('info', `Balance below threshold ($${publisherBalance} < $${MIN_TRANSFER_USD}), skipping`);
    await prisma.inferHubTransfer.create({
      data: {
        amountUsd: 0,
        publisherBalance,
        consumerBalance: 0,
        status: 'skipped_below_threshold',
        metadata: { threshold: MIN_TRANSFER_USD },
      },
    });
    return 'skipped';
  }

  // 3. Dry run exit
  if (DRY_RUN) {
    log('info', `[DRY RUN] Would transfer $${publisherBalance.toFixed(4)}`);
    return 'success';
  }

  // 4. Execute transfer
  const transferAmount = Math.floor(publisherBalance * 100) / 100; // round DOWN to cents to avoid float overrun

  let transferResult: TransferResponse;
  try {
    transferResult = await transferEarnings(transferAmount);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log('error', 'Transfer request failed', { err: msg, amount: transferAmount });
    await prisma.inferHubTransfer.create({
      data: {
        amountUsd: transferAmount,
        publisherBalance,
        consumerBalance: 0,
        status: 'failed',
        errorMessage: `transfer request failed: ${msg}`,
      },
    });
    await alertFailure('transfer_request_failed', {
      amount: transferAmount,
      publisherBalance,
      error: msg,
    });
    return 'failed';
  }

  // 5. Verify response
  if (!transferResult.success) {
    const errMsg = transferResult.error || 'unknown';
    log('error', 'Transfer API returned failure', { error: errMsg });
    await prisma.inferHubTransfer.create({
      data: {
        amountUsd: transferAmount,
        publisherBalance,
        consumerBalance: 0,
        status: 'failed',
        errorMessage: `API returned failure: ${errMsg}`,
        metadata: transferResult as unknown as Prisma.InputJsonObject,
      },
    });
    await alertFailure('transfer_api_failure', {
      amount: transferAmount,
      apiError: errMsg,
    });
    return 'failed';
  }

  // 6. Success — log it
  const newConsumer = transferResult.new_consumer_balance_usd ?? (await getConsumerBalance());
  log('info', `Transfer SUCCESS: $${transferResult.amount_transferred_usd?.toFixed(4)}`, {
    txId: transferResult.transaction_id,
    newPublisherBalance: transferResult.new_publisher_balance_usd,
    newConsumerBalance: newConsumer,
  });

  await prisma.inferHubTransfer.create({
    data: {
      amountUsd: transferResult.amount_transferred_usd || transferAmount,
      publisherBalance,
      consumerBalance: newConsumer,
      status: 'success',
      transactionId: transferResult.transaction_id,
      metadata: {
        newPublisherBalance: transferResult.new_publisher_balance_usd,
        rawResponse: transferResult,
      } as unknown as Prisma.InputJsonObject,
    },
  });

  return 'success';
}

// ---------- Daemon loop ----------

async function daemonLoop() {
  log('info', `Daemon mode started — polling every ${INTERVAL_MIN}m`);

  let consecutiveFailures = 0;

  // graceful shutdown
  const stop = () => {
    log('info', 'Received shutdown signal, exiting cleanly');
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  while (true) {
    try {
      const result = await runOnce();
      if (result === 'failed') {
        consecutiveFailures += 1;
        if (consecutiveFailures >= 5) {
          log('error', 'Five consecutive failures — pausing 30 minutes');
          await alertFailure('consecutive_failures', { count: consecutiveFailures });
          await sleep(30 * 60 * 1000);
          consecutiveFailures = 0;
        }
      } else {
        consecutiveFailures = 0;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log('error', 'Unhandled error in cycle', { err: msg });
    }

    await sleep(INTERVAL_MIN * 60 * 1000);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------- Entry ----------

(async () => {
  try {
    if (DAEMON) {
      await daemonLoop();
    } else {
      const result = await runOnce();
      log('info', `One-shot complete: ${result}`);
      process.exit(result === 'failed' ? 1 : 0);
    }
  } catch (err) {
    log('error', 'Fatal error', { err: String(err) });
    process.exit(1);
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
})();
