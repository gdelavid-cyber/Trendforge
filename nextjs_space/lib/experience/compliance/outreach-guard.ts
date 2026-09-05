import { logAuditEvent } from './audit-logger';

export interface OutreachLimits {
  dailyEmailLimit: number;
  dailyLinkedInLimit: number;
  dailyInstagramLimit: number;
}

export const OUTREACH_LIMITS: OutreachLimits = {
  dailyEmailLimit: 50,
  dailyLinkedInLimit: 10,
  dailyInstagramLimit: 20,
};

// Tracks sends in last 24h
const sendTracker: Map<string, { email: number; linkedin: number; instagram: number; lastReset: number }> = new Map();

function getTracker(userId: string) {
  const now = Date.now();
  if (!sendTracker.has(userId)) {
    sendTracker.set(userId, { email: 0, linkedin: 0, instagram: 0, lastReset: now });
  }
  const data = sendTracker.get(userId)!;
  // Reset if 24h passed
  if (now - data.lastReset > 24 * 60 * 60 * 1000) {
    data.email = 0;
    data.linkedin = 0;
    data.instagram = 0;
    data.lastReset = now;
  }
  return data;
}

export function validateOutreachRequest(
  userId: string,
  channel: 'Email' | 'Instagram DM' | 'LinkedIn' | 'X DM' | 'Facebook',
  hasExplicitUserConsent: boolean
): { allowed: boolean; error?: string } {
  if (!hasExplicitUserConsent) {
    return {
      allowed: false,
      error: 'Legal Compliance Violation: Outreach cannot be sent without explicit user review and approval (Section 30).',
    };
  }

  const tracker = getTracker(userId);

  if (channel === 'Email' && tracker.email >= OUTREACH_LIMITS.dailyEmailLimit) {
    return {
      allowed: false,
      error: `CAN-SPAM Daily Rate Limit Reached: Max ${OUTREACH_LIMITS.dailyEmailLimit} emails allowed per day to prevent domain reputation damage.`,
    };
  }

  if (channel === 'LinkedIn' && tracker.linkedin >= OUTREACH_LIMITS.dailyLinkedInLimit) {
    return {
      allowed: false,
      error: `LinkedIn TOS Protection: Max ${OUTREACH_LIMITS.dailyLinkedInLimit} connection messages allowed per day.`,
    };
  }

  if (channel === 'Instagram DM' && tracker.instagram >= OUTREACH_LIMITS.dailyInstagramLimit) {
    return {
      allowed: false,
      error: `Instagram Anti-Spam Limit: Max ${OUTREACH_LIMITS.dailyInstagramLimit} DMs allowed per day.`,
    };
  }

  // Increment counter
  if (channel === 'Email') tracker.email += 1;
  if (channel === 'LinkedIn') tracker.linkedin += 1;
  if (channel === 'Instagram DM') tracker.instagram += 1;

  logAuditEvent({
    userId,
    actionType: 'OUTREACH_SENT',
    resourceType: 'BuyerContact',
    resourceId: channel,
    details: { channel, timestamp: new Date().toISOString() },
  });

  return { allowed: true };
}

export const MANDATORY_INCOME_DISCLAIMER =
  'Trendly provides tools and guidance. Actual results depend on your execution, market conditions, and factors outside our control. Testimonials shown are individual experiences and not typical. No income is guaranteed.';