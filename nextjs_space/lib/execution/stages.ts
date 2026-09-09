import type { Trend, RawSignal } from '@prisma/client';

export interface StageContext {
  trend: Trend & { signals: RawSignal[] };
  priorOutputs: Record<string, unknown>;
}

export interface StageDefinition {
  key: string;
  ordinal: number;
  label: string;
  description: string;
  buildPrompt: (ctx: StageContext) => { system: string; user: string };
  validate: (output: unknown) => { ok: boolean; reason?: string };
  fallback: (ctx: StageContext) => Record<string, unknown>;
  temperature: number;
}

const STYLE_RULES = `
WRITING RULES (non-negotiable):
- Banned words/phrases: delve, testament, streamline, seamless, robust, leverage (as verb),
  synergy, game-changer, cutting-edge, revolutionize, "in today's landscape", "look no further",
  "I hope this finds you well", "unlock", "elevate", "supercharge", "moreover", "furthermore".
- Write like a competent peer typing quickly. Varied sentence length. Contractions. Occasional lowercase.
- Be concrete: real numbers, real tool names, real timeframes. Never hedge with "various" or "several".
- No em-dashes used as dramatic pauses. No tricolon lists ("faster, cheaper, better").
- Physical action discipline: No abstract steps like "research the market" or "plan strategy".
  Every action must specify an exact tool, URL, or physical deliverable.
`;

function signalDigest(ctx: StageContext, n = 12): string {
  return ctx.trend.signals
    .slice(0, n)
    .map(
      (s) =>
        `- [${s.source}${s.subreddit ? `/${s.subreddit}` : ''}, ${s.upvotes ?? s.score ?? 0}↑ ${s.comments}💬] ${s.title}${s.url ? ` (${s.url})` : ''}`
    )
    .join('\n');
}

function sourceSpread(ctx: StageContext): string[] {
  return Array.from(new Set(ctx.trend.signals.map((s) => s.source)));
}

function extractSignalUrls(ctx: StageContext): string[] {
  return ctx.trend.signals
    .map((s) => s.url)
    .filter((u): u is string => typeof u === 'string' && u.startsWith('http'));
}

/**
 * Generates an interactive, zero-dependency HTML5 slideshow/karaoke video preview player.
 * Embedded directly inside an iframe srcDoc.
 */
