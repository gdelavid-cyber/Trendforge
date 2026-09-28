import { askJev } from '../intelligence/decision/jev';
import { instrumentedJevCall } from '../observability/collector';

export interface GuardEvaluationParams {
  runId?: string;
  agentId?: string;
  userId?: string;
  action: string;
  context: Record<string, any>;
  threshold?: number;
}

export async function evaluateAutoGuard(params: GuardEvaluationParams) {
  const threshold = params.threshold ?? 0.85;
  const questions = {
    guard_compliance: {
      type: 'noul' as const,
      description: 'Does this planned agent action conform to system safety and guardrail limits?',
    },
    risk_score: {
      type: 'score' as const,
      description: 'Risk score from 0-100 where higher indicates elevated risk',
      min: 0,
      max: 100,
    },
  };

  const state = {
    action: params.action,
    context: params.context,
  };

  return await instrumentedJevCall(
    {
      gateType: 'approval',
      runId: params.runId,
      agentId: params.agentId,
      userId: params.userId,
      threshold,
      state,
      questions,
    },
    () => askJev(state, questions)
  );
}
