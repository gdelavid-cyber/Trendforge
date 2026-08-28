'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Briefcase,
  Users,
  DollarSign,
  Send,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Plus,
  X,
  Loader2,
  FileSpreadsheet,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { LogSaleModal } from '@/components/execution/LogSaleModal';

interface Lead {
  id: string;
  source: string;
  sourceUrl: string;
  buyerName: string;
  buyerEmail?: string | null;
  requestText: string;
  statedBudgetCents?: number | null;
  buyerIntentScore: number;
  budgetMatchScore: number;
  relevanceScore: number;
  contactabilityScore: number;
  compositeScore: number;
  status: 'NEW' | 'CONTACTED' | 'RESPONDED' | 'NEGOTIATING' | 'WON' | 'LOST' | 'ARCHIVED';
  messages: Array<{
    id: string;
    direction: 'OUTBOUND' | 'INBOUND';
    channel: string;
    content: string;
    sentBy: string;
    timestamp: string;
  }>;
}

interface Props {
  task: any;
  initialLeads: Lead[];
  plan: any;
  userRole: string;
}

const STAGES: Array<{ id: Lead['status']; title: string; color: string; badgeBg: string }> = [
  { id: 'NEW', title: 'New Prospects', color: 'text-blue-400', badgeBg: 'bg-blue-500/15 border-blue-500/30' },
  { id: 'CONTACTED', title: 'Outreach Sent', color: 'text-purple-400', badgeBg: 'bg-purple-500/15 border-purple-500/30' },
  { id: 'RESPONDED', title: 'Hot Responses', color: 'text-amber-400', badgeBg: 'bg-amber-500/15 border-amber-500/30' },
  { id: 'NEGOTIATING', title: 'In Negotiation', color: 'text-[#00F0FF]', badgeBg: 'bg-[#00F0FF]/15 border-[#00F0FF]/30' },
  { id: 'WON', title: 'Won / Settled', color: 'text-green-400', badgeBg: 'bg-green-500/15 border-green-500/30' },
];

