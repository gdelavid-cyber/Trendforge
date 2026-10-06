import crypto from 'crypto';

export interface StarNetJob {
  ventureId: string;
  fulfillmentOrderId?: string;
  taskId?: string;
  agentGoal: string;
  tools?: string[];
  callbackUrl?: string;
}

export interface StarNetResult {
  jobId: string;
  status: 'RUNNING' | 'COMPLETE' | 'FAILED';
  starnetRunId?: string;
  costCents?: number;
  artifact?: unknown;
  completedAt?: string;
}

export interface StarNetStation {
  url: string;
  bridgeSecret?: string;
  stationId?: string;
}

function getDefaultStation(): StarNetStation {
  return {
    url:          process.env.STARNET_URL          || 'http://localhost:8787',
    bridgeSecret: process.env.STARNET_BRIDGE_SECRET || process.env.TRENDFORGE_BRIDGE_SECRET || '',
    stationId:    process.env.STARNET_STATION_ID   || 'local',
  };
}

function signPayload(body: string, secret: string): string {
  if (!secret) return '';
  return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
}

/**
 * Check if a StarNet station is reachable.
 */
export async function checkStationHealth(station?: StarNetStation): Promise<boolean> {
  const s = station || getDefaultStation();
  try {
    const res = await fetch(`${s.url}/api/trendforge/health`, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Dispatch a job to a StarNet station.
 * Returns immediately with jobId — StarNet will POST back to /api/starnet/complete when done.
 */
export async function dispatchToStarNet(
  job: StarNetJob,
  station?: StarNetStation,
): Promise<{ jobId: string }> {
  const s = station || getDefaultStation();

  // Add our callback URL so StarNet can report back
  const callbackUrl = job.callbackUrl ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/starnet/complete`;

  const body = JSON.stringify({ ...job, callbackUrl });
  const sig  = signPayload(body, s.bridgeSecret || '');

  const res = await fetch(`${s.url}/api/trendforge/dispatch`, {
    method: 'POST',
    headers: {
      'Content-Type':           'application/json',
      'X-Trendforge-Signature': sig,
    },
    body,
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`StarNet dispatch failed (${res.status}): ${text}`);
  }

  return res.json();
}

/**
 * Poll a StarNet job for its current status.
 */
export async function getStarNetJob(
  jobId: string,
  station?: StarNetStation,
): Promise<StarNetResult> {
  const s = station || getDefaultStation();
  const res = await fetch(`${s.url}/api/trendforge/runs/${jobId}`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`StarNet job fetch failed (${res.status}): ${text}`);
  }
  return res.json();
}

/**
 * Pull verified cost records from StarNet since a given timestamp.
 * Used to import AI compute costs as ACTUAL FinancialRecords.
 */
export async function pullStarNetLedger(
  since?: Date,
  station?: StarNetStation,
): Promise<Array<{
  jobId: string;
  ventureId: string;
  fulfillmentOrderId: string | null;
  starnetRunId: string | null;
  costCents: number;
  completedAt: string;
}>> {
  const s   = station || getDefaultStation();
  const qs  = since ? `?since=${since.toISOString()}` : '';
  const res = await fetch(`${s.url}/api/trendforge/ledger${qs}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`StarNet ledger fetch failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return data.records || [];
}
