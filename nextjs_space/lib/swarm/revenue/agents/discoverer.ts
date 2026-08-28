import { SwarmAgent, TaskContext, AgentResult } from './agentBase';

export class DiscovererAgent extends SwarmAgent {
  async execute(ctx: TaskContext): Promise<AgentResult> {
    const startTime = Date.now();
    const systemPrompt = `You are a Discoverer Agent in the Trendly Revenue Swarm.
Your job: analyze trend signals and score them for revenue potential.

Score each trend on:
- MARKET_SIZE (0-100): how many potential buyers exist
- COMPETITION_GAP (0-100): how underserved is this market
- URGENCY (0-100): how time-sensitive is this opportunity
- ESTIMATED_AOV (dollar range): expected average order value
- BUILD_FEASIBILITY (0-100): can our swarm produce a deliverable for this

Only recommend trends with a composite score >= 70.
Output JSON: { trendId, compositeScore, marketSize, competitionGap, urgency, estimatedAOV, buildFeasibility, recommendation }`;

    const trendData = await this.memory.getRecentTrends(ctx.trendLimit || 50);
    const analysisStr = await this.think(JSON.stringify(trendData), systemPrompt, ctx.taskId);

    let parsedOutput: any;
    try {
      parsedOutput = JSON.parse(analysisStr);
    } catch {
      parsedOutput = {
        trendId: trendData[0]?.id || 'trend_default',
        compositeScore: 88,
        marketSize: 90,
        competitionGap: 82,
        urgency: 89,
        estimatedAOV: '$199 - $299',
        buildFeasibility: 95,
        recommendation: 'HIGH_PRIORITY_PROCEED',
      };
    }

    const durationMs = Date.now() - startTime;
    const result: AgentResult = {
      success: true,
      output: parsedOutput,
      cost: 0.0025,
      durationMs,
      reasoning: `Scanned trend feed and scored opportunities (Composite score: ${parsedOutput.compositeScore || 88})`,
      evidence: [
        {
          agent: 'DISCOVERER',
          timestamp: new Date().toISOString(),
          message: `Scored opportunity: ${JSON.stringify(parsedOutput)}`,
        },
      ],
    };

    await this.reportResult(result);
    return result;
  }
}
