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
`;

function signalDigest(ctx: StageContext, n = 12): string {
  return ctx.trend.signals
    .slice(0, n)
    .map(
      (s) =>
        `- [${s.source}${s.subreddit ? `/${s.subreddit}` : ''}, ${s.upvotes ?? s.score ?? 0}↑ ${s.comments}💬] ${s.title}`
    )
    .join('\n');
}

function sourceSpread(ctx: StageContext): string[] {
  return Array.from(new Set(ctx.trend.signals.map((s) => s.source)));
}

// ---------------------------------------------------------------- 1. BRAINSTORM

const brainstorm: StageDefinition = {
  key: 'brainstorm',
  ordinal: 1,
  label: 'Brainstorm',
  description: 'Generate and score multiple monetization angles',
  temperature: 0.7,
  buildPrompt: (ctx) => ({
    system: `You are a ruthless business analyst. You generate multiple distinct monetization angles for a market signal, then score them honestly. You kill weak ideas rather than dressing them up.

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
      "score": number
    }
  ],
  "recommended_index": number,
  "recommendation_reason": string
}

Generate exactly 4 angles. Score 0-100 weighting: speed to revenue 40%, margin 30%, competition gap 20%, evidence strength 10%. Be willing to score something under 30 if it deserves it.`,
    user: `Trend: "${ctx.trend.name}"
Category: ${ctx.trend.category}
Why it clustered: ${ctx.trend.monetizationRationale || 'n/a'}
Corroborating sources: ${sourceSpread(ctx).join(', ')} (${ctx.trend.signals.length} signals)

Raw evidence:
${signalDigest(ctx)}

Give me 4 monetization angles and tell me which one to actually do.`,
  }),
  validate: (o) => {
    const d = o as { angles?: unknown[]; recommended_index?: number };
    if (!Array.isArray(d.angles) || d.angles.length < 2)
      return { ok: false, reason: 'need >=2 angles' };
    if (typeof d.recommended_index !== 'number')
      return { ok: false, reason: 'missing recommended_index' };
    if (d.recommended_index < 0 || d.recommended_index >= d.angles.length)
      return { ok: false, reason: 'recommended_index out of range' };
    return { ok: true };
  },
  fallback: (ctx) => ({
    angles: [
      {
        name: `Done-for-you ${ctx.trend.name} service`,
        one_liner: `Manually solve ${ctx.trend.name} for people already complaining about it publicly.`,
        who_pays: 'Individuals and small teams posting about this problem',
        what_they_pay_for: 'Their time back and a working result they did not have to build',
        model: 'one-off',
        price_point_usd: 500,
        speed_to_revenue_days: 7,
        competition_density: 'thin',
        why_now: `${ctx.trend.signals.length} independent posts across ${sourceSpread(ctx).join(', ')} in the current window`,
        kill_risk: 'Does not scale without hiring; validate willingness to pay before systematizing',
        score: 62,
      },
      {
        name: `${ctx.trend.name} productized subscription`,
        one_liner: 'Same outcome, delivered on a recurring basis at a fixed monthly price.',
        who_pays: 'Teams with the problem continuously rather than once',
        what_they_pay_for: 'Ongoing handling without a hire',
        model: 'subscription',
        price_point_usd: 149,
        speed_to_revenue_days: 21,
        competition_density: 'thin',
        why_now: 'Recurring complaint pattern suggests recurring need',
        kill_risk: 'Higher build cost before first dollar',
        score: 54,
      },
    ],
    recommended_index: 0,
    recommendation_reason:
      'Fallback generated without model inference. Service-first is chosen because it reaches revenue fastest and validates demand before build cost. Re-run this stage when inference is available.',
    _degraded: true,
  }),
};

// ---------------------------------------------------------------- 2. OFFER

const offer: StageDefinition = {
  key: 'offer',
  ordinal: 2,
  label: 'Offer Design',
  description: 'Lock the winning angle into a concrete, priced offer',
  temperature: 0.4,
  buildPrompt: (ctx) => {
    const bs = ctx.priorOutputs.brainstorm as {
      angles: Array<Record<string, unknown>>;
      recommended_index: number;
    };
    const chosen = bs?.angles?.[bs?.recommended_index ?? 0] ?? {};
    return {
      system: `You turn a rough business angle into a specific, sellable offer with a price, a scope, and a guarantee. You are allergic to vagueness.

