'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, CheckCircle2, Cpu, Loader2, Play, Sparkles, Terminal, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { EarnMethod, EarnScene } from '@/lib/earn/methods';

interface SceneProps {
  method: EarnMethod;
  scene: EarnScene;
  onTriggerSwarm?: () => void;
}

const AGENTS = [
  { name: 'Research Specialist', role: 'Telemetry & Signal Mining', status: 'completed', progress: 100 },
  { name: 'Scriptwriter & Copy', role: 'High-Converting Narrative', status: 'completed', progress: 100 },
  { name: 'Remotion Video Generator', role: '9:16 Visual Canvas', status: 'running', progress: 78 },
  { name: 'Voiceover Synthesizer', role: 'Neural Spoken Audio', status: 'running', progress: 64 },
  { name: 'Sales Scout Lead Hunter', role: 'Concurrent Buyer Discovery', status: 'running', progress: 85 },
  { name: 'Quality Assurance & Risk', role: 'Proof & Hallucination Guard', status: 'queued', progress: 0 },
];

export function SceneSwarmExecution({ method, scene, onTriggerSwarm }: SceneProps) {
  return (
    <div className="relative w-full h-full min-h-screen flex items-center justify-center px-4 md:px-8 py-16 overflow-hidden bg-[#06060E]">
      <div className="max-w-5xl w-full mx-auto relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs font-mono mb-4"
        >
          <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
          <span className="text-[#00F0FF] font-bold">METHOD {String(method.number).padStart(2, '0')}</span>
          <span className="text-white/40">/</span>
          <span className="text-[#8E9BB4]">SCENE 3: PARALLEL SWARM EXECUTION</span>
        </motion.div>

        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
          {scene.headline}
        </h2>

        <p className="text-base md:text-lg text-[#00F0FF] mb-2 max-w-2xl font-mono">
          {scene.subheadline}
        </p>

        <p className="text-xs md:text-sm text-[#8E9BB4] max-w-2xl mb-8">
          {scene.body}
        </p>

        {/* Live Swarm Dispatch Monitor */}
        <div className="w-full max-w-3xl rounded-2xl bg-black/60 border border-white/10 p-5 mb-8 backdrop-blur-xl text-left shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#00F0FF]" />
              <span className="text-xs font-mono text-white font-bold uppercase tracking-wider">
                SWARM TELEMETRY CLUSTER · 6 ACTIVE CORES
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded border border-[#00FF66]/20">
              SYNCHRONIZED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AGENTS.map((agent) => (
              <div
                key={agent.name}
                className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bot className="w-3.5 h-3.5 text-[#00F0FF]" />
                    <span className="text-xs font-bold text-white font-mono">{agent.name}</span>
                  </div>
                  {agent.status === 'completed' && (
                    <span className="text-[10px] font-mono text-[#00FF66] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> DONE
                    </span>
                  )}
                  {agent.status === 'running' && (
                    <span className="text-[10px] font-mono text-[#00F0FF] flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> {agent.progress}%
                    </span>
                  )}
                  {agent.status === 'queued' && (
                    <span className="text-[10px] font-mono text-[#8E9BB4]">WAITING</span>
                  )}
                </div>
                <div className="text-[11px] text-[#8E9BB4] mb-2">{agent.role}</div>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-[#00F0FF] h-full transition-all duration-500"
                    style={{ width: `${agent.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action CTA */}
        <div className="flex items-center gap-4">
          <Button
            size="lg"
            onClick={onTriggerSwarm}
            className="cyan-gradient text-black font-extrabold uppercase px-8 h-12 font-mono shadow-[0_0_25px_rgba(0,240,255,0.4)]"
          >
            <Zap className="w-4 h-4 mr-2 fill-current" /> Deploy Swarm For This Method
          </Button>
          <Link href="/trends">
            <Button
              size="lg"
              variant="outline"
              className="border-white/10 text-white font-mono h-12 px-6 hover:bg-white/[0.04]"
            >
              Select Live Trend
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}