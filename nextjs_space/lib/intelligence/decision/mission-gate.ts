/**
 * JEV Mission Gate — the final go/no-go decision layer for agent execution.
 *
 * Every consequential agent execution on the platform now asks Jev before acting:
 *  - Station Crew autonomous runs   (POST /api/station/v1)
 *  - Council play promotions        (POST /api/council/approve-task)
 *
 * Contract (mirrors lib/swarm/auto-guards.ts):
 *  - FAIL-OPEN: when JEV is disabled or no provider key is configured
 *    (provider === 'none'), the gate allows execution so the platform keeps
 *    working deterministically without external keys.
 *  - ENFORCE: when JEV returns a real decision, the mission is blocked unless
 *    `mission_approval.probability >= JEV_CONFIDENCE_THRESHOLD` (default 0.85)
 *    AND `risk_score <= RISK_CEILING` (default 60).
 *  - Every call is instrumented into DecisionLog via instrumentedJevCall for
 *    calibration tracking (/api/observability/*).
 */
import { evaluateAutoGuard } from '@/lib/swarm/auto-guards';

export interface JevMissionGateInput {
  action: string;
  agentId?: string;
  userId?: string;
  runId?: string;
  mission: string;
  context?: Record<string, any>;
  threshold?: number;
  riskCeiling?: number;
}

export interface JevMissionGateVerdict {
  allowed: boolean;
  provider: 'typesafe' | 'openrouter' | 'vercel' | 'none';
  reason: string;
  approvalProbability: number | null;
  riskScore: number | null;
  latencyMs: number;
  error?: string;
}

const DEFAULT_RISK_CEILING = 60;

export async function jevMissionGate(input: JevMissionGateInput): Promise<JevMissionGateVerdict> {
  const threshold =
    input.threshold ?? parseFloat(process.env.JEV_CONFIDENCE_THRESHOLD || '0.85');
  const riskCeiling = input.riskCeiling ?? DEFAULT_RISK_CEILING;

  const response = await evaluateAutoGuard({
    runId: input.runId,
    agentId: input.agentId,
    userId: input.userId,
    action: input.action,
    context: {
      mission: input.mission.slice(0, 4000),
      ...(input.context || {}),
    },
    threshold,
  });

  const decision = (response?.decision ?? null) as Record<string, any> | null;

  // FAIL-OPEN: JEV disabled or no provider key — deterministic platform keeps running.
  if (!decision || response.provider === 'none') {
    return {
      allowed: true,
      provider: response.provider,
      reason: response.error || 'JEV_UNAVAILABLE_FAIL_OPEN',
      approvalProbability: null,
      riskScore: null,
      latencyMs: response.latencyMs,
      error: response.error,
    };
  }

  const approval = decision.mission_approval ?? decision.guard_compliance ?? {};
  const approvalProbability =
    typeof approval.probability === 'number'
      ? approval.probability
      : typeof approval.confidence === 'number'
        ? approval.confidence
        : null;
  const riskRaw = decision.risk_score;
  const riskScore =
    typeof riskRaw === 'number'
      ? riskRaw
      : typeof riskRaw?.score === 'number'
        ? riskRaw.score
        : null;

  const approvalOk =
    approvalProbability === null ? true : approvalProbability >= threshold;
  const riskOk = riskScore === null ? true : riskScore <= riskCeiling;
  const allowed = approvalOk && riskOk;

  return {
    allowed,
    provider: response.provider,
    reason: allowed
      ? 'JEV_APPROVED'
      : !approvalOk
        ? `JEV_VETO_LOW_CONFIDENCE (${approvalProbability} < ${threshold})`
        : `JEV_VETO_HIGH_RISK (${riskScore} > ${riskCeiling})`,
    approvalProbability,
    riskScore,
    latencyMs: response.latencyMs,
  };
}
