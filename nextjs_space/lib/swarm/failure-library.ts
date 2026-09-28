import { askJev } from '../intelligence/decision/jev';
import { instrumentedJevCall } from '../observability/collector';

export interface FailureTriageParams {
  runId?: string;
  agentId?: string;
  userId?: string;
  error: string;
  stepName: string;
  context: Record<string, any>;
  threshold?: number;
}

export async function triageExecutionFailure(params: FailureTriageParams) {
  const threshold = params.threshold ?? 0.80;
  const questions = {
    should_retry: {
      type: 'noul' as const,
      description: 'Is this failure transient and safe to retry automatically?',
    },
    recovery_route: {
      type: 'choice' as const,
      description: 'Which recovery strategy should be executed for this failure?',
      options: ['retry_immediate', 'retry_backoff', 'fallback_llm', 'escalate_admin', 'abort'],
    },
  };

  const state = {
    error: params.error,
    stepName: params.stepName,
    context: params.context,
  };

  return await instrumentedJevCall(
    {
      gateType: 'model_routing',
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