export function SalesPipelineClient({ task, initialLeads, plan, userRole }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [outreachMessage, setOutreachMessage] = useState('');
  const [isLogSaleOpen, setIsLogSaleOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  const handleSendOutreach = async (leadId: string) => {
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/outreach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customContent: outreachMessage || undefined }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Outreach message dispatched!');
        // Update local state
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: 'CONTACTED' } : l))
        );
        if (selectedLead?.id === leadId) {
          setSelectedLead((prev) => (prev ? { ...prev, status: 'CONTACTED' } : null));
        }
        setOutreachMessage('');
      } else {
        toast.error(data.error || 'Failed to send outreach');
      }
    } catch (e) {
      toast.error('Network error sending outreach');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: Lead['status']) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Lead moved to ${newStatus.replace('_', ' ')}`);
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
        );
        if (selectedLead?.id === leadId) {
          setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href={`/tasks/${task.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-white/50 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Task Workspace</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-[#00F0FF]" />
            <span>Sales Pipeline Kanban</span>
          </h1>
          <p className="text-xs font-mono text-white/50 mt-1">
            Targeting buyers for: <span className="text-white font-bold">{task.title}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href={`/tasks/${task.id}/sales-kit`}>
            <Button
              size="sm"
              variant="outline"
              className="border-white/20 text-xs font-mono text-white rounded-full px-4 h-9"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-[#FFD700]" />
              <span>View Sales Kit</span>
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={() => setIsLogSaleOpen(true)}
            className="bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-mono rounded-full px-5 h-9 font-bold hover:bg-green-500/30"
          >
            <DollarSign className="w-3.5 h-3.5 mr-1" />
            <span>Log a Sale</span>
          </Button>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.status === stage.id);

          return (
            <div
              key={stage.id}
              className="liquid-glass rounded-3xl p-4 flex flex-col min-w-[260px] h-[calc(100vh-220px)] min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold font-mono uppercase ${stage.color}`}>
                    {stage.title}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.2 rounded-full font-bold ${stage.badgeBg} ${stage.color}`}
                  >
                    {stageLeads.length}
                  </span>
                </div>
              </div>

              {/* Cards Stream */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                {stageLeads.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-[11px] font-mono text-white/30 text-center">
                    No prospects in this stage
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <motion.div
                      key={lead.id}
                      layoutId={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="liquid-glass-strong rounded-2xl p-4 space-y-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/[0.08] hover:border-[#00F0FF]/40 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-white group-hover:text-[#00F0FF] transition-colors truncate max-w-[160px]">
                            {lead.buyerName}
                          </h4>
                          <span className="text-[9px] font-mono px-2 py-0.2 rounded-full bg-white/5 text-white/60 uppercase">
                            {lead.source}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono font-bold text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded-full">
                          {lead.compositeScore}
                        </div>
                      </div>

                      <p className="text-[11px] text-white/65 line-clamp-2 leading-snug">
                        {lead.requestText}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-[10px] font-mono">
                        <span className="text-green-400 font-bold">
                          {lead.statedBudgetCents
                            ? `$${(lead.statedBudgetCents / 100).toFixed(0)}`
                            : '$150'}
                        </span>
                        <span className="text-white/40 group-hover:text-white transition-colors">
                          Inspect →
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead Conversation & Details Modal */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0A0D1A] border border-white/15 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative font-mono text-xs max-h-[90vh] flex flex-col justify-between"
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{selectedLead.buyerName}</h3>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 uppercase">
                      {selectedLead.source}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#00F0FF]/15 text-[#00F0FF] font-bold">
                      Score: {selectedLead.compositeScore}/100
                    </span>
                  </div>
                  {selectedLead.buyerEmail && (
                    <div className="text-[10px] text-white/50 mt-0.5">{selectedLead.buyerEmail}</div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedLead(null)}
                  className="text-white/50 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Request Box */}
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                  <div className="text-[10px] text-white/40 uppercase">Buyer Scope / Request</div>
                  <p className="text-xs text-white/90 leading-relaxed font-sans">{selectedLead.requestText}</p>
                </div>

                {/* 4-Factor Scores Grid */}
                <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                  <div className="p-2 bg-white/5 rounded-xl">
                    <div className="text-white/40">INTENT</div>
                    <div className="text-xs font-bold text-[#00F0FF] mt-0.5">{selectedLead.buyerIntentScore}%</div>
                  </div>
                  <div className="p-2 bg-white/5 rounded-xl">
                    <div className="text-white/40">BUDGET</div>
                    <div className="text-xs font-bold text-green-400 mt-0.5">{selectedLead.budgetMatchScore}%</div>
                  </div>
                  <div className="p-2 bg-white/5 rounded-xl">
                    <div className="text-white/40">RELEVANCE</div>
                    <div className="text-xs font-bold text-purple-400 mt-0.5">{selectedLead.relevanceScore}%</div>
                  </div>
                  <div className="p-2 bg-white/5 rounded-xl">
                    <div className="text-white/40">CONTACT</div>
                    <div className="text-xs font-bold text-amber-400 mt-0.5">{selectedLead.contactabilityScore}%</div>
                  </div>
                </div>

                {/* Conversation Feed */}
                <div className="space-y-2">
                  <div className="text-[10px] text-white/40 uppercase">Conversation History</div>
                  {selectedLead.messages && selectedLead.messages.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-[#040714] rounded-2xl border border-white/5">
                      {selectedLead.messages.map((m) => (
                        <div
                          key={m.id}
                          className={`p-2.5 rounded-xl max-w-[85%] text-xs ${
                            m.direction === 'OUTBOUND'
                              ? 'ml-auto bg-[#00F0FF]/15 text-white border border-[#00F0FF]/30'
                              : 'mr-auto bg-white/5 text-white/90 border border-white/10'
                          }`}
                        >
                          <div className="text-[9px] text-white/40 mb-1 flex items-center justify-between gap-4">
                            <span>{m.sentBy}</span>
                            <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="font-sans whitespace-pre-wrap">{m.content}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-white/30 text-[11px]">
                      No messages exchanged yet with this lead.
                    </div>
                  )}
                </div>

                {/* Quick Outreach Box */}
                <div className="space-y-2">
                  <label className="text-[10px] text-white/50 uppercase block">
                    Dispatch Personalized Pitch
                  </label>
                  <textarea
                    rows={3}
                    value={outreachMessage}
                    onChange={(e) => setOutreachMessage(e.target.value)}
                    placeholder={`Hi ${selectedLead.buyerName.split(' ')[0]}, saw your request for ${task.title}...`}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-white text-xs font-sans focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                {/* Stage Mover */}
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-white/40">STAGE:</span>
                  <select
                    value={selectedLead.status}
                    onChange={(e) => handleUpdateStatus(selectedLead.id, e.target.value as any)}
                    className="bg-[#050814] border border-white/15 rounded-xl px-2.5 py-1 text-white"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedLead(null)}
                    className="rounded-full text-xs font-mono h-9"
                  >
                    Close
                  </Button>

                  <Button
                    size="sm"
                    disabled={loadingAction}
                    onClick={() => handleSendOutreach(selectedLead.id)}
                    className="liquid-glass-strong text-white font-mono text-xs rounded-full px-5 h-9 font-bold flex items-center gap-1.5 hover:scale-105 transition-transform"
                  >
                    {loadingAction ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-[#00F0FF]" />
                        <span>Send Outreach</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Log Sale Modal */}
      <LogSaleModal
        taskId={task.id}
        isOpen={isLogSaleOpen}
        onClose={() => setIsLogSaleOpen(false)}
        onSuccess={() => {
          if (selectedLead) {
            handleUpdateStatus(selectedLead.id, 'WON');
          }
        }}
      />
    </div>
  );
}
