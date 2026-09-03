'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Lock, Send, ShieldCheck, UserCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { GuidedLead } from '@/app/api/earn/leads/route';

interface Step4Props {
  leads: GuidedLead[];
  onAuthorize: (selectedIds: string[], mode: string) => void;
}

export function Step4Buyers({ leads, onAuthorize }: Step4Props) {
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>(leads.map((l) => l.id));
  const [sendingMode, setSendingMode] = useState<'MANUAL' | 'DRAFT_APPROVE' | 'FULL_AUTO'>('MANUAL');
  const [previewLead, setPreviewLead] = useState<GuidedLead | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const toggleLead = (id: string) => {
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(selectedLeadIds.filter((x) => x !== id));
    } else {
      setSelectedLeadIds([...selectedLeadIds, id]);
    }
  };

  const handleConfirm = () => {
    if (selectedLeadIds.length === 0) {
      toast.error('Please select at least 1 buyer.');
      return;
    }
    setIsConfirming(false);
    onAuthorize(selectedLeadIds, sendingMode);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 text-left font-mono"
    >
      <div className="text-center max-w-2xl mx-auto mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FF66]/10 border border-[#00FF66]/20 text-xs text-[#00FF66] mb-2">
          <UserCheck className="w-3.5 h-3.5" /> 5 QUALIFIED BUYER PROSPECTS READY
        </div>
        <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-2 font-sans">
          Pick Buyers &amp; Authorize Outreach
        </h2>
        <p className="text-xs md:text-sm text-[#8E9BB4]">
          Select which qualified buyers to contact. Outreach defaults to Manual Mode so you inspect every message before sending.
        </p>
      </div>

      {/* 3 Sending Modes */}
      <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3">
        <div
          onClick={() => setSendingMode('MANUAL')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            sendingMode === 'MANUAL'
              ? 'bg-[#00F0FF]/10 border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.2)]'
              : 'bg-white/[0.02] border-white/10'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-xs text-white mb-1">
            <UserCheck className="w-3.5 h-3.5 text-[#00F0FF]" /> Manual Mode (Default)
          </div>
          <p className="text-[10px] text-[#8E9BB4]">
            Review message &amp; copy or send manually from your own channels.
          </p>
        </div>

        <div
          onClick={() => setSendingMode('DRAFT_APPROVE')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            sendingMode === 'DRAFT_APPROVE'
              ? 'bg-[#00F0FF]/10 border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.2)]'
              : 'bg-white/[0.02] border-white/10'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-xs text-white mb-1">
            <Bot className="w-3.5 h-3.5 text-[#FFD700]" /> Draft-and-Approve
          </div>
          <p className="text-[10px] text-[#8E9BB4]">
            AI stages pre-formatted proposal; you click to authorize each dispatch.
          </p>
        </div>

        <div className="p-3.5 rounded-xl border bg-white/[0.01] border-white/5 opacity-50 relative cursor-not-allowed">
          <div className="flex items-center justify-between font-bold text-xs text-white/50 mb-1">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Full-Auto Outreach
            </span>
            <Lock className="w-3 h-3 text-[#FFD700]" />
          </div>
          <p className="text-[10px] text-[#8E9BB4]">
            Locked: Unlocks progressively after your first closed payment.
          </p>
        </div>
      </div>

      {/* Buyer Cards List */}
      <div className="max-w-4xl mx-auto space-y-3">
        {leads.map((lead) => {
          const isSelected = selectedLeadIds.includes(lead.id);
          return (
            <div
              key={lead.id}
              className={`p-4 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-white/[0.04] border-white/20'
                  : 'bg-white/[0.01] border-white/5 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleLead(lead.id)}
                    className="w-4 h-4 rounded accent-[#00F0FF] cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-sm text-white">{lead.name}</span>
                    <span className="text-xs text-[#8E9BB4] ml-2">({lead.organization})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded border border-[#00FF66]/20 font-bold">
                    {lead.matchScore}% MATCH
                  </span>
                  <span className="text-[10px] text-[#FFD700] bg-[#FFD700]/10 px-2 py-0.5 rounded border border-[#FFD700]/20 font-bold">
                    {lead.estimatedBudget}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPreviewLead(lead)}
                    className="h-7 text-[11px] text-[#00F0FF] hover:text-white"
                  >
                    Preview Pitch &rarr;
                  </Button>
                </div>
              </div>

              <p className="text-xs text-[#8E9BB4] ml-7">
                <strong className="text-white/70">Detected Need: </strong>
                {lead.detectedPainPoint}
              </p>
            </div>
          );
        })}
      </div>

      {/* Confirmation Banner */}
      <div className="max-w-3xl mx-auto p-4 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-[#00F0FF]">
          <ShieldCheck className="w-4 h-4" />
          <span>Explicit authorization required: You are queueing {selectedLeadIds.length} tailored proposals.</span>
        </div>
        <Button
          size="lg"
          onClick={() => setIsConfirming(true)}
          className="cyan-gradient text-black font-extrabold uppercase px-8 h-12 shadow-[0_0_25px_rgba(0,240,255,0.4)]"
        >
          Authorize &amp; Dispatch Outreach ({selectedLeadIds.length} Buyers) &rarr;
        </Button>
      </div>

      {/* Message Preview Modal */}
      {previewLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-lg w-full rounded-2xl bg-[#06060E] border border-white/10 p-6 text-left">
            <h3 className="font-bold text-sm text-white mb-1">
              Outreach Preview for {previewLead.name}
            </h3>
            <div className="text-[10px] text-[#8E9BB4] mb-4">
              Channel: {previewLead.contactChannel} · {previewLead.organization}
            </div>

            <div className="mb-3">
              <span className="text-[10px] text-[#00F0FF] uppercase block mb-1">Subject:</span>
              <div className="p-2 rounded bg-black/50 border border-white/10 text-xs text-white">
                {previewLead.draftSubject}
              </div>
            </div>

            <div className="mb-4">
              <span className="text-[10px] text-[#00F0FF] uppercase block mb-1">Body:</span>
              <div className="p-3 rounded bg-black/50 border border-white/10 text-xs text-[#8E9BB4] whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto">
                {previewLead.draftMessage}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${previewLead.draftSubject}\n\n${previewLead.draftMessage}`
                  );
                  toast.success('Pitch copied to clipboard!');
                }}
                className="text-xs text-[#00F0FF]"
              >
                Copy Pitch
              </Button>
              <Button size="sm" onClick={() => setPreviewLead(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Authorization Modal */}
      {isConfirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full rounded-2xl bg-[#06060E] border border-white/10 p-6 text-center">
            <ShieldCheck className="w-10 h-10 text-[#00FF66] mx-auto mb-3" />
            <h3 className="font-bold text-base text-white mb-2">Confirm Outreach Dispatch</h3>
            <p className="text-xs text-[#8E9BB4] mb-6 leading-relaxed">
              You are authorizing outreach to {selectedLeadIds.length} verified buyers in {sendingMode} mode. No unauthorized accounts or automated spam will be sent.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsConfirming(false)}
                className="text-xs text-[#8E9BB4]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                className="cyan-gradient text-black font-extrabold uppercase text-xs h-10 px-6"
              >
                Confirm &amp; Proceed
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}