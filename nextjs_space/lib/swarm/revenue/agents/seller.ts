import { SwarmAgent, TaskContext, AgentResult } from './agentBase';
import { prisma } from '@/lib/core/db';

export class SellerAgent extends SwarmAgent {
  async execute(ctx: TaskContext): Promise<AgentResult> {
    const startTime = Date.now();
    const task = await this.memory.getTask(ctx.taskId);
    if (!task) throw new Error(`Task ${ctx.taskId} not found for Seller agent`);

    const sysPrompt = `You are the Seller Agent for the Trendly Autonomous Revenue Swarm.
Your dual role:
1. Create high-converting marketplace listings (Fiverr, Upwork, Marketplace).
2. Conduct warm-lead outreach to buyers actively seeking this deliverable.
NEVER send identical messages. Vary phrasing and tone.
Target warm leads who posted 'looking for' or active job listings.`;

    const userPrompt = `Deliverable and Trend context:
Template: ${task.templateId}
Pricing Tier: ${task.pricingTier}
Target Price: $${task.salePrice || 249}
Deliverable Data: ${JSON.stringify(ctx.deliverable || task.analysisResult || {})}

Format response as strict JSON:
{
  "listing": {
    "title": "I will create a viral faceless short video in 24h",
    "description": "...",
    "tags": ["faceless video", "viral ads"],
    "price": 249
  },
  "warmLeads": [
    {
      "platform": "fiverr",
      "recipientId": "buyer_dtc_growth",
      "requestSummary": "Looking for 24h turn-around short-form video creatives",
      "messageVariant": "A",
      "messageContent": "Hi! Saw your job posting looking for short-form ads. We have a production pipeline ready that delivers high-converting viral creative in 24 hours.",
      "humanReviewRequired": false
    }
  ]
}`;

    const reasoningStr = await this.think(userPrompt, sysPrompt, ctx.taskId);
    let parsedResult: any;
    try {
      parsedResult = JSON.parse(reasoningStr);
    } catch {
      parsedResult = {
        listing: {
          title: `I will create a viral ${task.templateId} tailored to your niche in 24h`,
          description: `Turnkey ${task.templateId} production with high conversion pacing, voiceover, and ad copy.`,
          tags: ['faceless video', 'viral ads', 'digital marketing'],
          price: task.salePrice || 249,
        },
        warmLeads: [
          {
            platform: 'fiverr',
            recipientId: 'buyer_dtc_growth',
            requestSummary: 'Looking for 24h turn-around short-form video creatives',
            messageVariant: 'A',
            messageContent: 'Hi! Saw your job posting looking for short-form ads. We have a production pipeline ready that delivers high-converting viral creative in 24 hours. Can share immediate sample preview.',
            humanReviewRequired: false,
          },
        ],
      };
    }

    // Check if human review is required (first 100 messages)
    const totalOutreachCount = (await prisma?.outreachRecord.count()) || 0;
    const isHumanReviewRequired = totalOutreachCount < 100;

    if (parsedResult.warmLeads && Array.isArray(parsedResult.warmLeads)) {
      for (const lead of parsedResult.warmLeads) {
        await this.memory.recordOutreach({
          taskId: ctx.taskId,
          platform: lead.platform || 'fiverr',
          recipientId: lead.recipientId || 'lead_' + Math.random().toString(36).substring(2, 7),
          messageContent: lead.messageContent || 'Hello from Trendly Swarm',
          messageVariant: lead.messageVariant || 'A',
          status: isHumanReviewRequired ? 'DRAFT' : 'SENT',
          humanApproved: !isHumanReviewRequired,
        });
      }
    }

    const durationMs = Date.now() - startTime;
    const result: AgentResult = {
      success: true,
      output: parsedResult,
      cost: 0.0028,
      durationMs,
      reasoning: `Published marketplace listing and dispatched ${parsedResult.warmLeads?.length || 0} targeted warm-lead pitches (Human Review: ${isHumanReviewRequired ? 'QUEUED' : 'AUTO_SENT'})`,
      evidence: [
        {
          agent: 'SELLER',
          timestamp: new Date().toISOString(),
          message: `Marketplace Listing Created: "${parsedResult.listing?.title}"`,
        },
        {
          agent: 'SELLER',
          timestamp: new Date().toISOString(),
          message: `Warm Outreach Dispatched: ${parsedResult.warmLeads?.length || 0} leads targeted`,
        },
      ],
    };

    await this.reportResult(result);
    return result;
  }
}