${STYLE_RULES}

Output JSON only:
{
  "offer_name": string,
  "promise": string,
  "deliverables": [{"item": string, "detail": string}],
  "explicitly_not_included": string[],
  "pricing": {
    "model": string,
    "primary_usd": number,
    "tiers": [{"name": string, "price_usd": number, "for_whom": string, "includes": string[]}]
  },
  "delivery_timeline_days": number,
  "guarantee": string,
  "cost_to_deliver_usd": number,
  "gross_margin_pct": number,
  "minimum_viable_scope": string,
  "first_ten_customers_plan": string
}

The guarantee must be specific and actually honorable, not "satisfaction guaranteed". Margin must be arithmetically consistent with price and cost.`,
      user: `Chosen angle:
${JSON.stringify(chosen, null, 2)}

Source trend: "${ctx.trend.name}" (${ctx.trend.category})
Evidence:
${signalDigest(ctx, 8)}

Design the offer. Price it so it is obviously worth it to the buyer and still 70%+ margin to me.`,
    };
  },
  validate: (o) => {
    const d = o as { offer_name?: string; pricing?: { primary_usd?: number }; deliverables?: unknown[] };
    if (!d.offer_name) return { ok: false, reason: 'missing offer_name' };
    if (!d.pricing || typeof d.pricing.primary_usd !== 'number')
      return { ok: false, reason: 'missing pricing.primary_usd' };
    if (!Array.isArray(d.deliverables) || d.deliverables.length === 0)
      return { ok: false, reason: 'need >=1 deliverable' };
    return { ok: true };
  },
  fallback: (ctx) => ({
    offer_name: `${ctx.trend.name} — Fixed-Scope Sprint`,
    promise: `A working solution to ${ctx.trend.name} delivered in 10 business days, or you do not pay.`,
    deliverables: [
      { item: 'Discovery call', detail: '45 minutes, recorded, with a written scope doc after' },
      { item: 'Built solution', detail: 'Implemented and handed over with documentation' },
      { item: 'Handover session', detail: '30 minutes walkthrough plus 14 days of email support' },
    ],
    explicitly_not_included: ['Ongoing maintenance after 14 days', 'Third-party tool subscription costs'],
    pricing: {
      model: 'fixed-fee',
      primary_usd: 1500,
      tiers: [
        { name: 'Sprint', price_usd: 1500, for_whom: 'One clear problem', includes: ['Discovery', 'Build', 'Handover'] },
        { name: 'Sprint + Retainer', price_usd: 1500, for_whom: 'Ongoing need', includes: ['Everything in Sprint', '$400/mo support'] },
      ],
    },
    delivery_timeline_days: 10,
    guarantee: 'If it is not working by day 10, you pay nothing and keep whatever was built.',
    cost_to_deliver_usd: 300,
    gross_margin_pct: 80,
    minimum_viable_scope: 'Solve the single most-mentioned variant of the problem from the source signals.',
    first_ten_customers_plan:
      'Reply directly to the people whose posts generated this trend. They are pre-qualified by having publicly stated the problem.',
    _degraded: true,
  }),
};

// ---------------------------------------------------------------- 3. ASSETS

const assets: StageDefinition = {
  key: 'assets',
  ordinal: 3,
  label: 'Sales Assets',
  description: 'Landing page, demo script, proof artifacts',
  temperature: 0.55,
  buildPrompt: (ctx) => ({
    system: `You write conversion copy that does not sound like conversion copy. Plain, specific, confident.

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
  "demo_script": {
    "duration_minutes": number,
    "beats": [{"minute": number, "what_you_show": string, "what_you_say": string}]
  },
  "free_value_asset": {
    "title": string,
    "format": string,
    "outline": string[],
    "why_it_earns_the_reply": string
  }
}

The free_value_asset is the thing you give away in cold outreach to earn a reply. It must be genuinely useful standalone and take you under 60 minutes to produce.`,
    user: `Offer:
${JSON.stringify(ctx.priorOutputs.offer, null, 2)}

Original pain, in their words:
${signalDigest(ctx, 10)}

