import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../lib/core/db';
import { isCouncilUserModeEnabled, isUserAdmin } from '../lib/council/config';
import { runCouncilDebate } from '../lib/council/council-runner';
import { notifyAdminCouncilVerdict, handleProposalPublishing } from '../lib/council/admin-notify';

const RUN_PREFIX = `council-test-${Date.now()}`;
const createdSessionIds: string[] = [];
const createdProposalIds: string[] = [];

beforeAll(async () => {
  // Ensure clean test environment
});

afterAll(async () => {
  // Clean up any test records created
  if (createdProposalIds.length > 0) {
    await prisma.hotTrendProposal.deleteMany({
      where: { id: { in: createdProposalIds } },
    });
  }
  if (createdSessionIds.length > 0) {
    await prisma.adminReview.deleteMany({
      where: { sessionId: { in: createdSessionIds } },
    });
    await prisma.hotTrendProposal.deleteMany({
      where: { sessionId: { in: createdSessionIds } },
    });
    await prisma.councilSession.deleteMany({
      where: { id: { in: createdSessionIds } },
    });
  }
  await prisma.adminNotification.deleteMany({
    where: { title: { contains: RUN_PREFIX } },
  });
  await prisma.$disconnect();
});

describe('AI Money Council — Two-Path Architecture & Gatekeeper Gating', () => {
  it('respects COUNCIL_USER_MODE_ENABLED toggle accurately', () => {
    const original = process.env.COUNCIL_USER_MODE_ENABLED;

    delete process.env.COUNCIL_USER_MODE_ENABLED;
    expect(isCouncilUserModeEnabled()).toBe(false);

    process.env.COUNCIL_USER_MODE_ENABLED = 'false';
    expect(isCouncilUserModeEnabled()).toBe(false);

    process.env.COUNCIL_USER_MODE_ENABLED = 'true';
    expect(isCouncilUserModeEnabled()).toBe(true);

    process.env.COUNCIL_USER_MODE_ENABLED = original;
  });

  it('validates admin role security guards', () => {
    // Standard user
    expect(isUserAdmin(null)).toBe(false);
    expect(isUserAdmin({ id: 'u_123', email: 'regular@trendly.io', role: 'USER' })).toBe(false);

    // Role-based admin
    expect(isUserAdmin({ id: 'u_admin', email: 'admin@trendly.io', role: 'ADMIN' })).toBe(true);

    // Configured admin ID
    const origIds = process.env.ADMIN_USER_IDS;
    process.env.ADMIN_USER_IDS = 'u_super1,u_super2';
    expect(isUserAdmin({ id: 'u_super1', email: 'other@trendly.io', role: 'USER' })).toBe(true);
    expect(isUserAdmin({ id: 'u_super2', email: 'other2@trendly.io' })).toBe(true);
    process.env.ADMIN_USER_IDS = origIds;

    // Configured admin email
    const origEmail = process.env.ADMIN_EMAIL;
    process.env.ADMIN_EMAIL = 'lead-operator@trendly.io';
    expect(isUserAdmin({ id: 'u_999', email: 'lead-operator@trendly.io', role: 'USER' })).toBe(true);
    process.env.ADMIN_EMAIL = origEmail;
  });

  it('executes 5-agent debate and advances high-scoring proposal (score >= 80) to admin review', async () => {
    const signal = {
      title: `${RUN_PREFIX} B2B Dispatch AI Agent`,
      source: 'Internal Scout',
      estimatedMargin: '85%',
      estimatedVelocity: '3 days',
    };

    const session = await runCouncilDebate(signal);
    createdSessionIds.push(session.id);

    expect(session).toBeDefined();
    expect(session.status).toBe('admin_review');
    expect(session.gatekeeperScore).toBeGreaterThanOrEqual(80);

    // Check all 6 personas contributed
    const transcript = session.debateTranscript as any[];
    expect(transcript).toHaveLength(6);

    const agentNames = transcript.map((t) => t.agentName);
    expect(agentNames).toContain('Deal Finder');
    expect(agentNames).toContain('Trend Hunter');
    expect(agentNames).toContain('Unit Economist');
    expect(agentNames).toContain('Operator');
    expect(agentNames).toContain('Contrarian');
    expect(agentNames).toContain('Closer');

    // Check Gatekeeper verdict
    const feedback = session.gatekeeperFeedback as any;
    expect(feedback.breakdown).toBeDefined();
    expect(feedback.breakdown.feasibility).toBeGreaterThan(0);
    expect(feedback.breakdown.unitEconomics).toBeGreaterThan(0);
    expect(feedback.breakdown.marketDemand).toBeGreaterThan(0);
  });

  it('filters low-scoring/high-risk signals and stops them from reaching admin review', async () => {
    const badSignal = {
      title: `${RUN_PREFIX} Unregulated Crypto Arbitrage`,
      source: 'Spam Forum',
      estimatedMargin: '5%',
      estimatedVelocity: '6 months',
    };

    const session = await runCouncilDebate(badSignal);
    createdSessionIds.push(session.id);

    expect(session.status).toBe('filtered');
    expect(session.gatekeeperScore).toBeLessThan(80);
    expect(session.conclusion).toBeDefined();
  });
});

