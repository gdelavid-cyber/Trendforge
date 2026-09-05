import { OpenRouterClient, openRouterClient, MODEL_TIERS, calculateCost, ModelTierKey } from '@/lib/intelligence/openrouter/client';
import { SwarmMemory, swarmMemory, AgentInstance } from '../memory';

export interface TaskContext {
  taskId: string;
  runId?: string;
  trendSignal?: any;
  trendLimit?: number;
  availableTemplates?: any;
  template?: any;
  analysis?: any;
  buildPrompt?: string;
  deliverable?: any;
  listing?: any;
  lead?: any;
  stripePaymentIntentId?: string;
  artifacts?: any[];
  validationResult?: any;
  salePrice?: number;
  totalCost?: number;
  [key: string]: any;
}

export interface EvidenceEntry {
  agent: string;
  timestamp: string;
  message: string;
}

export interface AgentResult {
  success: boolean;
  output: any;
  artifacts?: any[];
  cost: number;
  durationMs: number;
  reasoning: string;
  evidence: EvidenceEntry[];
}

export abstract class SwarmAgent {
  constructor(
    public instance: AgentInstance,
    protected openRouter: OpenRouterClient = openRouterClient,
    protected memory: SwarmMemory = swarmMemory
  ) {}

  abstract execute(taskContext: TaskContext): Promise<AgentResult>;

  protected async think(prompt: string, systemPrompt: string, taskId?: string): Promise<string> {
    const tierConfig = MODEL_TIERS[this.instance.modelTier] || MODEL_TIERS.master;

    const response = await this.openRouter.chatCompletion({
      model: tierConfig.primary,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: tierConfig.temperature,
      max_tokens: tierConfig.maxTokens,
      response_format: { type: 'json_object' },
    });

    const cost = calculateCost(response.usage, tierConfig.primary);

    await this.memory.logAgentActivity({
      agentId: this.instance.id,
      agentRole: this.instance.role,
      taskId,
      activity: `Executed cognitive reasoning step for role ${this.instance.role}`,
      model: tierConfig.primary,
      tokensIn: response.usage.prompt_tokens,
      tokensOut: response.usage.completion_tokens,
      cost,
    });

    return response.choices[0]?.message?.content || '{}';
  }

  protected async reportResult(result: AgentResult, revenue?: number): Promise<void> {
    await this.memory.updateAgentPerformance(this.instance.id, {
      success: result.success,
      cost: result.cost,
      revenue,
    });
  }
}
