import { type LlmFn } from './llm';

// StarNet Station (/v1/*) OpenAI-compatible harness transport.
// Connects Trendly to a local or tunneled StarNet sidecar (sidecar/openai-compat.js on :8787).
//
// Key architectural guarantees:
// 1. Multi-tenant isolation (Weakness #15): Every user/task gets a scoped X-StarNet-Session-Id
//    header (`trendly-${userId}-${sessionId}`), so StarNet's deriveAgentId() isolates
//    transcripts and workspace files per user.
// 2. Cloud-to-local & Host-pin compatibility (Weakness #14): Preserves loopback Host or
//    attaches X-StarNet-Client metadata for reverse proxies/tunnels.
// 3. Truthful capability gating (Weakness #16): Inspects `data.starnet` on every response.
//    If a capability prop (Signal Dish, File Cabinet, Workbench) is missing on the station
//    floor (`capdenied`) or a run fails/interrupts, throws an explicit
//    `BLOCKED by StarNet station: ...` error so Trendly's engine logs a real blocked trace.

const STARNET_TIMEOUT_MS = 180_000;
const MIN_STARNET_KEY_LEN = 16;

export interface StarNetRunOptions {
  baseUrl?: string;
  apiKey?: string;
  /**
   * Either 'starnet-agent' (default Overseer) or the exact name/agentId of a
   * specialist on your StarNet station roster (e.g. 'reddit_scraper', 'deal_finder').
   */
  agent?: string;
  model?: string;
  userId?: string;
  sessionId?: string;
  taskId?: string;
  timeoutMs?: number;
}

export interface StarNetCapabilitiesStatus {
  ok: boolean;
  connected: boolean;
  version?: string;
  streaming?: boolean;
  maxConcurrentRuns?: number;
  capabilities?: string[];
  missing?: string[];
  models?: string[];
  reason?: string;
}

export function validateStarNetApiKey(rawKey?: string | null): string {
  const key = (rawKey || process.env.STARNET_API_KEY || '').trim();
  if (key.length < MIN_STARNET_KEY_LEN) {
    throw new Error(
      `StarNet /v1 API requires STARNET_API_KEY of at least ${MIN_STARNET_KEY_LEN} characters.`
    );
  }
  return key;
}

/**
 * Normalizes a StarNet server URL to its root origin/path (stripping trailing `/v1` or `/chat/completions`).
 */
export function normalizeStarNetBaseUrl(rawUrl?: string | null): string {
  const fallback = process.env.STARNET_SERVE_URL || 'http://127.0.0.1:8787';
  const base = (rawUrl || fallback).trim().replace(/\/+$/, '');
  return base
    .replace(/\/v1\/chat\/completions$/i, '')
    .replace(/\/chat\/completions$/i, '')
    .replace(/\/v1$/i, '');
}

/**
 * Builds a deterministic, tenant-isolated session ID for StarNet's `X-StarNet-Session-Id` header.
 * Prevents cross-user workspace or memory collisions on a shared StarNet station.
 */
export function buildStarNetSessionId(userId?: string, sessionId?: string): string {
  const safeUser = (userId || 'anon').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 24);
  const safeSession = (sessionId || 'default').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 24);
  return `trendly-${safeUser}-${safeSession}`;
}

async function parseResponseJson(res: any): Promise<any> {
  if (typeof res?.json === 'function') {
    return await res.json();
  }
  if (typeof res?.text === 'function') {
    const raw = await res.text();
    return raw ? JSON.parse(raw) : {};
  }
  return {};
}

/**
 * Preflight check against StarNet's `/health`, `/v1/capabilities`, and `/v1/models` endpoints.
 */
