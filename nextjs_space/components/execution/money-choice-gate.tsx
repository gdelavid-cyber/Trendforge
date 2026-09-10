'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Target,
  MessageSquare,
  DollarSign,
  ArrowRight,
  Copy,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import Link from 'next/link';

export function MoneyChoiceGate({
  executionId,
  leadCount,
}: {
  executionId: string;
  leadCount: number;
}) {
  const count = leadCount || 5;

  return (
    <Card className="border border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 via-black/80 to-cyan-950/20 backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.15)] overflow-hidden">
      <CardContent className="p-6 space-y-5">
        {/* Top Directives Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h3 className="text-base font-bold font-orbitron text-white uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Pipeline Complete — Next Steps & Action Plan
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              All 6 stages of this turnkey revenue kit are built. Here is your exact step-by-step roadmap to close deals:
            </p>
          </div>
          <Badge variant="cyber" className="self-start sm:self-center text-xs font-mono px-3 py-1 font-bold">
            {count} Pre-Qualified Buyers Ready
          </Badge>
        </div>

        {/* 3 Step Interactive Direction Pathway */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/20 hover:border-cyan-500/50 transition flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold uppercase">
                  Step 1 · Prospects
                </span>
                <Users className="h-4 w-4 text-cyan-400" />
              </div>
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                Pick A Pre-Qualified Buyer
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                The bot scraped {count} people who publicly posted about this exact problem. Sorted by 0-100 buying intent.
              </p>
            </div>
            <Link href={`/dashboard/my-work/${executionId}/buyers`}>
              <Button size="sm" variant="cyber" className="w-full text-xs font-mono h-8 font-bold">
                See Buyers ({count}) &rarr;
              </Button>
            </Link>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-black/60 border border-amber-500/20 hover:border-amber-500/50 transition flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase">
                  Step 2 · Outreach
                </span>
                <Copy className="h-4 w-4 text-amber-400" />
              </div>
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                Copy 1-Click Pitch
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                On the Buyers page, click "Copy pitch". It auto-personalizes with the user's handle and pain point. Open their thread and reply!
              </p>
            </div>
            <Link href={`/dashboard/my-work/${executionId}/buyers?filter=high_intent`}>
              <Button size="sm" variant="outline" className="w-full text-xs font-mono h-8 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-bold">
                High Intent Leads &rarr;
              </Button>
            </Link>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/20 hover:border-emerald-500/50 transition flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase">
                  Step 3 · Practice
                </span>
                <MessageSquare className="h-4 w-4 text-emerald-400" />
              </div>
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                Roleplay with AI Coach
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Unsure what they will say? Practice against the AI buyer persona. Get scored on closing rate before talking to the real prospect.
              </p>
            </div>
            <Link href={`/dashboard/my-work/${executionId}/coach`}>
              <Button size="sm" variant="outline" className="w-full text-xs font-mono h-8 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-bold">
                Launch Pitch Coach &rarr;
              </Button>
            </Link>
          </div>
        </div>

        {/* Operating Rules & Reassurance */}
        <div className="p-3 rounded-lg bg-black/40 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Zero-spam policy:</strong> The bot never sends DMs or emails. You maintain complete control over outreach and keep 100% of deal revenue.
            </span>
          </div>
          <Link href={`/dashboard/my-work/${executionId}/buyers`}>
            <span className="text-cyan-400 hover:underline font-mono font-bold text-xs whitespace-nowrap flex items-center gap-1 cursor-pointer">
              Go to Buyers Board <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
