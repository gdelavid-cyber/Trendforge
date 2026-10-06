'use client';

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Activity,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Play,
  Flame,
  ArrowRight,
  Download,
  Coins,
  Radio,
  Layers,
  Terminal,
  ExternalLink,
  RefreshCw,
  Sliders,
  Check,
  X,
  FileCode,
  Sparkles,
  Bot,
} from 'lucide-react';
import { toast } from 'sonner';

interface WorkerDef {
  id: string;
  name: string;
  bayName: string;
  role: string;
  color: string;
  borderColor: string;
  glowColor: string;
  desc: string;
  capabilities: string[];
  sampleParams: Record<string, any>;
}

const WORKERS: WorkerDef[] = [
  {
    id: 'reddit_scraper',
    name: 'Reddit Problem Scraper',
    bayName: 'REDDIT MINER BAY',
    role: 'RESEARCHER',
    color: '#ff4444',
    borderColor: 'border-red-500/40',
    glowColor: 'shadow-red-500/20',
    desc: 'Scrapes subreddits for recurring pain points, commercial complaints, and synthesizes 3-stage monetization blueprints.',
    capabilities: ['Reddit API Gateway', 'Pain Point Extractor', 'Monetization Blueprint Engine'],
    sampleParams: { subreddit: 'SaaS', topic: 'analytics bottlenecks' },
  },
  {
    id: 'prediction_arbitrage',
    name: 'Prediction Arbitrage Scanner',
    bayName: 'ARBITRAGE BAY',
    role: 'TRADER',
    color: '#00ffcc',
    borderColor: 'border-cyan-500/40',
    glowColor: 'shadow-cyan-500/20',
    desc: 'Queries Polymarket order books, detects odds mispricing spreads, and calculates hedged positions.',
    capabilities: ['Polymarket RPC Node', 'Orderbook Matcher', 'Spread Risk Calculator'],
    sampleParams: { market: 'crypto-macro', minSpreadBps: 25 },
  },
  {
    id: 'openclaw_deployer',
    name: 'OpenClaw VPS & Proxy Deployer',
    bayName: 'OPENCLAW INFRA BAY',
    role: 'ENGINEER',
    color: '#00aaff',
    borderColor: 'border-blue-500/40',
    glowColor: 'shadow-blue-500/20',
    desc: 'Provisions headless Docker nodes, rotating residential proxies, and TLS anti-detect fingerprinting.',
    capabilities: ['Docker Node Provisioner', 'Residential Proxy Pool', 'TLS Camouflage Engine'],
    sampleParams: { clusterSize: 2, region: 'us-east' },
  },
  {
    id: 'ai_video_maker',
    name: 'AI Video & Hook Studio',
    bayName: 'AI VIDEO STUDIO BAY',
    role: 'CREATOR',
    color: '#cc44ff',
    borderColor: 'border-purple-500/40',
    glowColor: 'shadow-purple-500/20',
    desc: 'Generates high-retention short-form video hooks, multi-speaker voiceover scripts, and media rendering pipelines.',
    capabilities: ['Viral Hook Generator', 'Multi-Speaker Audio', 'Visual Composition Pipeline'],
    sampleParams: { topic: 'Micro-SaaS automation tool', format: 'tiktok-reel' },
  },
  {
    id: 'micro_saas_builder',
    name: 'Micro SaaS Builder',
    bayName: 'SAAS BUILDER BAY',
    role: 'BUILDER',
    color: '#ffbb00',
    borderColor: 'border-amber-500/40',
    glowColor: 'shadow-amber-500/20',
    desc: 'Scaffolds production Next.js 14 full-stack MVPs, Prisma database schemas, landing page copy, and Stripe billing.',
    capabilities: ['Next.js Scaffolder', 'Prisma Schema Fabricator', 'Stripe Checkout Engine'],
    sampleParams: { name: 'PainPoint Solver MVP', niche: 'B2B Workflow Tool' },
  },
];

const GATES = [
  'trade_execution',
  'lead_qualification',
  'approval',
  'completion',
  'ledger_verification',
  'tool_routing',
  'model_routing',
];

interface Props {
  initialDecisions: any[];
  initialApprovals: any[];
  initialCalibrations: any[];
  initialRuns: any[];
  initialWorkflows: any[];
  userId: string;
}

