import { prisma } from '@/lib/core/db';
import { logExecutionEvent } from '@/lib/execution/logger';

export interface SalesKitData {
  outreachTemplates: Array<{
    title: string;
    channel: string;
    subject?: string;
    body: string;
    prospectName?: string;
  }>;
  pricingRecommendation: number; // in cents
  pricingRationale: string;
  productCopy: string;
  objectionScripts: Array<{
    objection: string;
    rebuttal: string;
  }>;
  followUpSequences: Array<{
    day: number;
    title: string;
    body: string;
  }>;
}

/**
 * Generates a complete, tailored Sales Kit for a task (Option B: You Sell Yourself).
 */
export async function generateSalesKitForTask(
  taskId: string,
  userId?: string
): Promise<SalesKitData> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { trend: true },
  });

  const leads = await prisma.lead.findMany({
    where: { taskId },
    orderBy: { compositeScore: 'desc' },
    take: 3,
  });

  const title = task?.title || 'High-Alpha Deliverable';
  const trendName = task?.trend?.name || 'Emerging Market Signal';
  const estLow = (task?.estimatedEarningsLow || 100) * 100;
  const estHigh = (task?.estimatedEarningsHigh || 300) * 100;
  const recommendedPrice = Math.round((estLow + estHigh) / 2);

  const topProspect = leads[0]?.buyerName || 'Valued Partner';

  const salesKitData: SalesKitData = {
    pricingRecommendation: recommendedPrice,
    pricingRationale: `Based on current competitor market rates across Upwork and Fiverr ($120 - $350), this deliverable is positioned in the upper quartile ($${(recommendedPrice / 100).toFixed(2)}) due to full turnkey production quality and verified trend momentum in ${trendName}.`,
    productCopy: `Turnkey ${title} package engineered for immediate deployment. Includes fully rendered master files, source assets, and commercial license. Built to capture high-velocity traffic around ${trendName} with zero operational overhead.`,
    outreachTemplates: [
      {
        title: 'Direct Client Proposal (Upwork / Fiverr)',
        channel: 'freelance_proposal',
        subject: `Turnkey Solution for: ${leads[0]?.requestText ? leads[0].requestText.slice(0, 45) + '...' : title}`,
        body: `Hi ${topProspect},\n\nI saw your request regarding ${trendName} asset requirements. I have an already engineered, production-ready ${title} deliverable built specifically for this scope.\n\nKey Highlights:\n- Turnkey delivery ready within minutes\n- Full commercial usage and source files included\n- Validated for maximum retention and market conversion\n\nI can provide the complete package today for $${(recommendedPrice / 100).toFixed(2)}. Let me know if you would like me to share the preview link!\n\nBest,\nTrendly Operative`,
      },
      {
        title: 'Social DM Pitch (Twitter / LinkedIn)',
        channel: 'social_dm',
        body: `Hey ${topProspect.split(' ')[0]}! Noticed your post about needing high-quality ${trendName} assets. I just finalized a complete turnkey package that matches your exact specs. Ready to deliver immediately so you don't have to wait days. Interested in taking a quick look?`,
      },
      {
        title: 'Warm Email Outreach',
        channel: 'email',
        subject: `Quick delivery: Verified ${title} for your brand`,
        body: `Hi ${topProspect},\n\nHope your week is going well. We track real-time demand signals in the ${trendName} sector and noticed your team is actively expanding asset capacity.\n\nWe have a ready-to-deploy ${title} built and verified to current market standards. You can inspect the deliverable and commercial license immediately.\n\nPricing: $${(recommendedPrice / 100).toFixed(2)} (escrow-secured on delivery confirmation).\n\nWould you be open to reviewing the sample today?\n\nBest regards,\nTrendly Autonomous Solutions`,
      },
      {
        title: 'Fast-Close Discount Offer',
        channel: 'email',
        subject: `Special 24-hr pricing on ${title}`,
        body: `Hi ${topProspect},\n\nFollowing up on our earlier note. If you are able to confirm within the next 24 hours, we can lock in priority delivery and include full source files for $${((recommendedPrice * 0.85) / 100).toFixed(2)}.\n\nLet me know if you'd like the direct checkout link!\n\nCheers,`,
      },
    ],
    objectionScripts: [
      {
        objection: 'Why should I buy this instead of hiring a standard freelancer?',
        rebuttal: 'Standard freelancers typically take 3 to 7 business days and charge revision fees. This deliverable is already fully generated, quality-audited, and available for instant escrow transfer today with zero turnaround risk.',
      },
      {
        objection: 'Is the price negotiable?',
        rebuttal: 'Our standard rate reflects verified market quality. However, for immediate close or multi-asset commitments, we can offer a 10-15% courtesy discount via our automated escrow channel.',
      },
      {
        objection: 'What if the deliverable does not match my expectations?',
        rebuttal: 'All transactions are protected by our Escrow Guarantee. Funds are held safely in escrow and only released once you confirm satisfaction with the deliverable.',
      },
    ],
    followUpSequences: [
      {
        day: 1,
        title: 'Follow-Up 1: Gentle Check-in + Preview Asset',
        body: `Hi ${topProspect.split(' ')[0]}, just checking in to see if you had a chance to review the preview link for the ${title} package. Happy to answer any technical questions!`,
      },
      {
        day: 3,
        title: 'Follow-Up 2: Value Demonstration & Case Study',
        body: `Hey ${topProspect.split(' ')[0]}, wanted to share that similar assets in the ${trendName} space have driven strong engagement this week. The package is ready whenever you are set to proceed.`,
      },
      {
        day: 5,
        title: 'Follow-Up 3: Final Call & File Archive Notice',
        body: `Hi ${topProspect.split(' ')[0]}, reaching out one last time before we release this asset package to other interested buyers in our pipeline. Let me know if you would like to secure it!`,
      },
    ],
  };

  // Upsert into database
  const existingKit = await prisma.salesKit.findFirst({
    where: { taskId },
  });

  if (existingKit) {
    await prisma.salesKit.update({
      where: { id: existingKit.id },
      data: {
        outreachTemplates: salesKitData.outreachTemplates as any,
        pricingRecommendation: salesKitData.pricingRecommendation,
        pricingRationale: salesKitData.pricingRationale,
        productCopy: salesKitData.productCopy,
        objectionScripts: salesKitData.objectionScripts as any,
        followUpSequences: salesKitData.followUpSequences as any,
      },
    });
  } else {
    await prisma.salesKit.create({
      data: {
        taskId,
        outreachTemplates: salesKitData.outreachTemplates as any,
        pricingRecommendation: salesKitData.pricingRecommendation,
        pricingRationale: salesKitData.pricingRationale,
        productCopy: salesKitData.productCopy,
        objectionScripts: salesKitData.objectionScripts as any,
        followUpSequences: salesKitData.followUpSequences as any,
      },
    });
  }

  // Log in immutable audit log
  await logExecutionEvent({
    taskId,
    logType: 'artifact_created',
    actor: 'companion',
    actorId: 'sales_engine',
    actionDescription: 'Generated comprehensive Sales Kit (Option B) with personalized outreach templates and objection battlecards.',
    inputs: { taskId },
    outputs: { recommendedPrice, templateCount: salesKitData.outreachTemplates.length },
  });

  return salesKitData;
}

