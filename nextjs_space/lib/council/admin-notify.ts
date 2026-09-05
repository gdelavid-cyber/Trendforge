import { prisma } from '@/lib/db';
import { isCouncilUserModeEnabled } from './config';

export interface NotifyAdminResult {
  notificationId: string;
  publishedToUsers: boolean;
}

/**
 * Handles publishing an approved CouncilSession to HotTrendProposal.
 * Only publishes with visibleToUsers=true if COUNCIL_USER_MODE_ENABLED is true.
 * If COUNCIL_USER_MODE_ENABLED is false (Internal Mode), returns null and keeps discoveries quarantined.
 */
export async function handleProposalPublishing(sessionId: string, adminNotes?: string) {
  if (!isCouncilUserModeEnabled()) {
    return null;
  }

  const session = await prisma.councilSession.findUnique({
    where: { id: sessionId },
  });
  if (!session) return null;

  const conclusion = (session.conclusion as any) || {};
  const signal = (session.signal as any) || {};

  const proposal = await prisma.hotTrendProposal.upsert({
    where: { sessionId },
    create: {
      sessionId,
      title: conclusion.title || signal.title || 'Market Opportunity',
      marketVector: conclusion.marketVector || 'Autonomous Workflow Arbitrage',
      targetBuyer: conclusion.targetBuyer || 'B2B Enterprise / Agency Operators',
      revenueModel: conclusion.revenueModel || 'Turnkey Retainer / Setup Fee',
      mapsToMethod: conclusion.mapsToMethod || 'Method 1: Deliverables',
      isNewMethod: Boolean(conclusion.isNewMethod),
      newMethodSpec: conclusion.newMethodSpec || null,
      visibleToUsers: true, // ← SWITCH ENGAGED: surfaces on Hot Trends
    },
    update: {
      visibleToUsers: true,
      publishedAt: new Date(),
    },
  });

  return proposal;
}

/**
 * Notifies platform administrators of a Council discovery or review verdict.
 */
export async function notifyAdminCouncilVerdict(params: {
  sessionId?: string;
  score: number;
  passed: boolean;
  title: string;
}) {
  return await prisma.adminNotification.create({
    data: {
      type: params.passed ? 'council_discovery' : 'system_alert',
      sessionId: params.sessionId || null,
      title: `🧠 The Council evaluated: ${params.title} (${params.score}/100)`,
    },
  });
}

/**
 * Notifies platform administrators of a Council discovery or review update.
 * If COUNCIL_USER_MODE_ENABLED is true AND the session has an approved AdminReview,
 * automatically publishes the proposal to HotTrendProposal(visibleToUsers: true).
 */
export async function notifyAdmin(sessionId: string, title: string): Promise<NotifyAdminResult> {
  // 1. Record admin notification in DB
  const notif = await prisma.adminNotification.create({
    data: {
      type: 'council_discovery',
      sessionId,
      title: `🧠 The Council discovered: ${title}`,
    },
  });

  let publishedToUsers = false;

  // 2. Check if user-experience mode is flipped ON
  if (isCouncilUserModeEnabled()) {
    const adminReview = await prisma.adminReview.findFirst({
      where: { sessionId },
    });

    if (adminReview?.decision === 'approved' && !adminReview.sentToUsers) {
      const proposal = await handleProposalPublishing(sessionId);

      if (proposal) {
        await prisma.adminReview.update({
          where: { id: adminReview.id },
          data: { sentToUsers: true },
        });

        publishedToUsers = true;

        await prisma.adminNotification.create({
          data: {
            type: 'system_alert',
            sessionId,
            title: `Public Switch Active: "${title}" published to Hot Trends feed for regular users.`,
          },
        });
      }
    }
  }

  return {
    notificationId: notif.id,
    publishedToUsers,
  };
}
