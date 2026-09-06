'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export function useTeamActivity(taskId: string) {
  const [isRunning, setIsRunning] = useState(false);
  const run = useCallback(async (label: string, fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setIsRunning(true);
    const id = toast.loading(`${label} — working…`);
    try {
      const out = await fn();
      if (out.ok) toast.success(`${label} — done.`, { id });
      else toast.error(out.message || `${label} — blocked.`, { id });
    } catch (e: any) {
      toast.error(e?.message || `${label} — failed.`, { id });
    } finally {
      setIsRunning(false);
    }
  }, []);
  return { run, isRunning };
}
