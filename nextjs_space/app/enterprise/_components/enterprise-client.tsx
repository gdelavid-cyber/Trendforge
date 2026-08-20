'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Server, Cpu, Lock, CheckCircle2, ArrowRight, Loader2, Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function EnterpriseClient({ user }: { user: any }) {
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [useCase, setUseCase] = useState('');
  const [monthlyVolume, setMonthlyVolume] = useState('10,000+ Runs');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail.trim() || !companyName.trim()) {
      toast.error('Please provide company name and contact email');
      return;
    }

    setSubmitting(true);
    // Simulate enterprise lead submission & notification
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      toast.success('Enterprise inquiry submitted! Dedicated solutions architect will reach out within 2 hours.');
    }, 1000);
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-16 font-sans">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono mb-4">
          <Server className="w-3.5 h-3.5" />
          <span>ENTERPRISE GRADE // DEDICATED SWARM CLUSTERS</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-wider text-white">
          Enterprise <span className="cyan-gold-gradient-text">Autonomous Infrastructure</span>
        </h1>
        <p className="text-sm text-[#8892B0] max-w-2xl mx-auto mt-3">
          Deploy private Swarm clusters, custom domain scrapers, high-throughput Polymarket arbitrage runners, and dedicated residential proxy networks with 99.9% uptime SLA.
        </p>
      </motion.div>

      {/* Pricing / Plan Card & Inquiry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        {/* Left 2 Cols: Features */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-8">
            <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#00F0FF]" /> Included in Enterprise Tier
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans text-[#8892B0]">
              <div className="p-4 bg-black/40 rounded-lg border border-white/5 space-y-1">
                <span className="text-white font-bold block flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Dedicated Worker Swarms
                </span>
                <span>Zero queue contention. Isolated Node.js worker pools with dedicated compute.</span>
              </div>
              <div className="p-4 bg-black/40 rounded-lg border border-white/5 space-y-1">
                <span className="text-white font-bold block flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Bespoke Agent Engineering
                </span>
                <span>Custom scraping agents fine-tuned for your exact proprietary data requirements.</span>
              </div>
              <div className="p-4 bg-black/40 rounded-lg border border-white/5 space-y-1">
                <span className="text-white font-bold block flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> 100,000+ Monthly Runs
                </span>
                <span>High-volume execution capacity with customized cost-per-run bulk economics.</span>
              </div>
              <div className="p-4 bg-black/40 rounded-lg border border-white/5 space-y-1">
                <span className="text-white font-bold block flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> 99.9% Uptime & SLA
                </span>
                <span>Direct Slack/Telegram channel with engineering leads and 15-minute response SLA.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Inquiry Form */}
        <div className="glass-card p-8 border border-purple-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold uppercase text-purple-400">Enterprise Plan</span>
              <span className="text-xs font-mono text-[#8892B0]">Billed Monthly</span>
            </div>
            <div className="text-3xl font-black text-white font-mono mb-4">
              $999 <span className="text-xs text-[#8892B0] font-sans font-normal">/ month</span>
            </div>

            {submitted ? (
              <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs font-mono text-center">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
                Inquiry Received! Our solutions team is preparing your custom cluster.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 font-sans">
                <div>
                  <label className="text-[11px] text-[#8892B0] block mb-1 font-mono">Company / Organization</label>
                  <Input
                    placeholder="e.g. Apex Quant Labs"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="bg-black/50 border-white/10 text-white text-xs h-9"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#8892B0] block mb-1 font-mono">Work Email</label>
                  <Input
                    type="email"
                    placeholder="operative@company.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="bg-black/50 border-white/10 text-white text-xs h-9"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#8892B0] block mb-1 font-mono">Estimated Monthly Volume</label>
                  <select
                    value={monthlyVolume}
                    onChange={(e) => setMonthlyVolume(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 text-white text-xs h-9 rounded px-2"
                  >
                    <option value="10,000+ Runs">10,000 - 50,000 Runs/Mo</option>
                    <option value="50,000+ Runs">50,000 - 250,000 Runs/Mo</option>
                    <option value="Custom Unlimited">250,000+ Unlimited Dedicated</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[#8892B0] block mb-1 font-mono">Primary Use Case</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Real-time prediction orderbook scraping and automated SaaS builders"
                    value={useCase}
                    onChange={(e) => setUseCase(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs text-white placeholder:text-[#8892B0] focus:outline-none focus:border-purple-400"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold uppercase text-xs h-9 mt-2"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Bot className="w-3.5 h-3.5 mr-1" />}
                  Request Dedicated Cluster
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