export function generatePlayableHtml(previewData: unknown): string {
  const data = (previewData ?? {}) as {
    storyboard_frames?: Array<{
      frame_num: number;
      duration_sec: number;
      headline: string;
      subtitle: string;
      visual_cue: string;
      audio_script: string;
    }>;
    voiceover_script?: string;
  };

  const frames =
    Array.isArray(data.storyboard_frames) && data.storyboard_frames.length > 0
      ? data.storyboard_frames
      : [
          {
            frame_num: 1,
            duration_sec: 4,
            headline: 'The Problem You Feel Every Day',
            subtitle: 'Manual workflows draining hours of billable focus',
            visual_cue: 'Terminal screen with error logs and manual data entry bottleneck',
            audio_script: 'If you are tired of spending hours manually piecing together fragmented tools, this changes today.',
          },
          {
            frame_num: 2,
            duration_sec: 5,
            headline: 'The Engineered Solution',
            subtitle: 'Automated ingestion and real-time execution in one pipeline',
            visual_cue: 'Clean telemetry dashboard lighting up with live processed signals',
            audio_script: 'We built a purpose-driven engine that eliminates the friction entirely without complex migrations.',
          },
          {
            frame_num: 3,
            duration_sec: 4,
            headline: 'Zero Upfront Risk',
            subtitle: 'Fixed scope. Working deliverable or zero charge.',
            visual_cue: 'Checklist of verified results and instant handover documentation',
            audio_script: 'Fixed timeline, verified output, and you pay only after the deliverable is verified working.',
          },
        ];

  const totalDuration = frames.reduce((acc, f) => acc + (f.duration_sec || 4), 0);
  const safeJson = JSON.stringify(frames).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Video Preview</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #090d16; color: #f8fafc; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
    .player-container { flex: 1; display: flex; flex-direction: column; height: 100%; position: relative; }
    .stage { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; position: relative; background: radial-gradient(circle at 50% 40%, #172554 0%, #090d16 100%); overflow: hidden; text-align: center; }
    .stage::before { content: ""; position: absolute; inset: 0; background-image: radial-gradient(rgba(56, 189, 248, 0.08) 1px, transparent 1px); background-size: 24px 24px; pointer-events: none; }
    .frame-badge { display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px; border-radius: 9999px; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; z-index: 2; }
    .headline { font-size: 24px; font-weight: 800; max-width: 640px; line-height: 1.25; margin-bottom: 8px; color: #ffffff; text-shadow: 0 2px 12px rgba(0,0,0,0.6); z-index: 2; }
    .subtitle { font-size: 14px; font-weight: 500; color: #94a3b8; max-width: 540px; margin-bottom: 16px; z-index: 2; }
    .visual-box { width: 92%; max-width: 580px; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 10px; padding: 12px 18px; margin-bottom: 14px; backdrop-filter: blur(10px); box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: left; z-index: 2; }
    .visual-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 4px; }
    .visual-cue { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; color: #38bdf8; line-height: 1.4; }
    .karaoke-box { width: 92%; max-width: 640px; background: rgba(0, 0, 0, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px 16px; z-index: 2; min-height: 60px; display: flex; align-items: center; justify-content: center; }
    .karaoke-text { font-size: 14px; line-height: 1.5; color: #64748b; font-weight: 500; }
    .karaoke-word { display: inline; transition: color 0.15s ease, font-weight 0.15s ease; }
    .karaoke-word.lit { color: #f8fafc; font-weight: 700; text-shadow: 0 0 8px rgba(56, 189, 248, 0.5); }
    .controls { height: 56px; background: #080c14; border-top: 1px solid #1e293b; display: flex; align-items: center; padding: 0 16px; gap: 14px; z-index: 10; }
    .play-btn { width: 34px; height: 34px; border-radius: 50%; background: #38bdf8; border: none; color: #090d16; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 14px; font-weight: bold; transition: transform 0.15s, background 0.15s; }
    .play-btn:hover { background: #7dd3fc; transform: scale(1.05); }
    .time { font-family: monospace; font-size: 11px; color: #94a3b8; min-width: 65px; }
    .progress-bar { flex: 1; height: 6px; background: #1e293b; border-radius: 3px; position: relative; cursor: pointer; }
    .progress-fill { height: 100%; background: #38bdf8; width: 0%; border-radius: 3px; }
    .frame-tabs { display: flex; gap: 6px; margin-left: auto; }
    .frame-tab { padding: 3px 8px; font-size: 10px; font-weight: 600; border-radius: 4px; border: 1px solid #334155; background: #0f172a; color: #94a3b8; cursor: pointer; }
    .frame-tab.active { border-color: #38bdf8; color: #38bdf8; background: rgba(56, 189, 248, 0.1); }
  </style>
</head>
<body>
  <div class="player-container">
    <div class="stage">
      <div class="frame-badge" id="badge">SCENE 1 / ${frames.length}</div>
      <div class="headline" id="headline"></div>
      <div class="subtitle" id="subtitle"></div>
      <div class="visual-box">
        <div class="visual-label">Storyboard Visual Cue</div>
        <div class="visual-cue" id="visualCue"></div>
      </div>
      <div class="karaoke-box">
        <div class="karaoke-text" id="karaokeText"></div>
      </div>
    </div>
    <div class="controls">
      <button class="play-btn" id="playBtn">▶</button>
      <div class="time" id="timeDisplay">0:00 / 0:${totalDuration.toString().padStart(2, '0')}</div>
      <div class="progress-bar" id="progressBar">
        <div class="progress-fill" id="progressFill"></div>
      </div>
      <div class="frame-tabs" id="frameTabs"></div>
    </div>
  </div>

  <script>
    const frames = ${safeJson};
    let currentFrameIdx = 0;
    let isPlaying = false;
    let elapsedSec = 0;
    let timer = null;
    const totalSec = ${totalDuration};

    let cum = 0;
    const ranges = frames.map(f => {
      const start = cum;
      cum += (f.duration_sec || 4);
      return { start, end: cum, frame: f };
    });

    const playBtn = document.getElementById('playBtn');
    const timeDisplay = document.getElementById('timeDisplay');
    const progressFill = document.getElementById('progressFill');
    const progressBar = document.getElementById('progressBar');
    const badge = document.getElementById('badge');
    const headline = document.getElementById('headline');
    const subtitle = document.getElementById('subtitle');
    const visualCue = document.getElementById('visualCue');
    const karaokeText = document.getElementById('karaokeText');
    const frameTabs = document.getElementById('frameTabs');

    frames.forEach((f, i) => {
      const b = document.createElement('button');
      b.className = 'frame-tab' + (i === 0 ? ' active' : '');
      b.textContent = 'S' + (i + 1);
      b.onclick = () => jumpToFrame(i);
      frameTabs.appendChild(b);
    });

    function renderFrame(idx, subSec) {
      currentFrameIdx = idx;
      const f = frames[idx];
      badge.textContent = 'SCENE ' + (idx + 1) + ' / ' + frames.length + ' (' + f.duration_sec + 's)';
      headline.textContent = f.headline;
      subtitle.textContent = f.subtitle;
      visualCue.textContent = f.visual_cue;

      const words = (f.audio_script || '').split(/\\s+/);
      const frac = Math.min(1, Math.max(0, subSec / (f.duration_sec || 4)));
      const litCount = Math.floor(words.length * frac);

      karaokeText.innerHTML = words.map((w, wi) => 
        '<span class="karaoke-word ' + (wi <= litCount ? 'lit' : '') + '">' + w + ' </span>'
      ).join('');

      Array.from(frameTabs.children).forEach((t, i) => {
        t.className = 'frame-tab' + (i === idx ? ' active' : '');
      });
    }

    function updateTimeUI() {
      const curM = Math.floor(elapsedSec / 60);
      const curS = Math.floor(elapsedSec % 60);
      const totM = Math.floor(totalSec / 60);
      const totS = Math.floor(totalSec % 60);
      timeDisplay.textContent = curM + ':' + curS.toString().padStart(2, '0') + ' / ' + totM + ':' + totS.toString().padStart(2, '0');
      const pct = Math.min(100, (elapsedSec / totalSec) * 100);
      progressFill.style.width = pct + '%';
    }

    function tick() {
      if (!isPlaying) return;
      elapsedSec += 0.1;
      if (elapsedSec >= totalSec) {
        elapsedSec = totalSec;
        pause();
      }
      let targetIdx = 0;
      let frameSubSec = 0;
      for (let i = 0; i < ranges.length; i++) {
        if (elapsedSec >= ranges[i].start && elapsedSec <= ranges[i].end) {
          targetIdx = i;
          frameSubSec = elapsedSec - ranges[i].start;
          break;
        }
      }
      renderFrame(targetIdx, frameSubSec);
      updateTimeUI();
    }

    function play() {
      if (elapsedSec >= totalSec) elapsedSec = 0;
      isPlaying = true;
      playBtn.textContent = '⏸';
      timer = setInterval(tick, 100);
    }

    function pause() {
      isPlaying = false;
      playBtn.textContent = '▶';
      if (timer) clearInterval(timer);
    }

    function jumpToFrame(i) {
      elapsedSec = ranges[i].start;
      renderFrame(i, 0);
      updateTimeUI();
    }

    playBtn.onclick = () => {
      if (isPlaying) pause(); else play();
    };

    progressBar.onclick = (e) => {
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      elapsedSec = pct * totalSec;
      let targetIdx = 0;
      for (let i = 0; i < ranges.length; i++) {
        if (elapsedSec >= ranges[i].start && elapsedSec <= ranges[i].end) {
          targetIdx = i;
          break;
        }
      }
      renderFrame(targetIdx, elapsedSec - ranges[targetIdx].start);
      updateTimeUI();
    };

    renderFrame(0, 0);
    updateTimeUI();
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------- 1. RESEARCH

const research: StageDefinition = {
  key: 'research',
  ordinal: 1,
  label: 'Research & Evidence',
  description: 'Evidence brief, competitor breakdown, and operational boundaries',
  temperature: 0.4,
  buildPrompt: (ctx) => ({
    system: `You are a forensic market research analyst. You extract verifiable market signals, breakdown existing competitors, and identify hard operational boundaries (what to do vs what never to do).

${STYLE_RULES}

Output JSON only:
{
  "evidence_brief": {
    "summary": string,
    "volume_analysis": string,
    "core_pain_points": string[],
    "market_timing": string
  },
  "competitors": [
    {
      "name": string,
      "url": string,
      "what_they_do": string,
      "pricing_estimate": string,
      "critical_flaw": string
    }
  ],
  "do_and_dont": {
    "do": string[],
    "dont": string[]
  },
  "open_questions": [
    {
      "question": string,
      "answered_by_evidence": string
    }
  ]
}

Ensure at least 2 competitors are analyzed with realistic URLs, pricing, and critical flaws. Provide at least 3 concrete DOs and 3 concrete DONTs.`,
    user: `Trend: "${ctx.trend.name}"
Category: ${ctx.trend.category}
Corroborating sources: ${sourceSpread(ctx).join(', ')} (${ctx.trend.signals.length} signals)

Raw signal evidence:
${signalDigest(ctx, 15)}

Perform the research analysis. Extract genuine pain points from those quotes.`,
  }),
  validate: (o) => {
    const d = o as {
      evidence_brief?: { summary?: string; core_pain_points?: unknown[] };
      competitors?: unknown[];
      do_and_dont?: { do?: unknown[]; dont?: unknown[] };
    };
    if (!d.evidence_brief?.summary || !Array.isArray(d.evidence_brief.core_pain_points))
      return { ok: false, reason: 'missing evidence_brief.summary or core_pain_points' };
    if (!Array.isArray(d.competitors) || d.competitors.length < 1)
      return { ok: false, reason: 'need >=1 competitor' };
    if (!Array.isArray(d.do_and_dont?.do) || !Array.isArray(d.do_and_dont?.dont))
      return { ok: false, reason: 'missing do_and_dont lists' };
    return { ok: true };
  },
  fallback: (ctx) => ({
    evidence_brief: {
      summary: `Market demand for ${ctx.trend.name} is evidenced by ${ctx.trend.signals.length} verified signals across ${sourceSpread(ctx).join(', ')}. Users consistently report operational friction, manual data overhead, and poor tooling integration.`,
      volume_analysis: `${ctx.trend.signals.length} active threads across ${sourceSpread(ctx).length} communities in the current 72h harvest window.`,
      core_pain_points: [
        `Manual repetitive execution in ${ctx.trend.category} causing lost hours`,
        'Existing solutions charge enterprise rates without providing simple turnkey results',
        'Lack of clear handover documentation and verified SLAs',
      ],
      market_timing: 'High intent: users are publicly seeking solutions now before standardizing workflows.',
    },
    competitors: [
      {
        name: 'Legacy Custom Agencies',
        url: 'https://google.com/search?q=' + encodeURIComponent(`${ctx.trend.category} agency`),
        what_they_do: 'Bill hourly for manual integration sprints with vague deliverables',
        pricing_estimate: '$3,000 - $8,000 upfront',
        critical_flaw: 'Slow turnaround (4-8 weeks), non-transparent scopes, zero money-back guarantee',
      },
      {
        name: 'Generic SaaS Plugins',
        url: 'https://zapier.com/apps',
        what_they_do: 'Low-code connector recipes that still require extensive configuration',
        pricing_estimate: '$49 - $199/month',
        critical_flaw: 'Breaks on edge cases, requires buyer to configure and debug their own system',
      },
    ],
    do_and_dont: {
      do: [
        'Quote the buyer\'s exact language back to them in your initial outreach',
        'Offer a 100% money-back guarantee with zero upfront deposit for the first 3 clients',
        'Provide a 10-day fixed delivery sprint with clear scope boundaries',
      ],
      dont: [
        'Never sell "consulting" or open-ended hourly retainers',
        'Never automate message sending without human approval gates',
        'Never claim features before they are tested against real user inputs',
      ],
    },
    open_questions: [
      {
        question: 'Will buyers pay for an external sprint vs building internally?',
        answered_by_evidence: 'Yes, because the signals indicate teams lack bandwidth to triage this themselves.',
      },
    ],
    _degraded: true,
  }),
};

// ---------------------------------------------------------------- 2. BRAINSTORM

const brainstorm: StageDefinition = {
  key: 'brainstorm',
  ordinal: 2,
  label: 'Brainstorm & Angles',
  description: '4 monetization angles with cited URLs, kill risks, and physical next actions',
  temperature: 0.65,
  buildPrompt: (ctx) => {
    const urls = extractSignalUrls(ctx).slice(0, 10);
    return {
      system: `You are a pragmatic product strategist. You generate 4 monetization angles for a verified market trend.
Every angle must include real cited URLs from the source evidence, a hard kill risk, and at least 5 concrete physical next actions (e.g. "Register account at https://...", "Deploy template to Vercel", "Send 5 verified DMs").

${STYLE_RULES}

Output JSON only:
{
  "angles": [
    {
      "name": string,
      "one_liner": string,
      "who_pays": string,
      "what_they_pay_for": string,
      "model": "one-off" | "retainer" | "subscription" | "usage" | "commission",
      "price_point_usd": number,
      "speed_to_revenue_days": number,
      "competition_density": "empty" | "thin" | "crowded" | "saturated",
      "why_now": string,
      "kill_risk": string,
      "score": number,
      "cited_urls": string[],
      "next_actions": string[]
    }
  ],
  "recommended_index": number,
  "recommendation_reason": string
}

CRITICAL CONSTRAINTS:
- Generate exactly 4 angles.
- cited_urls in the recommended angle MUST contain at least 3 URLs from the provided signal URLs.
- next_actions in the recommended angle MUST contain at least 5 physical, concrete actions. No abstract planning.`,
      user: `Trend: "${ctx.trend.name}"
Category: ${ctx.trend.category}
Verified Signal URLs:
${urls.length > 0 ? urls.join('\n') : 'https://reddit.com/r/smallbusiness\nhttps://news.ycombinator.com\nhttps://producthunt.com'}

Signal text:
${signalDigest(ctx, 10)}

Generate the 4 angles with cited URLs and physical next actions.`,
    };
  },
  validate: (o) => {
    const d = o as {
      angles?: Array<{ cited_urls?: unknown[]; next_actions?: unknown[] }>;
      recommended_index?: number;
    };
    if (!Array.isArray(d.angles) || d.angles.length < 2)
      return { ok: false, reason: 'need >=2 angles' };
    if (typeof d.recommended_index !== 'number' || d.recommended_index < 0 || d.recommended_index >= d.angles.length)
      return { ok: false, reason: 'recommended_index out of range' };
    
    const chosen = d.angles[d.recommended_index];
    const allUrls = d.angles.flatMap((a) => (Array.isArray(a.cited_urls) ? a.cited_urls : []));
    if (allUrls.length < 3)
      return { ok: false, reason: 'need >=3 cited_urls across angles' };
    if (!Array.isArray(chosen.next_actions) || chosen.next_actions.length < 5)
      return { ok: false, reason: 'recommended angle requires >=5 concrete next_actions' };
    return { ok: true };
  },
  fallback: (ctx) => {
    const signalUrls = extractSignalUrls(ctx);
    const validUrls = signalUrls.length >= 3 ? signalUrls.slice(0, 3) : [
      'https://reddit.com/r/smallbusiness',
      'https://news.ycombinator.com',
      'https://producthunt.com',
    ];

    return {
      angles: [
        {
          name: `Done-for-you ${ctx.trend.name} Sprint`,
          one_liner: `Solve ${ctx.trend.name} for teams actively posting complaints, delivered in a 7-day sprint.`,
          who_pays: 'Operators and founders experiencing this manual bottleneck',
          what_they_pay_for: 'Turnkey resolution without having to hire or waste internal dev hours',
          model: 'one-off',
          price_point_usd: 1250,
          speed_to_revenue_days: 7,
          competition_density: 'thin',
          why_now: `${ctx.trend.signals.length} corroborating signals in the last harvest window`,
          kill_risk: 'High touch fulfillment; must productize scope into standard steps after client #3',
          score: 82,
          cited_urls: validUrls,
          next_actions: [
            'Create a free Stripe account at https://dashboard.stripe.com/register for invoice generation',
            'Draft the 3-step one-pager summarizing the fix and export to PDF or web link',
            'Post direct value reply to 3 cited signal threads offering the free diagnostic breakdown',
            'Collect confirmation and send Stripe payment link for 50% kickoff deposit',
            'Deliver completed handover document with 14 days of async support',
          ],
        },
        {
          name: `${ctx.trend.name} Managed Retainer`,
          one_liner: 'Continuous weekly maintenance and optimization for businesses with recurring volume.',
          who_pays: 'Growing companies with recurring instances of this problem',
          what_they_pay_for: 'Peace of mind and guaranteed same-day response SLA',
          model: 'retainer',
          price_point_usd: 499,
          speed_to_revenue_days: 14,
          competition_density: 'thin',
          why_now: 'Consistent weekly recurring pain points mentioned in forum discussions',
          kill_risk: 'Scope creep; requires strict SLA definitions',
          score: 68,
          cited_urls: validUrls,
          next_actions: [
            'Set up Calendly booking link at https://calendly.com for 20-minute scope triage',
            'Create a recurring Stripe subscription product titled "Monthly Support"',
            'Reach out to founders who engaged with the one-pager sprint',
            'Deliver weekly digest report showing hours saved and errors prevented',
            'Establish automated alerting via Slack or Discord webhook',
          ],
        },
      ],
      recommended_index: 0,
      recommendation_reason:
        'Fixed-scope sprint reaches revenue fastest (7 days) and validates willingness to pay with zero build overhead.',
      _degraded: true,
    };
  },
};

// ---------------------------------------------------------------- 3. WORK PLAN

const workPlan: StageDefinition = {
  key: 'work_plan',
  ordinal: 3,
  label: 'Work Plan & Tooling',
  description: 'Required tools, honest account guidance, timeline, and execution steps',
  temperature: 0.4,
  buildPrompt: (ctx) => ({
    system: `You are an operations architect. You translate a chosen business angle into a concrete work plan.
Be totally honest about tooling boundaries: the user creates their own accounts and inputs their own keys. The agent configures templates and drafts assets.

${STYLE_RULES}

Output JSON only:
{
  "tools": [
    {
      "name": string,
      "purpose": string,
      "cost_usd_per_mo": number,
      "url": string
    }
  ],
  "accounts_you_create": [
    {
      "service": string,
      "url": string,
      "user_action": string,
      "agent_action": string
    }
  ],
  "estimated_hours_to_launch": number,
  "blockers_to_clear": string[],
  "step_by_step_plan": [
    {
      "step": number,
      "title": string,
      "duration_hours": number,
      "owner": "user" | "agent",
      "instructions": string
    }
  ]
}

Provide at least 2 required accounts with exact signup links, and at least 4 numbered steps.`,
    user: `Brainstorm angle:
${JSON.stringify(ctx.priorOutputs.brainstorm ?? {}, null, 2)}

Trend: "${ctx.trend.name}" (${ctx.trend.category})

Build the operational work plan. Be precise on links and user vs agent duties.`,
  }),
  validate: (o) => {
    const d = o as {
      tools?: unknown[];
      accounts_you_create?: unknown[];
      step_by_step_plan?: unknown[];
    };
    if (!Array.isArray(d.accounts_you_create) || d.accounts_you_create.length < 1)
      return { ok: false, reason: 'missing accounts_you_create' };
    if (!Array.isArray(d.step_by_step_plan) || d.step_by_step_plan.length < 2)
      return { ok: false, reason: 'need >=2 steps in step_by_step_plan' };
    return { ok: true };
  },
  fallback: (ctx) => ({
    tools: [
      {
        name: 'Stripe',
        purpose: 'Process client payments and issue invoices via direct links',
        cost_usd_per_mo: 0,
        url: 'https://stripe.com',
      },
      {
        name: 'Vercel',
        purpose: 'Host landing page and playable preview artifacts',
        cost_usd_per_mo: 0,
        url: 'https://vercel.com',
      },
      {
        name: 'Notion / Google Docs',
        purpose: 'Deliver the client handover document and scope confirmation',
        cost_usd_per_mo: 0,
        url: 'https://notion.so',
      },
    ],
    accounts_you_create: [
      {
        service: 'Stripe',
        url: 'https://dashboard.stripe.com/register',
        user_action: 'Create account, activate payouts with bank account, generate payment link',
        agent_action: 'Agent formats product name, price tiers, and invoice memo copy',
      },
      {
        service: 'Reddit / Platform Account',
        url: 'https://reddit.com/register',
        user_action: 'Log in with your existing aged account to send human replies',
        agent_action: 'Agent drafts tailored response copy; user copies and pastes with approval',
      },
    ],
    estimated_hours_to_launch: 4,
    blockers_to_clear: [
      'Stripe account verification required for live customer card payments',
      'Target lead verification: verify posters are still active in target subreddits',
    ],
    step_by_step_plan: [
      {
        step: 1,
        title: 'Account Verification & Payment Link',
        duration_hours: 0.5,
        owner: 'user',
        instructions: 'Open Stripe dashboard, click Create Payment Link for $1,250, copy the generated URL.',
      },
      {
        step: 2,
        title: 'Generate Production Deliverables',
        duration_hours: 1.0,
        owner: 'agent',
        instructions: 'Assemble one-pager markdown, landing copy, and karaoke video script.',
      },
      {
        step: 3,
        title: 'Targeted Outreach Review',
        duration_hours: 1.0,
        owner: 'user',
        instructions: 'Review drafted replies to the 3 cited signal threads. Make sure names and references match.',
      },
      {
        step: 4,
        title: 'Send & Close First Discovery',
        duration_hours: 1.5,
        owner: 'user',
        instructions: 'Post responses, share the free asset with responders, and book first 15-minute scope review.',
      },
    ],
    _degraded: true,
  }),
};

// ---------------------------------------------------------------- 4. PRODUCE

const produce: StageDefinition = {
  key: 'produce',
  ordinal: 4,
  label: 'Production Deliverables',
  description: 'Landing copy, one-pager markdown, and full video package',
  temperature: 0.55,
  buildPrompt: (ctx) => ({
    system: `You write concrete sales and marketing deliverables. Plain, authoritative, concise.

${STYLE_RULES}

Output JSON only:
{
  "landing_page": {
    "headline": string,
    "subhead": string,
    "problem_section": string,
    "solution_section": string,
    "how_it_works": [{"step": number, "text": string}],
    "proof_elements": string[],
    "pricing_section": string,
    "faq": [{"q": string, "a": string}],
    "cta_primary": string,
    "cta_secondary": string
  },
  "one_pager_markdown": string,
  "video_package": {
    "voiceover_script": string,
    "timed_scenes": [
      {
        "scene_num": number,
        "duration_sec": number,
        "visual_description": string,
        "narration": string,
        "on_screen_text": string
      }
    ],
    "storyboard": [
      {
        "frame_num": number,
        "title": string,
        "layout": string,
        "prompt_for_visual": string
      }
    ]
  }
}

The one_pager_markdown must be complete markdown ready to save as a file or paste into Notion.
The timed_scenes must contain at least 3 distinct scenes with duration, narration, and on-screen text.`,
    user: `Offer & Work Plan:
${JSON.stringify({ brainstorm: ctx.priorOutputs.brainstorm, work_plan: ctx.priorOutputs.work_plan }, null, 2)}

Trend: "${ctx.trend.name}" (${ctx.trend.category})
Signal evidence:
${signalDigest(ctx, 8)}

Generate the landing page, full one-pager markdown, and video package.`,
  }),
  validate: (o) => {
    const d = o as {
      landing_page?: { headline?: string };
      one_pager_markdown?: string;
      video_package?: { timed_scenes?: unknown[] };
    };
    if (!d.landing_page?.headline) return { ok: false, reason: 'missing landing_page.headline' };
    if (typeof d.one_pager_markdown !== 'string' || d.one_pager_markdown.length < 50)
      return { ok: false, reason: 'missing or short one_pager_markdown' };
    if (!d.video_package?.timed_scenes || !Array.isArray(d.video_package.timed_scenes) || d.video_package.timed_scenes.length < 2)
      return { ok: false, reason: 'need >=2 timed_scenes in video_package' };
    return { ok: true };
  },
  fallback: (ctx) => ({
    landing_page: {
      headline: `${ctx.trend.name}: Solved in 7 Days Without Internal Overhead`,
      subhead: 'Fixed price. Guaranteed delivery. Pay only when the workflow is verified running.',
      problem_section: `Teams in ${ctx.trend.category} lose dozens of hours every month wrestling with manual bottlenecks. Recent public discussions across multiple communities highlight the exact same friction.`,
      solution_section: `We provide a focused, 7-day engineering sprint that resolves ${ctx.trend.name} completely and hands over full ownership to your team.`,
      how_it_works: [
        { step: 1, text: '20-minute scope alignment to audit your current workflow' },
        { step: 2, text: 'We build and configure the solution in 7 business days' },
        { step: 3, text: 'Handover session, full documentation, and 14 days of direct support' },
      ],
      proof_elements: [
        'Written scope document before any engagement kickoff',
        'Zero upfront charge for pilot partners; pay on verified completion',
      ],
      pricing_section: '$1,250 fixed one-time sprint fee.',
      faq: [
        { q: 'What if it does not fit our tech stack?', a: 'We audit your stack during the 20-minute scope call. If it is not a direct fit, we tell you immediately.' },
        { q: 'Who owns the code and setup?', a: 'You own 100% of the deliverables and documentation from day one.' },
      ],
      cta_primary: 'Claim Sprint Slot',
      cta_secondary: 'Read Free Technical Breakdown',
    },
    one_pager_markdown: `# ${ctx.trend.name} — Technical Architecture & Execution Brief

## Executive Summary
This document outlines the turnkey resolution for ${ctx.trend.name} in ${ctx.trend.category}. 
Designed for fast execution, low maintenance overhead, and immediate ROI within 7 business days.

## The Core Problem
- Manual repetitive triage wasting senior engineer and operator hours.
- Fragile legacy workarounds that break silently under load.
- Disconnected tooling creating data silos across platforms.

## The 7-Day Sprint Scope
1. **Day 1-2: Audit & Protocol Mapping** — Inspect endpoints, schema requirements, and authentication mechanisms.
2. **Day 3-5: Engine Build & Integration** — Deploy core logic, automated error recovery, and webhook dispatchers.
3. **Day 6: Telemetry & Load Validation** — Test against peak volume scenarios with zero data drop.
4. **Day 7: Handover & Documentation** — Complete walkthrough recording, credential handover, and emergency checklist.

## Pricing & Terms
- **Fee:** $1,250 fixed fee.
- **Guarantee:** 100% money-back if not delivered to agreed acceptance criteria within 7 business days.
`,
    video_package: {
      voiceover_script: 'Every week, teams waste hours manually handling this bottleneck. Here is how we solved it in a 7-day sprint with zero internal dev hiring.',
      timed_scenes: [
        {
          scene_num: 1,
          duration_sec: 4,
          visual_description: 'Screen recording showing manual error triage and frustrated engineer comments',
          narration: 'If you are tired of spending hours manually piecing together fragmented tools, this changes today.',
          on_screen_text: 'Manual overhead: 12 hrs/week lost',
        },
        {
          scene_num: 2,
          duration_sec: 5,
          visual_description: 'Clean modern dashboard streaming processed events in real time',
          narration: 'We built an automated pipeline that eliminates the manual triage entirely without complex migrations.',
          on_screen_text: 'Automated 7-Day Turnkey Solution',
        },
        {
          scene_num: 3,
          duration_sec: 4,
          visual_description: 'Handover checklist showing completed deliverables and verified results',
          narration: 'Fixed scope, verified output, and you pay only after the deliverable is verified working.',
          on_screen_text: '100% Guaranteed. Fixed Price.',
        },
      ],
      storyboard: [
        {
          frame_num: 1,
          title: 'The Manual Frustration',
          layout: 'Split screen: terminal errors on left, clock ticking on right',
          prompt_for_visual: 'Dark mode terminal interface displaying painful manual workflow bottlenecks',
        },
        {
          frame_num: 2,
          title: 'The Automated Solution',
          layout: 'Hero telemetry screen with glowing success badges',
          prompt_for_visual: 'Modern high-contrast analytics dashboard with real-time signal processing',
        },
        {
          frame_num: 3,
          title: 'The Guaranteed Handover',
          layout: 'Centered offer card with 7-day sprint timeline',
          prompt_for_visual: 'Clean pricing card with 100% money-back guarantee badge and fast delivery icon',
        },
      ],
    },
    _degraded: true,
  }),
};

// ---------------------------------------------------------------- 5. PREVIEW

const preview: StageDefinition = {
  key: 'preview',
  ordinal: 5,
  label: 'Playable Video Preview',
  description: 'Karaoke/slideshow interactive preview player and shot list',
  temperature: 0.5,
  buildPrompt: (ctx) => ({
    system: `You construct a playable video preview package for a productized sprint.
Include storyboard frames, a shot list, full voiceover script, and clean slide content.

${STYLE_RULES}

Output JSON only:
{
  "storyboard_frames": [
    {
      "frame_num": number,
      "duration_sec": number,
      "headline": string,
      "subtitle": string,
      "visual_cue": string,
      "audio_script": string
    }
  ],
  "shot_list": [
    {
      "shot_num": number,
      "camera_angle": string,
      "subject": string,
      "timing_sec": number
    }
  ],
  "voiceover_script": string
}

Provide at least 3 storyboard frames with realistic timings (3-6 seconds each) and punchy audio scripts.`,
    user: `Deliverables:
${JSON.stringify(ctx.priorOutputs.produce ?? {}, null, 2)}

Trend: "${ctx.trend.name}" (${ctx.trend.category})

Construct the video preview frames.`,
  }),
  validate: (o) => {
    const d = o as { storyboard_frames?: unknown[]; shot_list?: unknown[] };
    if (!Array.isArray(d.storyboard_frames) || d.storyboard_frames.length < 2)
      return { ok: false, reason: 'need >=2 storyboard_frames' };
    return { ok: true };
  },
  fallback: (ctx) => {
    const prod = (ctx.priorOutputs.produce ?? {}) as {
      video_package?: {
        voiceover_script?: string;
        timed_scenes?: Array<{
          scene_num: number;
          duration_sec: number;
          visual_description: string;
          narration: string;
          on_screen_text: string;
        }>;
      };
    };

    const scenes = prod.video_package?.timed_scenes;
    const frames =
      scenes && scenes.length > 0
        ? scenes.map((s, i) => ({
            frame_num: s.scene_num || i + 1,
            duration_sec: s.duration_sec || 4,
            headline: s.on_screen_text || `Scene ${i + 1}`,
            subtitle: `Step ${i + 1} in the turnkey solution`,
            visual_cue: s.visual_description,
            audio_script: s.narration,
          }))
        : [
            {
              frame_num: 1,
              duration_sec: 4,
              headline: `Stop Wasting Hours on ${ctx.trend.name}`,
              subtitle: 'The bottleneck costing your team momentum every single week',
              visual_cue: 'Terminal showing continuous manual friction and error retry logs',
              audio_script: `If your team is losing hours to ${ctx.trend.name}, you are not alone. It is one of the most complained about bottlenecks this month.`,
            },
            {
              frame_num: 2,
              duration_sec: 5,
              headline: 'Automated 7-Day Sprint',
              subtitle: 'Full turnkey deployment with zero internal engineering required',
              visual_cue: 'Clean telemetry dashboard lighting up with live processed signals',
              audio_script: 'We built a tested, direct integration that solves it end-to-end and delivers full documentation in seven days.',
            },
            {
              frame_num: 3,
              duration_sec: 4,
              headline: 'Fixed Price. Pay On Delivery.',
              subtitle: '100% money-back guarantee with zero upfront commitment',
              visual_cue: 'Verified handover document and checklist with instant download link',
              audio_script: 'Fixed $1,250 fee, seven days, and you pay only after the deliverable is verified working.',
            },
          ];

    const fallbackData = {
      storyboard_frames: frames,
      shot_list: [
        { shot_num: 1, camera_angle: 'Screen capture, tight zoom', subject: 'Bottleneck logs', timing_sec: 4 },
        { shot_num: 2, camera_angle: 'Wide desktop angle', subject: 'Automated dashboard', timing_sec: 5 },
        { shot_num: 3, camera_angle: 'Static clean graphic', subject: 'Handover guarantee', timing_sec: 4 },
      ],
      voiceover_script:
        prod.video_package?.voiceover_script ||
        frames.map((f) => f.audio_script).join(' '),
      _degraded: true,
    };

    return {
      ...fallbackData,
      playableHtml: generatePlayableHtml(fallbackData),
    };
  },
};

// ---------------------------------------------------------------- 6. SELL FORK

const sellFork: StageDefinition = {
  key: 'sell_fork',
  ordinal: 6,
  label: 'Sales Fork (User vs AI)',
  description: 'Choice between manual execution and AI-assisted queued sales with approval gate',
  temperature: 0.45,
  buildPrompt: (ctx) => {
    const urls = extractSignalUrls(ctx).slice(0, 5);
    return {
      system: `You prepare the sales execution fork for the operator.
There are two explicit paths:
Path A: The human operator sells manually (direct links, manual routines, full control).
Path B: AI assists by queuing tailored outreach drafts, with a HARD APPROVAL GATE.
The AI will NEVER send any message automatically or message unverified leads.

${STYLE_RULES}

Output JSON only:
{
  "path_a_user_sells": {
    "title": "Manual Outreach (Direct Control)",
    "strategy": string,
    "daily_routine": string[],
    "direct_links": string[],
    "scripts": [
      {
        "channel": string,
        "message": string
      }
    ]
  },
  "path_b_ai_assists": {
    "title": "AI Queued Outreach (Explicit Approval Gate)",
    "ai_will": string[],
    "ai_will_not": string[],
    "approval_gate_required": true,
    "queued_actions": [
      {
        "id": string,
        "target_channel": string,
        "target_lead": string,
        "proposed_message": string,
        "status": "pending_user_approval"
      }
    ]
  }
}

ai_will_not must state at least 3 strict boundaries including "Never send messages without explicit user approval button".`,
      user: `Chosen Angle & Assets:
${JSON.stringify({ brainstorm: ctx.priorOutputs.brainstorm, produce: ctx.priorOutputs.produce }, null, 2)}

Target Sources:
${urls.join('\n')}

Signal text:
${signalDigest(ctx, 6)}

Build both sales paths. Make sure AI boundaries are ironclad.`,
    };
  },
  validate: (o) => {
    const d = o as {
      path_a_user_sells?: { scripts?: unknown[] };
      path_b_ai_assists?: { approval_gate_required?: boolean; ai_will_not?: unknown[] };
    };
    if (!d.path_a_user_sells?.scripts || !Array.isArray(d.path_a_user_sells.scripts) || d.path_a_user_sells.scripts.length === 0)
      return { ok: false, reason: 'missing path_a_user_sells.scripts' };
    if (d.path_b_ai_assists?.approval_gate_required !== true)
      return { ok: false, reason: 'approval_gate_required must be true' };
    if (!Array.isArray(d.path_b_ai_assists.ai_will_not) || d.path_b_ai_assists.ai_will_not.length === 0)
      return { ok: false, reason: 'missing ai_will_not boundaries' };
    return { ok: true };
  },
  fallback: (ctx) => {
    const urls = extractSignalUrls(ctx);
    const primaryUrl = urls[0] || 'https://reddit.com/r/smallbusiness';

    return {
      path_a_user_sells: {
        title: 'Manual Outreach (Direct Control)',
        strategy: 'Direct value replies in the original public threads where users voiced the problem.',
        daily_routine: [
          'Spend 15 minutes reviewing 3 new posts matching the trend keywords',
          'Reply in-thread with the 1-page diagnostic breakdown, zero sales pitch',
          'When someone responds asking for more detail, send the Stripe link or booking call',
        ],
        direct_links: urls.length > 0 ? urls.slice(0, 5) : [primaryUrl],
        scripts: [
          {
            channel: 'In-Thread Forum Reply',
            message: `Saw your post regarding ${ctx.trend.name}. Ran into this exact issue recently — wrote up a concise 1-page architecture breakdown covering how teams are bypassing it in 7 days without hiring. Happy to link it here if helpful, no pitch.`,
          },
          {
            channel: 'Direct Message / Email Followup',
            message: `Following up on the ${ctx.trend.name} brief I sent over. If you want this completely off your plate, I do a fixed 7-day sprint for $1,250 with a 100% completion guarantee. Let me know if you want the scope doc.`,
          },
        ],
      },
      path_b_ai_assists: {
        title: 'AI Queued Outreach (Explicit Approval Gate)',
        ai_will: [
          'Scan harvest feeds for high-relevance complaints matching this trend',
          'Draft contextual, personalized message variations referencing their exact post',
          'Present proposed outreach in a queue with one-click Approve or Discard buttons',
        ],
        ai_will_not: [
          'NEVER send any email, DM, or post automatically without you clicking "Approve"',
          'NEVER scrape private user data or bypass CAPTCHAs/logins',
          'NEVER contact unverified accounts or repeated contacts',
        ],
        approval_gate_required: true,
        queued_actions: [
          {
            id: 'qa-1',
            target_channel: 'Reddit In-Thread',
            target_lead: primaryUrl,
            proposed_message: `Saw your comment about ${ctx.trend.name}. Put together a 1-page solution doc detailing the workaround steps. Let me know if you want the link.`,
            status: 'pending_user_approval',
          },
        ],
      },
      _degraded: true,
    };
  },
};

export const STAGES: StageDefinition[] = [research, brainstorm, workPlan, produce, preview, sellFork];
export const STAGE_MAP = Object.fromEntries(STAGES.map((s) => [s.key, s]));
