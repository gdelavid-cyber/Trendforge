import { askJev } from '../intelligence/decision/jev';
import { instrumentedJevCall } from '../observability/collector';

export interface PatternSelectionParams {
  runId?: string;
  agentId?: string;
  userId?: string;
  goal: string;
  capabilities: string[];
  context: Record<string, any>;
  threshold?: number;
}

export async function selectAgentPattern(params: PatternSelectionParams) {
  const threshold = params.threshold ?? 0.80;
  const questions = {
    pattern_fit: {
      type: 'choice' as const,
      description: 'Which architectural execution pattern is best suited for this task?',
      options: ['sequential_dag', 'parallel_map_reduce', 'router_fanout', 'adversarial_critic', 'autonomous_loop'],
    },
    feasibility: {
      type: 'noul' as const,
      description: 'Can this pattern be reliably completed within budget and latency constraints?',
    },
  };

  const state = {
    goal: params.goal,
    capabilities: params.capabilities,
    context: params.context,
  };

  return await instrumentedJevCall(
    {
      gateType: 'tool_routing',
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