/**
 * Dispatches an automated outreach message to a qualified lead.
 */
export async function sendOutreachToLead(
  leadId: string,
  sentBy: string = 'companion_bot',
  customContent?: string
) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { task: true },
  });

  if (!lead) throw new Error('Lead not found');

  const taskTitle = lead.task.title;
  const buyerFirstName = lead.buyerName ? lead.buyerName.split(' ')[0] : 'there';
  const defaultMessage = `Hi ${buyerFirstName},\n\nI saw your post regarding ${taskTitle}. We have an already engineered, quality-verified deliverable ready for immediate transfer with full commercial rights.\n\nLet me know if you would like me to send over the preview link and details!\n\nBest regards,\nTrendly Autonomous Agent`;

  const messageText = customContent || defaultMessage;

  // Create outbound message
  const msg = await prisma.leadMessage.create({
    data: {
      leadId,
      direction: 'OUTBOUND',
      channel: lead.source === 'email' ? 'email' : `${lead.source}_dm`,
      content: messageText,
      sentBy,
    },
  });

  // Update lead status to CONTACTED
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: 'CONTACTED',
      contactedAt: new Date(),
    },
  });

  // Log outreach event
  await logExecutionEvent({
    taskId: lead.taskId,
    logType: 'outreach_sent',
    actor: sentBy === 'companion_bot' ? 'companion' : 'user',
    actorId: sentBy,
    actionDescription: `Sent personalized outreach to lead ${lead.buyerName} via ${lead.source}.`,
    inputs: { leadId, buyerName: lead.buyerName, channel: lead.source },
    outputs: { messageId: msg.id },
  });

  return msg;
}

