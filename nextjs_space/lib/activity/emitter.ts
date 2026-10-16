import { logExecutionEvent } from '@/lib/execution/logger';

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
  return emit('companion_action', input);
}

export async function emitBlocked(input: EmitInput) {
  return emit('companion_action', input);
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
