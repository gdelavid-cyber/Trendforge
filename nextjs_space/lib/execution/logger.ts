import crypto from 'crypto';
import { prisma } from '@/lib/core/db';

export interface LogEntryInput {
  taskId: string;
  milestoneId?: string | null;
  logType:
    | 'milestone_start'
    | 'milestone_complete'
    | 'artifact_created'
    | 'validator_run'
    | 'lead_scraped'
    | 'outreach_sent'
    | 'buyer_response'
    | 'negotiation'
    | 'approval_requested'
    | 'approval_decision'
    | 'payment_event'
    | 'sale_completed'
    | 'error'
    | 'retry'
    | 'user_action'
    | 'companion_action';
  actor: 'companion' | 'user' | 'system' | 'validator' | 'buyer';
  actorId: string;
  actionDescription: string;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  artifacts?: string[];
}

/**
 * Calculates SHA-256 hash for immutable audit logging.
 */
export function calculateLogHash(
  prevHash: string | null,
  taskId: string,
  logType: string,
  actor: string,
  actorId: string,
  actionDescription: string,
  inputs: Record<string, any>,
  outputs: Record<string, any>,
  timestamp: string
): string {
  const payload = JSON.stringify({
    prevHash: prevHash || '0000000000000000000000000000000000000000000000000000000000000000',
    taskId,
    logType,
    actor,
    actorId,
    actionDescription,
    inputs,
    outputs,
    timestamp,
  });

  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Persists an immutable log entry with SHA-256 hash chaining.
 */
export async function logExecutionEvent(data: LogEntryInput) {
  try {
    const timestamp = new Date();
    
    // Find previous log entry for hash chaining
    const prevLog = await prisma.executionLog.findFirst({
      where: { taskId: data.taskId },
      orderBy: { timestamp: 'desc' },
      select: { hash: true },
    });

    const prevHash = prevLog?.hash || null;
    const hash = calculateLogHash(
      prevHash,
      data.taskId,
      data.logType,
      data.actor,
      data.actorId,
      data.actionDescription,
      data.inputs || {},
      data.outputs || {},
      timestamp.toISOString()
    );

    return await prisma.executionLog.create({
      data: {
        taskId: data.taskId,
        milestoneId: data.milestoneId || null,
        logType: data.logType,
        actor: data.actor,
        actorId: data.actorId,
        actionDescription: data.actionDescription,
        inputs: data.inputs || {},
        outputs: data.outputs || {},
        artifacts: data.artifacts || [],
        timestamp,
        hash,
        prevHash,
      },
    });
  } catch (error) {
    console.error('Failed to log execution event:', error);
    return null;
  }
}
