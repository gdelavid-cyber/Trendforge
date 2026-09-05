// Platform guide content: every page documented honestly (what it does, what
// you can do, tips) plus spotlight-tour steps for the pages where a walkthrough
// actually helps. Tour selectors target data-tour attributes placed on stable
// landmarks; a page with an empty `tour` simply gets no walkthrough.

export interface TourStep {
  selector: string;
  title: string;
  body: string;
}

export interface PageGuide {
  path: string;
  /** Optional regex override for dynamic routes (checked before prefixes). */
  match?: RegExp;
  title: string;
  group: 'Earn' | 'Companions & Agents' | 'World & Market' | 'Account';
  tagline: string;
  whatItDoes: string;
  actions: string[];
  tips: string[];
  tour: TourStep[];
}

export const GUIDE_PAGES: PageGuide[] = [
  {
    path: '/dashboard',
    title: 'Dashboard & Portfolio',
    group: 'Earn',
    tagline: 'Your command center — balance, companion, and current moves.',
    whatItDoes:
      'Shows your real TREND balance from the honest-money ledger, your companion\'s state, and the moves you have in flight. Nothing here is simulated — balances only move when real work settles.',
    actions: [
      'Check your TREND balance and recent ledger-backed activity.',
      'Jump back into an active task or open the Approval Inbox.',
      'Talk to your companion about what to run next.',
      'Review pending approval gates before outbound executions trigger.',
    ],
    tips: [
      'Balances update as deposits credit and missions burn compute — not on a timer.',
      'The companion card links straight to any paused approval gate.',
      'Use the Talk button to brainstorm high-converting niches directly with your companion.',
    ],
    tour: [
      { selector: '[data-tour="dashboard-balance"]', title: 'Real balance', body: 'This is ledger-backed TREND/USDC. It changes only when money actually moves — deposits in, compute burned, trade proceeds settled.' },
      { selector: '[data-tour="dashboard-companion"]', title: 'Your companion', body: 'Status, level, and quick access to Talk. If a step needs your approval, this card tells you first.' },
    ],
  },
  {
    path: '/tasks',
    title: 'Weekly Tasks & Power Moves',
    group: 'Earn',
    tagline: 'Curated money-making tasks refreshed daily and weekly from live trends.',
    whatItDoes:
      'A feed of vetted earning tasks generated from live trend signals. Vote to shape next week\'s batch, then launch any task solo (DIY), step-by-step (Co-pilot), or fully automated (Autopilot).',
    actions: [
      'Filter tasks by category, risk level, and setup difficulty.',
      'Open a task to see its 5-step plan and recommended tool stack before committing.',
      'Upvote or downvote tasks to steer future pipeline generations.',
      'Inspect verified earnings ranges and time-to-first-dollar estimates.',
    ],
    tips: [
      'Difficulty ratings indicate complexity and time investment, from zero-cost side hustles to high-reward ventures.',
      'HIGH-risk moves require acknowledging the risk guidelines first.',
      'Every task links to its original trend signal on the Trends Radar.',
    ],
    tour: [
      { selector: '[data-tour="tasks-filters"]', title: 'Filters', body: 'Narrow the feed by category, difficulty, and risk level so you only see moves that fit your resources.' },
      { selector: '[data-tour="tasks-list"]', title: 'Task feed', body: 'Each card shows setup cost, target range, and votes. Open one to inspect the full plan and War Room.' },
    ],
  },
  {
    path: '/tasks/[id]',
    match: /^\/tasks\/[^/]+$/,
    title: 'Task War Room & Execution',
    group: 'Earn',
    tagline: 'Live multi-modal execution, squad brainstorming, and verified proof.',
    whatItDoes:
      'The command center for executing a single task: interactive step directions, direct website links, live AI squad brainstorming (Kairos, UNIT-O, Midas), Web Speech voice note generation, 9:16 video packages, sales outreach sequences, and cryptographic proof-of-work receipts.',
    actions: [
      'Click any numbered step to view tactical execution directions and direct website links.',
      'Click "Have AI Execute Step" to run individual steps autonomously with your companion.',
      'Trigger "Brainstorm Squad Strategy" to generate a live multi-agent consensus debate.',
      'Listen to synthesized voice notes, view viral video storyboards, and export sales sequences.',
      'Download cryptographic Proof-of-Work JSON receipts for verified client delivery.',
    ],
    tips: [
      'External actions (sending emails, publishing posts, executing trades) pause for your approval in the Approval Inbox.',
      'Multi-modal cards (Voice, Video, Sales) only render when real assets are produced — never simulated.',
      'You can run individual steps in Co-pilot mode or engage Autopilot for full pipeline execution.',
    ],
    tour: [
      { selector: '[data-tour="task-modes"]', title: 'Run modes', body: 'Pick how hands-on you want to be: DIY, Co-pilot, or Autopilot. Autopilot pauses at external gates for your one-click approval.' },
      { selector: '[data-tour="task-outputs"]', title: 'Actual outputs', body: 'When a run produces real deliverables, they show up here with audio players, storyboards, and download links.' },
    ],
  },
  {
    path: '/trends',
    title: 'Trends Radar & Daily News',
    group: 'Earn',
    tagline: 'Live market telemetry, AI monetization classification, and daily news intelligence.',
    whatItDoes:
      'Autonomous scrapers actively monitor HackerNews, Reddit, Twitter, and market feeds. Our AI classifier separates monetizable commercial opportunities (routed to Tasks) from macro ecosystem shifts (curated into Daily News briefings).',
    actions: [
      'Toggle tabs between All Intelligence, Monetizable Power Moves, and Daily News.',
      'Click "Run Autonomous Scraper & Classifier" to live-scrape and classify fresh internet signals.',
      'Read "Why It Matters Today" executive briefings for non-monetizable macro trends.',
      'Jump directly from monetizable trend cards into actionable tasks.',
    ],
    tips: [
      'Mention velocity indicates surges in internet discussion per hour.',
      'Confidence scores reflect cross-platform source validation and market viability.',
      'Daily News briefings highlight major regulatory and infrastructure shifts before commercial opportunities emerge.',
    ],
    tour: [],
  },
  {
    path: '/avatar-studio',
    title: 'The Forge & Companion Studio',
    group: 'Companions & Agents',
    tagline: 'Customize your AI companion, calibration matrix, and voice persona.',
    whatItDoes:
      'Customize your sovereign AI companion\'s visual appearance, archetype (Kairos, UNIT-O, Midas, Nyx, etc.), voice pacing, risk parameters, and tactical loadout slots.',
    actions: [
      'Select and equip cosmetic slots (Head, Body, Aura, Trail, Finisher).',
      'Tune personality attributes, risk posture, and autonomy preferences.',
      'Save loadouts to update your companion across the platform.',
      'Preview companion responsive expressions and audio voice synthesis.',
    ],
    tips: [
      'Your companion\'s archetype influences their perspective in Squad Brainstorming sessions.',
      'Loadout changes persist instantly across your active tasks and war room cards.',
    ],
    tour: [],
  },
  {
    path: '/approvals',
    title: 'Approval Inbox & Safety Gates',
    group: 'Earn',
    tagline: 'One-click safety gates for outbound emails, posts, and real-world actions.',
    whatItDoes:
      'When your companion reaches an external step (sending cold outreach emails, publishing social media, deploying smart contracts, executing trades), it pauses here for your explicit approval.',
    actions: [
      'Inspect the exact message, payload, and recipient before anything leaves the platform.',
      'Click Approve to immediately dispatch the action and resume automated execution.',
      'Click Reject to skip the step cleanly without breaking task progression.',
    ],
    tips: [
      'Approving runs the real action immediately using your connected API keys.',
      'If an integration key is missing, a blocked guidance note will link to Profile → Integrations.',
    ],
    tour: [
      { selector: '[data-tour="approvals-list"]', title: 'Pending gates', body: 'Every row is a real outbound action waiting for your yes/no. Nothing has been sent yet.' },
    ],
  },
  {
    path: '/agents',
    title: 'Sovereign Web4 Agents',
    group: 'Companions & Agents',
    tagline: 'Autonomous on-chain economic citizens with non-custodial Autonomous Wallets.',
    whatItDoes:
      'Web4 agents hold independent Solana/USDC Autonomous Wallets starting with $0.00 (zero capital at risk). When funded by operators, agents execute autonomous tasks, generate revenue, and sustain their operations.',
    actions: [
      'Fund an agent via verified on-chain USDC deposit (unique memo code included) only when you want to deploy capital.',
      'Execute automated mission workflows — compute and execution costs burn from the agent\'s real balance.',
      'Request withdrawals of remaining balance to your external crypto wallet at any time.',
      'Read the Web4 Manifesto (/manifesto) for full architecture and economic details.',
      'Talk directly with any agent via voice and text terminal.',
    ],
    tips: [
      'Unfunded agents remain in DORMANT state at zero cost — no fees or penalties apply while dormant.',
      'All agent wallets start with $0.00 by default; capital is only allocated upon explicit operator deposit.',
    ],
    tour: [
      { selector: '[data-tour="agent-fund"]', title: 'Fund with real USDC', body: 'Opens deposit instructions: treasury address + this agent\'s unique memo code. Send USDC on Solana with that memo and the verifier credits the agent.' },
      { selector: '[data-tour="agent-withdraw"]', title: 'Withdrawals', body: 'Queue a withdrawal of leftover balance. Requests go to admin review; the ledger debit settles only on approval.' },
    ],
  },
  {
    path: '/workflows',
    title: 'Autonomous Multi-Agent Workflows',
    group: 'Companions & Agents',
    tagline: 'Orchestrate multi-step pipelines and autonomous agent swarms.',
    whatItDoes:
      'Chain multiple specialized agent skills together into complex workflows (e.g. Scrape -> Analyze -> Generate Voice -> Draft Pitch -> Dispatch Outreach).',
    actions: [
      'Create and configure multi-step workflow pipelines.',
      'Assign different agent specialists to specific workflow nodes.',
      'Run workflows on demand or schedule them to execute automatically.',
    ],
    tips: [
      'Workflows can output multi-modal packages directly to client endpoints.',
      'Failed steps trigger auto-retry with procedural fallback handlers.',
    ],
    tour: [],
  },
  {
    path: '/builder',
    title: 'No-Code Agent Studio',
    group: 'Companions & Agents',
    tagline: 'Drag-and-drop assembly of custom sovereign agents.',
    whatItDoes:
      'Compose skill blocks into a visual canvas, configure personality parameters, and mint a sovereign Web4 agent with its own identity hash.',
    actions: [
      'Drag and connect skill blocks (Research, Audio, Video, Sales, Code).',
      'Configure cosmetic assets, archetype voice, and system directives.',
      'Deploy the agent to your active fleet.',
    ],
    tips: ['Newly minted agents start with $0 balance and remain dormant until funded.'],
    tour: [],
  },
  {
    path: '/marketplace',
    title: 'P2P Agent & Asset Marketplace',
    group: 'World & Market',
    tagline: 'Trade agents, hire specialists, and acquire rare cosmetic assets.',
    whatItDoes:
      'Buy, sell, and hire top-performing agents ranked by verified P&L and task completion history, plus trade collectible cosmetic assets.',
    actions: [
      'Browse marketplace listings by category (Agents, Tools, Cosmetics).',
      'Inspect an agent\'s verified ledger history and survival score before buying.',
      'List your own calibrated agents or services for peer-to-peer sale.',
    ],
    tips: ['Agent listings carry their transparent ledger history and survival stats with them.'],
    tour: [],
  },
  {
    path: '/stories',
    title: 'Verified Success Stories',
    group: 'Earn',
    tagline: 'Proof-of-work receipts and verified earnings from real operators.',
    whatItDoes:
      'A transparent showcase of completed tasks, customer payouts, and revenue milestones achieved by platform users. Only verified submissions display verified earnings badges.',
    actions: [
      'Browse success stories filtered by task type and earnings range.',
      'Submit your own completed task story with proof screenshots for community review.',
      'Earn platform reputation points and favor credits upon verification.',
    ],
    tips: ['Earnings figures reflect real outside revenue generated using Trendly action plans.'],
    tour: [],
  },
  {
    path: '/community',
    title: 'Operator Community & Leaderboards',
    group: 'World & Market',
    tagline: 'Discussions, strategy sharing, and operator rankings.',
    whatItDoes:
      'Connect with fellow solopreneurs, share winning outreach scripts, discuss emerging trend niches, and compete on the operator leaderboard.',
    actions: [
      'Publish posts and discussion threads on high-converting moves.',
      'Exchange favors and tips with other operators in the network.',
      'Climb the leaderboard by completing tasks and verifying earnings.',
    ],
    tips: ['Active community members earn bonus agent runs and VIP badges.'],
    tour: [],
  },
  {
    path: '/profile',
    title: 'Profile, BYOK Vault & Integrations',
    group: 'Account',
    tagline: 'Manage your credentials, action integrations, and custom AI brains.',
    whatItDoes:
      'Your encrypted bring-your-own-key (BYOK) vault for action integrations (SendGrid, Resend, X/Twitter, Polymarket) and LLM brains (OpenAI, Anthropic, DeepSeek). Keys are AES-256-GCM encrypted and never exposed in full.',
    actions: [
      'Connect SendGrid/Resend to enable companion outbound email dispatching.',
      'Connect X / Twitter API keys to allow companions to publish launch posts.',
      'Add your custom OpenAI / Anthropic key to power companion intelligence.',
      'Configure notification settings and account preferences.',
    ],
    tips: [
      'Without an integration key, outbound runners pause honestly with blocked guidance.',
      'You can disconnect or update keys at any time; keys are never stored in plaintext.',
    ],
    tour: [
      { selector: '[data-tour="integrations-card"]', title: 'Action vault', body: 'Paste keys for external services your agents will execute against. Masked display only.' },
    ],
  },
  {
    path: '/referrals',
    title: 'Referrals & Affiliate Rewards',
    group: 'Account',
    tagline: 'Invite operators and earn recurring platform rewards.',
    whatItDoes:
      'Share your unique referral link to onboard new creators and operators. Earn community points, bonus agent compute runs, and revenue share.',
    actions: [
      'Copy your unique referral link and share across your network.',
      'Track referred users, active runs, and unlocked bonus credits.',
    ],
    tips: ['Referred users receive bonus bootstrap credits upon initial signup.'],
    tour: [],
  },
  {
    path: '/pricing',
    title: 'Plans & Compute Tiers',
    group: 'Account',
    tagline: 'Subscription tiers, unlimited companion runs, and enterprise access.',
    whatItDoes:
      'Compare Free, Pro, Elite, and Enterprise plans offering unlimited autonomous runs, priority LLM reasoning queues, and multi-agent swarm support.',
    actions: [
      'Upgrade your account via Stripe for high-volume automated task runs.',
      'Unlock advanced multi-agent swarm coordination and dedicated compute quotas.',
    ],
    tips: ['All core tasks and manual directions remain accessible on the free plan.'],
    tour: [],
  },
];

/** Finds the guide for the current pathname (dynamic-route regexes first, then longest prefix). */
export function guideForPath(pathname: string): PageGuide | null {
  const clean = pathname.split('?')[0];
  const byRegex = GUIDE_PAGES.find((p) => p.match?.test(clean));
  if (byRegex) return byRegex;
  const matches = GUIDE_PAGES.filter((p) => clean === p.path || clean.startsWith(p.path + '/'));
  if (matches.length === 0) return null;
  return matches.sort((a, b) => b.path.length - a.path.length)[0];
}

/** Condensed catalog injected into the companion's system prompt. */
export function condensedGuideForPrompt(): string {
  return GUIDE_PAGES.map((p) =>
    `- ${p.title} (${p.path}): ${p.whatItDoes.split('. ')[0]}.`
  ).join('\n');
}
