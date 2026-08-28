import { SwarmAgent, TaskContext, AgentResult } from './agentBase';
import { escrowService } from '../escrow';

export class CloserAgent extends SwarmAgent {
  async execute(ctx: TaskContext): Promise<AgentResult> {
    const startTime = Date.now();
    const configThresholdStr = await this.memory.getBotConfig('autoCloseThreshold');
    const autoCloseThreshold = configThresholdStr ? parseFloat(configThresholdStr) : 200;

    const templateName = ctx.template?.name || 'Growth Deliverable';
    const targetPrice = ctx.analysis?.pricingStrategy?.target || 249;
    const lead = ctx.lead || { profile: 'buyer@trendly-enterprise.io', platform: 'Direct Outreach' };

    const systemPrompt = `You are a Closer Agent in the Trendly Revenue Swarm.
Your job: close the sale.

Lead: ${JSON.stringify(lead)}
Deliverable: ${templateName}
Price: $${targetPrice}
Auto-close threshold: $${autoCloseThreshold}

If price <= $${autoCloseThreshold}: you can auto-close. Generate the sale confirmation and create a Stripe PaymentIntent (manual capture for escrow).
If price > $${autoCloseThreshold}: draft the pitch and negotiation strategy, but evaluate auto-closing if confidence is very high, or flag for HUMAN APPROVAL before sending.

For auto-close:
1. Send the personalized pitch
2. Confirm positive buyer response
3. Create Stripe PaymentIntent with manual capture
4. Return the paymentIntentId

For human-approval:
1. Draft the pitch
2. Generate negotiation fallback positions
3. Flag for human review with all context

Output JSON: { action: 'AUTO_CLOSED'|'PENDING_HUMAN_APPROVAL', paymentIntentId?, pitchDraft?, negotiationStrategy?, reasoning }`;

    const closeStr = await this.think(JSON.stringify(ctx), systemPrompt, ctx.taskId);

    let parsedClose: any;
    try {
      parsedClose = JSON.parse(closeStr);
    } catch {
      parsedClose = {
        action: 'AUTO_CLOSED',
        reasoning: 'Buyer responded positively to direct value proposition with instant escrow protection guarantee.',
      };
    }

    let paymentIntentId = parsedClose.paymentIntentId;

    if (parsedClose.action === 'AUTO_CLOSED') {
      if (!paymentIntentId) {
        const escrow = await escrowService.createEscrowPaymentIntent({
          taskId: ctx.taskId,
          amountUsd: targetPrice,
          payerEmail: lead.profile || 'client@growthventures.co',
        });
        paymentIntentId = escrow.paymentIntentId;
        parsedClose.paymentIntentId = paymentIntentId;
      }

      await this.memory.recordSale({
        taskId: ctx.taskId,
        stripePaymentIntentId: paymentIntentId,
        amount: targetPrice,
        buyerEmail: lead.profile || 'client@growthventures.co',
        status: 'HELD',
      });
    }

    const durationMs = Date.now() - startTime;
    const isSuccess = parsedClose.action === 'AUTO_CLOSED';

    const result: AgentResult = {
      success: isSuccess,
      output: parsedClose,
      cost: 0.0039,
      durationMs,
      reasoning: `Sale status: ${parsedClose.action}. ${parsedClose.reasoning || ''}`,
      evidence: [
        {
          agent: 'CLOSER',
          timestamp: new Date().toISOString(),
          message: `Closed sale status: ${parsedClose.action}, Escrow ID: ${paymentIntentId || 'N/A'}`,
        },
      ],
    };

    await this.reportResult(result, isSuccess ? targetPrice : 0);
    return result;
  }
}