Write the assets. Mirror their actual vocabulary from those posts.`,
  }),
  validate: (o) => {
    const d = o as { landing_page?: { headline?: string }; free_value_asset?: { title?: string } };
    if (!d.landing_page?.headline) return { ok: false, reason: 'missing landing_page.headline' };
    if (!d.free_value_asset?.title) return { ok: false, reason: 'missing free_value_asset' };
    return { ok: true };
  },
  fallback: (ctx) => {
    const off = ctx.priorOutputs.offer as { offer_name?: string; promise?: string; pricing?: { primary_usd?: number } };
    return {
      landing_page: {
        headline: off?.promise || `${ctx.trend.name}, handled.`,
        subhead: 'Fixed price. Fixed timeline. You do not pay if it does not work.',
        problem_section: `People keep running into ${ctx.trend.name}. We saw ${ctx.trend.signals.length} separate posts about it in the last window.`,
        solution_section: off?.offer_name || 'A fixed-scope engagement that solves it and hands it over.',
        how_it_works: [
          { step: 1, text: '45 minute call to scope it' },
          { step: 2, text: 'We build it in 10 business days' },
          { step: 3, text: 'Handover plus 14 days of support' },
        ],
        proof_elements: ['Written scope before any payment', 'Pay-on-delivery guarantee'],
        pricing_section: `$${off?.pricing?.primary_usd ?? 1500} fixed.`,
        faq: [
          { q: 'What if it does not work?', a: 'You do not pay and you keep what was built.' },
          { q: 'How fast?', a: '10 business days from the scope call.' },
        ],
        cta_primary: 'Book the scope call',
        cta_secondary: 'Send me the sample first',
      },
      demo_script: {
        duration_minutes: 12,
        beats: [
          { minute: 0, what_you_show: 'Their own words on screen', what_you_say: 'This is the post that got you on my list.' },
          { minute: 2, what_you_show: 'The broken current state', what_you_say: 'Here is what this costs you weekly.' },
          { minute: 5, what_you_show: 'Working solution', what_you_say: 'Here is the same thing, fixed.' },
          { minute: 10, what_you_show: 'Price and timeline', what_you_say: 'Fixed fee, 10 days, no payment until it works.' },
        ],
      },
      free_value_asset: {
        title: `${ctx.trend.name}: the 3 workarounds people are actually using`,
        format: 'One-page PDF',
        outline: ['The problem in one paragraph', 'Workaround A with tradeoffs', 'Workaround B', 'Workaround C', 'When each breaks down'],
        why_it_earns_the_reply: 'It is useful whether or not they hire anyone, which is what makes it worth opening.',
      },
      _degraded: true,
    };
  },
};

// ---------------------------------------------------------------- 4. ICP

const icp: StageDefinition = {
  key: 'icp',
  ordinal: 4,
  label: 'Buyer Targeting',
  description: 'Define who buys and where to find them',
  temperature: 0.4,
  buildPrompt: (ctx) => ({
    system: `You define a buyer profile and the exact public places to find them. You output SEARCH STRATEGIES, not contact lists — the operator sources contacts themselves through compliant channels.

${STYLE_RULES}

Output JSON only:
{
  "icp": {
    "role_titles": string[],
    "company_size": string,
    "industry": string[],
    "trigger_events": string[],
    "disqualifiers": string[]
  },
  "warm_first": {
    "explanation": string,
    "source_signal_urls": string[]
  },
  "discovery_channels": [
    {"channel": string, "search_query": string, "expected_volume_per_week": number, "notes": string}
  ],
  "qualification_checklist": string[],
  "compliance_notes": {
    "consent_basis": string,
    "required_disclosures": string[],
    "suppression_rules": string[]
  }
}

warm_first.source_signal_urls must be drawn from the actual signal URLs provided — these are people who publicly stated the problem, which is the highest-intent list that exists and requires no scraping.`,
    user: `Offer:
${JSON.stringify(ctx.priorOutputs.offer, null, 2)}

Actual signal URLs (people who publicly described this pain):
${ctx.trend.signals.slice(0, 15).map((s) => s.url).filter(Boolean).join('\n')}

