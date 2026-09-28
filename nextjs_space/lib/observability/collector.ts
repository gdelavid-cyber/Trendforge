import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';

export type GateType =
  | 'trade_execution'
  | 'lead_qualification'
  | 'approval'
  | 'completion'
  | 'ledger_verification'
  | 'tool_routing'
  | 'model_routing'
  | (string & {});

export type PrimitiveType = 'choice' | 'score' | 'noul';

export type ActionTaken =
  | 'allowed'
  | 'blocked'
  | 'escalated'
  | 'fallback_to_llm'
  | 'fallback_to_rule';

export interface DecisionLogRecord {
  runId?: string | null;
  agentId?: string | null;
  userId?: string | null;
  gateType: string;
  primitive: PrimitiveType;
  question: string;
  answer: {
    probability?: number;
    confidence?: number;
    choice?: string;
    score?: number;
    [key: string]: any;
  };
  threshold: number;
  inputSummary: string;
  inputHash?: string;
  latencyMs: number;
  costUsd?: number;
  actionTaken: ActionTaken;
}

export interface InstrumentedJevParams {
  gateType: string;
  runId?: string;
  agentId?: string;
  userId?: string;
  threshold: number;
  state: any;
  questions: Record<
    string,
    {
      type: PrimitiveType;
      description?: string;
      min?: number;
      max?: number;
      options?: string[];
      [key: string]: any;
    }
  >;
}

export function isObservabilityEnabled(): boolean {
  const val = process.env.OBSERVABILITY_ENABLED;
  return val !== 'false' && val !== '0';
}

/**
 * Redacts sensitive tokens/keys and truncates JSON serialization of state to max 500 chars.
 */
export function summarize(state: any): string {
  try {
    if (state === null || state === undefined) {
      return '{}';
    }

    const redact = (obj: any, depth = 0): any => {
      if (depth > 5 || obj === null || typeof obj !== 'object') {
        return obj;
      }
      if (Array.isArray(obj)) {
        return obj.slice(0, 10).map((item) => redact(item, depth + 1));
      }
      const cleaned: Record<string, any> = {};
      const sensitiveRegex = /(key|token|secret|password|auth|bearer|cookie|credential|seed|private)/i;

      for (const [k, v] of Object.entries(obj)) {
        if (sensitiveRegex.test(k)) {
          cleaned[k] = '[REDACTED]';
        } else if (typeof v === 'object' && v !== null) {
          cleaned[k] = redact(v, depth + 1);
        } else {
          cleaned[k] = v;
        }
      }
      return cleaned;
    };

    const sanitized = redact(state);
    const jsonStr = JSON.stringify(sanitized);
    return jsonStr.length > 500 ? jsonStr.slice(0, 500) : jsonStr;
  } catch {
    return '{"error":"serialization_failed"}';
  }
}

/**
 * Filters answer object to only known typed fields.
 */
export function normalizeAnswer(answer: any): {
  probability?: number;
  confidence?: number;
  choice?: string;
  score?: number;
} {
  if (!answer || typeof answer !== 'object') {
    return {};
  }
  const normalized: {
    probability?: number;
    confidence?: number;
    choice?: string;
    score?: number;
  } = {};

  if (typeof answer.probability === 'number' && !isNaN(answer.probability)) {
    normalized.probability = Math.max(0, Math.min(1, answer.probability));
  }
  if (typeof answer.confidence === 'number' && !isNaN(answer.confidence)) {
    normalized.confidence = Math.max(0, Math.min(1, answer.confidence));
  }
  if (typeof answer.score === 'number' && !isNaN(answer.score)) {
    normalized.score = answer.score;
  }
  if (typeof answer.choice === 'string') {
    normalized.choice = answer.choice;
  }

  return normalized;
}

/**
 * Computes sha256 of question + inputSummary and returns first 16 hex chars.
 */
export function hashInput(question: string, inputSummary: string): string {
  return createHash('sha256')
    .update((question || '') + (inputSummary || ''))
    .digest('hex')
    .slice(0, 16);
}

/**
 * Writes a single row to DecisionLog. Append-only, never throws.
 */
export async function recordDecision(record: DecisionLogRecord): Promise<void> {
  try {
    const inputHash =
      record.inputHash || hashInput(record.question, record.inputSummary);
    const costUsd =
      record.costUsd !== undefined ? record.costUsd : 0.000042;

    await prisma.decisionLog.create({
      data: {
        runId: record.runId || null,
        agentId: record.agentId || null,
        userId: record.userId || null,
        gateType: record.gateType,
        primitive: record.primitive,
        question: record.question,
        answer: record.answer,
        threshold: record.threshold,
        inputSummary: record.inputSummary.slice(0, 500),
        inputHash,
        latencyMs: Math.max(0, Math.round(record.latencyMs)),
        costUsd,
        actionTaken: record.actionTaken,
      },
    });
  } catch (err) {
    console.error('[Observability] Failed to record decision log:', err);
  }
}

