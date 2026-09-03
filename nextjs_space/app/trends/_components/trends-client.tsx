'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Flame,
  Clock,
  Zap,
  ArrowRight,
  Play,
  Layers,
  Newspaper,
  DollarSign,
  ExternalLink,
  Loader2,
  Sparkles,
  Info,
  CheckCircle2,
  Bot,
  Radio,
} from 'lucide-react';
import { TrendCategoryBadge } from '@/components/trend-badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { MarketDebriefModal } from '@/components/debrief/MarketDebriefModal';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { SectionHelpBanner } from '@/components/guide/section-help-banner';
import { BrainstormModal } from '@/components/earn/brainstorm-modal';

interface TrendItem {
  id: string;
  name: string;
  sourcePlatforms: string[];
  mentionVelocity: number;
  sentimentScore: number;
  confidence: number;
  category: string;
  status: string;
  isMonetizable: boolean;
  monetizationScore: number;
  monetizationRationale?: string | null;
  newsSummary?: string | null;
  whyItMatters?: string | null;
  newsSourceUrl?: string | null;
  hoursSinceDetection: number;
  detectedAt?: string | null;
  taskCount: number;
  tasks: any[];
}

export function TrendsClient({ trends: initialTrends }: { trends: TrendItem[] }) {
  const router = useRouter();
  const [trends, setTrends] = useState<TrendItem[]>(initialTrends);
  const [activeTab, setActiveTab] = useState<'ALL' | 'MONETIZABLE' | 'NEWS'>('ALL');
  const [runningScraper, setRunningScraper] = useState(false);
  const [isDebriefOpen, setIsDebriefOpen] = useState(false);
  const [isBrainstormOpen, setIsBrainstormOpen] = useState(false);
  const [selectedTrend, setSelectedTrend] = useState<{ id: string; name: string; taskId?: string } | null>(null);

  const handleDeploySwarmFromTrend = (trend: TrendItem) => {
    const firstTaskId = trend.tasks?.[0]?.id;
    setSelectedTrend({
      id: trend.id,
      name: trend.name,
      taskId: firstTaskId,
    });
    setIsBrainstormOpen(true);
  };

  const monetizableCount = trends.filter((t) => t.isMonetizable).length;
  const newsCount = trends.filter((t) => !t.isMonetizable).length;

  const filteredTrends = trends.filter((t) => {
    if (activeTab === 'MONETIZABLE') return t.isMonetizable;
    if (activeTab === 'NEWS') return !t.isMonetizable;
    return true;
  });

  const handleRunAutonomousClassifier = async () => {
    setRunningScraper(true);
    toast.info('Autonomous AI is scraping live sources (HackerNews, Reddit, Twitter) & classifying monetization viability...');

    try {
      const res = await fetch('/api/pipeline/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.summary || `Classifier complete! Added ${data.monetizableMovesAdded} tasks and ${data.marketNewsAdded} news briefings.`);
        router.refresh();
      } else {
        toast.error(data.error || 'Pipeline run failed');
      }
    } catch (err: any) {
      toast.error('Failed to trigger autonomous scraper');
    } finally {
      setRunningScraper(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-10">
      {/* Header & Autonomous Trigger */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] text-xs font-mono mb-2">
            <Flame className="w-3.5 h-3.5 animate-pulse" />
            <span>AUTONOMOUS AI RADAR & MONETIZATION CLASSIFIER</span>
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-white flex items-center gap-2">
            Trends <span className="cyan-gold-gradient-text">Radar</span>
          </h1>
          <p className="text-sm text-[#8892B0] font-sans mt-1 max-w-2xl">
            Live internet telemetry filtered by our AI classifier: monetizable trends generate executable Power Moves, while macro signals become daily news intelligence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => setIsDebriefOpen(true)}
            variant="outline"
            className="border-[#FFD700]/40 text-[#FFD700] hover:bg-[#FFD700]/10 bg-[#FFD700]/5 font-mono uppercase text-xs h-11 px-4 font-bold shadow-[0_0_15px_rgba(255,215,0,0.15)]"
          >
            <Bot className="w-4 h-4 mr-2 text-[#FFD700]" /> 🎙️ Spoken Debrief
          </Button>

          <Button
            onClick={handleRunAutonomousClassifier}
            disabled={runningScraper}
            className="cyan-gradient text-black font-extrabold uppercase text-xs h-11 px-5 holographic-btn font-mono shrink-0 shadow-[0_0_20px_rgba(0,240,255,0.3)]"
          >
            {runningScraper ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scraping & Classifying...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Run Autonomous Scraper & Classifier
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Section Guide & Info */}
      <SectionHelpBanner />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-4 mb-6 overflow-x-auto scrollbar-none font-mono">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${
            activeTab === 'ALL'
              ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
              : 'text-[#8E9BB4] hover:text-white bg-white/[0.02] border border-transparent'
          }`}
        >
          <span>🌐 All Intelligence</span>
          <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-black/50 border border-white/10">{trends.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('MONETIZABLE')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${
            activeTab === 'MONETIZABLE'
              ? 'bg-green-500/15 text-green-400 border border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.15)]'
              : 'text-[#8E9BB4] hover:text-white bg-white/[0.02] border border-transparent'
          }`}
        >
          <span>💰 Monetizable Power Moves</span>
          <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-black/50 border border-white/10">{monetizableCount}</span>
        </button>

        <button
          onClick={() => setActiveTab('NEWS')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${
            activeTab === 'NEWS'
              ? 'bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/40 shadow-[0_0_15px_rgba(255,215,0,0.15)]'
              : 'text-[#8E9BB4] hover:text-white bg-white/[0.02] border border-transparent'
          }`}
        >
          <span>📰 Daily News & Market Radar</span>
          <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-black/50 border border-white/10">{newsCount}</span>
        </button>
      </div>

      {/* Trends & News Feed */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredTrends.map((trend: TrendItem, i: number) => {
            const isMonetizable = trend.isMonetizable;

            return (
              <motion.div
                key={trend?.id ?? i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ delay: i * 0.03 }}
                className={`glass-card p-6 border transition-all group ${
                  isMonetizable
                    ? 'border-green-500/20 hover:border-green-500/40'
                    : 'border-[#FFD700]/20 hover:border-[#FFD700]/40 bg-gradient-to-r from-black/60 via-[#11111E]/40 to-black/60'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="live-pulse-dot">
                        <span className={`ping ${isMonetizable ? 'bg-green-400' : 'bg-[#FFD700]'}`} />
                        <span className={`core ${isMonetizable ? 'bg-green-400' : 'bg-[#FFD700]'}`} />
                      </span>
                      <h3 className="font-display font-bold text-lg text-white group-hover:text-[#00F0FF] transition-colors">
                        {trend?.name ?? 'Emerging Signal'}
                      </h3>

                      {/* Classification Badge */}
                      {isMonetizable ? (
                        <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-300 flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-green-400" />
                          Monetizable Move · {Math.round((trend.monetizationScore || 0.85) * 100)}%
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border border-[#FFD700]/30 bg-[#FFD700]/10 text-[#FFD700] flex items-center gap-1">
                          <Newspaper className="w-3 h-3" />
                          Daily News & Market Intel
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <TrendCategoryBadge category={trend?.category ?? 'AI_TOOLS'} />
                      {(trend?.sourcePlatforms ?? []).map((p: string) => (
                        <span key={p} className="text-[10px] font-mono bg-black/50 border border-white/5 px-2 py-0.5 rounded text-[#8892B0]">
                          {p}
                        </span>
                      ))}
                      <span className="text-[10px] font-mono text-[#8892B0] flex items-center gap-1 ml-2">
                        <Clock className="w-3 h-3 text-[#00F0FF]" /> Detected {Math.round(trend?.hoursSinceDetection ?? 0)}h ago
                      </span>
                    </div>
                  </div>

                  {/* Telemetry Metrics */}
                  <div className="flex items-center gap-6 flex-shrink-0 font-mono">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm">
                        <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400 font-bold">{Math.round(trend?.mentionVelocity ?? 12)}</span>
                      </div>
                      <div className="text-[9px] text-[#8892B0] uppercase">mentions/hr</div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm">
                        <span className="text-[#FFD700] font-bold">{((trend?.confidence ?? 0.9) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="text-[9px] text-[#8892B0] uppercase">confidence</div>
                    </div>

                    <div className="w-24 hidden sm:block">
                      <div className="text-[9px] text-[#8892B0] uppercase mb-1">Sentiment</div>
                      <Progress value={(trend?.sentimentScore ?? 0.85) * 100} className="h-1.5 bg-black/60" />
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleDeploySwarmFromTrend(trend)}
                      className="cyan-gradient text-black font-extrabold uppercase text-[10px] h-7 px-2.5 font-mono shadow-[0_0_12px_rgba(0,240,255,0.3)] shrink-0"
                    >
                      <Zap className="w-3 h-3 mr-1 fill-current" /> Deploy AI Swarm
                    </Button>
                  </div>
                </div>

                {/* Content Section: EITHER Actionable Tasks OR Daily News Briefing */}
                {isMonetizable ? (
                  /* Monetizable: Show associated tasks */
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-green-400 flex items-center gap-1">
                        <Layers className="w-3 h-3" /> Actionable Power Moves ({trend?.taskCount ?? trend?.tasks?.length ?? 0}):
                      </span>
                      <Link
                        href={`/tasks?category=${trend?.category || 'AI_TOOLS'}`}
                        className="text-[11px] font-mono text-[#8892B0] hover:text-[#00F0FF] flex items-center gap-1"
                      >
                        Explore All Moves <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                    {trend?.tasks && trend.tasks.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                        {trend.tasks.map((task: any) => (
                          <Link key={task.id} href={`/tasks/${task.id}`} className="block">
                            <div className="bg-black/50 border border-white/[0.08] hover:border-green-400/40 rounded-lg p-3.5 transition-all flex flex-col justify-between h-full shadow-inner">
                              <div>
                                <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#00F0FF]">
                                  {task.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-[#8892B0]">
                                  <span className="text-green-400 font-bold">
                                    +${task.estimatedEarningsLow}-${task.estimatedEarningsHigh} est.
                                  </span>
                                  <span>·</span>
                                  <span>${task.startupCost} setup</span>
                                  <span>·</span>
                                  <span>{task.timeToFirstDollar || '1-3d'}</span>
                                </div>
                              </div>

                              <div className="mt-3 pt-2 border-t border-white/[0.04] flex items-center justify-end">
                                <span className="text-[10px] font-mono text-green-400 flex items-center gap-1 font-bold">
                                  Run Move <Play className="w-2.5 h-2.5 fill-green-400" />
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs font-mono text-[#8892B0] py-2 flex items-center gap-2">
                        <span>Autonomous task generated and available in Weekly Tasks catalog.</span>
                        <Link href="/tasks" className="text-[#00F0FF] underline">
                          Open Tasks &rarr;
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Not directly monetizable: Show Daily News & Market Intelligence Briefing */
                  <div className="mt-4 space-y-3 bg-black/40 border border-white/5 rounded-xl p-4 text-left">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#FFD700] uppercase flex items-center gap-1.5 mb-1">
                        <Newspaper className="w-3.5 h-3.5" /> Executive News Briefing:
                      </span>
                      <p className="text-xs text-[#E0E7FF] font-sans leading-relaxed">
                        {trend.newsSummary || `Market intelligence signal detected from ${trend.sourcePlatforms?.join(', ')} with surging velocity.`}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#00F0FF] uppercase flex items-center gap-1.5 mb-1">
                        <Info className="w-3.5 h-3.5" /> Why It Matters Today:
                      </span>
                      <p className="text-xs text-[#CCD6F6] font-sans leading-relaxed">
                        {trend.whyItMatters || 'Indicates macro technology shifts and ecosystem momentum. Staying informed on these trends provides strategic foresight before monetization angles open up.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 flex-wrap gap-2">
                      <span className="text-[10px] font-mono text-[#8E9BB4]">
                        Status: <strong className="text-[#FFD700]">Tracked in Daily News Feed</strong> (Non-monetizable macro trend)
                      </span>

                      {trend.newsSourceUrl && (
                        <a
                          href={trend.newsSourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-mono text-[#00F0FF] hover:underline inline-flex items-center gap-1"
                        >
                          View Original Discussion <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredTrends.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Flame className="w-8 h-8 text-[#FFD700] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white uppercase tracking-wider">No Signals in This Category</h3>
          <p className="text-xs text-[#8892B0] mt-1 font-sans">
            Click "Run Autonomous Scraper & Classifier" above to scrape live internet trends and populate the radar.
          </p>
        </div>
      )}

      {/* 3D Holographic Spoken Market Debrief Broadcast Modal */}
      <MarketDebriefModal
        isOpen={isDebriefOpen}
        onClose={() => setIsDebriefOpen(false)}
      />

      {/* AI Brainstorm Chamber Modal */}
      <BrainstormModal
        isOpen={isBrainstormOpen}
        onClose={() => {
          setIsBrainstormOpen(false);
          setSelectedTrend(null);
        }}
        trendId={selectedTrend?.id}
        taskId={selectedTrend?.taskId}
        trendTitle={selectedTrend?.name}
      />
    </div>
  );
}
