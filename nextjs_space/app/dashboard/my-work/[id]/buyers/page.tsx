'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layouts/header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  ExternalLink,
  Flame,
  CheckCircle2,
  Copy,
  Star,
  MessageSquare,
  Search,
  Sparkles,
  Target,
  Send,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface BuyerLead {
  id: string;
  source: string;
  sourceUrl: string;
  externalId: string;
  authorHandle: string;
  postTitle: string | null;
  postExcerpt: string;
  postedAt: string;
  intentScore: number;
  intentReasons: string[];
  engagement: number;
  replyCount: number;
  contactMethods: Array<{ channel: string; how: string; effort: string; risk: string }>;
  status: string;
  savedToShortlist: boolean;
  userNotes: string | null;
}

export default function BuyersPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

  const [leads, setLeads] = useState<BuyerLead[]>([]);
  const [queries, setQueries] = useState<any[]>([]);
  const [trend, setTrend] = useState<any>(null);
  const [revenueKit, setRevenueKit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high_intent' | 'shortlisted'>('all');

  const fetchLeads = async () => {
    try {
      const res = await fetch(`/api/execution/${id}/buyers`);
      if (!res.ok) return;
      const data = await res.json();
      setLeads(data.leads || []);
      setQueries(data.queries || []);
      setTrend(data.trend);
      setRevenueKit(data.revenueKit);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchLeads();
  }, [id]);

  const updateLead = async (leadId: string, updates: Partial<BuyerLead>) => {
    setLeads(prev => prev.map(l => (l.id === leadId ? { ...l, ...updates } : l)));
    try {
      await fetch(`/api/execution/${id}/buyers`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, ...updates }),
      });
      toast.success('Lead updated');
    } catch {
      toast.error('Failed to update lead');
      fetchLeads();
    }
  };

  const copyPitch = (lead: BuyerLead) => {
    const templates = revenueKit?.sell_fork?.outreach_templates || revenueKit?.sell_fork?.copy || [];
    let text = '';
    if (Array.isArray(templates) && templates.length > 0) {
      text = templates[0].body || templates[0].message || JSON.stringify(templates[0]);
    } else {
      text = `Hey @${lead.authorHandle}! Saw your post regarding ${trend?.name || 'this problem'}. I built a turnkey solution that handles this directly. Let me know if you want the preview link!`;
    }
    navigator.clipboard.writeText(text);
    toast.success('Pitch copy copied to clipboard!');
  };

  const filtered = leads.filter(l => {
    if (filter === 'high_intent') return l.intentScore >= 50;
    if (filter === 'shortlisted') return l.savedToShortlist;
    return true;
  });

  return (
    <div className="min-h-screen bg-transparent text-white pb-20">
      <Header />
      <div className="max-w-[1260px] mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/my-work/${id}`}>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] text-slate-300"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-400" />
                <h1 className="text-xl font-bold font-mono uppercase tracking-wider text-white">
                  Pre-Qualified Buyer Discovery
                </h1>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {trend?.name} • <span className="text-emerald-400 font-bold">{leads.length} Real Buyers Found</span>
              </p>
            </div>
          </div>

          <Link href={`/dashboard/my-work/${id}/coach`}>
            <Button
              size="sm"
              className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Practice Pitch with AI Coach &rarr;
            </Button>
          </Link>
        </div>

        {/* Compliance & Safety Guarantee Banner */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              <strong className="text-white font-mono uppercase">100% Organic & Compliance Safe:</strong> These are real people who publicly stated this exact problem on public forums. No scraped private emails. You copy your kit's pitch, reply publicly or in-thread, and close on your terms.
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className={`text-xs font-mono h-8 ${filter === 'all' ? 'bg-emerald-500 text-black font-bold' : 'border-white/[0.1] text-slate-300'}`}
          >
            All Leads ({leads.length})
          </Button>
          <Button
            size="sm"
            variant={filter === 'high_intent' ? 'default' : 'outline'}
            onClick={() => setFilter('high_intent')}
            className={`text-xs font-mono h-8 ${filter === 'high_intent' ? 'bg-emerald-500 text-black font-bold' : 'border-white/[0.1] text-slate-300'}`}
          >
            High Intent 50%+ ({leads.filter(l => l.intentScore >= 50).length})
          </Button>
          <Button
            size="sm"
            variant={filter === 'shortlisted' ? 'default' : 'outline'}
            onClick={() => setFilter('shortlisted')}
            className={`text-xs font-mono h-8 ${filter === 'shortlisted' ? 'bg-emerald-500 text-black font-bold' : 'border-white/[0.1] text-slate-300'}`}
          >
            Shortlisted ({leads.filter(l => l.savedToShortlist).length})
          </Button>
        </div>

        {/* Leads Feed */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 font-mono">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-emerald-400 mb-2" />
            Scanning forum signals for active buyer intent...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-white/[0.1] rounded-2xl bg-white/[0.01]">
            <Users className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <h3 className="text-sm font-bold font-mono text-white">No buyer leads match this filter</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              The scraper worker is actively running search expansion queries across Reddit, Hacker News, and X.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(lead => (
              <Card
                key={lead.id}
                className="border border-white/[0.08] bg-black/40 backdrop-blur-md hover:border-emerald-500/40 transition-all rounded-xl"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
                    <div className="flex items-center gap-2.5">
                      <Badge className="bg-white/[0.06] text-white border-white/[0.1] font-mono text-[10px] uppercase font-bold px-2 py-0.5">
                        {lead.source}
                      </Badge>
                      <span className="text-xs font-mono text-cyan-400 font-semibold">@{lead.authorHandle}</span>
                      <a
                        href={lead.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        View Post <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        className={`font-mono text-xs font-bold px-2.5 py-0.5 ${
                          lead.intentScore >= 70
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : lead.intentScore >= 40
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                        }`}
                      >
                        <Flame className="w-3 h-3 mr-1 fill-current" />
                        {lead.intentScore}% Intent
                      </Badge>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateLead(lead.id, { savedToShortlist: !lead.savedToShortlist })}
                        className={`h-7 w-7 p-0 ${lead.savedToShortlist ? 'text-amber-400' : 'text-slate-500 hover:text-white'}`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </Button>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div>
                    {lead.postTitle && (
                      <h4 className="text-sm font-bold text-white font-mono mb-1">{lead.postTitle}</h4>
                    )}
                    <p className="text-xs text-slate-300 font-sans leading-relaxed bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
                      "{lead.postExcerpt}"
                    </p>
                  </div>

                  {/* Intent Reasons */}
                  {Array.isArray(lead.intentReasons) && lead.intentReasons.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Signals:</span>
                      {lead.intentReasons.map((r, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                        >
                          ✓ {r}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions & Contact Pathway */}
                  <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                      <span className="text-slate-500">Contact Pathway:</span>
                      <span className="text-slate-300">
                        {lead.contactMethods?.[0]?.how || 'Reply in-thread with value first'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => copyPitch(lead)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs h-8 px-3"
                      >
                        <Copy className="w-3 h-3 mr-1" /> Copy Pitch
                      </Button>

                      {lead.status !== 'PITCHED' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateLead(lead.id, { status: 'PITCHED' })}
                          className="border-white/[0.1] text-slate-300 hover:text-white font-mono text-xs h-8 px-3"
                        >
                          <Send className="w-3 h-3 mr-1 text-cyan-400" /> Mark Pitched
                        </Button>
                      ) : (
                        <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/30 font-mono text-xs px-2.5 py-1">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-cyan-400" /> Pitched
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Expansion Queries Monitor */}
        {queries.length > 0 && (
          <div className="pt-6 border-t border-white/[0.08] space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400" /> Automated Lead Expansion Queries ({queries.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {queries.map(q => (
                <div key={q.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-bold uppercase">{q.platform}</span>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">{q.status}</Badge>
                  </div>
                  <p className="text-white">"{q.query}"</p>
                  <p className="text-slate-500 text-[10px]">{q.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
