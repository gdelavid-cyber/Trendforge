import { logExecutionEvent } from '@/lib/execution/logger';
import { recordTrace } from '@/lib/growth/nova/traces';

export interface EmitInput {
  taskId: string;
  milestoneId?: string | null;
  actorId: string;
  actionDescription: string;
  outputs?: Record<string, any>;
}

async function emit(kind: 'companion_action' | 'user_action', input: EmitInput) {
  const row = await logExecutionEvent({
    taskId: input.taskId,
    milestoneId: input.milestoneId ?? null,
    logType: kind,
    actor: 'companion',
    actorId: input.actorId,
    actionDescription: input.actionDescription,
    outputs: input.outputs ?? {},
  });
  return { id: row?.id ?? null };
}

export async function emitStart(input: EmitInput) {
  return emit('companion_action', input);
}

export async function emitProgress(input: EmitInput) {
  return emit('companion_action', input);
}

export async function emitDone(input: EmitInput) {
  const out = await emit('companion_action', input);
  void recordTrace({ userId: null, kind: 'STEP', subject: input.actionDescription.slice(0, 200), summary: 'Done.', reasons: [] });
  return out;
}

export async function emitBlocked(input: EmitInput) {
  const out = await emit('companion_action', input);
  void recordTrace({ userId: null, kind: 'STEP', subject: input.actionDescription.slice(0, 200), summary: 'Blocked, reported honestly.', reasons: [input.actionDescription.slice(0, 500)] });
  return out;
}

export async function requestAck(input: EmitInput) {
  return logExecutionEvent({
    taskId: input.taskId,
    milestoneId: input.milestoneId ?? null,
    logType: 'approval_requested',
    actor: 'system',
    actorId: input.actorId,
    actionDescription: input.actionDescription,
    outputs: input.outputs ?? {},
  }).then((row) => ({ id: row?.id ?? null }));
}
