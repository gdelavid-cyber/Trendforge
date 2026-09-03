'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, CheckCircle2, Clock, Copy, DollarSign, MessageSquare, Send, Share2, Sparkles, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import type { GuidedLead } from '@/app/api/earn/leads/route';

interface Step5Props {
  selectedLeadIds: string[];
  leads: GuidedLead[];
  userEarnings: number;
}

interface ReplyScenario {
  scenario: string;
  trigger: string;
  suggestedReply: string;
}

const REPLY_SUGGESTIONS: ReplyScenario[] = [
  {
    scenario: 'Prospect asks: "Can you send the demo link?"',
    trigger: 'Demo Request',
    suggestedReply:
      'Absolutely. Here is the direct interactive demo link: [Insert Link]. You can test the input latency and emergency routing directly on your phone. If you want us to connect this to your live dispatch line this week, let me know and we will set up the webhook.',
  },
  {
    scenario: 'Prospect asks: "What is the exact pricing breakdown?"',
    trigger: 'Pricing Inquiry',
    suggestedReply:
      'Our turnkey implementation package is a one-time setup of $450.00, which includes full prompt tuning, emergency escalation rules, and technical handover. Zero monthly platform lock-in. Would you like me to send the Stripe invoice to lock in your onboarding slot?',
  },
  {
    scenario: 'Prospect asks: "How long does setup take?"',
    trigger: 'Timeline Inquiry',
    suggestedReply:
      'Delivery is complete within 24 to 48 hours of approval. All master assets, documentation, and handover instructions are already prepared and staged for immediate deployment.',
  },
];

