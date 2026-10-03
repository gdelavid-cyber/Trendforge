/**
 * TrendForge Station — Deterministic Loop Breaker & No-Progress Guard
 *
 * Evolved from StarNet's `sidecar/loop-breaker.js` (Hermes audit architecture):
 * Detects and stops three pathological agent loop patterns without imposing arbitrary turn quotas:
 * 1. Unknown-tool strikes: Model hallucinates non-existent tool names 3 turns in a row.
 * 2. Same-tool failure streak: A tool fails repeatedly (even when the model varies arguments).
 *    Counts at most 1 failure per tool per turn so parallel fan-outs don't prematurely abort a run.
 *    Clears automatically when a state-mutating tool (`PROGRESS_RESET`) succeeds.
 * 3. No-progress success polling: Identical (tool, canonicalJson(args), FNV-1a result digest)
 *    across consecutive turns.
 */

export const UNKNOWN_TOOL_SUMMARY = 'unknown-tool';

export interface LoopBreakerLimits {
  unknownStrikes?: number;
  sameToolWarnAfter?: number;
  sameToolStopAfter?: number;
  noProgressWarnAfter?: number;
  noProgressStopAfter?: number;
}

export interface LoopBreakerCall {
  id: string;
  name: string;
  args?: Record<string, any>;
  parseError?: boolean;
}

export interface LoopBreakerResult {
  callId: string;
  isError: boolean;
  summary?: string;
  content?: string;
}

export interface LoopBreakerStop {
  failureStage: 'tool_loop';
  failureCode: 'unknown_tools' | 'repeated_tool_failure' | 'no_progress';
  message: string;
}

export interface LoopBreakerVerdict {
  notes: string[];
  stop: LoopBreakerStop | null;
}

const DEFAULTS: Required<LoopBreakerLimits> = {
  unknownStrikes: 3,
  sameToolWarnAfter: 3,
  sameToolStopAfter: 6,
  noProgressWarnAfter: 3,
  noProgressStopAfter: 5,
};

// State-mutating tools whose success resets other tools' failure streaks
const PROGRESS_RESET = new Set([
  'notebook_write',
  'quest_update',
  'deliverable_note',
  'nextjs_microsaas_builder',
  'openclaw_vps_provisioner',
  'sendgrid_bulk_dispatcher',
  'discord_alert_webhook',
  'crew_delegate',
]);

export function wireKey(name: string | undefined | null): string {
  return String(name ?? '')
    .replace(/\./g, '_')
    .toLowerCase();
}

export function canonicalJson(value: any): string {
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalJson).join(',') + ']';
  }
  if (value && typeof value === 'object') {
    return (
      '{' +
      Object.keys(value)
        .sort()
        .map((k) => JSON.stringify(k) + ':' + canonicalJson(value[k]))
        .join(',') +
      '}'
    );
  }
  return JSON.stringify(value === undefined ? null : value);
}

/**
 * Deterministic 32-bit FNV-1a digest for compact evidence comparison.
 */
export function fnv1aDigest(text: string | undefined | null): string {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim();
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return ('00000000' + h.toString(16)).slice(-8) + ':' + s.length;
}

function isSkip(result?: LoopBreakerResult): boolean {
  return /^skipped\b/i.test(String(result?.summary ?? ''));
}

