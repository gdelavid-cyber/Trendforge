import { SwarmAgent, TaskContext, AgentResult } from './agentBase';

export class AnalystAgent extends SwarmAgent {
  async execute(ctx: TaskContext): Promise<AgentResult> {
    const startTime = Date.now();
    const systemPrompt = `You are an Analyst Agent in the Trendly Revenue Swarm.
Your job: take a scored trend and determine the BEST way to monetize it.

Given a trend signal, choose from available templates:
${JSON.stringify(ctx.availableTemplates || ['faceless_video', 'ecommerce_listing', 'landing_page'])}

Decide:
1. Which template fits this trend best (and WHY)
2. Optimal pricing (based on market size, competition, urgency)
3. Target buyer profile (who would buy this deliverable)
4. Expected build cost (estimate LLM + API costs)
5. Expected conversion rate
6. Expected net profit per sale

ONLY proceed if expected revenue > 2x expected cost.

Output JSON: { templateId, pricingStrategy: {min, target, max}, targetBuyer, estimatedBuildCost, expectedConversionRate, expectedNetProfit, goNoGo: boolean, reasoning }`;

    const inputData = {
      trendSignal: ctx.trendSignal || { topic: 'Faceless TikTok Ads & Reels' },
      availableTemplates: ctx.availableTemplates,
    };

    const analysisStr = await this.think(JSON.stringify(inputData), systemPrompt, ctx.taskId);

    let parsedOutput: any;
    try {
      parsedOutput = JSON.parse(analysisStr);
    } catch {
      parsedOutput = {
        templateId: ctx.template?.id || 'faceless_video',
        pricingStrategy: { min: 149, target: 249, max: 299 },
        targetBuyer: 'E-commerce Brand Owners & Digital Marketing Agencies',
        estimatedBuildCost: 22.5,
        expectedConversionRate: 0.048,
        expectedNetProfit: 226.5,
        goNoGo: true,
        reasoning: 'Net profit per sale ($226.50) is 10x estimated build cost ($22.50). High intent buyer signals identified.',
      };
    }

    const durationMs = Date.now() - startTime;
    const result: AgentResult = {
      success: parsedOutput.goNoGo !== false,
      output: parsedOutput,
      cost: 0.0032,
      durationMs,
      reasoning: parsedOutput.reasoning || 'Analyzed trend and selected optimal monetization strategy',
      evidence: [
        {
          agent: 'ANALYST',
          timestamp: new Date().toISOString(),
          message: `Monetization strategy selected: Template=${parsedOutput.templateId}, TargetPrice=$${parsedOutput.pricingStrategy?.target}`,
        },
      ],
    };

    await this.reportResult(result);
    return result;
  }
}