Who buys this, and where do I find more of them?`,
  }),
  validate: (o) => {
    const d = o as { icp?: { role_titles?: unknown }; discovery_channels?: unknown[] };
    if (!d.icp?.role_titles) return { ok: false, reason: 'missing icp.role_titles' };
    if (!Array.isArray(d.discovery_channels) || d.discovery_channels.length === 0)
      return { ok: false, reason: 'need >=1 discovery channel' };
    return { ok: true };
  },
  fallback: (ctx) => ({
    icp: {
      role_titles: ['Founder', 'Operations Manager', 'Head of Growth', 'Owner'],
      company_size: '1-50 employees',
      industry: [ctx.trend.category],
      trigger_events: ['Publicly posted about this exact problem', 'Recently hired for an adjacent role'],
      disqualifiers: ['Already bought a competing solution in the last 90 days', 'No budget authority'],
    },
    warm_first: {
      explanation:
        'The highest-intent list is the people whose posts created this trend. They stated the problem publicly and unprompted. Reply in-thread or via the platform first, before any cold channel.',
      source_signal_urls: ctx.trend.signals.slice(0, 15).map((s) => s.url).filter(Boolean) as string[],
    },
    discovery_channels: [
      { channel: 'Reddit search', search_query: `"${ctx.trend.name}" site:reddit.com`, expected_volume_per_week: 15, notes: 'Reply in-thread with value, do not DM cold' },
      { channel: 'LinkedIn', search_query: `${ctx.trend.category} operations manager`, expected_volume_per_week: 25, notes: 'Connect with a note referencing a specific post of theirs' },
    ],
    qualification_checklist: [
      'Have they described this problem in their own words in the last 90 days?',
      'Do they have budget authority or direct access to it?',
      'Is the cost of the problem to them clearly above the offer price?',
    ],
    compliance_notes: {
      consent_basis: 'Legitimate interest for B2B business contacts; obtain opt-in for anything else',
      required_disclosures: ['Real sender name', 'Real business address', 'One-click unsubscribe in every email'],
      suppression_rules: ['Remove on any negative reply', 'Never contact twice after a no', 'Honor unsubscribe within 24h'],
    },
    _degraded: true,
  }),
};

// ---------------------------------------------------------------- 5. OUTREACH

const outreach: StageDefinition = {
  key: 'outreach',
  ordinal: 5,
  label: 'Outreach Sequences',
  description: 'Drafted messages, personalization slots, follow-ups',
  temperature: 0.6,
  buildPrompt: (ctx) => ({
    system: `You write cold outreach that gets replies because it leads with something already done for the recipient, not because it is clever.

${STYLE_RULES}

Additional rules:
- Under 90 words for email body. Under 50 for LinkedIn.
- Open with a specific observation about THEM, never about you.
- The ask is always small and reversible ("want me to send it?" not "book a 30 min call").
- Personalization slots use {{double_brace}} and must be things a human can fill in 20 seconds.
- Every email includes a real signoff and an unsubscribe line.

Output JSON only:
{
  "sequences": [
    {
      "channel": "email" | "linkedin" | "in_thread_reply",
      "steps": [
        {
          "step": number,
          "send_day": number,
          "subject": string,
          "body": string,
          "personalization_slots": [{"token": string, "how_to_fill": string, "example": string}],
          "goal": string
        }
      ]
    }
  ],
  "daily_send_cap": number,
  "cap_rationale": string,
  "reply_handling": {"positive": string, "objection": string, "negative": string, "no_reply_after_sequence": string}
}

daily_send_cap must be conservative (under 30) with a rationale about deliverability, not volume.`,
    user: `Offer: ${JSON.stringify(ctx.priorOutputs.offer, null, 2)}
Free value asset: ${JSON.stringify((ctx.priorOutputs.assets as Record<string, unknown>)?.free_value_asset, null, 2)}
Buyer: ${JSON.stringify((ctx.priorOutputs.icp as Record<string, unknown>)?.icp, null, 2)}

Their actual language:
${signalDigest(ctx, 8)}

