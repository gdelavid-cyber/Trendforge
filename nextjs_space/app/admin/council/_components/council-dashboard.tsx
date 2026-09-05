'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Flame,
  ArrowRight
} from 'lucide-react';

interface AgentDialogue {
  agentName: string;
  role: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  perspective: string;
  keyMetric?: string;
  recommendation: string;
}

interface CouncilSessionItem {
  id: string;
  status: string;
  signal: any;
  debateTranscript: AgentDialogue[];
  gatekeeperScore: number | null;
  gatekeeperFeedback: any;
  conclusion: any;
  userModeActive: boolean;
  createdAt: string;
  updatedAt: string;
  proposals?: any[];
  adminReviews?: any[];
}

export function CouncilDashboard({ userModeEnabled }: { userModeEnabled: boolean }) {
  const [sessions, setSessions] = useState<CouncilSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<{ [id: string]: string }>({});
  const [submittingReview, setSubmittingReview] = useState<string | null>(null);

  // Trigger form state
  const [triggering, setTriggering] = useState(false);
  const [signalTitle, setSignalTitle] = useState('AI Voice Copilot for High-Ticket B2B Sales');
  const [signalSource, setSignalSource] = useState('Twitter / ProductHunt / Reddit');
  const [estimatedMargin, setEstimatedMargin] = useState('85%');
  const [estimatedVelocity, setEstimatedVelocity] = useState('3-5 days to MVP');
  const [triggerResult, setTriggerResult] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/council/pending');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        if (data.sessions && data.sessions.length > 0 && !expandedSession) {
          setExpandedSession(data.sessions[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load council sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleTriggerDebate = async (e: React.FormEvent) => {
    e.preventDefault();
    setTriggering(true);
    setTriggerResult(null);

    try {
      const res = await fetch('/api/admin/council/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signal: {
            title: signalTitle,
            source: signalSource,
            estimatedMargin,
            estimatedVelocity,
            timestamp: new Date().toISOString()
          }
        })
      });

      const data = await res.json();
      if (res.ok) {
        setTriggerResult(`Debate completed! Score: ${data.session.gatekeeperScore}/100. Status: ${data.session.status}`);
        await fetchSessions();
        if (data.session?.id) {
          setExpandedSession(data.session.id);
        }
      } else {
        setTriggerResult(`Error: ${data.error || 'Trigger failed'}`);
      }
    } catch (err: any) {
      setTriggerResult(`Error: ${err.message}`);
    } finally {
      setTriggering(false);
    }
  };

  const handleReview = async (sessionId: string, decision: 'approved' | 'rejected' | 'needs_more_debate') => {
    setSubmittingReview(sessionId);
    try {
      const notes = reviewNotes[sessionId] || '';
      const res = await fetch('/api/admin/council/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          decision,
          reviewNotes: notes
        })
      });

      if (res.ok) {
        await fetchSessions();
      } else {
        const data = await res.json();
        alert(`Review action failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Review error: ${err.message}`);
    } finally {
      setSubmittingReview(null);
    }
  };

  const getAgentBadge = (name: string) => {
    switch (name) {
      case 'Trend Hunter':
        return { icon: <TrendingUp className="w-3.5 h-3.5" />, color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
      case 'Unit Economist':
        return { icon: <DollarSign className="w-3.5 h-3.5" />, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'Operator':
        return { icon: <Wrench className="w-3.5 h-3.5" />, color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'Contrarian':
        return { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      case 'Closer':
        return { icon: <Flame className="w-3.5 h-3.5" />, color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      default:
        return { icon: <Users className="w-3.5 h-3.5" />, color: 'bg-slate-500/10 text-slate-400 border-slate-500/30' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner: Mode Indicator */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        userModeEnabled 
          ? 'bg-amber-950/30 border-amber-500/40 text-amber-200' 
          : 'bg-slate-900/80 border-slate-700/60 text-slate-300'
      }`}>
        <div className="flex items-center gap-3">
          {userModeEnabled ? (
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-white">
                {userModeEnabled ? 'USER-FACING MODE ACTIVE' : 'INTERNAL MODE ACTIVE (Admin-Only)'}
              </h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
                userModeEnabled 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                COUNCIL_USER_MODE_ENABLED={userModeEnabled ? 'true' : 'false'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {userModeEnabled
                ? 'Approved Council proposals will automatically be published to the public /api/hot-trends feed. Debates stay internal.'
                : 'Debates and proposals are strictly quarantined to admin view. Regular users see zero Council discovery data.'}
            </p>
          </div>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-md border border-slate-800">
          Gatekeeper Threshold: <span className="text-emerald-400 font-bold">80/100</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Trigger Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-white text-base">Trigger Money Council Debate</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Inject a raw market signal to dispatch the 5 specialist agents (Trend Hunter, Unit Economist, Operator, Contrarian, Closer) and receive the Gatekeeper verdict.
            </p>

            <form onSubmit={handleTriggerDebate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Signal / Opportunity Name</label>
                <input
                  type="text"
                  value={signalTitle}
                  onChange={(e) => setSignalTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Signal Source</label>
                <input
                  type="text"
                  value={signalSource}
                  onChange={(e) => setSignalSource(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Est. Margin</label>
                  <input
                    type="text"
                    value={estimatedMargin}
                    onChange={(e) => setEstimatedMargin(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">MVP Velocity</label>
                  <input
                    type="text"
                    value={estimatedVelocity}
                    onChange={(e) => setEstimatedVelocity(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={triggering}
                className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/50 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition"
              >
                {triggering ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    5 Agents Debating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Convene Money Council
                  </>
                )}
              </button>

              {triggerResult && (
                <div className={`p-2.5 rounded-lg text-xs ${
                  triggerResult.startsWith('Error') 
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                    : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                }`}>
                  {triggerResult}
                </div>
              )}
            </form>
          </div>

          {/* Quick Guide Card */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 space-y-2">
            <h4 className="font-semibold text-slate-200">How The 5 Agents Score:</h4>
            <ul className="space-y-1.5 pl-3 list-disc">
              <li><strong className="text-cyan-400">Trend Hunter:</strong> Assesses momentum & decay curve.</li>
              <li><strong className="text-emerald-400">Unit Economist:</strong> Models gross margin, CAC, and pricing.</li>
              <li><strong className="text-blue-400">Operator:</strong> Evaluates engineering lift & execution friction.</li>
              <li><strong className="text-rose-400">Contrarian:</strong> Identifies regulatory, platform, & churn risks.</li>
              <li><strong className="text-amber-400">Closer:</strong> Verifies monetization channel & speed to transaction.</li>
            </ul>
          </div>
        </div>

        {/* Right Columns: Council Sessions Review Cockpit */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white text-lg">Council Review Stream</h3>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                {sessions.length} sessions
              </span>
            </div>
            <button
              onClick={fetchSessions}
              disabled={loading}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No council sessions pending or recorded.</p>
              <p className="text-xs text-slate-600 mt-1">Convene a debate on the left to start generating proposals.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((sess) => {
                const isExpanded = expandedSession === sess.id;
                const score = sess.gatekeeperScore ?? 0;
                const passedGatekeeper = score >= 80;
                const isPendingReview = sess.status === 'admin_review';

                return (
                  <div 
                    key={sess.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden transition"
                  >
                    {/* Header Row */}
                    <div 
                      onClick={() => setExpandedSession(isExpanded ? null : sess.id)}
                      className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/40"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono px-2 py-0.5 rounded font-semibold ${
                            sess.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            sess.status === 'rejected' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                            sess.status === 'admin_review' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {sess.status.toUpperCase()}
                          </span>
                          <h4 className="font-semibold text-white text-sm">
                            {sess.signal?.title || 'Signal Proposal'}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400">
                          Created {new Date(sess.createdAt).toLocaleString()} · Source: {sess.signal?.source || 'N/A'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <div className="text-xs text-slate-400">Gatekeeper</div>
                          <div className={`text-sm font-bold font-mono ${
                            passedGatekeeper ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            {score}/100
                          </div>
                        </div>
                        <div className="text-slate-500">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Detail Body */}
                    {isExpanded && (
                      <div className="border-t border-slate-800/80 p-5 bg-slate-950/40 space-y-6">
                        {/* Gatekeeper Card */}
                        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                              Gatekeeper Evaluation
                            </span>
                            <span className={`text-xs font-semibold ${
                              passedGatekeeper ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {passedGatekeeper ? 'Advanced to Admin Review' : 'Filter Stopped Below 80'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                            <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                              <div className="text-slate-500 text-[10px]">Feasibility</div>
                              <div className="text-xs font-bold text-slate-200">
                                {sess.gatekeeperFeedback?.breakdown?.feasibility ?? '—'}/100
                              </div>
                            </div>
                            <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                              <div className="text-slate-500 text-[10px]">Unit Economics</div>
                              <div className="text-xs font-bold text-slate-200">
                                {sess.gatekeeperFeedback?.breakdown?.unitEconomics ?? '—'}/100
                              </div>
                            </div>
                            <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                              <div className="text-slate-500 text-[10px]">Market Demand</div>
                              <div className="text-xs font-bold text-slate-200">
                                {sess.gatekeeperFeedback?.breakdown?.marketDemand ?? '—'}/100
                              </div>
                            </div>
                            <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                              <div className="text-slate-500 text-[10px]">Risk Score</div>
                              <div className="text-xs font-bold text-amber-300">
                                {sess.gatekeeperFeedback?.breakdown?.risk ?? '—'}/100
                              </div>
                            </div>
                          </div>

                          {sess.gatekeeperFeedback?.riskFlags?.length > 0 && (
                            <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded">
                              <span className="font-semibold block mb-1">Flagged Risks:</span>
                              <ul className="list-disc pl-4 space-y-0.5">
                                {sess.gatekeeperFeedback.riskFlags.map((rf: string, idx: number) => (
                                  <li key={idx}>{rf}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* 5-Agent Debate Stream */}
                        <div className="space-y-3">
                          <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                            Council Deliberation Transcript
                          </h5>
                          <div className="space-y-2.5">
                            {Array.isArray(sess.debateTranscript) && sess.debateTranscript.map((dia, idx) => {
                              const badge = getAgentBadge(dia.agentName);
                              return (
                                <div 
                                  key={idx} 
                                  className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 text-xs space-y-1.5"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`px-2 py-0.5 rounded-full border flex items-center gap-1 font-medium ${badge.color}`}>
                                        {badge.icon}
                                        {dia.agentName}
                                      </span>
                                      <span className="text-slate-500 text-[11px]">{dia.role}</span>
                                    </div>
                                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase ${
                                      dia.sentiment === 'bullish' ? 'bg-emerald-500/20 text-emerald-300' :
                                      dia.sentiment === 'bearish' ? 'bg-rose-500/20 text-rose-300' :
                                      'bg-slate-800 text-slate-400'
                                    }`}>
                                      {dia.sentiment}
                                    </span>
                                  </div>

                                  <p className="text-slate-300 leading-relaxed pl-1">
                                    {dia.perspective}
                                  </p>

                                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-1.5 mt-1">
                                    <div>
                                      <strong className="text-slate-400">Rec:</strong> {dia.recommendation}
                                    </div>
                                    {dia.keyMetric && (
                                      <div className="font-mono text-emerald-400">
                                        {dia.keyMetric}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Admin Action Bar */}
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                          <label className="block text-xs font-semibold text-slate-300">
                            Admin Decision & Directives
                          </label>
                          <textarea
                            value={reviewNotes[sess.id] || ''}
                            onChange={(e) => setReviewNotes({ ...reviewNotes, [sess.id]: e.target.value })}
                            placeholder="Add strategic guidelines, execution constraints, or feedback..."
                            className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 h-16"
                          />

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <div className="text-[11px] text-slate-400">
                              {userModeEnabled ? (
                                <span className="text-amber-400 font-medium">
                                  ⚡ Approving will auto-publish this to user-facing /api/hot-trends feed.
                                </span>
                              ) : (
                                <span className="text-emerald-400 font-medium">
                                  🔒 Approving will keep this as an internal admin-only playbook.
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleReview(sess.id, 'rejected')}
                                disabled={submittingReview === sess.id}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 flex items-center gap-1 transition"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Reject
                              </button>
                              <button
                                onClick={() => handleReview(sess.id, 'needs_more_debate')}
                                disabled={submittingReview === sess.id}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Needs More Debate
                              </button>
                              <button
                                onClick={() => handleReview(sess.id, 'approved')}
                                disabled={submittingReview === sess.id}
                                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {userModeEnabled ? 'Approve & Publish to Users' : 'Approve Internally'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
