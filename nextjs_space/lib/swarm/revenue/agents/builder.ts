import { SwarmAgent, TaskContext, AgentResult } from './agentBase';

export class BuilderAgent extends SwarmAgent {
  async execute(ctx: TaskContext): Promise<AgentResult> {
    const startTime = Date.now();
    const template = ctx.template || { name: 'Faceless Social Video Pack', id: 'faceless_video' };
    const trendTopic = ctx.trendSignal?.topic || ctx.trendSignal?.name || 'AI Creator Economy Growth';
    const targetBuyer = ctx.analysis?.targetBuyer || 'DTC Brands and Marketing Agencies';
    const targetPrice = ctx.analysis?.pricingStrategy?.target || 249;

    const systemPrompt = `You are a Builder Agent in the Trendly Revenue Swarm.
Your job: generate a complete, sellable deliverable.

You are building: ${template.name}
Deliverable spec: ${JSON.stringify(template.spec || {})}

Requirements:
1. Follow the template spec EXACTLY
2. Tailor content to the trend: ${trendTopic}
3. Target buyer: ${targetBuyer}
4. Make it sellable — this must be something a buyer would pay $${targetPrice} for
5. Every element must be production-ready, not a draft
${template.buildInstructions || ''}

Output: the complete deliverable content as structured JSON.`;

    const buildPrompt = `Build high-converting production deliverables for trend: "${trendTopic}" targeting ${targetBuyer}. Include full content, hooks, assets and layout specs.`;
    const deliverableStr = await this.think(buildPrompt, systemPrompt, ctx.taskId);

    let deliverable: any;
    try {
      deliverable = JSON.parse(deliverableStr);
    } catch {
      deliverable = {
        title: `${trendTopic} - Production Suite`,
        specVersion: '2.4.0',
        content: deliverableStr,
        components: ['primary_asset', 'ad_copy_variations', 'high_res_render_package'],
      };
    }

    const durationMs = Date.now() - startTime;
    const result: AgentResult = {
      success: true,
      output: {
        templateId: template.id,
        deliverable,
        generatedAt: new Date().toISOString(),
      },
      artifacts: [
        {
          id: 'art_' + Math.random().toString(36).substring(2, 9),
          type: template.id,
          name: `${template.name} - ${trendTopic}`,
          data: deliverable,
        },
      ],
      cost: 0.015,
      durationMs,
      reasoning: `Built production deliverable for ${template.name} (${trendTopic})`,
      evidence: [
        {
          agent: 'BUILDER',
          timestamp: new Date().toISOString(),
          message: `Generated production deliverable bundle for template ${template.id}`,
        },
      ],
    };

    await this.reportResult(result);
    return result;
  }
}
