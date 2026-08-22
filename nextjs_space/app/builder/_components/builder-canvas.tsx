'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Plus,
  Play,
  Trash2,
  Cpu,
  Bot,
  Zap,
  ArrowRight,
  CheckCircle,
  Loader2,
  Terminal,
  Shield,
  Coins,
  Sparkles,
  Sliders,
  DollarSign,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { SKILLS_LIBRARY, SkillDefinition } from '@/lib/web4/skills-library';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface WorkflowNode {
  id: string;
  skillId: string;
  skill: SkillDefinition;
  params: Record<string, any>;
}

export function BuilderCanvas({ user }: { user: any }) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    {
      id: 'node-1',
      skillId: 'scrape_reddit_painpoints',
      skill: SKILLS_LIBRARY.find((s) => s.id === 'scrape_reddit_painpoints')!,
      params: { subreddit: 'SaaS', keywords: 'frustrated, alternative, broken', maxPosts: 20 },
    },
    {
      id: 'node-2',
      skillId: 'nextjs_microsaas_builder',
      skill: SKILLS_LIBRARY.find((s) => s.id === 'nextjs_microsaas_builder')!,
      params: { productIdea: 'AI Client Review Aggregator for Shopify', niche: 'E-Commerce Brands' },
    },
  ]);

  const [agentName, setAgentName] = useState('Apex Autonomous Miner');
  const [agentArchetype, setAgentArchetype] = useState('DATA_MINER');
  const [testing, setTesting] = useState(false);
  const [minting, setMinting] = useState(false);
  const [sandboxLogs, setSandboxLogs] = useState<any[] | null>(null);

  const filteredSkills = selectedCategory === 'ALL'
    ? SKILLS_LIBRARY
    : SKILLS_LIBRARY.filter((s) => s.category === selectedCategory);

  const addNode = (skill: SkillDefinition) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      skillId: skill.id,
      skill,
      params: skill.inputs.reduce((acc, input) => {
        acc[input.name] = input.default || '';
        return acc;
      }, {} as Record<string, any>),
    };
    setNodes((prev) => [...prev, newNode]);
    toast.success(`Added ${skill.name} to DAG workflow!`);
  };

  const removeNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
  };

  const updateNodeParam = (nodeId: string, paramName: string, value: any) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, params: { ...n.params, [paramName]: value } } : n))
    );
  };

  const handleTestSandbox = async () => {
    if (nodes.length === 0) {
      toast.error('Add at least one skill block to the workflow canvas.');
      return;
    }

    setTesting(true);
    setSandboxLogs(null);
    try {
      const res = await fetch('/api/web4/builder/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSandboxLogs(data.logs);
        toast.success(`Sandbox verified! Projected profit: $${data.netProjectedProfit} USDC`);
      } else {
        toast.error(data.error || 'Test run failed');
      }
    } catch {
      toast.error('Network error executing sandbox');
    } finally {
      setTesting(false);
    }
  };

  const handleMintAgent = async () => {
    if (!user) {
      toast.error('Please sign in to deploy sovereign Web4 agents.');
      router.push('/auth/signin');
      return;
    }

    if (nodes.length === 0) {
      toast.error('Workflow canvas is empty.');
      return;
    }

    setMinting(true);
    try {
      const res = await fetch('/api/web4/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentName,
          archetype: agentArchetype,
          skills: nodes.map((n) => ({ skillId: n.skillId, params: n.params })),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Minted ${data.agent.name} with EIP-8004 identity!`);
        router.push('/agents/web4');
      } else {
        toast.error(data.error || 'Failed to mint agent.');
      }
    } catch {
      toast.error('Network error minting agent.');
    } finally {
      setMinting(false);
    }
  };

  const totalComputeCost = nodes.reduce((sum, n) => sum + (n.skill?.computeCostUsdc || 0), 0);

  return (
    <div className="max-w-[1360px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-xs font-mono mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>NO-CODE AGENT STUDIO // VISUAL DAG WORKFLOW BUILDER</span>
          </div>
          <h1 className="font-orbitron text-2xl sm:text-4xl font-black uppercase tracking-wider text-white">
            Agent <span className="cyan-gold-gradient-text">Studio Canvas</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8E9BB4] font-sans mt-1">
            Drag, configure, and connect 50+ autonomous skill blocks. Test in real-time sandbox and mint as sovereign Web4 agents.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleTestSandbox}
            disabled={testing || nodes.length === 0}
            size="sm"
            className="border-white/10 text-xs font-mono uppercase text-white bg-white/[0.03] hover:border-[#00F0FF]/40"
          >
            {testing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-[#00F0FF]" /> Running Sandbox...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 mr-1.5 fill-[#00F0FF] text-[#00F0FF]" /> Test Sandbox Run
              </>
            )}
          </Button>

          <Button
            onClick={handleMintAgent}
            disabled={minting || nodes.length === 0}
            size="sm"
            className="cyan-gradient text-black font-extrabold uppercase text-xs h-9 px-4 holographic-btn font-mono"
          >
            <Bot className="w-3.5 h-3.5 mr-1.5 fill-current" /> {minting ? 'Minting On-Chain...' : 'Mint Sovereign Agent'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Skill Blocks Library (50+ skills) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card p-4">
            <h3 className="text-xs font-mono uppercase font-bold text-white mb-3 flex items-center justify-between">
              <span>Skill Blocks Library</span>
              <span className="text-[#00F0FF]">{filteredSkills.length} Available</span>
            </h3>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {['ALL', 'SCRAPER', 'FINANCE', 'OUTREACH', 'MEDIA', 'CODE', 'SOCIAL'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#00F0FF] text-black font-bold'
                      : 'bg-white/5 text-[#8E9BB4] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Scrollable Skills List */}
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {filteredSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="p-3 rounded-xl bg-black/40 border border-white/[0.06] hover:border-[#00F0FF]/40 transition-all flex items-start justify-between gap-3 group"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{skill.icon}</span>
                      <span className="text-xs font-bold text-white font-mono group-hover:text-[#00F0FF] transition-colors">
                        {skill.name}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8E9BB4] font-sans line-clamp-2">{skill.description}</p>
                    <div className="mt-2 text-[9px] font-mono text-[#FFD700]">
                      Cost: ${skill.computeCostUsdc} USDC / run
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => addNode(skill)}
                    className="h-7 px-2.5 bg-white/5 hover:bg-[#00F0FF] hover:text-black text-xs font-mono rounded"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center/Right Col: Visual Workflow DAG Canvas & Sandbox Terminal */}
        <div className="lg:col-span-8 space-y-6">
          {/* Agent Meta Configuration Bar */}
          <div className="glass-card p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex-1 w-full sm:w-auto">
              <label className="text-[10px] font-mono text-[#8E9BB4] uppercase block mb-1">Agent Name</label>
              <Input
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="bg-black/50 border-white/10 text-white font-mono text-xs h-8"
              />
            </div>
            <div className="w-full sm:w-48">
              <label className="text-[10px] font-mono text-[#8E9BB4] uppercase block mb-1">Archetype</label>
              <select
                value={agentArchetype}
                onChange={(e) => setAgentArchetype(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded px-2.5 py-1.5 text-white font-mono text-xs h-8"
              >
                <option value="DATA_MINER">Data Miner</option>
                <option value="DEFI_ARBITRAGEUR">DeFi Arbitrageur</option>
                <option value="LEAD_HUNTER">Lead Hunter</option>
                <option value="VIRAL_CREATOR">Viral Creator</option>
                <option value="SAAS_ARCHITECT">SaaS Architect</option>
              </select>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-[#8E9BB4] uppercase block">Total Compute Cost</span>
              <span className="text-xs font-mono text-[#00F0FF] font-bold">${totalComputeCost.toFixed(4)} USDC / run</span>
            </div>
          </div>

          {/* Workflow DAG Node List */}
          <div className="glass-card p-6 min-h-[300px]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/[0.06]">
              <h3 className="text-xs font-mono uppercase font-bold text-white flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-[#00F0FF]" />
                Workflow DAG Execution Pipeline ({nodes.length} Stages)
              </h3>
              <span className="text-[10px] font-mono text-[#8E9BB4]">Sequential Autonomous Flow</span>
            </div>

            {nodes.length === 0 ? (
              <div className="py-16 text-center text-[#8E9BB4] text-xs font-mono">
                Click "+" on any skill block from the library on the left to add it to this pipeline.
              </div>
            ) : (
              <div className="space-y-4">
                {nodes.map((node, idx) => (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-black/60 border border-white/10 hover:border-[#00F0FF]/30 transition-all relative group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-[10px] font-mono font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-base">{node.skill.icon}</span>
                        <h4 className="text-xs font-bold text-white font-mono">{node.skill.name}</h4>
                        <span className="text-[9px] font-mono text-[#8E9BB4] bg-white/5 px-2 py-0.5 rounded">
                          {node.skill.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#FFD700]">
                          ${node.skill.computeCostUsdc} USDC
                        </span>
                        <button
                          onClick={() => removeNode(node.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Inputs Configuration */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
                      {node.skill.inputs.map((input) => (
                        <div key={input.name}>
                          <label className="text-[9px] font-mono text-[#8E9BB4] uppercase block mb-1">
                            {input.name}
                          </label>
                          <Input
                            value={node.params[input.name] ?? ''}
                            onChange={(e) => updateNodeParam(node.id, input.name, e.target.value)}
                            placeholder={input.placeholder || ''}
                            className="bg-black/80 border-white/10 text-white font-mono text-[11px] h-7"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Arrow down connector indicator */}
                    {idx < nodes.length - 1 && (
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10 w-6 h-6 rounded-full bg-black border border-white/20 flex items-center justify-center text-[10px] text-[#00F0FF]">
                        ↓
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Sandbox Real-Time Log Terminal */}
          {sandboxLogs && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 border border-[#00F0FF]/30"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-mono text-[#00F0FF] font-bold">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>SANDBOX EXECUTION TELEMETRY (VERIFIED 200 OK)</span>
                </div>
                <span className="text-[10px] font-mono text-green-400">100% SUCCESS RATIO</span>
              </div>

              <div className="p-3 bg-black/80 rounded-lg text-xs font-mono space-y-2 text-[#CCD6F6] max-h-48 overflow-y-auto">
                {sandboxLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[#00F0FF]">[{log.stepIndex}]</span>
                    <div>
                      <span className="text-white font-bold">{log.skillName}</span>:{' '}
                      <span className="text-[#8E9BB4]">{log.outputSummary}</span>
                      <span className="text-[#FFD700] ml-2 font-bold">(-${log.computeBurn} USDC)</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
