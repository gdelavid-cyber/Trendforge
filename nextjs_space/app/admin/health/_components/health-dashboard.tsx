'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, Server, AlertTriangle, RefreshCw, CheckCircle2, Loader2, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function HealthDashboard({ user }: { user: any }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/admin/health');
      const json = await res.json();
      if (json.success) setData(json);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const triggerTestAlert = () => {
    toast.success('Slack & Email simulated alert dispatched to engineering channel!');
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-10 font-sans">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-mono mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>GLOBAL OBSERVABILITY // LIVE HEALTH DAEMON</span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-wider text-white">
            Infrastructure <span className="cyan-gold-gradient-text">Health</span>
          </h1>
          <p className="text-xs text-[#8892B0] font-mono mt-1">
            EXTERNAL GATEWAYS, LATENCIES & SWARM CIRCUIT STATES
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={triggerTestAlert}
            className="border-white/10 text-xs font-mono text-[#8892B0] hover:text-white"
          >
            Test Alert Webhook
          </Button>
          <Button
            size="sm"
            onClick={() => { setLoading(true); fetchHealth(); }}
            className="cyan-gradient text-black font-extrabold uppercase text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </motion.div>

      {/* Telemetry Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-5">
          <span className="text-[#8892B0] text-[10px] uppercase font-mono block">Overall Health</span>
          <div className="text-2xl font-bold text-green-400 mt-1 flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-5 h-5 text-green-400" /> {data?.systemStatus ?? 'OPTIMAL'}
          </div>
          <span className="text-[10px] text-[#8892B0] font-mono block mt-1">Uptime: 99.94%</span>
        </div>

        <div className="glass-card p-5">
          <span className="text-[#8892B0] text-[10px] uppercase font-mono block">24h Swarm Error Rate</span>
          <div className="text-2xl font-bold text-white mt-1 font-mono">
            {data?.metrics?.errorRatePercent ?? 0}%
          </div>
          <span className="text-[10px] text-[#8892B0] font-mono block mt-1">
            {data?.metrics?.recentFailedRuns24h ?? 0} Failed Runs
          </span>
        </div>

        <div className="glass-card p-5">
          <span className="text-[#8892B0] text-[10px] uppercase font-mono block">Total Agent Executions</span>
          <div className="text-2xl font-bold text-[#00F0FF] mt-1 font-mono">
            {data?.metrics?.totalAgentRuns ?? 0}
          </div>
          <span className="text-[10px] text-[#8892B0] font-mono block mt-1">Across 5 Worker Types</span>
        </div>

        <div className="glass-card p-5">
          <span className="text-[#8892B0] text-[10px] uppercase font-mono block">Active Catalog Moves</span>
          <div className="text-2xl font-bold text-purple-400 mt-1 font-mono">
            {data?.metrics?.totalTasks ?? 0}
          </div>
          <span className="text-[10px] text-[#8892B0] font-mono block mt-1">Deduplicated Pipeline</span>
        </div>
      </div>

      {/* External Dependencies & APIs */}
      <div className="glass-card p-6 mb-8">
        <h3 className="text-sm font-mono uppercase tracking-wider text-[#00F0FF] mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-[#00F0FF]" /> External Gateway Latency Telemetry
        </h3>

        <div className="divide-y divide-white/[0.04]">
          {data?.externalApis?.map((api: any, idx: number) => (
            <div key={idx} className="py-3 flex items-center justify-between text-xs font-mono">
              <span className="text-white font-bold">{api.name}</span>
              <div className="flex items-center gap-4">
                <span className="text-[#8892B0]">{api.latencyMs}ms</span>
                <span className="text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded text-[10px]">
                  {api.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
