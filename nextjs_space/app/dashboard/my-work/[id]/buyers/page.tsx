'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { AgeBadge } from '@/components/ui/age-badge';
import { ExternalLink, Copy, Star, Check, MessageSquare } from 'lucide-react';
import { showToast } from '@/components/ui/toast';
import Link from 'next/link';

interface Lead {
  id: string;
  source: string;
  sourceUrl: string;
  authorHandle: string;
  postTitle: string | null;
  postExcerpt: string;
  postedAt: string;
  intentScore: number;
  intentReasons: string[];
  engagement: number;
  contactMethods: Array<{ channel: string; how: string; effort: string }>;
  status: string;
  savedToShortlist: boolean;
}

export default function BuyersPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const executionId = id;
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<'all' | 'shortlist' | 'high_intent'>('all');
  const [pitchTemplate, setPitchTemplate] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!executionId) return;
    fetch(`/api/execution/${executionId}/buyers`)
      .then(r => r.json())
      .then(d => {
        setLeads(d.leads ?? []);
        setPitchTemplate(d.pitchTemplate ?? '');
      })
      .finally(() => setLoading(false));
  }, [executionId]);

  const filtered = leads.filter(l => {
    if (filter === 'shortlist') return l.savedToShortlist;
    if (filter === 'high_intent') return l.intentScore >= 70;
    return true;
  });

  const shortlist = async (leadId: string, save: boolean) => {
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ savedToShortlist: save }),
    });
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, savedToShortlist: save } : l));
  };

  const markPitched = async (leadId: string, outcome?: string) => {
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PITCHED', outcome }),
    });
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'PITCHED' } : l));
    showToast('Marked as pitched — good luck!', 'success');
  };

  const copyPitch = (lead: Lead) => {
    // Auto-personalize the template
    const personalized = pitchTemplate
      ? pitchTemplate
          .replace(/\{\{first_name\}\}/g, lead.authorHandle)
          .replace(/\{\{their_specific_problem\}\}/g, lead.postTitle?.slice(0, 80) ?? '')
          .replace(/\{\{where\}\}/g, `${lead.source}`)
      : `Hey @${lead.authorHandle}, saw your post on ${lead.source} about ${lead.postTitle || 'this problem'}. We built an turnkey solution specifically for this.`;

    navigator.clipboard.writeText(personalized);
    showToast('Pitch copied — personalized for this lead', 'success');
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header
        title="Pre-Qualified Buyers"
        subtitle={`${leads.length} people who publicly asked for this. Sorted by buying intent.`}
      />

      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={filter === 'all' ? 'cyber' : 'outline'} size="sm" onClick={() => setFilter('all')}>
            All ({leads.length})
          </Button>
          <Button variant={filter === 'high_intent' ? 'cyber' : 'outline'} size="sm" onClick={() => setFilter('high_intent')}>
            High Intent (score ≥ 70)
          </Button>
          <Button variant={filter === 'shortlist' ? 'cyber' : 'outline'} size="sm" onClick={() => setFilter('shortlist')}>
            ⭐ Shortlist
          </Button>
          <Link href={`/dashboard/my-work/${executionId}/coach`} className="ml-auto">
            <Button variant="cyber-blue" size="sm">
              <MessageSquare className="h-3 w-3 mr-1" />
              Practice pitch first
            </Button>
          </Link>
        </div>

        {loading && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Loading buyer leads...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No leads match. Bot is discovering — check back in a few minutes.
          </div>
        )}

        {filtered.map(lead => (
          <Card key={lead.id} className="border-border/60 hover:border-[#00F0FF]/40 transition-all bg-card/40 backdrop-blur-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">{lead.source}</Badge>
                    <span className="text-xs font-medium text-foreground">@{lead.authorHandle}</span>
                    <IntentBadge score={lead.intentScore} />
                    {lead.status === 'PITCHED' && (
                      <Badge variant="cyber" className="text-[10px]">✓ Pitched</Badge>
                    )}
                  </div>
                  {lead.postTitle && <p className="text-sm font-medium mb-1 text-foreground">{lead.postTitle}</p>}
                  <p className="text-xs text-muted-foreground italic">"{lead.postExcerpt.slice(0, 240)}..."</p>
                </div>
                <button
                  onClick={() => shortlist(lead.id, !lead.savedToShortlist)}
                  className={`p-1 rounded transition-colors ${lead.savedToShortlist ? 'text-amber-400' : 'text-muted-foreground hover:text-amber-400'}`}
                  title={lead.savedToShortlist ? 'Remove from shortlist' : 'Add to shortlist'}
                >
                  <Star className={`h-4 w-4 ${lead.savedToShortlist ? 'fill-amber-400' : ''}`} />
                </button>
              </div>

              {lead.intentReasons && Array.isArray(lead.intentReasons) && (
                <div className="flex flex-wrap gap-1">
                  {lead.intentReasons.slice(0, 4).map((r, i) => (
                    <Badge key={i} variant="cyber-blue" className="text-[9px]">{r}</Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <AgeBadge date={lead.postedAt} />
                  <span>↑ {lead.engagement}</span>
                </div>
                <div className="flex gap-1.5">
                  <a href={lead.sourceUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="text-[10px] h-7">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View post
                    </Button>
                  </a>
                  <Button
                    variant="cyber-blue"
                    size="sm"
                    className="text-[10px] h-7"
                    onClick={() => copyPitch(lead)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy pitch
                  </Button>
                  <Button
                    variant="cyber"
                    size="sm"
                    className="text-[10px] h-7"
                    onClick={() => markPitched(lead.id)}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    I pitched
                  </Button>
                </div>
              </div>

              {/* Contact method hints */}
              {lead.contactMethods?.[0] && (
                <div className="text-[10px] text-muted-foreground bg-muted/30 rounded p-2">
                  <strong className="text-foreground">How to reach:</strong> {lead.contactMethods[0].how}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function IntentBadge({ score }: { score: number }) {
  if (score >= 80) return <Badge variant="cyber" className="text-[9px]">🔥 {score} intent</Badge>;
  if (score >= 60) return <Badge variant="cyber-yellow" className="text-[9px]">⚡ {score} intent</Badge>;
  return <Badge variant="secondary" className="text-[9px]">{score} intent</Badge>;
}
