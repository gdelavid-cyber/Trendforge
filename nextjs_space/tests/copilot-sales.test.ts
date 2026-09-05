import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../lib/core/db';
import {
  validateChannelMode,
  isOptOutMessage,
  enforcePriceFloor,
  prependAiDisclosure,
} from '../lib/copilot/compliance';
import { analyzeBuyerEngagement } from '../lib/copilot/analyzer';
import { processAutoCloseTurn } from '../lib/copilot/auto-closer';

const RUN = `copilot-${Date.now()}`;
let testUserId: string;
let testTaskId: string;
let testLeadId: string;
let testSessionId: string;

beforeAll(async () => {
  // Setup user, task, and lead
  const user = await prisma.user.create({
    data: {
      email: `${RUN}@copilot-test.local`,
      name: 'Copilot Test User',
      passwordHash: 'x',
    },
  });
  testUserId = user.id;

  const task = await prisma.task.findFirstOrThrow();
  testTaskId = task.id;

  const lead = await prisma.lead.create({
    data: {
      taskId: testTaskId,
      userId: testUserId,
      source: 'email',
      sourceUrl: 'https://trendly.io/test',
      buyerName: 'Dr. John Smith',
      buyerEmail: `${RUN}-buyer@target.local`,
      requestText: 'Looking for emergency after-hours dispatch solution.',
      status: 'NEW',
    },
  });
  testLeadId = lead.id;
});

afterAll(async () => {
  await prisma.paymentLinkSale.deleteMany({
    where: { session: { userId: testUserId } },
  });
  await prisma.copilotSuggestion.deleteMany({
    where: { session: { userId: testUserId } },
  });
  await prisma.callSession.deleteMany({
    where: { coPilot: { userId: testUserId } },
  });
  await prisma.coPilotSession.deleteMany({
    where: { userId: testUserId },
  });
  await prisma.lead.deleteMany({
    where: { id: testLeadId },
  });
  await prisma.user.deleteMany({
    where: { id: testUserId },
  });
  await prisma.$disconnect();
});

describe('AI Co-Pilot & Auto-Close Legal Compliance Layer', () => {
  it('enforces hard-coded Channel Legal Map', () => {
    // Auto-Close allowed on compliant channels
    expect(validateChannelMode('email', 'auto_close').allowed).toBe(true);
    expect(validateChannelMode('sms', 'auto_close').allowed).toBe(true);
    expect(validateChannelMode('reddit', 'auto_close').allowed).toBe(true);
    expect(validateChannelMode('in_app', 'auto_close').allowed).toBe(true);

    // Auto-Close strictly blocked on prohibited channels
    const linkedinCheck = validateChannelMode('linkedin', 'auto_close');
    expect(linkedinCheck.allowed).toBe(false);
    expect(linkedinCheck.code).toBe('CHANNEL_AUTO_CLOSE_PROHIBITED');

    const upworkCheck = validateChannelMode('upwork', 'auto_close');
    expect(upworkCheck.allowed).toBe(false);

    const xCheck = validateChannelMode('x', 'auto_close');
    expect(xCheck.allowed).toBe(false);

    // AI Co-Pilot and Manual modes permitted everywhere
    expect(validateChannelMode('linkedin', 'co_pilot').allowed).toBe(true);
    expect(validateChannelMode('linkedin', 'manual').allowed).toBe(true);
    expect(validateChannelMode('upwork', 'co_pilot').allowed).toBe(true);
  });

  it('detects opt-out keywords and mandates immediate cessation', () => {
    expect(isOptOutMessage('Please unsubscribe me from this list')).toBe(true);
    expect(isOptOutMessage('STOP')).toBe(true);
    expect(isOptOutMessage('I am not interested, leave me alone')).toBe(true);
    expect(isOptOutMessage('Can you send more details?')).toBe(false);
  });

  it('enforces non-negotiable code-level price floor', () => {
    const priceFloor = 300.0;

    // Quoted amount below floor ($150) must be intercepted and clamped to $300.00
    const testBelow = 'I can offer you this complete system for $150 today.';
    const resultBelow = enforcePriceFloor(testBelow, priceFloor);
    expect(resultBelow.intercepted).toBe(true);
    expect(resultBelow.safeContent).toBe('I can offer you this complete system for $300.00 today.');

    // Quoted amount above floor ($450) passes through unaltered
    const testAbove = 'The standard package is $450 with 48h handover.';
    const resultAbove = enforcePriceFloor(testAbove, priceFloor);
    expect(resultAbove.intercepted).toBe(false);
    expect(resultAbove.safeContent).toBe(testAbove);
  });

  it('injects mandatory AI disclosure on session initiation', () => {
    const initialPitch = 'We have built an emergency voice setup for your clinic.';
    const disclosed = prependAiDisclosure(initialPitch);
    expect(disclosed).toContain("I'm an AI assistant helping with this offer");
    expect(disclosed).toContain(initialPitch);
  });
});

describe('Sales Co-Pilot Reasoning & Auto-Close Turn Processing', () => {
  it('analyzes buyer messages and outputs structured intent and coaching tips', async () => {
    const analysis = await analyzeBuyerEngagement({
      buyerMessage: 'How much does this package cost? It looks pretty expensive.',
      leadContext: {
        buyerName: 'Dr. John Smith',
        requestText: 'Emergency call triage',
        source: 'email',
      },
      productContext: {
        priceOffer: 450,
        priceFloor: 250,
      },
    });

    expect(analysis).toBeDefined();
    expect(analysis.intent).toBeDefined();
    expect(analysis.coachingTip).toBeDefined();
    expect(analysis.suggestedReply).toBeDefined();
    expect(analysis.urgency).toBeDefined();
  });

  it('processes auto_close turn with opt-out cessation', async () => {
    // Create an auto_close session
    const session = await prisma.coPilotSession.create({
      data: {
        userId: testUserId,
        executionId: 'exec_auto_test',
        leadId: testLeadId,
        channel: 'email',
        mode: 'auto_close',
        status: 'waiting',
        priceOffer: 450,
        priceFloor: 250,
      },
    });
    testSessionId = session.id;

    // Simulate opt-out turn
    const result = await processAutoCloseTurn(session.id, 'Please remove me and stop emailing.');
    expect(result.actionTaken).toBe('OPT_OUT');

    const updated = await prisma.coPilotSession.findUniqueOrThrow({
      where: { id: session.id },
    });
    expect(updated.status).toBe('opted_out');
  });

  it('processes auto_close turn with agreement and Stripe payment link generation', async () => {
    // Re-activate session for agreement test
    await prisma.coPilotSession.update({
      where: { id: testSessionId },
      data: { status: 'waiting' },
    });

    const result = await processAutoCloseTurn(testSessionId, 'Looks great, send invoice now so we can pay.');
    expect(result.actionTaken).toBe('PAYMENT_LINK_SENT');
    expect(result.paymentLink).toContain('https://buy.stripe.com');

    // Confirm PaymentLinkSale record created in DB
    const link = await prisma.paymentLinkSale.findFirst({
      where: { sessionId: testSessionId },
    });
    expect(link).toBeDefined();
    expect(link?.amount).toBeGreaterThanOrEqual(250);
  });
});
