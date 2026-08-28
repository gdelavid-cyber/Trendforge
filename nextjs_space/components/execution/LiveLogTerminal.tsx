'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, Filter, RefreshCw, CheckCircle2 } from 'lucide-react';

export interface LogEntry {
  id: string;
  taskId: string;
  milestoneId?: string | null;
  logType: string;
  actor: string;
  actorId: string;
  actionDescription: string;
  inputs?: any;
  outputs?: any;
  artifacts?: string[];
  timestamp: string;
  hash: string;
  prevHash?: string | null;
}

interface Props {
  taskId: string;
  initialLogs?: LogEntry[];
}

export function LiveLogTerminal({ taskId, initialLogs = [] }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [filter, setFilter] = useState<string>('ALL');
  const [isLive, setIsLive] = useState(true);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // Poll / SSE stream
  useEffect(() => {
    let isMounted = true;

    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/tasks/${taskId}/logs`);
        const data = await res.json();
        if (data.success && isMounted) {
          setLogs(data.logs);
        }
      } catch (e) {}
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [taskId]);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'ALL') return true;
    if (filter === 'MILESTONES') return log.logType.includes('milestone');
    if (filter === 'LEADS') return log.logType.includes('lead');
    if (filter === 'OUTREACH') return log.logType.includes('outreach') || log.logType.includes('buyer');
    if (filter === 'SALES') return log.logType.includes('sale') || log.logType.includes('payment');
    if (filter === 'VALIDATION') return log.logType.includes('validator');
    return true;
  });

  return (
    <div className="liquid-glass rounded-3xl p-6 space-y-4 font-mono">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-[#00F0FF]">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Swarm Activity Terminal
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[9px] text-green-400 font-bold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
                Live Feed
              </span>
            </div>
            <div className="text-[10px] text-white/40">
              Immutable SHA-256 Hashed Audit Trail
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          {['ALL', 'MILESTONES', 'LEADS', 'OUTREACH', 'SALES', 'VALIDATION'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-full transition-all ${
                filter === f
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 font-bold'
                  : 'bg-white/5 text-white/50 hover:text-white border border-white/5'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Feed */}
      <div className="bg-[#030611]/80 rounded-2xl p-4 border border-white/[0.06] h-72 overflow-y-auto space-y-2.5 text-xs text-white/80 scrollbar-thin scrollbar-thumb-white/10">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/40 text-center space-y-2">
            <Terminal className="w-6 h-6 text-white/20" />
            <span>Awaiting swarm task initialization...</span>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.03] transition-colors space-y-1"
            >
              <div className="flex items-center justify-between text-[10px] text-white/40">
                <div className="flex items-center gap-2">
                  <span className="text-[#00F0FF] font-bold uppercase">
                    [{log.actor}]
                  </span>
                  <span className="text-white/60">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="px-1.5 py-0.2 bg-white/5 rounded text-[9px] text-white/50 uppercase">
                    {log.logType}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-white/30 truncate max-w-[120px]">
                  <Shield className="w-2.5 h-2.5 text-green-400" />
                  <span>#{log.hash.slice(0, 8)}</span>
                </div>
              </div>

              <div className="text-[11px] text-white/90 leading-relaxed font-sans">
                {log.actionDescription}
              </div>

              {log.artifacts && log.artifacts.length > 0 && (
                <div className="flex items-center gap-2 pt-1 text-[10px] text-[#00F0FF]">
                  <span>Artifact Vaulted:</span>
                  {log.artifacts.map((a, i) => (
                    <span key={i} className="underline text-white/70">
                      {a.split('/').pop()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