export function createLoopBreaker(options: {
  limits?: LoopBreakerLimits | false;
  unattended?: boolean;
} = {}) {
  const off = options.limits === false;
  const cfg = typeof options.limits === 'object' && options.limits ? options.limits : {};
  const STRIKE_MAX = off ? 0 : cfg.unknownStrikes ?? DEFAULTS.unknownStrikes;
  const ST_WARN = off ? 0 : cfg.sameToolWarnAfter ?? DEFAULTS.sameToolWarnAfter;
  const ST_STOP = off ? 0 : cfg.sameToolStopAfter ?? DEFAULTS.sameToolStopAfter;
  const NP_WARN = off ? 0 : cfg.noProgressWarnAfter ?? DEFAULTS.noProgressWarnAfter;
  const NP_STOP = off ? 0 : cfg.noProgressStopAfter ?? DEFAULTS.noProgressStopAfter;
  const unattended = options.unattended ?? true;

  let strikes = 0;
  const strikeNames: string[] = [];
  const fails = new Map<string, number>();
  const warned = new Set<string>();
  const warnedAt = new Map<string, number>();
  let turn = 0;
  let npKey = '';
  let npStreak = 0;
  let npWarned = false;
  let npName = '';

  function observe(
    calls: LoopBreakerCall[],
    results: LoopBreakerResult[]
  ): LoopBreakerVerdict {
    const notes: string[] = [];
    if (off) return { notes, stop: null };

    const byId = new Map<string, LoopBreakerResult>();
    for (const r of results || []) {
      if (r) byId.set(r.callId, r);
    }

    const attempted: Array<{ call: LoopBreakerCall; r: LoopBreakerResult }> = [];
    for (const call of calls || []) {
      const r = byId.get(call?.id);
      if (r && !isSkip(r)) attempted.push({ call, r });
    }
    if (!attempted.length) return { notes, stop: null };

    // (a) Unknown-tool strikes
    const unknown = attempted.filter(
      (x) => x.r.isError && String(x.r.summary || '') === UNKNOWN_TOOL_SUMMARY
    );
    if (unknown.length === attempted.length) {
      strikes++;
      for (const x of unknown) {
        const n = String(x.call.name || '').slice(0, 60);
        if (n && !strikeNames.includes(n) && strikeNames.length < 5) {
          strikeNames.push(n);
        }
      }
      if (STRIKE_MAX && strikes >= STRIKE_MAX) {
        return {
          notes,
          stop: {
            failureStage: 'tool_loop',
            failureCode: 'unknown_tools',
            message: `Loop breaker: model called non-existent tools (${strikeNames.join(', ')}) on ${strikes} consecutive turns.`,
          },
        };
      }
    } else {
      strikes = 0;
      strikeNames.length = 0;
    }

    // (b) Same-tool failure streak (varying arguments) — max 1 count per tool per turn
    turn++;
    const countedThisTurn = new Set<string>();
    const stopNeedsWarning = ST_WARN > 0 && ST_WARN <= ST_STOP;

    for (const x of attempted) {
      const key = wireKey(x.call.name);
      if (!key) continue;
      if (x.r.isError) {
        if (String(x.r.summary || '') === UNKNOWN_TOOL_SUMMARY) continue;
        if (countedThisTurn.has(key)) continue;
        countedThisTurn.add(key);

        const n = (fails.get(key) || 0) + 1;
        fails.set(key, n);
        const label = String(x.call.name || key).slice(0, 80);
        const warnedEarlier = warned.has(key) && (warnedAt.get(key) ?? turn) < turn;

        if (unattended && ST_STOP && n >= ST_STOP && (!stopNeedsWarning || warnedEarlier)) {
          return {
            notes,
            stop: {
              failureStage: 'tool_loop',
              failureCode: 'repeated_tool_failure',
              message: `Loop breaker: '${label}' failed ${n} turns in a row on an unattended run — stopping to prevent unproductive spend.`,
            },
          };
        }

        if (ST_WARN && n >= ST_WARN && !warned.has(key)) {
          warned.add(key);
          warnedAt.set(key, turn);
          notes.push(
            `<failure_streak>${label} has failed ${n} turns in a row. Varying arguments has not resolved the issue. ` +
              `Inspect the error message, switch to an alternative skill, or report the exact blocker.</failure_streak>`
          );
        }
      } else {
        fails.delete(key);
        warned.delete(key);
        countedThisTurn.delete(key);
        if (PROGRESS_RESET.has(key)) {
          fails.clear();
          warned.clear();
          countedThisTurn.clear();
        }
      }
    }

    // (c) No-progress success polling (identical tool + args + result digest)
    const eligible = attempted.every((x) => !x.r.isError && !x.call.parseError);
    if (!eligible) {
      npKey = '';
      npStreak = 0;
      npWarned = false;
      npName = '';
    } else {
      const parts = attempted.map(
        (x) =>
          wireKey(x.call.name) +
          '\u0000' +
          canonicalJson(x.call.args ?? {}) +
          '\u0000' +
          fnv1aDigest(x.r.content)
      );
      parts.sort();
      const key = parts.join('\n');
      if (key === npKey) {
        npStreak++;
      } else {
        npKey = key;
        npStreak = 1;
        npWarned = false;
        npName = attempted.map((x) => String(x.call.name || 'tool').slice(0, 60)).join(', ');
      }

      if (unattended && NP_STOP && npStreak >= NP_STOP) {
        return {
          notes,
          stop: {
            failureStage: 'tool_loop',
            failureCode: 'no_progress',
            message: `Loop breaker: '${npName}' returned the identical result ${npStreak} turns in a row with identical arguments — stopping redundant loop.`,
          },
        };
      }

      if (NP_WARN && npStreak >= NP_WARN && !npWarned) {
        npWarned = true;
        notes.push(
          `<no_progress>You have invoked '${npName}' ${npStreak} turns in a row with identical arguments and received the identical result. ` +
            `Synthesize your final answer from the data already gathered or try a different tool.</no_progress>`
        );
      }
    }

    return { notes, stop: null };
  }

  return {
    observe,
    snapshot: () => ({
      strikes,
      fails: Array.from(fails.entries()),
      noProgressStreak: npStreak,
      unattended,
    }),
  };
}
