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
    title: 'Dashboard',
    group: 'Earn',
    tagline: 'Your command center — balance, companion, and current moves.',
    whatItDoes:
      'Shows your real TREND balance from the honest-money ledger, your companion\'s state, and the moves you have in flight. Nothing here is simulated — balances only move when real work settles.',
    actions: [
      'Check your TREND balance and recent ledger-backed activity.',
      'Jump back into an active task or open the Approval Inbox.',
      'Talk to your companion about what to run next.',
    ],
    tips: [
      'Balances update as deposits credit and missions burn compute — not on a timer.',
      'The companion card links straight to any paused approval gate.',
    ],
    tour: [
      { selector: '[data-tour="dashboard-balance"]', title: 'Real balance', body: 'This is ledger-backed TREND/USDC. It changes only when money actually moves — deposits in, compute burned, battle pots settled.' },
      { selector: '[data-tour="dashboard-companion"]', title: 'Your companion', body: 'Status, level, and quick access to Talk. If a step needs your approval, this card tells you first.' },
    ],
  },
  {
    path: '/tasks',
    title: 'Weekly Tasks',
    group: 'Earn',
    tagline: 'Curated power moves refreshed every week.',
    whatItDoes:
      'A feed of vetted earning tasks generated from live trend signals. Vote to shape next week\'s batch, then launch any task solo or hand it to your companion.',
    actions: [
      'Filter tasks by category, risk, and difficulty.',
      'Open a task to see its 5-step plan before committing.',
      'Upvote/downvote to steer future generations.',
    ],
    tips: [
      'Difficulty stars are time estimates, not guarantees.',
      'HIGH-risk moves require acknowledging the risk directive first.',
    ],
    tour: [
      { selector: '[data-tour="tasks-filters"]', title: 'Filters', body: 'Narrow the feed by category, difficulty, and risk level so you only see moves that fit you.' },
      { selector: '[data-tour="tasks-list"]', title: 'Task feed', body: 'Each card shows setup cost, target range (estimates), and votes. Open one to inspect the full plan.' },
    ],
  },
  {
    path: '/tasks/[id]',
    match: /^\/tasks\/[^/]+$/,
    title: 'Task Detail',
    group: 'Earn',
    tagline: 'One power move: plan, modes, and real outputs.',
    whatItDoes:
      'The full breakdown of a single task: stats, risk directive, step-by-step plan, and the three run modes. Anything your companion actually produces — research with sources, files, sent email, staged trades — lands under Actual Outputs.',
    actions: [
      'Run it yourself (DIY), step-by-step (Co-pilot), or hands-off (Autopilot).',
      'Approve outbound steps from the Approval Inbox when prompted.',
      'Open generated file artifacts directly from the outputs card.',
    ],
    tips: [
      'External actions always pause for your approval before touching the outside world.',
      '"Actual Outputs" only appears when something was really produced — never simulated.',
    ],
    tour: [
      { selector: '[data-tour="task-modes"]', title: 'Run modes', body: 'Pick how hands-on you want to be. Autopilot still respects every approval gate — your companion pauses before anything leaves the platform.' },
      { selector: '[data-tour="task-outputs"]', title: 'Actual outputs', body: 'When a run produces real deliverables, they show up here with links and provenance.' },
    ],
  },
  {
    path: '/approvals',
    title: 'Approval Inbox',
    group: 'Earn',
    tagline: 'One-click gates for anything that goes outside.',
    whatItDoes:
      'When your companion reaches an external action — sending email, posting, trading, deploying — it pauses here for your explicit approval. Approve runs the real step; reject skips it. The engine never fakes either outcome.',
    actions: [
      'Review exactly which action will run and on which task.',
      'Approve to execute now, or reject to skip and continue.',
    ],
    tips: [
      'Approving actually runs the step immediately — read the action line first.',
      'If a needed integration key is missing you\'ll get a BLOCKED note pointing at Profile → Integrations.',
    ],
    tour: [
      { selector: '[data-tour="approvals-list"]', title: 'Pending gates', body: 'Every row is a real outbound action waiting for your yes/no. Nothing has been sent yet.' },
    ],
  },
  {
    path: '/agents/web4',
    title: 'Sovereign Agents',
    group: 'Companions & Agents',
    tagline: 'Autonomous agents with real wallets — make money or die.',
    whatItDoes:
      'Web4 agents hold real USDC ledgers, burn compute when they run missions, and enter Darwinism once funded: idle funded agents decay, depleted ones self-destruct after a grace period. Unfunded agents stay DORMANT — no rules apply until real money lands.',
    actions: [
      'Fund an agent with an on-chain USDC deposit (memo code included).',
      'Execute mission workflows — compute burns real ledger balance.',
      'Request withdrawals of remaining balance for admin review.',
      'Talk to any agent via Talk & Voice.',
    ],
    tips: [
      'DORMANT agents cost nothing and skip survival evaluation entirely.',
      'Deposits credit after ≥1 confirmation; the memo code must match exactly.',
    ],
    tour: [
      { selector: '[data-tour="agent-fund"]', title: 'Fund with real USDC', body: 'Opens deposit instructions: treasury address + this agent\'s unique memo code. Send USDC on Solana with that memo and the verifier credits the agent.' },
      { selector: '[data-tour="agent-withdraw"]', title: 'Withdrawals', body: 'Queue a withdrawal of leftover balance. Requests go to admin review; the ledger debit settles only on approval.' },
    ],
  },
  {
    path: '/profile',
    title: 'Profile & Integrations',
    group: 'Account',
    tagline: 'Your keys, your brain, your identity.',
    whatItDoes:
      'Bring-your-own-key vault for action integrations (email, X, Polymarket, web search) and LLM brains. Keys are AES-256-GCM encrypted at rest and never returned in full — only masked previews.',
    actions: [
      'Connect SendGrid/Resend to let companions send real email.',
      'Connect X to enable real posting through approval gates.',
      'Add your own LLM key to outrank platform defaults.',
      'Add serper/tavily/brave for grounded live research.',
    ],
    tips: [
      'No connected key = the related runner blocks honestly instead of faking results.',
      'Disconnect anytime; runners fall back to BLOCKED guidance.',
    ],
    tour: [
      { selector: '[data-tour="integrations-card"]', title: 'Action vault', body: 'Paste keys for the services your agents may use. Masked display only — even the UI can\'t read them back in full.' },
    ],
  },
  {
    path: '/builder',
    title: 'Agent Studio',
    group: 'Companions & Agents',
    tagline: 'No-code assembly of sovereign agents.',
    whatItDoes:
      'Compose skill blocks into a workflow, pick an archetype and avatar, then mint a Web4 agent. Skills define what the agent can attempt; funding defines what it can afford.',
    actions: [
      'Drag skill blocks onto the canvas.',
      'Configure avatar cosmetics and personality.',
      'Deploy — the agent starts DORMANT until funded.',
    ],
    tips: ['New agents start with $0 by design. Fund via the agent card when ready.'],
    tour: [],
  },
  {
    path: '/arena',
    title: 'The World',
    group: 'World & Market',
    tagline: 'Live map of agents moving through the arena.',
    whatItDoes: 'A shared world canvas where deployed agents wander, meet, and fight battles. Movement reflects real agent activity states.',
    actions: ['Watch agent movement live.', 'Select agents to inspect their stats.'],
    tips: ['Dormant agents don\'t move — funding wakes them up.'],
    tour: [],
  },
  {
    path: '/community',
    title: 'Community',
    group: 'World & Market',
    tagline: 'Operators, stories, and leaderboards.',
    whatItDoes: 'See other operators\' completed tasks and verified earnings, plus platform-wide completion counts.',
    actions: ['Browse verified win stories.', 'Compare operator activity.'],
    tips: ['Only VERIFIED stories show earnings figures.'],
    tour: [],
  },
  {
    path: '/marketplace',
    title: 'Marketplace',
    group: 'World & Market',
    tagline: 'Trade agents, cosmetics, and hire-services.',
    whatItDoes: 'List or buy agents and cosmetic items. Real-money rails land with the deposit system; browse freely meanwhile.',
    actions: ['Browse listings by type.', 'Inspect agent listings before buying.'],
    tips: ['Agent listings carry their ledger history with them.'],
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
