'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layers, ArrowRight, Play, Plus, Bot, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { AgentCompanionModal } from '@/components/chat/AgentCompanionModal';
import { CompanionPortrait } from '@/components/avatar/CompanionPortrait';
import { SectionHelpBanner } from '@/components/guide/section-help-banner';

const getStepArchetype = (agentType: string) => {
  switch (agentType) {
    case 'prediction_arbitrage': return 'QUANTUM_ANDROID';
    case 'ai_video_maker': return 'COSMIC_ENTITY';
    case 'micro_saas_builder': return 'WALL_STREET_TITAN';
    case 'openclaw_deployer': return 'CYBER_HUMANOID';
    case 'reddit_scraper':
    default: return 'CYBER_HUMANOID';
  }
};

export function WorkflowBuilderClient({ user }: { user: any }) {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [workflowName, setWorkflowName] = useState('Reddit -> SaaS -> Video Pipeline');
  const [steps, setSteps] = useState<Array<{ agentType: string; name: string }>>([
    { agentType: 'reddit_scraper', name: '1. Scrape SaaS Pain Points' },
    { agentType: 'micro_saas_builder', name: '2. Scaffold Micro-SaaS Codebase' },
    { agentType: 'ai_video_maker', name: '3. Generate Marketing Video' },
  ]);
  const [executing, setExecuting] = useState(false);
  const [consultAgent, setConsultAgent] = useState<any | null>(null);

  const fetchWorkflows = async () => {
    try {
      const res = await fetch('/api/workflows');
      const data = await res.json();
      if (data.success) setWorkflows(data.workflows);
    } catch (_) {}
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleAddStep = (agentType: string, name: string) => {
    setSteps((prev) => [...prev, { agentType, name: `${prev.length + 1}. ${name}` }]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExecuteWorkflow = async () => {
    if (!workflowName.trim() || steps.length === 0) {
      toast.error('Workflow name and at least 1 step required');
      return;
    }
    setExecuting(true);
    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workflowName,
          steps,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Workflow '${workflowName}' initiated!`);
        router.push(`/agents/${data.firstRunId}/status`);
      } else {
        toast.error(data.error || 'Failed to start workflow');
      }
    } catch {
      toast.error('Error starting workflow');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-12 font-sans">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-xs font-mono mb-3">
          <Layers className="w-3.5 h-3.5" />
          <span>ADVANCED WORKFLOWS // MULTI-AGENT PIPELINES</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-wider text-white">
          Agent <span className="cyan-gold-gradient-text">Workflow Builder</span>
        </h1>
        <p className="text-sm text-[#8892B0] max-w-2xl mt-2 font-sans">
          Chain multiple autonomous Swarm Agents sequentially: feed extracted pain points directly into software scaffolding and video marketing assets.
        </p>
      </motion.div>

      {/* Section Guide & Info */}
      <SectionHelpBanner />

      {/* Builder Visual Canvas */}
      <div className="glass-card p-6 md:p-8 mb-8 border border-white/10">
        <div className="mb-6 max-w-md">
          <label className="text-xs font-mono text-[#8892B0] block mb-1">Workflow Pipeline Name</label>
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="bg-black/50 border-white/10 text-white font-mono text-sm h-10"
          />
        </div>

        {/* Steps sequence */}
        <div className="space-y-4 mb-8">
          <span className="text-xs font-mono uppercase text-[#00F0FF] block">Execution Pipeline Sequence:</span>

          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="p-3.5 bg-black/60 border border-white/10 hover:border-[#00F0FF]/40 rounded-xl relative group min-w-[220px] flex items-center gap-3">
                  <div
                    onClick={() =>
                      setConsultAgent({
                        name: step.name,
                        archetype: getStepArchetype(step.agentType),
                        walletBalance: 0,
                        survivalScore: 90,
                      })
                    }
                    className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-black/80 shadow-[0_0_10px_rgba(0,240,255,0.15)] cursor-pointer hover:border-[#00F0FF] hover:scale-105 transition-all"
                    title="Click to Talk / Consult Worker"
                  >
                    <CompanionPortrait archetype={getStepArchetype(step.agentType)} className="w-full h-full" seed={step.name.length} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#00F0FF] uppercase block">Step #{idx + 1}</span>
                    <span className="text-xs font-bold text-white block truncate max-w-[130px]">{step.name}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveStep(idx)}
                    className="absolute top-2 right-2 text-[#8892B0] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {idx < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-[#8892B0] hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add Step Buttons */}
        <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#8892B0]">Add Worker to Pipeline:</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddStep('reddit_scraper', 'Scrape Reddit Demand')}
              className="border-white/10 text-xs h-7 text-[#00F0FF]"
            >
              + Reddit Scraper
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddStep('micro_saas_builder', 'Scaffold Micro-SaaS')}
              className="border-white/10 text-xs h-7 text-[#00F0FF]"
            >
              + Micro-SaaS Builder
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddStep('ai_video_maker', 'Generate Video')}
              className="border-white/10 text-xs h-7 text-[#00F0FF]"
            >
              + Video Maker
            </Button>
          </div>

          <Button
            onClick={handleExecuteWorkflow}
            disabled={executing || steps.length === 0}
            className="cyan-gradient text-black font-extrabold uppercase holographic-btn px-6 h-9"
          >
            {executing ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Play className="w-4 h-4 fill-black mr-1.5" />}
            Execute Chained Pipeline
          </Button>
        </div>
      </div>

      {/* Global AI Companion Modal */}
      <AgentCompanionModal
        isOpen={!!consultAgent}
        onClose={() => setConsultAgent(null)}
        agent={consultAgent}
        user={user}
      />
    </div>
  );
}
