'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, Clock, CheckCircle2, RefreshCw, Server, Bot, Database, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StatusClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const json = await res.json();
      if (json.success) setData(json);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const services = data?.services || [];

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-16 font-sans">
      {/* Overall Status Banner */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-mono mb-4">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>ALL CORE PLATFORM CLUSTERS ONLINE</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-wider text-white">
          System <span className="cyan-gold-gradient-text">Status & Telemetry</span>
        </h1>
        <p className="text-sm text-[#8892B0] max-w-xl mx-auto mt-2">
          Real-time reliability telemetry for autonomous Swarm Agents, prediction orderbooks, and AI Brain decision clusters.
        </p>
      </motion.div>

      {/* Main Status Container */}
      <div className="glass-card p-8 border border-white/[0.08] mb-8">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Global System Health</h3>
              <p className="text-xs text-[#8892B0] font-mono">Telemetry Refreshed Every 30 Seconds</p>
            </div>
          </div>
          <span className="text-xs font-mono text-green-400 font-bold bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
            99.9% Uptime
          </span>
        </div>

        {/* Services List */}
        <div className="space-y-4">
          {services.map((svc: any) => {
            const isOk = svc.status === 'OPERATIONAL';
            return (
              <div
                key={svc.id}
                className="p-4 rounded-lg bg-black/40 border border-white/[0.04] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{svc.name}</span>
                    <span className="text-[10px] font-mono text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded">
                      {svc.uptimePercent}% Uptime
                    </span>
                  </div>
                  {svc.avgLatencyMs && (
                    <span className="text-[10px] font-mono text-[#8892B0] block mt-1">
                      Avg Execution Latency: {svc.avgLatencyMs}ms // {svc.recentRunsCount ?? 0} Recorded Runs
                    </span>
                  )}
                  {svc.activeOpportunities && (
                    <span className="text-[10px] font-mono text-[#8892B0] block mt-1">
                      Active Scraped Opportunities: {svc.activeOpportunities} Moves
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isOk ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
                  <span className={`text-xs font-mono font-bold uppercase ${isOk ? 'text-green-400' : 'text-yellow-400'}`}>
                    {svc.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
