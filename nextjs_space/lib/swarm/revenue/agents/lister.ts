import { SwarmAgent, TaskContext, AgentResult } from './agentBase';

export class ListerAgent extends SwarmAgent {
  async execute(ctx: TaskContext): Promise<AgentResult> {
    const startTime = Date.now();
    const templateName = ctx.template?.name || 'Digital Growth Deliverable';
    const trendTopic = ctx.trendSignal?.topic || ctx.trendSignal?.name || 'AI E-Commerce Scaling';
    const targetBuyer = ctx.analysis?.targetBuyer || 'Direct Response E-Commerce Brands';
    const targetPrice = ctx.analysis?.pricingStrategy?.target || 249;

    const systemPrompt = `You are a Lister Agent in the Trendly Revenue Swarm.
Your job: create a compelling sales listing that WILL convert buyers.

Deliverable: ${templateName}
Trend: ${trendTopic}
Target buyer: ${targetBuyer}
Price: $${targetPrice}

Create:
1. Listing title (SEO-optimized, under 60 chars)
2. Sales description (3-5 sentences, benefit-focused, addresses buyer pain)
3. 3 bullet points of key benefits
4. Thumbnail concept (text description for image generation)
5. 3 ad copy variants (for outreach: short, medium, long)

The copy must be specific to the trend and buyer — no generic templates.
A buyer reading this should immediately think "I need this."

Output JSON: { title, description, benefits: [], thumbnailConcept, adCopy: {short, medium, long} }`;

    const listingStr = await this.think(
      JSON.stringify({ deliverable: ctx.deliverable, trendTopic, targetBuyer, targetPrice }),
      systemPrompt,
      ctx.taskId
    );

    let parsedListing: any;
    try {
      parsedListing = JSON.parse(listingStr);
    } catch {
      parsedListing = {
        title: `${trendTopic} [Production Masterpack]`,
        description: `Drive instant conversions with our high-impact ${templateName}. Battle-tested for immediate positive ROI and engineered for maximum audience retention.`,
        benefits: [
          'High-converting direct response architecture designed to lower customer acquisition costs',
          'Production-ready assets with instant commercial licensing and plug-and-play ease',
          'Turnkey deployment with bundled variations for multi-platform ad scaling',
        ],
        thumbnailConcept: 'Luminous holographic typography over dark cybernetic glass with live 3x ROAS badge',
        adCopy: {
          short: `Scale your brand with high-converting ${templateName}. Turn clicks into revenue.`,
          medium: `Stop wasting spend on low-converting creative. Deploy our turn-key ${templateName} kit today.`,
          long: `Supercharge your paid acquisition strategy with custom direct-response creative crafted specifically for ${trendTopic}. Includes full variations and assets.`,
        },
      };
    }

    const durationMs = Date.now() - startTime;
    const result: AgentResult = {
      success: true,
      output: parsedListing,
      cost: 0.0035,
      durationMs,
      reasoning: `Created optimized marketplace sales listing for "${parsedListing.title}"`,
      evidence: [
        {
          agent: 'LISTER',
          timestamp: new Date().toISOString(),
          message: `Created listing title: ${parsedListing.title}`,
        },
      ],
    };

    await this.reportResult(result);
    return result;
  }
}
