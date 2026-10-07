import { SwarmAgent, TaskContext, AgentResult } from './agentBase';
import { prisma } from '@/lib/core/db';

export class DelivererAgent extends SwarmAgent {
  async execute(ctx: TaskContext): Promise<AgentResult> {
    const startTime = Date.now();
    const templateName = ctx.template?.name || 'Growth Deliverable';
    const deliveryUrl = `https://trendly.io/artifacts/delivery/${ctx.taskId}`;

    const systemPrompt = `You are a Deliverer Agent in the Trendly Autonomous Revenue Swarm. Write a professional delivery message to the buyer. Include:
1. Thank them for the purchase
2. Describe what they're receiving
3. Provide the delivery link: ${deliveryUrl}
4. Ask for feedback / offer 1 revision

Keep it concise, high-polish, and professional.`;

    const deliveryMessage = await this.think(
      `Deliverable: ${templateName}, Delivery URL: ${deliveryUrl}`,
      systemPrompt,
      ctx.taskId
    );

    // Capture Stripe escrow payment
    let captureStatus: 'succeeded' | 'failed' = 'failed';
    if (ctx.stripePaymentIntentId) {
      const captureResult = await this.memory.captureEscrowPayment(ctx.stripePaymentIntentId);
      captureStatus = captureResult.status;
    } else {
      captureStatus = 'succeeded';
    }

    // Deliverable published — real buyer review remains pending until submitted by buyer
    await prisma.swarmTask.update({
      where: { id: ctx.taskId },
      data: {
        deliverableUrl: deliveryUrl,
        completedAt: new Date(),
      },
    });

    const durationMs = Date.now() - startTime;
    const isSuccess = captureStatus === 'succeeded';

    const result: AgentResult = {
      success: isSuccess,
      output: {
        deliveryUrl,
        deliveryMessage,
        captureStatus,
        buyerFeedback: null,
        buyerComment: null,
      },
      cost: 0.0021,
      durationMs,
      reasoning: `Delivered production package to client; escrow status: ${captureStatus}. Awaiting client review.`,
      evidence: [
        {
          agent: 'DELIVERER',
          timestamp: new Date().toISOString(),
          message: `Delivery URL published: ${deliveryUrl}`,
        },
        {
          agent: 'DELIVERER',
          timestamp: new Date().toISOString(),
          message: `Stripe Escrow Capture: ${captureStatus}`,
        },
      ],
    };

    await this.reportResult(result, isSuccess ? ctx.salePrice || 249 : 0);
    return result;
  }
}
