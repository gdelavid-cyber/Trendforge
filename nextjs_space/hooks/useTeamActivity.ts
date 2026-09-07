'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export function useTeamActivity(taskId: string, actorId: string = 'companion') {
  const [isRunning, setIsRunning] = useState(false);
  const run = useCallback(async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
    setIsRunning(true);
    const id = toast.loading(`${label} — working…`);
    // Dynamic import: emitter pulls in prisma via lib/execution/logger, which
    // cannot bundle into the client chunk statically. Failures stay non-fatal
    // so the UX (toasts) keeps working even if the feed write is down.
    try {
      const { emitStart } = await import('@/lib/activity/emitter');
      await emitStart({ taskId, actorId, actionDescription: label });
    } catch {}
    try {
      const out = await fn();
      try {
        const { emitDone } = await import('@/lib/activity/emitter');
        await emitDone({ taskId, actorId, actionDescription: label });
      } catch {}
      const ok = (out as { ok?: boolean } | null)?.ok;
      if (ok === false) toast.error((out as { message?: string })?.message || `${label} — blocked.`, { id });
      else toast.success(`${label} — done.`, { id });
      return out;
    } catch (e: any) {
      toast.error(e?.message || `${label} — failed.`, { id });
      throw e;
    } finally {
      setIsRunning(false);
    }
  }, [taskId, actorId]);
  return { run, isRunning };
}