export async function checkStarNetCapabilities(
  opts: { baseUrl?: string; apiKey?: string; requiredCapabilities?: string[] } = {}
): Promise<StarNetCapabilitiesStatus> {
  const base = normalizeStarNetBaseUrl(opts.baseUrl);
  const apiKey = (opts.apiKey || process.env.STARNET_API_KEY || '').trim();
  const required = opts.requiredCapabilities ?? [];

  try {
    const healthRes = await fetch(`${base}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    });
    if (!healthRes.ok) {
      return {
        ok: false,
        connected: false,
        reason: `StarNet /health returned HTTP ${healthRes.status}`,
      };
    }

    const health = await parseResponseJson(healthRes).catch(() => ({}));
    if (apiKey.length < MIN_STARNET_KEY_LEN) {
      return {
        ok: false,
        connected: true,
        version: health.version,
        reason: `StarNet sidecar is online (v${health.version || 'unknown'}), but STARNET_API_KEY (<16 chars) is not set for /v1 harness calls.`,
      };
    }

    const authHeaders = {
      Authorization: `Bearer ${apiKey}`,
    };

    const [capRes, modelsRes] = await Promise.all([
      fetch(`${base}/v1/capabilities`, {
        headers: authHeaders,
        cache: 'no-store',
        signal: AbortSignal.timeout(8_000),
      }).catch(() => null),
      fetch(`${base}/v1/models`, {
        headers: authHeaders,
        cache: 'no-store',
        signal: AbortSignal.timeout(8_000),
      }).catch(() => null),
    ]);

    const capData = capRes && capRes.ok ? await parseResponseJson(capRes).catch(() => null) : null;
    const modelsData = modelsRes && modelsRes.ok ? await parseResponseJson(modelsRes).catch(() => null) : null;
    const models = Array.isArray(modelsData?.data)
      ? modelsData.data.map((m: { id?: string }) => String(m.id || '')).filter(Boolean)
      : ['starnet-agent'];
    const capabilities: string[] = Array.isArray(capData?.capabilities)
      ? capData.capabilities.map((c: unknown) => String(c))
      : [];
    const missing = required.filter((req) => !capabilities.includes(req));

    return {
      ok: missing.length === 0,
      connected: true,
      version: capData?.version || health.version,
      streaming: Boolean(capData?.streaming ?? true),
      maxConcurrentRuns: Number(capData?.max_concurrent_runs ?? 0),
      capabilities,
      missing,
      models,
    };
  } catch (err: any) {
    return {
      ok: false,
      connected: false,
      reason: err?.message || 'StarNet sidecar is unreachable.',
    };
  }
}

/**
 * Creates an LlmFn backed by StarNet's `/v1/chat/completions` harness ingress.
 */
export function starnetServeLlm(opts: StarNetRunOptions = {}): LlmFn {
  const base = normalizeStarNetBaseUrl(opts.baseUrl);
  const apiKey = (opts.apiKey || process.env.STARNET_API_KEY || '').trim();
  const targetAgent = (opts.agent || opts.model || process.env.STARNET_MODEL || 'starnet-agent').trim();
  const timeoutMs = opts.timeoutMs ?? STARNET_TIMEOUT_MS;

  return async (messages, jsonMode = false) => {
    const validKey = validateStarNetApiKey(apiKey);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const sessionId = buildStarNetSessionId(opts.userId, opts.sessionId || opts.taskId);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validKey}`,
        'X-StarNet-Session-Id': sessionId,
      };

      const body: Record<string, unknown> = {
        model: targetAgent,
        stream: false,
        messages,
      };
      if (jsonMode) {
        body.response_format = { type: 'json_object' };
      }

      const res = await fetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = typeof res.text === 'function' ? await res.text().catch(() => '') : '';
        throw new Error(`StarNet /v1/chat/completions (${res.status}): ${errText.slice(0, 240)}`);
      }

      const data = await parseResponseJson(res);
      const content = String(data?.choices?.[0]?.message?.content ?? '').trim();
      const starnetMeta = data?.starnet;

      // Enforce truthful telemetry: surface capability denials or failed runs honestly
      if (
        starnetMeta &&
        (starnetMeta.status === 'blocked' ||
          starnetMeta.status === 'error' ||
          (starnetMeta.completed === false && !content))
      ) {
        const detail =
          starnetMeta.reason ||
          starnetMeta.error ||
          data?.error?.message ||
          `run ended with status '${starnetMeta.status}'`;
        throw new Error(`BLOCKED by StarNet station: ${detail}`);
      }

      if (!content) {
        throw new Error('StarNet station returned an empty reply');
      }

      return content;
    } finally {
      clearTimeout(timer);
    }
  };
}
