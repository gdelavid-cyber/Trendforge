'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, Mic, Zap, MessageSquare, X, Shield, Wallet } from 'lucide-react';
import { AgentCompanionModal } from '@/components/chat/AgentCompanionModal';
import { MiniStage3D } from '@/components/avatar/stage3d/MiniStage3D';
import { playCompanionSummonSfx } from '@/lib/audio/sfx';

interface ActiveRun {
  working: boolean;
  label?: string;
  progress?: number;
  archetype?: string;
  taskTitle?: string | null;
}

export function FloatingCompanionWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [activeRun, setActiveRun] = useState<ActiveRun>({ working: false });
  const [agentData, setAgentData] = useState<any>({
    name: 'Nexus Cyber Operative',
    archetype: 'CYBER_HUMANOID',
    walletBalance: 0,
    survivalScore: 88,
  });

  // Fetch active agent info + poll live run status for the orb rig
  useEffect(() => {
    fetch('/api/web4/agents')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.agents && data.agents.length > 0) {
          setAgentData(data.agents[0]);
        }
      })
      .catch(() => {});

    const pollRun = () =>
      fetch('/api/companion/status')
        .then((res) => res.json())
        .then((data: ActiveRun) => setActiveRun(data))
        .catch(() => {});

    pollRun();
    const iv = setInterval(pollRun, 20000);
    return () => clearInterval(iv);
  }, []);

  // Keyboard shortcut: Cmd+K or Ctrl+Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsOpen((prev) => {
          if (!prev) playCompanionSummonSfx();
          return !prev;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenCompanion = () => {
    playCompanionSummonSfx();
    setIsOpen(true);
    setShowQuickMenu(false);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-3 pointer-events-auto">
        {/* Quick Menu Popup */}
        <AnimatePresence>
          {showQuickMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="bg-[#0A0A12]/95 border border-[#00F0FF]/40 backdrop-blur-xl p-4 rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.25)] w-72 space-y-3 font-mono text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />
                  <span className="font-bold text-white uppercase text-[11px] truncate max-w-[140px]">
                    {agentData.name}
                  </span>
                </div>
                <button
                  onClick={() => setShowQuickMenu(false)}
                  className="text-[#8E9BB4] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#8E9BB4]">
                <span className={`flex items-center gap-1 font-bold ${agentData.walletBalance > 0 ? 'text-green-400' : 'text-blue-300'}`}>
                  <Wallet className="w-3 h-3" /> ${Number(agentData.walletBalance ?? 0).toFixed(1)} USDC
                </span>
                <span className="text-[#00F0FF]">Score: {agentData.survivalScore || 88}/100</span>
              </div>

              {activeRun.working && (
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-400/30 text-amber-300 text-[10px] font-mono">
                  <Zap className="w-3 h-3 flex-shrink-0 animate-pulse" />
                  <span className="truncate">{activeRun.taskTitle || 'Task running'} · {Math.round((activeRun.progress ?? 0) * 100)}%</span>
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                <button
                  onClick={handleOpenCompanion}
                  className="w-full cyan-gradient text-black font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs holographic-btn uppercase"
                >
                  <Mic className="w-3.5 h-3.5 fill-black" /> Open 3D Voice Stage
                </button>
                <div className="text-[9px] text-[#8E9BB4] text-center">
                  Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-white">⌘K</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-white">Ctrl+K</kbd>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Avatar Trigger Orb */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (showQuickMenu) {
              handleOpenCompanion();
            } else {
              setShowQuickMenu(true);
            }
          }}
          className="relative group p-1 rounded-full bg-gradient-to-r from-[#00F0FF] via-[#A855F7] to-[#FFD700] shadow-[0_0_25px_rgba(0,240,255,0.4)] cursor-pointer select-none"
        >
          <div className="w-14 h-14 rounded-full bg-[#08080E] p-0.5 flex items-center justify-center overflow-hidden relative">
            {/* Live 3D companion — mirrors the user's real run state */}
            <MiniStage3D
              avatarId={(activeRun.working ? activeRun.archetype : (agentData.archetype || 'cyber_humanoid')).toLowerCase()}
              emotion={activeRun.working ? 'battle' : 'confident'}
              isWorking={activeRun.working}
              workLabel={(activeRun.taskTitle || activeRun.label || '').slice(0, 42)}
              workProgress={activeRun.progress ?? undefined}
              className="w-full h-full"
            />

            {/* Live / Running Badge */}
            <span
              className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-black flex items-center justify-center ${
                activeRun.working ? 'bg-amber-400' : 'bg-green-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full bg-white animate-ping ${activeRun.working ? 'bg-amber-200' : ''}`}
              />
            </span>
          </div>

          {/* Tooltip Tag */}
          <span className="absolute -top-7 right-0 text-[10px] font-mono font-bold uppercase bg-black/90 text-[#00F0FF] px-2 py-0.5 rounded-full border border-[#00F0FF]/40 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
            Talk to Agent 🎙️
          </span>
        </motion.button>
      </div>

      {/* Full 3D AI Companion Modal */}
      <AgentCompanionModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        agent={agentData}
      />
    </>
  );
}