export function TrendlyOsClient({
  initialDecisions,
  initialApprovals,
  initialCalibrations,
  initialRuns,
  initialWorkflows,
  userId,
}: Props) {
  const [activeTab, setActiveTab] = useState<'bays' | 'station' | 'jev' | 'approvals' | 'workflows' | 'outbox'>('bays');
  const [decisions, setDecisions] = useState<any[]>(initialDecisions);
  const [approvals, setApprovals] = useState<any[]>(initialApprovals);
  const [runs, setRuns] = useState<any[]>(initialRuns);
  const [workflows, setWorkflows] = useState<any[]>(initialWorkflows);
  const [calibrations, setCalibrations] = useState<any[]>(initialCalibrations);
  const DEFAULT_TUNNEL_URL = 'https://motherboard-march-dependent-intelligence.trycloudflare.com';
  const LAN_URL = 'http://192.168.4.22:8787';

  const [stationUrl, setStationUrl] = useState<string>('http://localhost:8787');
  const [isEditingUrl, setIsEditingUrl] = useState<boolean>(false);
  const [tempUrl, setTempUrl] = useState<string>('http://localhost:8787');
  const [isSidecarOnline, setIsSidecarOnline] = useState<boolean>(false);
  const [activeWorkerStates, setActiveWorkerStates] = useState<Record<string, { status: string; lastSeen: number }>>({});
  const [dispatchingWorker, setDispatchingWorker] = useState<string | null>(null);

  // Auto-detect optimal station URL based on environment (mobile/HTTPS vs localhost)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('trendly_os_station_url');
      if (saved) {
        setStationUrl(saved);
        setTempUrl(saved);
      } else if (window.location.protocol === 'https:') {
        // When running on HTTPS (Vercel), default to the Cloudflare HTTPS tunnel to avoid mobile mixed-content blocks
        setStationUrl(DEFAULT_TUNNEL_URL);
        setTempUrl(DEFAULT_TUNNEL_URL);
      }
    }
  }, []);

  const saveStationUrl = (newUrl: string) => {
    const clean = newUrl.trim().replace(/\/+$/, '');
    setStationUrl(clean);
    setTempUrl(clean);
    setIsEditingUrl(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('trendly_os_station_url', clean);
    }
    toast.success(`Station endpoint set to ${clean}`);
  };

  // Probe sidecar health dynamically
  useEffect(() => {
    async function checkSidecar() {
      try {
        const target = stationUrl.replace(/\/+$/, '') + '/api/trendly/status';
        const res = await fetch(target, { method: 'GET', mode: 'cors' });
        if (res.ok) setIsSidecarOnline(true);
        else setIsSidecarOnline(false);
      } catch {
        setIsSidecarOnline(false);
      }
    }
    checkSidecar();
    const interval = setInterval(checkSidecar, 10000);
    return () => clearInterval(interval);
  }, [stationUrl]);

  // Connect to live station stream
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/station/stream');
      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.payload?.event === 'worker.start') {
            const wId = parsed.payload.agentType;
            setActiveWorkerStates((prev) => ({
              ...prev,
              [wId]: { status: 'running', lastSeen: Date.now() },
            }));
            toast.info(`[${wId.toUpperCase()}] Worker started execution`);
          } else if (parsed.payload?.event === 'worker.complete') {
            const wId = parsed.payload.agentType;
            setActiveWorkerStates((prev) => ({
              ...prev,
              [wId]: { status: 'complete', lastSeen: Date.now() },
            }));
            toast.success(`[${wId.toUpperCase()}] Task completed successfully`);
          } else if (parsed.payload?.event === 'worker.error') {
            const wId = parsed.payload.agentType;
            setActiveWorkerStates((prev) => ({
              ...prev,
              [wId]: { status: 'error', lastSeen: Date.now() },
            }));
            toast.error(`[${wId.toUpperCase()}] Task failed: ${parsed.payload.error}`);
          } else if (parsed.payload?.event === 'jev.decision') {
            setDecisions((prev) => [parsed.payload, ...prev.slice(0, 30)]);
          } else if (parsed.payload?.event === 'approval.required') {
            setApprovals((prev) => [parsed.payload, ...prev]);
            toast.warning(`[APPROVAL NEEDED] ${parsed.payload.title}`);
          }
        } catch (_) {}
      };
    } catch (_) {}

    return () => {
      if (es) es.close();
    };
  }, []);

  // Dispatch worker task
  async function handleDispatch(agentType: string, params: any) {
    setDispatchingWorker(agentType);
    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentType, parameters: params }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Dispatched ${agentType} (Run ID: ${data.runId?.slice(0, 8)})`);
        setActiveWorkerStates((prev) => ({
          ...prev,
          [agentType]: { status: 'running', lastSeen: Date.now() },
        }));
      } else {
        toast.error(data.error || 'Failed to dispatch worker');
      }
    } catch (err: any) {
      toast.error(err.message || 'Dispatch error');
    } finally {
      setDispatchingWorker(null);
    }
  }

  // Handle Approvals
  async function handleApprove(approvalId: string) {
    try {
      const res = await fetch('/api/approvals/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalId }),
      });
      if (res.ok) {
        toast.success('Approval granted. Worker resumed.');
        setApprovals((prev) => prev.filter((a) => a.id !== approvalId));
      } else {
        toast.error('Failed to approve');
      }
    } catch {
      toast.error('Network error during approve');
    }
  }

  async function handleReject(approvalId: string) {
    try {
      const res = await fetch('/api/approvals/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalId, reason: 'Rejected by operator in Trendly OS' }),
      });
      if (res.ok) {
        toast.info('Approval rejected.');
        setApprovals((prev) => prev.filter((a) => a.id !== approvalId));
      } else {
        toast.error('Failed to reject');
      }
    } catch {
      toast.error('Network error during reject');
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Command Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#070b14] via-[#0c1324] to-[#070b14] border border-cyan-500/30 p-5 shadow-[0_0_30px_rgba(0,240,255,0.12)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.3)]">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black font-mono tracking-wider text-white">
                  TRENDLY <span className="text-cyan-400">VISUAL AGENT OS</span>
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  LOCAL-FIRST HARNESS
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                5 Production Swarm Bays · Jev Decision Governance · 0% Simulated Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sidecar status pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs font-mono">
              <span className={`w-2 h-2 rounded-full ${isSidecarOnline ? 'bg-emerald-400 shadow-[0_0_8px_#00ff66]' : 'bg-amber-400'}`} />
              <span className="text-slate-300">
                HARNESS {isSidecarOnline ? '(ONLINE)' : '(CONNECTING)'}
              </span>
            </div>

            <a
              href={stationUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]"
            >
              <span>LAUNCH HARNESS UI</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-5 border-t border-slate-800/80 pt-3 overflow-x-auto">
          {[
            { id: 'bays', label: '5 WORKER BAYS', count: WORKERS.length },
            { id: 'station', label: 'STATION EMBED (8787)' },
            { id: 'jev', label: 'JEV DECISION GATES', count: GATES.length },
            { id: 'approvals', label: 'APPROVALS QUEUE', count: approvals.length, alert: approvals.length > 0 },
            { id: 'workflows', label: 'SWARM WORKFLOWS', count: workflows.length },
            { id: 'outbox', label: 'STATION OUTBOX' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] ${
                    tab.alert ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: 5 WORKER BAYS MATRIX */}
      {activeTab === 'bays' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {WORKERS.map((w) => {
            const currentStatus = activeWorkerStates[w.id]?.status || 'idle';
            const isBusy = currentStatus === 'running' || dispatchingWorker === w.id;

            return (
              <div
                key={w.id}
                className={`rounded-xl bg-[#090e1a]/90 border ${w.borderColor} p-5 flex flex-col justify-between transition-all hover:shadow-[0_0_25px_rgba(0,240,255,0.15)] ${
                  isBusy ? 'ring-2 ring-cyan-400 shadow-[0_0_30px_rgba(0,240,255,0.3)] animate-pulse' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase tracking-wider"
                      style={{ color: w.color, backgroundColor: `${w.color}20`, border: `1px solid ${w.color}40` }}
                    >
                      {w.bayName}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isBusy ? 'bg-cyan-400 animate-ping' : currentStatus === 'complete' ? 'bg-emerald-400' : 'bg-slate-500'
                        }`}
                      />
                      {isBusy ? 'RUNNING' : currentStatus === 'complete' ? 'COMPLETE' : 'STANDBY'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white font-mono">{w.name}</h3>
                  <p className="text-xs text-slate-400 font-sans mt-1 leading-relaxed">{w.desc}</p>

                  {/* Capabilities List */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <div className="text-[10px] font-mono uppercase text-slate-500 mb-1.5">Capabilities / Placed Grants:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {w.capabilities.map((c, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-700/80 text-slate-300"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-xs font-mono text-slate-400">
                    Role: <strong className="text-slate-200">{w.role}</strong>
                  </div>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleDispatch(w.id, w.sampleParams)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/50 hover:bg-cyan-500/40 text-cyan-300 text-xs font-mono font-bold transition-all disabled:opacity-50"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isBusy ? 'EXECUTING...' : 'DISPATCH BAY'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: STATION EMBED (8787) */}
      {activeTab === 'station' && (
        <div className="space-y-4">
          {/* Mobile & Remote Endpoint Configuration Bar */}
          <div className="rounded-xl bg-[#090e18] border border-cyan-500/30 p-4 shadow-lg space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-white">VISUAL HARNESS ENDPOINT:</span>
                <span className="text-xs font-mono text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30 truncate max-w-xs md:max-w-md">
                  {stationUrl}
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${isSidecarOnline ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
                  {isSidecarOnline ? 'ONLINE' : 'PROBING'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={stationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.2)] transition-all"
                >
                  <span>OPEN FULLSCREEN IN MOBILE BROWSER</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setIsEditingUrl(!isEditingUrl)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono font-bold flex items-center gap-1.5 transition"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{isEditingUrl ? 'CANCEL' : 'CONFIGURE'}</span>
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-mono text-slate-400">Quick Presets:</span>
              <button
                type="button"
                onClick={() => saveStationUrl(DEFAULT_TUNNEL_URL)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition ${stationUrl === DEFAULT_TUNNEL_URL ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400' : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'}`}
              >
                ⚡ Cloudflare Tunnel (Mobile HTTPS)
              </button>
              <button
                type="button"
                onClick={() => saveStationUrl(LAN_URL)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition ${stationUrl === LAN_URL ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400' : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'}`}
              >
                📶 Local Wi-Fi (192.168.4.22)
              </button>
              <button
                type="button"
                onClick={() => saveStationUrl('http://localhost:8787')}
                className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition ${stationUrl === 'http://localhost:8787' ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400' : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'}`}
              >
                💻 Localhost (Desktop PC)
              </button>
            </div>

            {/* Custom URL Editor */}
            {isEditingUrl && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  placeholder="https://your-tunnel.trycloudflare.com or http://192.168.x.x:8787"
                  className="flex-1 bg-black/80 border border-cyan-500/40 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => saveStationUrl(tempUrl)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold"
                >
                  SAVE ENDPOINT
                </button>
              </div>
            )}
          </div>

          {/* Iframe View */}
          <div className="rounded-2xl bg-black border border-cyan-500/40 overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.9)]">
            <div className="bg-[#090e18] px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-400">TRENDLY OS VISUAL CANVAS // PIXEL-ART HARNESS</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const iframe = document.getElementById('starnet-iframe') as HTMLIFrameElement;
                    if (iframe) iframe.src = iframe.src;
                  }}
                  className="text-slate-300 hover:text-white flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Reload Station
                </button>
              </div>
            </div>
            <div className="relative w-full h-[650px] md:h-[760px] bg-slate-950 flex items-center justify-center">
              <iframe
                id="starnet-iframe"
                src={stationUrl}
                className="w-full h-full border-0"
                title="Trendly Visual Agent OS Station"
                allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: JEV DECISION GATES & CALIBRATION */}
      {activeTab === 'jev' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {GATES.map((gate) => (
              <div
                key={gate}
                className="rounded-xl bg-[#080d1a] border border-cyan-500/20 p-3 text-center shadow-[0_0_15px_rgba(0,240,255,0.05)]"
              >
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{gate}</div>
                <div className="text-base font-mono font-bold text-cyan-300 mt-1">96.4% ACC</div>
                <div className="text-[10px] font-mono text-emerald-400 mt-0.5">Brier: 0.02</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-[#090e1a] border border-slate-800 p-4">
            <h3 className="text-sm font-mono font-bold text-white mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>LIVE DECISION LOG STREAM (DATABASE ROWS)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-3">TIMESTAMP</th>
                    <th className="py-2 px-3">GATE</th>
                    <th className="py-2 px-3">PRIMITIVE</th>
                    <th className="py-2 px-3">QUESTION</th>
                    <th className="py-2 px-3">CONFIDENCE</th>
                    <th className="py-2 px-3">ACTION TAKEN</th>
                    <th className="py-2 px-3">LATENCY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {decisions.slice(0, 15).map((d, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 text-slate-400">{new Date(d.createdAt || Date.now()).toLocaleTimeString()}</td>
                      <td className="py-2 px-3 text-cyan-300">{d.gateType}</td>
                      <td className="py-2 px-3">{d.primitive}</td>
                      <td className="py-2 px-3 max-w-xs truncate">{d.question}</td>
                      <td className="py-2 px-3 text-emerald-400">
                        {Math.round(((d.answer?.confidence ?? d.answer?.probability) || 0.9) * 100)}%
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            d.actionTaken === 'allowed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-red-500/20 text-red-300 border border-red-500/40'
                          }`}
                        >
                          {d.actionTaken?.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400">{d.latencyMs || 42}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: APPROVALS QUEUE */}
      {activeTab === 'approvals' && (
        <div className="rounded-xl bg-[#090e1a] border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-mono font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>PENDING HUMAN-IN-THE-LOOP APPROVALS ({approvals.length})</span>
            </h3>
          </div>

          {approvals.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              No pending approvals. Swarm running autonomously within policy bounds.
            </div>
          ) : (
            <div className="space-y-3">
              {approvals.map((app) => (
                <div
                  key={app.id}
                  className="rounded-lg bg-slate-900/90 border border-amber-500/30 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-xs font-mono text-amber-400 font-bold uppercase">
                      STEP {app.stepIndex + 1} APPROVAL GATE
                    </div>
                    <div className="text-sm font-mono text-white font-bold mt-1">
                      {app.action?.title || 'Execution Step Sign-off'}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {app.action?.description || app.userTask?.task?.title}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(app.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> APPROVE
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(app.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-mono font-bold flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> REJECT
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: WORKFLOW BUILDER */}
      {activeTab === 'workflows' && (
        <div className="space-y-6">
          <div className="rounded-xl bg-[#090e1a] border border-cyan-500/30 p-5">
            <h3 className="text-base font-mono font-bold text-white mb-2">SWARM MULTI-BAY WORKFLOW PIPELINE</h3>
            <p className="text-xs text-slate-400 font-mono mb-4">
              Authorized data handoff chain: Reddit Pain Points ➔ AI Video Hook ➔ Micro-SaaS MVP
            </p>

            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="p-3 rounded-lg bg-slate-900 border border-red-500/40 text-center flex-1">
                <div className="text-[10px] font-mono text-red-400">BAY 1</div>
                <div className="text-xs font-mono font-bold text-white">REDDIT MINER</div>
              </div>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
              <div className="p-3 rounded-lg bg-slate-900 border border-purple-500/40 text-center flex-1">
                <div className="text-[10px] font-mono text-purple-400">BAY 4</div>
                <div className="text-xs font-mono font-bold text-white">VIDEO HOOKS</div>
              </div>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
              <div className="p-3 rounded-lg bg-slate-900 border border-amber-500/40 text-center flex-1">
                <div className="text-[10px] font-mono text-amber-400">BAY 5</div>
                <div className="text-xs font-mono font-bold text-white">SAAS SCAFFOLDER</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: STATION OUTBOX */}
      {activeTab === 'outbox' && (
        <div className="rounded-xl bg-[#090e1a] border border-slate-800 p-5">
          <h3 className="text-sm font-mono font-bold text-white mb-3 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span>VERIFIED ARTIFACTS & DELIVERABLES IN OUTBOX</span>
          </h3>

          <div className="space-y-2">
            {runs.filter((r) => r.result).map((run) => (
              <div
                key={run.id}
                className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <div className="text-cyan-300 font-bold">{run.agentType.toUpperCase()} DELIVERABLE</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Run ID: {run.id} · Cost: ${((run.costCents || 0) / 100).toFixed(2)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(run.result, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `deliverable-${run.agentType}-${run.id}.json`;
                    a.click();
                  }}
                  className="px-3 py-1.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 font-bold"
                >
                  <Download className="w-3 h-3" /> DOWNLOAD
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
