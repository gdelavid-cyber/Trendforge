'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Clock, TrendingUp, AlertCircle, ArrowRight, Zap, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { DIFFICULTY_CONFIG, RISK_CONFIG } from '@/lib/constants';

interface TrendingTask {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  riskLevel: string;
  startupCost: number;
  estimatedEarningsLow: number;
  estimatedEarningsHigh: number;
  timeToFirstDollar: string | null;
  category: string;
  trendScore: number;
  expiresAt: string | null;
}

export function TrendingFeed() {
  const [tasks, setTasks] = useState<TrendingTask[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchTrendingBackup = async () => {
    try {
      const res = await fetch('/api/tasks/trending');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Backup polling failed:', err);
    }
  };

  useEffect(() => {
    // Initiate Server-Sent Events (SSE) stream
    const eventSource = new EventSource('/api/tasks/trending');

    eventSource.addEventListener('initial', (e: any) => {
      try {
        const initialTasks = JSON.parse(e.data);
        setTasks(initialTasks);
        setError(null);
      } catch (err) {
        console.error('Failed to parse initial SSE data:', err);
      }
    });

    eventSource.addEventListener('message', (e: any) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload?.type === 'NEW_TRENDING' && payload?.task) {
          const newTask = payload.task;
          setTasks((prev) => {
            const filtered = prev.filter((t) => t.id !== newTask.id);
            const updated = [newTask, ...filtered].sort((a, b) => b.trendScore - a.trendScore).slice(0, 10);
            return updated;
          });
        }
      } catch (err) {
        console.error('Failed to parse SSE update message:', err);
      }
    });

    eventSource.onerror = (err) => {
      console.warn('SSE stream disconnected, falling back to 30s polling.', err);
      setError('Live stream disconnected. Polling updates every 30s.');
      eventSource.close();
      
      fetchTrendingBackup();
      const interval = setInterval(fetchTrendingBackup, 30000);
      return () => clearInterval(interval);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base text-white uppercase tracking-wider flex items-center gap-2">
          <span className="live-pulse-dot">
            <span className="ping bg-[#00F0FF]" />
            <span className="core bg-[#00F0FF]" />
          </span>
          Live Pulse Opportunity Stream
        </h2>
        {error && (
          <span className="text-[10px] text-[#8892B0] flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-[#FF6B9D]" /> {error}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <Link href={`/tasks/${task.id}`}>
                <div className="glass-card p-6 flex flex-col justify-between h-full group">
                  <div>
                    {/* Live Badge and Countdown */}
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] text-[#FFD700] font-bold font-mono bg-[#FFD700]/10 border border-[#FFD700]/20 px-2.5 py-0.5 rounded-full">
                        Score: {task.trendScore.toFixed(1)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FF6B9D] text-black font-mono shadow-[0_0_10px_rgba(255,107,157,0.5)]">
                          LIVE
                        </span>
                        <ExpirationCountdown expiresAt={task.expiresAt} />
                      </div>
                    </div>

                    <h3 className="text-base text-white group-hover:text-[#00F0FF] transition-colors mb-2 line-clamp-1">
                      {task.title}
                    </h3>

                    <p className="text-xs text-[#8892B0] line-clamp-2 mb-4 font-sans">
                      {task.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${DIFFICULTY_CONFIG[task.difficulty as keyof typeof DIFFICULTY_CONFIG]?.bg} ${DIFFICULTY_CONFIG[task.difficulty as keyof typeof DIFFICULTY_CONFIG]?.text}`}>
                        {DIFFICULTY_CONFIG[task.difficulty as keyof typeof DIFFICULTY_CONFIG]?.label}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${RISK_CONFIG[task.riskLevel as keyof typeof RISK_CONFIG]?.bg} ${RISK_CONFIG[task.riskLevel as keyof typeof RISK_CONFIG]?.text}`}>
                        <Shield className="w-3 h-3 mr-1" />{RISK_CONFIG[task.riskLevel as keyof typeof RISK_CONFIG]?.label}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono text-[#8892B0] border-t border-white/[0.06] pt-3">
                      <div className="flex items-center gap-1">
                        <span className="text-[#FFD700] font-bold">$</span>{task.startupCost} setup
                      </div>
                      <div className="flex items-center gap-1 text-green-400 font-bold">
                        <DollarSign className="w-3.5 h-3.5 fill-current text-green-400" />
                        +${task.estimatedEarningsLow}-${task.estimatedEarningsHigh}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        {task.timeToFirstDollar ?? '1-7d'}
                      </div>
                    </div>

                    <div className="flex items-center justify-end mt-2 pt-2 border-t border-white/[0.06]">
                      <span className="text-[#00F0FF] text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Start Move <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {tasks.length === 0 && (
        <div className="glass-card p-12 text-center">
          <TrendingUp className="w-8 h-8 text-[#8892B0] mx-auto mb-3" />
          <p className="text-[#8892B0] text-sm">No moves are currently trending. Run the pipeline to calculate new pulses.</p>
        </div>
      )}
    </div>
  );
}

function ExpirationCountdown({ expiresAt }: { expiresAt: string | null }) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft('No expiry');
      return;
    }

    const target = new Date(expiresAt).getTime();
    
    const updateTimer = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt) return null;

  return (
    <span className="text-[10px] text-[#8892B0] font-mono">
      ⏱️ {timeLeft}
    </span>
  );
}
