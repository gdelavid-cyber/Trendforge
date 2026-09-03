'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Cpu,
  DollarSign,
  Layers,
  Mail,
  Radar,
  ShieldCheck,
  Store,
  TrendingUp,
  Users,
  Video,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getActiveSwarmAgents, AgentMetadata } from '@/lib/earn/agents';

const ICON_MAP: Record<string, any> = {
  Radar,
  Layers,
  Users,
  Mail,
  Video,
  Store,
  DollarSign,
  ShieldCheck,
  TrendingUp,
};

export function AgentSwarmDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const agents: AgentMetadata[] = getActiveSwarmAgents();

  const workingCount = agents.filter((a) => a.status === 'working').length;
  const approvalCount = agents.filter((a) => a.status === 'waiting_approval').length;

  return (
    <div className="fixed bottom-4 right-4 z-50 font-mono text-left max-w-sm w-full px-2">
      {/* Floating Trigger Pill */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer p-3 rounded-2xl bg-[#06060E]/95 border border-white/20 shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl flex items-center justify-between hover:border-[#00F0FF]/50 transition-all"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
            <Cpu className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>9-AGENT SWARM BRAIN</span>
              <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
            </div>
            <div className="text-[10px] text-[#8E9BB4]">
              {workingCount > 0 ? `${workingCount} executing` : 'All tasks synchronized'}
              {approvalCount > 0 && ` · ${approvalCount} awaiting review`}
            </div>
          </div>
        </div>

        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-[#8E9BB4] hover:text-white">
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </Button>
      </div>

      {/* Expanded Swarm Details Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="mt-2 p-4 rounded-2xl bg-[#06060E]/95 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl max-h-[70vh] overflow-y-auto space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] text-[11px]">
              <span className="font-bold text-white uppercase tracking-wider">
                ACTIVE DOMAIN SPECIALISTS
              </span>
              <span className="text-[#00F0FF] text-[10px]">PARALLEL EXECUTION</span>
            </div>

            <div className="space-y-2.5">
              {agents.map((agent) => {
                const IconComponent = ICON_MAP[agent.avatarIcon] || Bot;
                return (
                  <div
                    key={agent.id}
                    className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-lg flex items-center justify-center text-xs"
                          style={{
                            backgroundColor: `${agent.color}15`,
                            borderColor: `${agent.color}40`,
                            color: agent.color,
                          }}
                        >
                          <IconComponent className="w-3 h-3" />
                        </div>
                        <span className="font-bold text-white">{agent.name}</span>
                      </div>

                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-bold border ${
                          agent.status === 'working'
                            ? 'bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/20 animate-pulse'
                            : agent.status === 'waiting_approval'
                            ? 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20'
                            : 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/20'
                        }`}
                      >
                        {agent.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-[10px] text-[#8E9BB4] line-clamp-1 mb-1">{agent.role}</p>

                    {agent.currentTask && (
                      <div className="text-[10px] text-white/80 bg-black/40 p-1.5 rounded border border-white/5">
                        <strong className="text-[#00F0FF]/80">Task: </strong>
                        {agent.currentTask}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}