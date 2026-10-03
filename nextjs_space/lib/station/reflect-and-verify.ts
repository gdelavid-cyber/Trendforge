import { redis } from '@/lib/core/redis';

/**
 * TrendForge Station — Cortex Reflection & Mechanical Completion Evidence
 *
 * Evolved from StarNet's `sidecar/reflect.js`, `sidecar/verify.js`, and
 * `sidecar/completion-evidence.js`:
 * 1. Secret-redacted, anti-noise durable belief extraction (`FACT` & `PREFERENCE`)
 *    with `<recalled-memory>` fence stripping, transient chatter rejection,
 *    and Jaccard token similarity deduplication.
 * 2. Mechanical Completion Evidence tracking (`CompletionEvidenceTracker`) that
 *    separates unverified tool calls from mechanically verified outcomes.
 */

export type BeliefKind = 'fact' | 'profile';

export interface StationBelief {
  id: string;
  userId: string;
  kind: BeliefKind;
  content: string;
  confidence: number;
  createdAt: string;
}

const MAX_CONTENT = 280;
const MIN_CONTENT = 8;
const MIN_TOKENS = 2;
const DEFAULT_MAX_PROPOSALS = 5;

const LINE_RE = /^\s*[-*•]?\s*(FACT|PREFERENCE|PROFILE)\s*[:\-—]\s*(.+?)\s*$/i;
const TRANSIENT_RE =
  /^(the user (said|asked|wanted|mentioned|requested)|we (discussed|talked|covered|went over)|in this (run|task|session|conversation)|this (run|task|session)|today (i|we)|the (task|conversation) (was|is))\b/i;
