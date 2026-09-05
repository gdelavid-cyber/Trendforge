import { logAuditEvent } from '@/lib/experience/compliance/audit-logger';
import type { CopilotChannel, CopilotMode } from './types';

// Hard-coded Legal Compliance Map (Non-configurable by user)
export const AUTO_CLOSE_ALLOWED_CHANNELS: ReadonlySet<string> = new Set([
  'email',
  'sms',
  'reddit',
  'reddit_reply',
  'in_app',
  'in_app_chat',
]);

export const AUTO_CLOSE_BLOCKED_CHANNELS: ReadonlySet<string> = new Set([
  'linkedin',
  'linkedin_dm',
  'upwork',
  'upwork_proposal',
  'x',
  'x_dm',
  'twitter',
  'phone', // phone auto-close cold call is prohibited without verified consent
]);

export const DEFAULT_AI_DISCLOSURE =
  process.env.COPILOT_AI_DISCLOSURE_TEXT ||
  "I'm an AI assistant helping with this offer. I'm here to share details and help answer any questions.";

// Opt-out detection regex pattern (CAN-SPAM, TCPA, and platform TOS compliance)
const OPT_OUT_REGEX =
  /\b(unsubscribe|stop|cancel|not interested|remove me|leave me alone|do not contact|opt out|quit|end)\b/i;

export interface ComplianceValidation {
  allowed: boolean;
  code?: 'CHANNEL_AUTO_CLOSE_PROHIBITED' | 'OPT_OUT_DETECTED' | 'PRICE_BELOW_FLOOR';
  error?: string;
}

/**
 * Validates that the requested sales mode is legally permitted on the chosen channel.
 */
export function validateChannelMode(channel: string, mode: CopilotMode): ComplianceValidation {
  const normChannel = channel.toLowerCase().trim();

  if (mode === 'auto_close') {
    if (AUTO_CLOSE_BLOCKED_CHANNELS.has(normChannel)) {
      return {
        allowed: false,
        code: 'CHANNEL_AUTO_CLOSE_PROHIBITED',
        error: `Auto-Close is legally prohibited on ${channel} due to anti-spam terms of service. Please select AI Co-Pilot or Manual mode.`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Checks if a prospect's incoming message indicates an opt-out or cease-contact request.
 */
export function isOptOutMessage(message: string): boolean {
  if (!message || typeof message !== 'string') return false;
  return OPT_OUT_REGEX.test(message);
}

/**
 * Ensures AI disclosure is prepended to the initial outreach message.
 */
export function prependAiDisclosure(content: string): string {
  if (content.includes("AI assistant") || content.includes("I'm an AI")) {
    return content;
  }
  return `${DEFAULT_AI_DISCLOSURE}\n\n${content}`;
}

/**
 * Scans content for dollar figures and enforces that no quoted price is below the price floor.
 */
export function enforcePriceFloor(content: string, priceFloor: number): { safeContent: string; intercepted: boolean } {
  if (!content || typeof content !== 'string') return { safeContent: content || '', intercepted: false };
  if (priceFloor <= 0) return { safeContent: content, intercepted: false };

  // Match dollar amounts like $100, $45.50, etc.
  const priceRegex = /\$(\d+(?:\.\d{2})?)/g;
  let intercepted = false;

  const safeContent = content.replace(priceRegex, (match, p1) => {
    const amount = parseFloat(p1);
    if (!isNaN(amount) && amount < priceFloor) {
      intercepted = true;
      return `$${priceFloor.toFixed(2)}`;
    }
    return match;
  });

  return { safeContent, intercepted };
}

/**
 * Records a compliance audit event.
 */
export function logComplianceEvent(
  userId: string,
  sessionId: string,
  eventType: 'OPT_OUT' | 'ESCALATION' | 'PRICE_FLOOR_INTERCEPT' | 'AI_DISCLOSURE',
  details: Record<string, any>
) {
  logAuditEvent({
    userId,
    actionType: 'OUTREACH_SENT',
    resourceType: 'CoPilotSession',
    resourceId: sessionId,
    details: {
      complianceEventType: eventType,
      ...details,
    },
  });
}