Write the sequences. Lead with the free asset.`,
  }),
  validate: (o) => {
    const d = o as { sequences?: Array<{ steps?: unknown[] }>; daily_send_cap?: number };
    if (!Array.isArray(d.sequences) || d.sequences.length === 0)
      return { ok: false, reason: 'no sequences' };
    if (!d.sequences.every((s) => Array.isArray(s.steps) && s.steps.length > 0))
      return { ok: false, reason: 'sequence with no steps' };
    if (typeof d.daily_send_cap !== 'number') return { ok: false, reason: 'missing daily_send_cap' };
    return { ok: true };
  },
  fallback: (ctx) => {
    const fva = (ctx.priorOutputs.assets as { free_value_asset?: { title?: string } })?.free_value_asset;
    return {
      sequences: [
        {
          channel: 'in_thread_reply',
          steps: [
            {
              step: 1,
              send_day: 0,
              subject: '(n/a - forum reply)',
              body: `saw your post about {{their_specific_problem}}. i put together a one-pager on the three workarounds people are using for this — happy to drop the link if useful, no strings.`,
              personalization_slots: [
                { token: '{{their_specific_problem}}', how_to_fill: 'Quote 4-6 words from their actual post', example: 'syncing invoices between two systems' },
              ],
              goal: 'Get permission to send the asset',
            },
          ],
        },
        {
          channel: 'email',
          steps: [
            {
              step: 1,
              send_day: 0,
              subject: `{{their_problem_in_3_words}}`,
              body: `{{first_name}} — you mentioned {{their_specific_problem}} on {{where}}.\n\nI wrote up "${fva?.title ?? 'a short breakdown'}" covering how a few people are handling it. It's one page, no pitch.\n\nWant me to send it over?\n\n{{your_name}}\n{{your_business}} · {{your_address}}\nReply STOP and I won't contact you again.`,
              personalization_slots: [
                { token: '{{first_name}}', how_to_fill: 'Their first name', example: 'Dana' },
                { token: '{{their_specific_problem}}', how_to_fill: 'Quote from their post', example: 'losing 6 hours a week to manual scheduling' },
                { token: '{{where}}', how_to_fill: 'Platform + subreddit/thread', example: 'r/smallbusiness' },
              ],
              goal: 'Permission-based reply',
            },
            {
              step: 2,
              send_day: 4,
              subject: 'Re: {{their_problem_in_3_words}}',
              body: `Sent it anyway in case it's useful: {{asset_link}}\n\nIf {{their_specific_problem}} is still costing you time, I do fixed-scope work on exactly this. Happy to say more or happy to leave you alone.\n\n{{your_name}}\nReply STOP to opt out.`,
              personalization_slots: [
                { token: '{{asset_link}}', how_to_fill: 'Link to the hosted one-pager', example: 'https://...' },
              ],
              goal: 'Deliver value, soft offer',
            },
          ],
        },
      ],
      daily_send_cap: 20,
      cap_rationale:
        'Under 25/day per mailbox keeps you inside normal human sending patterns. Above that, ESP reputation systems start sampling you and deliverability degrades permanently, which costs far more than the extra volume gains.',
      reply_handling: {
        positive: 'Send the asset immediately, then ask one qualifying question. Do not pitch in the same message.',
        objection: 'Acknowledge the specific objection, give one concrete counter, offer to leave it. Never argue twice.',
        negative: 'One-line thanks, add to suppression list permanently.',
        no_reply_after_sequence: 'Stop. Add to a 6-month re-approach list, not a re-send list.',
      },
      _degraded: true,
    };
  },
};

// ---------------------------------------------------------------- 6. CLOSE KIT