/**
 * Determines actionTaken from normalized answer and threshold.
 */
function evaluateAction(
  primitive: PrimitiveType,
  answer: { probability?: number; confidence?: number; score?: number; choice?: string },
  threshold: number
): ActionTaken {
  if (primitive === 'noul') {
    if (answer.confidence !== undefined && answer.confidence < threshold) {
      return 'blocked';
    }
    if (answer.probability !== undefined) {
      return answer.probability >= threshold ? 'allowed' : 'blocked';
    }
    return 'allowed';
  }

  if (primitive === 'score') {
    if (answer.score !== undefined) {
      return answer.score >= threshold ? 'allowed' : 'blocked';
    }
    return 'allowed';
  }

  if (primitive === 'choice') {
    return answer.choice ? 'allowed' : 'blocked';
  }

  return 'allowed';
}

// Dynamic threshold cache (60s TTL)
const dynamicThresholdCache = new Map<string, { threshold: number; expiresAt: number }>();

export async function resolveGateThreshold(gateType: string, fallback: number = 0.85): Promise<number> {
  const cached = dynamicThresholdCache.get(gateType);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.threshold;
  }
  try {
    const config = await prisma.dynamicGateConfig.findUnique({ where: { gateType } });
    const threshold = config ? config.currentThreshold : (fallback ?? 0.85);
    dynamicThresholdCache.set(gateType, { threshold, expiresAt: Date.now() + 60000 });
    return threshold;
  } catch {
    return fallback ?? 0.85;
  }
}

export function invalidateGateThresholdCache(gateType?: string) {
  if (gateType) {
    dynamicThresholdCache.delete(gateType);
  } else {
    dynamicThresholdCache.clear;
  }
}

/**
 * Wraps a Jev call with observability logging:
 * - Times the call
 * - Runs jevCall()
 * - Logs one DecisionLog row per question in params.questions
 * - On error, logs a fallback row with actionTaken='fallback_to_rule' and rethrows
 * - Divides total latency evenly across questions
 * - Sets costUsd = 0.000042 per question (Jev pricing)
 */
export async function instrumentedJevCall<T>(
  params: InstrumentedJevParams,
  jevCall: () => Promise<T>
): Promise<T> {
  if (!isObservabilityEnabled()) {
    return await jevCall();
  }

  const startTime = Date.now();
  const inputSummary = summarize(params.state);
  const questionEntries = Object.entries(params.questions);
  const questionCount = Math.max(1, questionEntries.length);
  const effectiveThreshold = await resolveGateThreshold(params.gateType, params.threshold);

  try {
    const result = await jevCall();
    const totalLatency = Date.now() - startTime;
    const perQuestionLatency = Math.round(totalLatency / questionCount);

    const decisionObj = (result as any)?.decision ?? (result as any) ?? null;

    // Log a row for each question
    await Promise.all(
      questionEntries.map(([qKey, qDef]) => {
        const rawAns = decisionObj ? decisionObj[qKey] : null;
        const normalizedAns = normalizeAnswer(rawAns);
        const questionText = qDef.description || qKey;
        const primitive = qDef.type || 'noul';
        const actionTaken = evaluateAction(primitive, normalizedAns, effectiveThreshold);

        return recordDecision({
          runId: params.runId,
          agentId: params.agentId,
          userId: params.userId,
          gateType: params.gateType,
          primitive,
          question: questionText,
          answer: normalizedAns,
          threshold: effectiveThreshold,
          inputSummary,
          latencyMs: perQuestionLatency,
          costUsd: 0.000042,
          actionTaken,
        }).catch((err) => {
          console.error('[Observability] Failed async decision log write:', err);
        });
      })
    );

    return result;
  } catch (error) {
    const totalLatency = Date.now() - startTime;
    const perQuestionLatency = Math.round(totalLatency / questionCount);

    // On error, log a fallback row for each question with fallback_to_rule
    await Promise.all(
      questionEntries.map(([qKey, qDef]) => {
        const questionText = qDef.description || qKey;
        const primitive = qDef.type || 'noul';

        return recordDecision({
          runId: params.runId,
          agentId: params.agentId,
          userId: params.userId,
          gateType: params.gateType,
          primitive,
          question: questionText,
          answer: {},
          threshold: params.threshold,
          inputSummary,
          latencyMs: perQuestionLatency,
          costUsd: 0.000042,
          actionTaken: 'fallback_to_rule',
        }).catch((logErr) => {
          console.error('[Observability] Failed fallback decision log write:', logErr);
        });
      })
    );

    // Rethrow original error
    throw error;
  }
}