const ADVICE_RE =
  /^(to (use|enable|set up|configure|get|install|run|access)\b|(here('s| is) )?how to\b|steps? to\b|you (can|should|need to)\b)|\bshould be (exposed|set|added|configured|stored|placed|defined|passed|provided)\b/i;
const RECALL_FENCE_RE = /<recalled-memory>[\s\S]*?<\/recalled-memory>|<\/?recalled-memory>/gi;

// Secret patterns to redact before any memory candidate is accepted
const SECRET_PATTERNS: RegExp[] = [
  /\bsk-[A-Za-z0-9_-]{16,}\b/g,
  /\bsk-or-v1-[A-Za-z0-9_-]{16,}\b/g,
  /\bxai-[A-Za-z0-9_-]{16,}\b/g,
  /\bSG\.[A-Za-z0-9._-]{20,}\b/g,
  /\bBearer\s+[A-Za-z0-9._-]{16,}\b/gi,
  /\b0x[a-fA-F0-9]{64}\b/g,
];

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
  'did', 'that', 'this', 'it', 'as', 'by', 'from',
]);

export function redactSecrets(text: string): string {
  let out = String(text ?? '');
  for (const pat of SECRET_PATTERNS) {
    out = out.replace(pat, '[REDACTED_SECRET]');
  }
  return out;
}

export function stripRecallFence(text: string): string {
  return String(text ?? '').replace(RECALL_FENCE_RE, '').trim();
}

function significantTokens(text: string): string[] {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

export function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(significantTokens(a));
  const setB = new Set(significantTokens(b));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const tok of setA) {
    if (setB.has(tok)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Parses raw tagged reflection lines (`FACT: ...`, `PREFERENCE: ...`) into
 * sanitized, deduplicated, secret-redacted `StationBelief` records.
 */
export function parseAndFilterBeliefs(
  rawModelOutput: string,
  userId: string,
  existingBeliefs: StationBelief[] = [],
  maxCount = DEFAULT_MAX_PROPOSALS
): StationBelief[] {
  const lines = stripRecallFence(rawModelOutput)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const accepted: StationBelief[] = [];
  const existingTexts = existingBeliefs.map((b) => b.content);

  for (const line of lines) {
    if (accepted.length >= maxCount) break;
    const match = LINE_RE.exec(line);
    if (!match) continue;

    const rawTag = match[1].toUpperCase();
    const kind: BeliefKind = rawTag === 'FACT' ? 'fact' : 'profile';
    const cleaned = redactSecrets(match[2].replace(/\s+/g, ' ').trim()).slice(0, MAX_CONTENT);

    if (cleaned.length < MIN_CONTENT) continue;
    if (TRANSIENT_RE.test(cleaned)) continue;
    if (ADVICE_RE.test(cleaned)) continue;
    if (cleaned.includes('[REDACTED_SECRET]')) continue; // Never persist secret-bearing lines

    const tokens = significantTokens(cleaned);
    if (tokens.length < MIN_TOKENS) continue;

    // Deduplicate against existing store and current batch (Jaccard >= 0.72)
    const isDup = [...existingTexts, ...accepted.map((a) => a.content)].some(
      (prev) => prev.toLowerCase() === cleaned.toLowerCase() || jaccardSimilarity(prev, cleaned) >= 0.72
    );
    if (isDup) continue;

    accepted.push({
      id: `belief_${Date.now()}_${accepted.length + 1}`,
      userId,
      kind,
      content: cleaned,
      confidence: kind === 'profile' ? 0.9 : 0.85,
      createdAt: new Date().toISOString(),
    });
  }

  return accepted;
}

/**
 * Builds a bounded prompt for the Cortex reflection pass, including ALREADY REMEMBERED
 * beliefs so the model doesn't re-propose known facts.
 */
export function buildReflectionPrompt(
  messages: Array<{ role: string; content: string }>,
  existingBeliefs: StationBelief[] = []
): string {
  const turns = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => `${m.role === 'user' ? 'USER' : 'AGENT'}: ${stripRecallFence(m.content)}`)
    .join('\n')
    .slice(-3600);

  const known = existingBeliefs
    .slice(-20)
    .map((b) => `- ${b.content.replace(/\s+/g, ' ').slice(0, 150)}`)
    .join('\n');

  const knownBlock = known
    ? `ALREADY REMEMBERED — do NOT propose any of these again:\n${known}\n\n`
    : '';

  return (
    `${knownBlock}Review the recent exchange below and extract up to 3 durable, high-value memories ` +
    `worth remembering across future runs. Emit ONLY lines prefixed with "FACT: " or "PREFERENCE: ". ` +
    `Do NOT emit transient run narration ("we discussed X") or how-to instructions. If nothing durable is new, output NONE.\n\n` +
    `${turns}`
  );
}

// In-memory + Redis store for user Station Beliefs (`notebook.read` / `notebook.write`)
const memoryFallback = new Map<string, StationBelief[]>();

export async function getStationBeliefs(userId: string): Promise<StationBelief[]> {
  const key = `trendly:station:beliefs:${userId || 'anon'}`;
  if (process.env.REDIS_URL && redis) {
    try {
      const raw = await redis.get(key);
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed)) {
          memoryFallback.set(key, parsed);
          return parsed;
        }
      }
    } catch {
      // Fallback to in-memory
    }
  }
  return memoryFallback.get(key) ?? [];
}

export async function appendStationBeliefs(
  userId: string,
  newBeliefs: StationBelief[]
): Promise<StationBelief[]> {
  if (!newBeliefs.length) return getStationBeliefs(userId);
  const key = `trendly:station:beliefs:${userId || 'anon'}`;
  const existing = await getStationBeliefs(userId);
  const merged = [...existing, ...newBeliefs].slice(-100);
  memoryFallback.set(key, merged);

  if (process.env.REDIS_URL && redis) {
    try {
      await redis.set(key, JSON.stringify(merged));
    } catch {
      // Ignore Redis write error
    }
  }
  return merged;
}

/**
 * Formats recalled beliefs into a bounded, prompt-injection-safe `<recalled-memory>` block.
 */
