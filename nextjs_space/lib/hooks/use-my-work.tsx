'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

export interface WorkExecution {
  id: string;
  trendId: string;
  trendName: string;
  category: string;
  status: string;
  progressPct: number;
  lastCheckpoint: string | null;
  lastActivityAt: string;
  stagesDone: number;
  stagesTotal: number;
  unread: boolean;
  pinned: boolean;
}

interface Ctx {
  executions: WorkExecution[];
  activeCount: number;
  unreadCount: number;
  refresh: () => Promise<void>;
  loading: boolean;
}

const MyWorkContext = createContext<Ctx | null>(null);

export function MyWorkProvider({ children }: { children: ReactNode }) {
  const [executions, setExecutions] = useState<WorkExecution[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/my-work?filter=active');
      if (!res.ok) return;
      const data = await res.json();
      setExecutions(data.executions ?? []);
      setActiveCount(data.activeCount ?? 0);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + smart adaptive polling: 4s if running, 20s otherwise
  useEffect(() => {
    refresh();
    let t: NodeJS.Timeout;
    const loop = () => {
      const anyRunning = executions.some(e => ['QUEUED', 'RUNNING'].includes(e.status));
      t = setTimeout(async () => {
        await refresh();
        loop();
      }, anyRunning ? 4000 : 20000);
    };
    loop();
    return () => clearTimeout(t);
  }, [refresh, executions.length]);

  return (
    <MyWorkContext.Provider value={{ executions, activeCount, unreadCount, refresh, loading }}>
      {children}
    </MyWorkContext.Provider>
  );
}

export function useMyWork() {
  const ctx = useContext(MyWorkContext);
  if (!ctx) {
    // Return safe fallback if rendered outside provider
    return {
      executions: [],
      activeCount: 0,
      unreadCount: 0,
      refresh: async () => {},
      loading: false,
    };
  }
  return ctx;
}
