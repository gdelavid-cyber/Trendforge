import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'About Trendly — Autonomous Income Infrastructure',
  description: 'Learn how Trendly pairs real-time trend intelligence with autonomous AI agents to build real business assets.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-[#f8fafc] font-sans selection:bg-[#38bdf8]/30">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 space-y-16">
        {/* Section 1: Mission Statement */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#38bdf8]/10 border border-[#38bdf8]/20 text-xs font-mono text-[#38bdf8]">
            <Sparkles className="w-3.5 h-3.5" /> MISSION STATEMENT
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
            Democratizing Autonomous Income Generation
          </h1>
          <p className="text-lg sm:text-xl text-[#94a3b8] max-w-2xl mx-auto leading-relaxed">
            Trendly bridges the gap between emerging market demand and immediate execution. We build tools that allow creators and entrepreneurs to package AI deliverables, discover vetted buyers, and collect revenue with zero technical friction.
          </p>
        </section>

        {/* Section 2: How Trendly Works (3 Steps) */}
        <section className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">How Trendly Works</h2>
            <p className="text-sm text-[#94a3b8] mt-1">A simple 3-part engine from discovery to verified payout.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#38bdf8]/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8] font-mono font-bold">
                01
              </div>
              <h3 className="text-lg font-bold text-white">Detect Live Demand</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Our Trend Scout continuously indexes 15+ public sources (TikTok Creative Center, YouTube Trending, Google Trends, Upwork) to uncover rising buyer intent before markets saturate.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#f59e0b]/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 flex items-center justify-center text-[#f59e0b] font-mono font-bold">
                02
              </div>
              <h3 className="text-lg font-bold text-white">Build Deliverables</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Autonomous agent builders compile turnkey assets — from 9:16 vertical video packages to local SEO audits — following rigorous production checklists.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#8b5cf6]/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center text-[#8b5cf6] font-mono font-bold">
                03
              </div>
              <h3 className="text-lg font-bold text-white">Approve &amp; Close</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Sales agents match qualified buyers using public directories. You inspect the deliverables, approve outreach with 1 click, and collect payment directly via Stripe.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Technical Details via Nova */}
        <section className="p-8 rounded-3xl bg-gradient-to-br from-white/[0.03] to-[#38bdf8]/[0.05] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2 text-[#38bdf8] text-xs font-mono">
              <Bot className="w-4 h-4" /> NEED DEEP ARCHITECTURE DETAILS?
            </div>
            <h3 className="text-xl font-bold text-white">Ask Nova, Your 24/7 AI Companion</h3>
            <p className="text-xs text-[#94a3b8] max-w-md">
              Full algorithmic specifications, agent orchestration docs, and API documentation are accessible conversationally through Nova at any time.
            </p>
          </div>
          <Link href="/earn">
            <Button size="lg" className="bg-[#38bdf8] hover:bg-[#38bdf8]/90 text-black font-extrabold font-mono text-xs h-11 px-6 whitespace-nowrap">
              Explore Earning Paths &rarr;
            </Button>
          </Link>
        </section>

        {/* Legal Disclaimer */}
        <footer className="text-[11px] font-mono text-[#94a3b8] max-w-2xl mx-auto italic text-center pt-8 border-t border-white/[0.06]">
          Trendly provides tools, templates, and guidance. Actual results depend on consistent execution, market conditions, and factors outside our control. Results vary. No income is guaranteed.
        </footer>
      </div>
    </div>
  );
}