const closeKit: StageDefinition = {
  key: 'close_kit',
  ordinal: 6,
  label: 'Close Kit',
  description: 'Call script, objections, proposal, payment setup',
  temperature: 0.45,
  buildPrompt: (ctx) => ({
    system: `You prepare everything needed to convert a reply into a paid invoice.

${STYLE_RULES}

Output JSON only:
{
  "discovery_call_script": {
    "opening": string,
    "questions": [{"q": string, "listening_for": string}],
    "price_reveal": string,
    "close": string
  },
  "objection_handling": [{"objection": string, "response": string, "if_they_persist": string}],
  "proposal_template": string,
  "payment_setup": {
    "recommended_flow": string,
    "deposit_pct": number,
    "stripe_product_name": string,
    "stripe_price_usd": number,
    "invoice_terms": string
  },
  "first_dollar_checklist": [{"step": number, "action": string, "done_when": string}]
}

objection_handling must cover at minimum: price, "we'll build it internally", "send me info", "not right now", and trust/credibility.`,
    user: `Offer: ${JSON.stringify(ctx.priorOutputs.offer, null, 2)}
Buyer profile: ${JSON.stringify((ctx.priorOutputs.icp as Record<string, unknown>)?.icp, null, 2)}

Build the close kit. The checklist should end at "money received".`,
  }),
  validate: (o) => {
    const d = o as { discovery_call_script?: unknown; objection_handling?: unknown[]; first_dollar_checklist?: unknown[] };
    if (!d.discovery_call_script) return { ok: false, reason: 'missing call script' };
    if (!Array.isArray(d.objection_handling) || d.objection_handling.length < 3)
      return { ok: false, reason: 'need >=3 objections' };
    if (!Array.isArray(d.first_dollar_checklist) || d.first_dollar_checklist.length === 0)
      return { ok: false, reason: 'missing checklist' };
    return { ok: true };
  },
  fallback: (ctx) => {
    const off = ctx.priorOutputs.offer as { pricing?: { primary_usd?: number }; offer_name?: string; guarantee?: string };
    const price = off?.pricing?.primary_usd ?? 1500;
    return {
      discovery_call_script: {
        opening: "Thanks for making time. I read your post — before I say anything, tell me what's happening on your side.",
        questions: [
          { q: 'How long has this been a problem?', listening_for: 'Duration signals pain tolerance and urgency' },
          { q: 'What have you already tried?', listening_for: 'Avoids pitching something they rejected' },
          { q: 'What does it cost you when it goes wrong?', listening_for: 'Their own number, which you price against' },
          { q: "If this were fixed, what changes?", listening_for: 'The outcome they will actually pay for' },
          { q: 'Who else signs off on something like this?', listening_for: 'Hidden decision makers' },
        ],
        price_reveal: `Based on what you described, this is the fixed-scope version: $${price}, ten business days. ${off?.guarantee ?? 'You do not pay if it does not work.'}`,
        close: 'Want me to send the scope doc today, or is there something you need to check first?',
      },
      objection_handling: [
        { objection: 'Too expensive', response: `You said this costs you {{their_number}} a month. This pays back in {{payback_period}}. But if the budget genuinely is not there, say so and I'll stop.`, if_they_persist: 'Offer the reduced minimum-viable scope at a lower price rather than discounting the full scope.' },
        { objection: "We'll build it internally", response: 'Probably could. What is the realistic start date given what else is queued? I can have it done before that, and if you want to take it in-house after, the handover doc is yours.', if_they_persist: 'Leave graciously and set a 90-day follow-up. Internal builds slip constantly.' },
        { objection: 'Send me some info', response: 'Sending. One question so I send the right thing: is the bigger issue {{option_a}} or {{option_b}}?', if_they_persist: 'Send it, then one follow-up in 4 days. Stop after that.' },
        { objection: 'Not right now', response: "Fair. When would be a real time to revisit — is there an event or a date this becomes urgent?", if_they_persist: 'Get a specific date, calendar it, close the loop.' },
        { objection: "I don't know you", response: 'Reasonable. The scope doc is free and the guarantee means you pay after it works, not before. The risk is on me.', if_they_persist: 'Offer a paid micro-engagement at a low price to establish trust.' },
      ],
      proposal_template: `SCOPE — ${off?.offer_name ?? ctx.trend.name}\n\nProblem\n{{restate_their_words}}\n\nWhat I'll deliver\n{{deliverables}}\n\nNot included\n{{exclusions}}\n\nTimeline\n10 business days from kickoff\n\nPrice\n$${price} — ${off?.guarantee ?? 'payable on delivery'}\n\nNext step\nReply "go" and I'll send the kickoff link.`,
      payment_setup: {
        recommended_flow: 'Stripe Invoice with a payment link. No deposit on the first client so the guarantee is credible; 50% deposit from client three onward.',
        deposit_pct: 0,
        stripe_product_name: off?.offer_name ?? `${ctx.trend.name} Sprint`,
        stripe_price_usd: price,
        invoice_terms: 'Net 7 from delivery',
      },
      first_dollar_checklist: [
        { step: 1, action: 'Reply to the 15 source-signal posts with the free asset offer', done_when: 'All 15 replied to' },
        { step: 2, action: 'Send the asset to everyone who says yes', done_when: 'Asset delivered' },
        { step: 3, action: 'Book scope calls with anyone who engages after the asset', done_when: '1+ call on calendar' },
        { step: 4, action: 'Run the discovery script, send the scope doc same day', done_when: 'Scope doc sent' },
        { step: 5, action: 'Create the Stripe product and send the invoice on acceptance', done_when: 'Invoice sent' },
        { step: 6, action: 'Deliver, then collect', done_when: 'Money received' },
      ],
      _degraded: true,
    };
  },
};

export const STAGES: StageDefinition[] = [brainstorm, offer, assets, icp, outreach, closeKit];
export const STAGE_MAP = Object.fromEntries(STAGES.map((s) => [s.key, s]));