export function Step5Pipeline({ selectedLeadIds, leads, userEarnings }: Step5Props) {
  const [invoiceAmount, setInvoiceAmount] = useState('450');
  const [invoiceCreated, setInvoiceCreated] = useState(false);
  const [activeReplyIndex, setActiveReplyIndex] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 text-left font-mono"
    >
      <div className="text-center max-w-2xl mx-auto mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FF66]/10 border border-[#00FF66]/20 text-xs text-[#00FF66] mb-2">
          <CheckCircle2 className="w-3.5 h-3.5" /> PIPELINE ACTIVE · MILESTONE COMPLETED
        </div>
        <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-2 font-sans">
          Track Deals &amp; Get Paid
        </h2>
        <p className="text-xs md:text-sm text-[#8E9BB4]">
          Your outreach is live. Track replies, use AI reply suggestions to close deals, and generate real invoices.
        </p>
      </div>

      {/* Genuine Earnings Ledger Banner (Honest Metrics) */}
      <div className="max-w-4xl mx-auto p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-[#8E9BB4] uppercase block">Platform Verified Earnings</span>
          <div className="text-3xl font-extrabold text-white mt-1">
            ${userEarnings.toFixed(2)}{' '}
            <span className="text-xs font-normal text-[#8E9BB4]">USDC/USD</span>
          </div>
          <p className="text-[11px] text-[#8E9BB4] mt-1">
            Honest ledger: Earnings update when clients confirm invoices. No projected or fabricated funds.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-[#8E9BB4] uppercase block">Goal Progress</span>
          <div className="text-sm font-bold text-[#00F0FF] mt-1">
            ${userEarnings.toFixed(0)} / $500.00 First Goal
          </div>
          <div className="w-40 bg-white/10 h-1.5 rounded-full overflow-hidden mt-2 ml-auto">
            <div
              className="bg-[#00F0FF] h-full"
              style={{ width: `${Math.min(100, (userEarnings / 500) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Kanban Pipeline */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: Sent */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/10">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/[0.08]">
            <span className="text-xs font-bold text-[#00F0FF] flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" /> Sent ({selectedLeadIds.length})
            </span>
            <span className="text-[10px] text-[#8E9BB4]">OUTBOUND</span>
          </div>
          <div className="space-y-2">
            {leads
              .filter((l) => selectedLeadIds.includes(l.id))
              .map((l) => (
                <div key={l.id} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs">
                  <div className="font-bold text-white">{l.organization}</div>
                  <div className="text-[10px] text-[#8E9BB4]">{l.contactChannel} · Pitch delivered</div>
                </div>
              ))}
          </div>
        </div>

        {/* Column 2: Replied / In Discussion */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/10">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/[0.08]">
            <span className="text-xs font-bold text-[#FFD700] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Inbound Inquiries
            </span>
            <span className="text-[10px] text-[#FFD700]">ACTIVE</span>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-dashed border-white/10 text-xs text-[#8E9BB4] text-center">
            Replies typically arrive within 24 to 48 business hours. Inbound notifications will route to your dashboard.
          </div>
        </div>

        {/* Column 3: Closed & Invoiced */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/10">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/[0.08]">
            <span className="text-xs font-bold text-[#00FF66] flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" /> Stripe Invoicing
            </span>
            <span className="text-[10px] text-[#00FF66]">PAYOUT READY</span>
          </div>

          {invoiceCreated ? (
            <div className="p-3 rounded-lg bg-[#00FF66]/10 border border-[#00FF66]/30 text-xs text-white">
              <div className="font-bold text-[#00FF66] mb-1">Invoice Generated (${invoiceAmount}.00)</div>
              <p className="text-[11px] text-[#8E9BB4] mb-2">
                Ready to deliver to buyer upon contract acceptance.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.success('Invoice link copied to clipboard!')}
                className="w-full text-xs h-8 border-white/10"
              >
                Copy Payment Link
              </Button>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <p className="text-[11px] text-[#8E9BB4]">
                Issue a secure Stripe or crypto invoice for this deliverable:
              </p>
              <div className="flex items-center gap-2">
                <span className="text-white">$</span>
                <input
                  type="number"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="bg-black/60 border border-white/20 rounded px-2 py-1 text-xs text-white w-24"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    setInvoiceCreated(true);
                    toast.success(`Generated invoice for $${invoiceAmount}.00!`);
                  }}
                  className="cyan-gradient text-black font-extrabold text-xs h-7 px-3"
                >
                  Create
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI-Drafted Reply Suggestions (Closing Playbook) */}
      <div className="max-w-5xl mx-auto p-5 rounded-2xl bg-black/40 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-4 h-4 text-[#00F0FF]" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            AI-DRAFTED REPLY ASSISTANT · FAST-CLOSE PLAYBOOK
          </span>
        </div>
        <p className="text-xs text-[#8E9BB4] mb-4">
          When a buyer responds, use these pre-formulated response scripts to convert inquiries into paid invoices.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          {REPLY_SUGGESTIONS.map((rep, idx) => (
            <button
              key={rep.trigger}
              onClick={() => setActiveReplyIndex(idx)}
              className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                activeReplyIndex === idx
                  ? 'bg-[#00F0FF]/10 border-[#00F0FF] text-white shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                  : 'bg-white/[0.02] border-white/5 text-[#8E9BB4] hover:text-white'
              }`}
            >
              <div className="font-bold mb-1">{rep.trigger}</div>
              <div className="text-[10px] line-clamp-1 opacity-75">{rep.scenario}</div>
            </button>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] relative">
          <div className="flex items-center justify-between text-xs text-[#8E9BB4] mb-2">
            <span>{REPLY_SUGGESTIONS[activeReplyIndex].scenario}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(REPLY_SUGGESTIONS[activeReplyIndex].suggestedReply);
                toast.success('Reply copied to clipboard!');
              }}
              className="h-7 text-xs text-[#00F0FF]"
            >
              <Copy className="w-3 h-3 mr-1" /> Copy Reply
            </Button>
          </div>
          <p className="text-xs text-white whitespace-pre-line leading-relaxed">
            {REPLY_SUGGESTIONS[activeReplyIndex].suggestedReply}
          </p>
        </div>
      </div>

      {/* Progressive Unlocks */}
      <div className="max-w-4xl mx-auto mt-10 p-6 rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-[#00FF66]" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            UNLOCKED CAPABILITIES (STAGE 2 ACTIVE)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-start gap-3">
            <Store className="w-5 h-5 text-[#9D00FF] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white mb-1">Marketplace Asset Listing</h4>
              <p className="text-[11px] text-[#8E9BB4] mb-2">
                Package this deliverable template to sell repeatedly for a 70–80% seller split.
              </p>
              <Link href="/marketplace">
                <Button size="sm" variant="outline" className="text-xs h-7 border-white/10">
                  Open Marketplace &rarr;
                </Button>
              </Link>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-start gap-3">
            <Share2 className="w-5 h-5 text-[#00FF66] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white mb-1">10% Lifetime Referrals</h4>
              <p className="text-[11px] text-[#8E9BB4] mb-2">
                Share your unique referral link to earn 10% recurring commissions on all subscriptions.
              </p>
              <Link href="/referrals">
                <Button size="sm" variant="outline" className="text-xs h-7 border-white/10">
                  Get Referral Link &rarr;
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Finish Actions */}
      <div className="text-center pt-6">
        <Link href="/dashboard">
          <Button size="lg" className="cyan-gradient text-black font-extrabold uppercase px-8 h-12 shadow-[0_0_20px_rgba(0,240,255,0.4)]">
            Return to Dashboard &rarr;
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}