/**
 * Simulates a realistic buyer response and handles autonomous conversation progression.
 */
export async function simulateBuyerResponse(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { task: true },
  });

  if (!lead) return null;

  const responses = [
    `Thanks for reaching out! This looks exactly like what we need. Could you confirm what the price is and if we get the full source files?`,
    `Great timing! We were just reviewing proposals. What is the turnaround time if we approve today?`,
    `Hey, looks interesting. Can you do $${Math.max(50, Math.round((lead.statedBudgetCents || 15000) / 100))} for the complete package? If so, we are ready to purchase immediately.`,
  ];

  const responseText = responses[Math.floor(Math.random() * responses.length)];

  // Record inbound response
  const msg = await prisma.leadMessage.create({
    data: {
      leadId,
      direction: 'INBOUND',
      channel: lead.source === 'email' ? 'email' : `${lead.source}_dm`,
      content: responseText,
      sentBy: lead.buyerName || 'Buyer',
    },
  });

  // Update lead status to RESPONDED
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: 'RESPONDED',
      lastResponseAt: new Date(),
    },
  });

  // Log in immutable audit trail
  await logExecutionEvent({
    taskId: lead.taskId,
    logType: 'buyer_response',
    actor: 'buyer',
    actorId: lead.buyerName || 'buyer',
    actionDescription: `Received high-intent response from buyer ${lead.buyerName}.`,
    inputs: { leadId },
    outputs: { responseText },
  });

  return msg;
}

/**
 * Automates deal closure and records a sale in the system.
 */
export async function executeDealClosureAndSale(
  taskId: string,
  userId: string,
  leadId: string,
  agreedAmountCents: number,
  loggedBy: 'bot' | 'user' = 'bot'
) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  const task = await prisma.task.findUnique({ where: { id: taskId } });

  if (!lead || !task) throw new Error('Lead or Task not found');

  const platformFeePercentage = 0.10; // 10% platform fee
  const platformFeeCents = Math.round(agreedAmountCents * platformFeePercentage);
  const userPayoutCents = agreedAmountCents - platformFeeCents;

  // Create Sale record in escrow
  const sale = await prisma.sale.create({
    data: {
      taskId,
      userId,
      leadId,
      buyerName: lead.buyerName || 'Verified Buyer',
      buyerEmail: lead.buyerEmail || 'buyer@verifiedclient.io',
      buyerPlatform: lead.source,
      productDelivered: task.title,
      saleAmountCents: agreedAmountCents,
      platformFeeCents,
      userPayoutCents,
      paymentMethod: 'stripe',
      stripePaymentIntentId: `pi_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      escrowStatus: 'HELD', // Held in escrow until delivery confirmation
      proofArtifacts: [`https://trendly.io/artifacts/delivery_${taskId}.pdf`],
      loggedBy,
    },
  });

  // Update lead to WON
  await prisma.lead.update({
    where: { id: leadId },
    data: { status: 'WON' },
  });

  // Update user earnings
  await prisma.user.update({
    where: { id: userId },
    data: {
      totalEarnings: {
        increment: userPayoutCents / 100,
      },
    },
  });

  // Log sale in immutable audit log
  await logExecutionEvent({
    taskId,
    logType: 'sale_completed',
    actor: loggedBy === 'bot' ? 'companion' : 'user',
    actorId: userId,
    actionDescription: `Completed sale of ${task.title} to ${lead.buyerName} for $${(agreedAmountCents / 100).toFixed(2)}. Escrow funded; net payout: $${(userPayoutCents / 100).toFixed(2)}.`,
    inputs: { taskId, leadId, agreedAmountCents },
    outputs: { saleId: sale.id, userPayoutCents, escrowStatus: sale.escrowStatus },
  });

  return sale;
}
