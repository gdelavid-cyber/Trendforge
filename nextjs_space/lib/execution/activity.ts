import { db } from '@/lib/db';

export type ActivityKind =
  | 'execution_started'
  | 'stage_completed'
  | 'stage_fallback'
  | 'awaiting_approval'
  | 'approved'
  | 'kit_ready'
  | 'outreach_scheduled'
  | 'money_received'
  | 'buyers_discovered'
  | 'execution_failed';

export async function logActivity(params: {
  userId: string | null | undefined;
  executionId?: string;
  trendId?: string;
  kind: ActivityKind;
  title: string;
  detail?: string;
}) {
  if (!params.userId) return; // anon executions skip the feed
  try {
    await db.userActivity.create({
      data: {
        userId: params.userId,
        executionId: params.executionId,
        trendId: params.trendId,
        kind: params.kind,
        title: params.title,
        detail: params.detail,
      },
    });
  } catch (err) {
    console.error('[Activity] Failed to log activity:', err);
  }
}

export async function updateCheckpoint(
  executionId: string,
  checkpoint: string
) {
  try {
    await db.trendExecution.update({
      where: { id: executionId },
      data: { lastCheckpoint: checkpoint, lastActivityAt: new Date() },
    });
  } catch (err) {
    console.error('[Activity] Failed to update checkpoint:', err);
  }
}