describe('AI Money Council — Exposure Switch & Isolation Behavior', () => {
  it('quarantines discoveries internally when COUNCIL_USER_MODE_ENABLED=false', async () => {
    process.env.COUNCIL_USER_MODE_ENABLED = 'false';

    // Create an approved session in internal mode
    const session = await prisma.councilSession.create({
      data: {
        status: 'approved',
        signal: { title: `${RUN_PREFIX} Internal Only Playbook`, source: 'Private Repo' },
        debateTranscript: [
          { agentName: 'Trend Hunter', role: 'Scout', sentiment: 'bullish', perspective: 'Hidden alpha', recommendation: 'Keep internal' }
        ],
        gatekeeperVerdict: { passed: true, score: 92 },
        conclusion: { summary: 'Internal execution strategy' },
      },
    });
    createdSessionIds.push(session.id);

    // Call publishing handler
    const proposal = await handleProposalPublishing(session.id, 'Approved for internal testing only');

    // Proposal should NOT be created for public users
    expect(proposal).toBeNull();

    // Verify no public proposal exists in DB for this session
    const publicFound = await prisma.hotTrendProposal.findFirst({
      where: { sessionId: session.id, visibleToUsers: true },
    });
    expect(publicFound).toBeNull();
  });

  it('publishes sanitized proposal to users when COUNCIL_USER_MODE_ENABLED=true without leaking internal debate transcript', async () => {
    process.env.COUNCIL_USER_MODE_ENABLED = 'true';

    // Create session
    const session = await prisma.councilSession.create({
      data: {
        status: 'approved',
        signal: { title: `${RUN_PREFIX} Public AI Video Trend`, source: 'TikTok Viral' },
        debateTranscript: [
          { agentName: 'Trend Hunter', role: 'Scout', sentiment: 'bullish', perspective: 'Massive surge', recommendation: 'Publish' },
          { agentName: 'Contrarian', role: 'Red Team', sentiment: 'neutral', perspective: 'Sensitive internal note', recommendation: 'Redacted' }
        ],
        gatekeeperVerdict: {
          score: 88,
          breakdown: { feasibility: 85, unitEconomics: 90, marketDemand: 88, risk: 20 },
        },
        conclusion: {
          title: `${RUN_PREFIX} Public AI Video Trend`,
          summary: 'High demand video tool',
          marketVector: 'Autonomous Short-Form Video',
          targetBuyer: 'E-commerce DTC Brands',
          revenueModel: '$300/mo subscription',
          mapsToMethod: 'Method 2: Video Empire',
        },
      },
    });
    createdSessionIds.push(session.id);

    // Call publishing handler with switch ON
    const proposal = await handleProposalPublishing(session.id, 'Admin signed off for public rollout');
    expect(proposal).not.toBeNull();
    if (proposal) {
      createdProposalIds.push(proposal.id);
      expect(proposal.visibleToUsers).toBe(true);
      expect(proposal.title).toBe(`${RUN_PREFIX} Public AI Video Trend`);
      expect(proposal.marketVector).toBe('Autonomous Short-Form Video');

      // Check DB record directly
      const dbRecord = await prisma.hotTrendProposal.findUniqueOrThrow({
        where: { id: proposal.id },
      });
      expect(dbRecord.visibleToUsers).toBe(true);

      // Verify that the proposal public record does NOT expose internal raw transcripts
      expect((dbRecord as any).debateTranscript).toBeUndefined();
    }
  });

  it('records admin notification on debate completion', async () => {
    const notif = await notifyAdminCouncilVerdict({
      sessionId: 'sess_test_alert',
      score: 87,
      passed: true,
      title: `${RUN_PREFIX} Notification Alert`,
    });

    expect(notif).toBeDefined();
    expect(notif.read).toBe(false);
    expect(notif.title).toContain(RUN_PREFIX);
    expect(notif.title).toContain('87/100');
  });
});