export function formatRecalledMemoryBlock(beliefs: StationBelief[], maxItems = 12): string {
  if (!beliefs.length) return '';
  const items = beliefs
    .slice(-maxItems)
    .map((b) => `- [${b.kind.toUpperCase()}] ${b.content.replace(/\s+/g, ' ').slice(0, 180)}`)
    .join('\n');
  return `<recalled-memory>\nDurable operator & domain context from Station Cortex:\n${items}\n</recalled-memory>`;
}

// ============================================================================
// Mechanical Completion Evidence & Verification (`verify.js` + `completion-evidence.js`)
// ============================================================================

export interface VerificationVerdict {
  passed: boolean;
  summary: string;
}

const COUNT_RE = /(\d+)\s+(pass(?:ed|ing)?|fail(?:ed|ing|ures?)?|errors?|signals?|leads?)/i;

export function interpretVerification(input: {
  exitCode?: number;
  out?: string;
  timedOut?: boolean;
  aborted?: boolean;
}): VerificationVerdict {
  const passed = (input.exitCode ?? 0) === 0 && !input.timedOut && !input.aborted;
  const out = String(input.out ?? '');
  const lines = out
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  let summary = '';
  for (let i = lines.length - 1; i >= 0; i--) {
    if (COUNT_RE.test(lines[i])) {
      summary = lines[i];
      break;
    }
  }
  if (!summary && lines.length) summary = lines[lines.length - 1];
  summary = summary.slice(0, 200);
  if (input.timedOut) summary = `timed out — ${summary}`.trim();
  else if (input.aborted) summary = `aborted — ${summary}`.trim();
  if (!summary) {
    summary = passed ? 'verification passed' : `verification failed (exit ${input.exitCode ?? '?'})`;
  }
  return { passed, summary };
}

export interface EvidenceRecord {
  id: string;
  callId: string;
  tool: string;
  kind: 'deterministic_check' | 'live_signal_observation' | 'artifact_created';
  strength: 'mechanical' | 'candidate' | 'failed';
  summary: string;
}

export function createCompletionEvidenceTracker() {
  const evidence: EvidenceRecord[] = [];
  let seq = 0;

  function observeToolExecution(event: {
    callId: string;
    toolName: string;
    ok: boolean;
    summary: string;
    result?: any;
  }) {
    if (!event.ok) {
      evidence.push({
        id: `ev-${++seq}`,
        callId: event.callId,
        tool: event.toolName,
        kind: 'deterministic_check',
        strength: 'failed',
        summary: event.summary.slice(0, 160),
      });
      return;
    }

    const hasRealPayload =
      Boolean(event.result) &&
      ((typeof event.result.rawCount === 'number' && event.result.rawCount > 0) ||
        Array.isArray(event.result.painPoints) ||
        Array.isArray(event.result.leadContacts) ||
        Array.isArray(event.result.opportunities) ||
        Boolean(event.result.bundleDataUri) ||
        Boolean(event.result.verified));

    evidence.push({
      id: `ev-${++seq}`,
      callId: event.callId,
      tool: event.toolName,
      kind:
        event.toolName === 'verify.run'
          ? 'deterministic_check'
          : event.toolName.startsWith('scrape_') || event.toolName.includes('scanner')
          ? 'live_signal_observation'
          : 'artifact_created',
      strength: hasRealPayload ? 'mechanical' : 'candidate',
      summary: event.summary.slice(0, 160),
    });
  }

  function snapshot() {
    const mechanicalCount = evidence.filter((e) => e.strength === 'mechanical').length;
    const failedCount = evidence.filter((e) => e.strength === 'failed').length;
    return {
      totalObserved: evidence.length,
      mechanicalCount,
      failedCount,
      verified: mechanicalCount > 0 && failedCount === 0,
      evidence: [...evidence],
    };
  }

  return { observeToolExecution, snapshot };
}
