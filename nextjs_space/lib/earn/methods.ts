// lib/earn/methods.ts — static config for all 9 Earn methods (no runtime imports)

export type EarnMethodSlug =
  | 'one-click-deliverables' | 'autonomous-sales' | 'reddit-arbitrage'
  | 'marketplace-assets' | 'referrals' | 'micro-saas'
  | 'prediction-arbitrage' | 'web4-agents' | 'ai-swarm-launch';

export type SceneVariant =
  | 'opportunity' | 'how-it-works' | 'swarm-execution' | 'buyer-pipeline' | 'launch-economics';

export interface EarnScene {
  index: number;
  variant: SceneVariant;
  headline: string;
  subheadline: string;
  body: string;
  cta: string;
  ctaHref?: string;
  accent: string;
  riskNote?: string;
}

export interface EarnMethod {
  number: number;
  slug: EarnMethodSlug;
  title: string;
  subtitle: string;
  shortDescription: string;
  timeToFirstDollar: string;
  capital: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  riskLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  advantage: string;
  tags: string[];
  scenes: EarnScene[];
  requiresAuth: boolean;
  riskWarning?: string;
}

export const EARN_METHODS: EarnMethod[] = [
  {
    number: 1,
    slug: 'one-click-deliverables',
    title: '1-Click Power Move Deliverables',
    subtitle: 'Select a trend. Deploy the swarm. Get paid.',
    shortDescription: 'Pick a hot blueprint from Live Pulse, activate the AI swarm, and receive a turnkey client-ready deliverable — no technical skill required.',
    timeToFirstDollar: '24–48 hours',
    capital: 'zero',
    difficulty: 'Beginner',
    riskLevel: 'Low',
    advantage: 'Zero technical overhead, zero ad spend',
    tags: ['deliverables', 'ai-swarm', 'client-work', 'no-code'],
    requiresAuth: true,
    scenes: [
      { index: 1, variant: 'opportunity', headline: 'Turn Trending Signals Into Paid Deliverables', subheadline: 'No clients, no cold calls, no upfront capital.', body: 'The AI scans live trends, selects a high-velocity blueprint, and queues the entire production run. You review. You approve. You collect.', cta: 'Deploy AI Swarm', accent: '[#00F0FF]' },
      { index: 2, variant: 'how-it-works', headline: 'Blueprint → Brainstorm → Build → Ship', subheadline: 'Four steps. One click. Production-grade output.', body: 'Select a trend or task from the Live Pulse radar. The Brainstorm Chamber dispatches six specialized agents in parallel: Research, Script, Voice, Video, Design, and Quality.', cta: 'Browse Live Pulse', ctaHref: '/trends', accent: '[#00F0FF]' },
      { index: 3, variant: 'swarm-execution', headline: 'AI Swarm Executing Your Deliverable', subheadline: 'Six agents running concurrently. Zero idle time.', body: 'Watch the Research Agent pull market data, the Scriptwriter draft copy, the Voiceover Agent render audio, and the Design Agent package visuals — all while the Sales Scout hunts buyers in parallel.', cta: 'Deploy AI Swarm', accent: '[#00F0FF]' },
      { index: 4, variant: 'buyer-pipeline', headline: 'Buyers Identified Before You Finish Building', subheadline: 'Sales Scout works while builders produce.', body: 'Qualified buyer leads are discovered from permitted sources and matched to your deliverable by budget, urgency, and relevance. Choose Bot Sells, You Sell, or Hybrid.', cta: 'View Buyer Pipeline', ctaHref: '/dashboard/sales', accent: '[#00F0FF]' },
      { index: 5, variant: 'launch-economics', headline: 'Launch. Sell. Scale.', subheadline: 'Your first dollar arrives faster than any agency.', body: 'Export the finished deliverable, track your sale in the ledger, and reinvest margin into your next power move. Every completed sale unlocks the next tier of blueprints.', cta: 'Start First Power Move', accent: '[#00F0FF]' },
    ],
  },
  {
    number: 2,
    slug: 'autonomous-sales',
    title: 'Autonomous Sales Pipeline',
    subtitle: 'Find qualified buyers. Close faster.',
    shortDescription: 'Open the Autonomous Sales Pipeline inside any task. The system locates high-intent buyers, qualifies them by budget, and drafts tailored outreach — you control what gets sent.',
    timeToFirstDollar: '2–3 days',
    capital: 'zero',
    difficulty: 'Beginner',
    riskLevel: 'Low',
    advantage: 'Reach qualified buyers without manual prospecting',
    tags: ['sales', 'outreach', 'pipeline', 'automation'],
    requiresAuth: true,
    riskWarning: 'All outreach requires your explicit approval before sending. No automated messaging without your confirmation. Platform-compliant APIs only.',
    scenes: [
      { index: 1, variant: 'opportunity', headline: 'A Sales Pipeline That Never Sleeps', subheadline: 'Bot Sells. You Sell. Hybrid. You choose.', body: 'Inside any task, the Autonomous Sales Pipeline identifies buyers actively looking for exactly what you are building — matched by problem, budget, and urgency.', cta: 'Open Sales Pipeline', ctaHref: '/tasks', accent: '[#FFD700]' },
      { index: 2, variant: 'how-it-works', headline: 'Qualify → Match → Draft → Approve → Send', subheadline: 'Every step transparent, every send authorized.', body: 'The Sales Scout uses permitted data sources to surface leads with verified budget signals. It matches each lead to your offer and drafts a personalized pitch. You approve before anything is sent.', cta: 'See How It Works', accent: '[#FFD700]' },
      { index: 3, variant: 'swarm-execution', headline: 'Sales Scout Running in Parallel', subheadline: 'While builders produce, the scout hunts.', body: 'The Buyer Qualification Agent and Outreach Drafting Agent run concurrently with your deliverable builders. By the time your asset is ready, a curated buyer list with draft messages is waiting.', cta: 'Deploy AI Swarm', accent: '[#FFD700]' },
      { index: 4, variant: 'buyer-pipeline', headline: 'Your Outreach Dashboard', subheadline: 'Suggested → Selected → Approved → Sent → Won.', body: 'Each buyer card shows their problem, estimated budget, match score, and a draft pitch you can edit inline. Choose Bot Sells, You Sell, or Hybrid mode.', cta: 'View Sales Dashboard', ctaHref: '/dashboard/sales', accent: '[#FFD700]' },
      { index: 5, variant: 'launch-economics', headline: 'Close, Track, Reinvest.', subheadline: 'Every deal logged. Every dollar traceable.', body: 'Won deals are recorded in your ledger. Reply tracking shows open rates and response stages. Pause or stop any campaign instantly. Compliance controls always on.', cta: 'Start Pipeline', accent: '[#FFD700]' },
    ],
  },
  {
    number: 3,
    slug: 'reddit-arbitrage',
    title: 'Reddit Pain Point Arbitrage',
    subtitle: 'Where frustration meets opportunity.',
    shortDescription: 'The Reddit Research Agent surfaces public discussions where users are actively requesting tools or freelancers. It matches pain points to blueprints — you approve before anything is posted.',
    timeToFirstDollar: '3–5 days',
    capital: 'zero',
    difficulty: 'Beginner',
    riskLevel: 'Low',
    advantage: 'Demand-led discovery — leads come to you',
    tags: ['reddit', 'research', 'leads', 'freelance'],
    requiresAuth: true,
    riskWarning: 'All responses require manual approval before posting. Trendly respects Reddit API terms, subreddit rules, and anti-spam requirements.',
    scenes: [
      { index: 1, variant: 'opportunity', headline: 'Millions of Pain Points. Posted Publicly. Daily.', subheadline: 'They ask for help. You show up with a solution.', body: 'Every day, thousands of users post on Reddit describing exactly the problem your deliverable solves. The Reddit Research Agent finds those posts, classifies the request, and prepares a helpful response for your approval.', cta: 'Start Reddit Research', accent: '[#FF007A]' },
      { index: 2, variant: 'how-it-works', headline: 'Choose Subreddit → Mine Pain Points → Match Blueprint → Draft Response', subheadline: 'Four steps from discovery to opportunity.', body: 'Select a subreddit or category. The agent scans public posts for tool requests and business frustrations. It classifies each one and maps it to the most relevant Trendly blueprint. You review every match.', cta: 'Browse Blueprints', ctaHref: '/blueprints', accent: '[#FF007A]' },
      { index: 3, variant: 'swarm-execution', headline: 'Research Agent Scanning Live Threads', subheadline: 'Public posts. Classified. Matched to blueprints.', body: 'The Reddit Research Agent uses the public Reddit API to identify high-intent threads. Each discovery is scored by recency, relevance, and budget signal. You see source post, problem classification, and matched blueprint.', cta: 'Deploy Research Agent', accent: '[#FF007A]' },
      { index: 4, variant: 'buyer-pipeline', headline: 'Approve Your Response Before Anything Gets Sent', subheadline: 'Human judgment stays in the loop, always.', body: 'Each matched opportunity shows the original post, your draft response, the offer, and suggested price. You edit, approve, and the system submits through your authenticated Reddit account.', cta: 'Review Opportunities', accent: '[#FF007A]' },
      { index: 5, variant: 'launch-economics', headline: 'Replies, Leads, Conversions.', subheadline: 'Track every opportunity from post to payment.', body: 'Replies are tracked. Leads that convert are logged in your sales pipeline. The agent continues scanning for new opportunities on a schedule you control.', cta: 'Open Research Agent', accent: '[#FF007A]' },
    ],
  },
  {
    number: 4,
    slug: 'marketplace-assets',
    title: 'Marketplace Asset & Agent Sales',
    subtitle: 'Build once. Sell to thousands.',
    shortDescription: 'Package your companions, prompts, workflow blueprints, or Remotion templates into the Trendly Marketplace. Other users purchase them — you earn a 70-80% seller split.',
    timeToFirstDollar: '5–7 days',
    capital: 'zero',
    difficulty: 'Intermediate',
    riskLevel: 'Low',
    advantage: 'Passive income from existing work — build once, distribute forever',
    tags: ['marketplace', 'passive', 'agents', 'templates'],
    requiresAuth: true,
    riskWarning: 'Earnings are recorded only after transactions are confirmed on the platform ledger. Displayed figures are verified, not projected.',
    scenes: [
      { index: 1, variant: 'opportunity', headline: 'Your Work. Listed. Earning While You Sleep.', subheadline: '70-80% seller split. Configurable pricing. Real payouts.', body: 'Every agent, prompt chain, blueprint, or template you have built is a sellable asset. The Trendly Marketplace connects it to users who want to skip the build and buy the result.', cta: 'Go to Marketplace', ctaHref: '/marketplace', accent: '[#9D00FF]' },
      { index: 2, variant: 'how-it-works', headline: 'Package → List → Preview → Sell', subheadline: 'The Marketplace Packaging Agent handles the hard parts.', body: 'The Packaging Agent takes your raw output and generates a listing with a preview, description, usage examples, license type, and pricing suggestion. You review and publish.', cta: 'Create Listing', ctaHref: '/marketplace', accent: '[#9D00FF]' },
      { index: 3, variant: 'swarm-execution', headline: 'Packaging Agent Building Your Listing', subheadline: 'Professional listing in minutes, not hours.', body: 'The agent extracts your asset value proposition, writes a compelling description, generates preview screenshots, suggests a price based on comparable listings, and adds versioning metadata.', cta: 'Deploy Packaging Agent', accent: '[#9D00FF]' },
      { index: 4, variant: 'buyer-pipeline', headline: 'Buyers, Reviews, Earnings.', subheadline: 'Real purchases. Verified reviews. Ledger-backed payouts.', body: 'Your seller dashboard shows buyer count, total revenue, active licenses, reviews, and payout status. Earnings appear in your ledger only after confirmed transactions.', cta: 'View Seller Dashboard', ctaHref: '/marketplace', accent: '[#9D00FF]' },
      { index: 5, variant: 'launch-economics', headline: 'Version, Update, Re-monetize.', subheadline: 'Your asset grows with the platform.', body: 'Ship updates to existing buyers automatically. Raise your price as demand proves value. List variations across tiers. Your catalogue becomes a compounding revenue stream.', cta: 'Publish to Marketplace', ctaHref: '/marketplace', accent: '[#9D00FF]' },
    ],
  },
  {
    number: 5,
    slug: 'referrals',
    title: '10% Lifetime Referral Commissions',
    subtitle: 'Share your link. Earn on every subscription.',
    shortDescription: 'Share your unique referral link. Eligible users earn 10% recurring commissions on referred subscribers, subject to platform terms and eligibility rules.',
    timeToFirstDollar: '3–7 days',
    capital: 'zero',
    difficulty: 'Beginner',
    riskLevel: 'Low',
    advantage: 'Recurring passive income from a network you build once',
    tags: ['referrals', 'passive', 'recurring', 'commissions'],
    requiresAuth: true,
    riskWarning: 'Commissions are subject to platform terms, refund windows, chargeback adjustments, and eligibility requirements. No guaranteed income.',
    scenes: [
      { index: 1, variant: 'opportunity', headline: '10% Every Month. For Life.', subheadline: 'One referral. Recurring revenue as long as they subscribe.', body: 'Share your unique Trendly referral link with your audience. Every eligible subscriber earns you 10% of their monthly subscription, recurring, subject to platform terms.', cta: 'Get My Referral Link', ctaHref: '/referrals', accent: '[#00FF66]' },
      { index: 2, variant: 'how-it-works', headline: 'Share → Sign Up → Subscribe → You Earn', subheadline: 'Tracked, transparent, and fully auditable.', body: 'Your referral link is unique. Every sign-up through it is attributed to you. When they subscribe to a paid plan, your commission is added to your pending balance.', cta: 'View Referral Dashboard', ctaHref: '/referrals', accent: '[#00FF66]' },
      { index: 3, variant: 'swarm-execution', headline: 'Share Tools. Track Everything.', subheadline: 'One-click sharing to every channel.', body: 'Your referral hub gives you your link, pre-written share copy for Twitter, LinkedIn, and Discord, plus a QR code. All referral activity is tracked in real time.', cta: 'Open Referral Hub', ctaHref: '/referrals', accent: '[#00FF66]' },
      { index: 4, variant: 'buyer-pipeline', headline: 'Commission Breakdown.', subheadline: 'Subscription earnings. Marketplace cut. Pending vs. available.', body: 'Your earnings dashboard separates subscription commissions from marketplace referral bonuses. Pending balances show what is in the review window. Available balances are ready to withdraw.', cta: 'View Earnings', ctaHref: '/referrals', accent: '[#00FF66]' },
      { index: 5, variant: 'launch-economics', headline: 'Network Compounds. Revenue Compounds.', subheadline: 'Each referral you make can also become a referrer.', body: 'The most effective referrers share authentic results — their own Trendly earnings, not promises. Build trust, build network, build recurring income.', cta: 'Start Referring', ctaHref: '/referrals', accent: '[#00FF66]' },
    ],
  },
  {
    number: 6,
    slug: 'micro-saas',
    title: 'Turnkey Micro-SaaS Deployment',
    subtitle: 'From validated trend to live product in days.',
    shortDescription: 'The micro-saas builder agent generates a complete Next.js app with auth, Stripe billing, Prisma DB, and Tailwind UI from any validated trend. Deploy to Vercel after your review.',
    timeToFirstDollar: '1–3 weeks',
    capital: '–20 (domain + hosting)',
    difficulty: 'Intermediate',
    riskLevel: 'Medium',
    advantage: 'Recurring MRR and an asset you own outright',
    tags: ['saas', 'recurring', 'code', 'stripe', 'deployment'],
    requiresAuth: true,
    riskWarning: 'Requires approximately -20 upfront for domain and hosting. Revenue depends on customer acquisition. No external services are connected without your explicit approval.',
    scenes: [
      { index: 1, variant: 'opportunity', headline: 'A Live SaaS Product. From a Trend. This Week.', subheadline: '-49/month per user. Recurring. Yours.', body: 'Pick a validated trend with clear demand. The micro-saas builder generates a complete production application — authentication, billing, database, UI — ready to deploy. You own the code and the revenue.', cta: 'Pick a Trend', ctaHref: '/trends', accent: '[#FFD700]' },
      { index: 2, variant: 'how-it-works', headline: 'Trend → Brief → Code → Review → Deploy → Bill', subheadline: 'Every step requires your approval before proceeding.', body: 'Select a trend, review the product brief, approve the feature list, generate the code, run validation, connect your Stripe account, and deploy to Vercel. Each phase waits for your go-ahead.', cta: 'Start Micro-SaaS', accent: '[#FFD700]' },
      { index: 3, variant: 'swarm-execution', headline: 'Code Agent Building Your Product', subheadline: 'Next.js, Prisma, Stripe, Tailwind. Production-grade.', body: 'The Code Agent generates complete, working application code. The Deployment Agent validates the build, checks TypeScript errors, and prepares a Vercel deployment package.', cta: 'Deploy AI Swarm', accent: '[#FFD700]' },
      { index: 4, variant: 'buyer-pipeline', headline: 'First Users Before Launch.', subheadline: 'Build an audience while the code is generating.', body: 'The Sales Scout identifies early adopters in your target market while the Code Agent builds. By launch day, you have a warm list of potential subscribers ready to convert.', cta: 'Find Early Adopters', accent: '[#FFD700]' },
      { index: 5, variant: 'launch-economics', headline: 'MRR Dashboard. Churn. Retention.', subheadline: 'Track the metrics that matter from day one.', body: 'Once live, your dashboard shows MRR, active users, churn rate, and lifetime value. Stripe webhooks post every payment to your ledger. Reinvest into growth or list the asset for acquisition.', cta: 'Launch Micro-SaaS', accent: '[#FFD700]' },
    ],
  },
  {
    number: 7,
    slug: 'prediction-arbitrage',
    title: 'Prediction & Liquidity Arbitrage',
    subtitle: 'Monitor markets. Identify inefficiencies. Trade with discipline.',
    shortDescription: 'The prediction arbitrage agent monitors supported prediction markets. Paper-trade mode available first. Live trading disabled by default and requires explicit configuration.',
    timeToFirstDollar: 'Minutes to hours (when active)',
    capital: '–,000+',
    difficulty: 'Expert',
    riskLevel: 'Very High',
    advantage: 'Potential rapid return on verifiable market inefficiencies',
    tags: ['trading', 'prediction-markets', 'arbitrage', 'capital-required'],
    requiresAuth: true,
    riskWarning: 'WARNING: This method involves capital risk. You can lose some or all deployed funds. Past performance does not guarantee future results. This is not financial advice. Trading is DISABLED by default. You must set risk limits and explicitly enable live trading. Only trade capital you can afford to lose completely.',
    scenes: [
      { index: 1, variant: 'opportunity', headline: 'Markets Have Inefficiencies. Agents Find Them.', subheadline: 'Paper trade first. Always.', body: 'Prediction markets price outcomes on real events. Pricing discrepancies create arbitrage opportunities. The prediction arbitrage agent monitors supported markets and flags potential openings — you decide whether to act.', cta: 'Open Paper Trade Simulator', accent: '[#FF007A]', riskNote: 'Capital loss is possible. Paper-trade mode only by default.' },
      { index: 2, variant: 'how-it-works', headline: 'Monitor → Detect → Simulate → Confirm → Execute', subheadline: 'Every live trade requires your active confirmation.', body: 'The agent scans supported markets, scores opportunities by expected value and confidence, estimates fees and slippage, and presents a trade ticket. Paper-trading shows projected outcomes without real capital.', cta: 'Configure Agent', accent: '[#FF007A]', riskNote: 'Live trading requires enabling in settings. Disabled by default.' },
      { index: 3, variant: 'swarm-execution', headline: 'Prediction Agent — Paper Mode Active', subheadline: 'All displays show simulated results until live mode is enabled.', body: 'The agent monitors market feeds, calculates spread efficiency, estimates fees on every candidate trade, and logs simulation results. Risk limits and emergency shutdown configurable before any live trading.', cta: 'View Paper Trade Log', accent: '[#FF007A]', riskNote: 'Paper mode only. Simulated results are not guaranteed outcomes.' },
      { index: 4, variant: 'buyer-pipeline', headline: 'Position Log. P&L. Risk Controls.', subheadline: 'Transparent accounting. No hidden fees.', body: 'Every simulated and live trade is logged with entry price, exit price, gross P&L, fees, slippage, and net result. Stop-loss and daily loss limits are enforced automatically.', cta: 'View Position Log', accent: '[#FF007A]', riskNote: 'Not financial advice. Configure stop-loss before enabling live trading.' },
      { index: 5, variant: 'launch-economics', headline: 'Capital At Risk. Results Not Guaranteed.', subheadline: 'Read the risk disclosure before enabling live trading.', body: 'Live trading is disabled by default. To enable it you must set a capital limit, configure a stop-loss, acknowledge the risk disclosure, and explicitly toggle live mode. You can pause or shut down at any time.', cta: 'Configure Risk Limits', accent: '[#FF007A]', riskNote: 'Trading involves the risk of capital loss. Only deploy funds you can afford to lose entirely. Not financial advice.' },
    ],
  },
  {
    number: 8,
    slug: 'web4-agents',
    title: 'Sovereign Web4 Agent Workers',
    subtitle: 'Deploy agents. Earn micropayments. Own the economy.',
    shortDescription: 'Deploy autonomous Web4 companions that execute permitted microtasks and receive x402-style micropayments. Testnet-only by default. Mainnet requires explicit confirmation.',
    timeToFirstDollar: 'Days to weeks',
    capital: 'Gas fees + seed wallet',
    difficulty: 'Expert',
    riskLevel: 'Very High',
    advantage: 'Machine-economy passive income from deployed autonomous agents',
    tags: ['web4', 'agents', 'crypto', 'micropayments', 'autonomous'],
    requiresAuth: true,
    riskWarning: 'WARNING: Blockchain transactions are irreversible. Funds sent to incorrect addresses cannot be recovered. Gas fees reduce returns. All Web4 operations run on testnet by default. Mainnet requires explicit confirmation. Never share your private key. Only fund wallets with amounts you can afford to lose entirely.',
    scenes: [
      { index: 1, variant: 'opportunity', headline: 'Agents That Work While You Sleep. And Get Paid.', subheadline: 'x402 micropayments. Machine economy. Sovereign identity.', body: 'Deploy Web4 companions with their own wallets, identities, and permitted task queues. They execute approved microtasks and receive micropayments automatically. You collect the earnings sweep.', cta: 'View Web4 Agents', ctaHref: '/web4', accent: '[#9D00FF]', riskNote: 'Testnet only by default. Mainnet transactions are irreversible.' },
      { index: 2, variant: 'how-it-works', headline: 'Create Wallet → Set Permissions → Deploy → Monitor', subheadline: 'Every permission explicit. Every transaction logged.', body: 'Wallet creation requires your approval. You set spending limits, allowlists for approved contracts and APIs, and a profit sweep schedule. The agent executes only within its configured bounds.', cta: 'View Web4 Dashboard', ctaHref: '/web4', accent: '[#9D00FF]', riskNote: 'Private keys stored encrypted server-side. Never exposed in browser.' },
      { index: 3, variant: 'swarm-execution', headline: 'Testnet Active. Mainnet Requires Confirmation.', subheadline: 'Simulate on testnet before committing real funds.', body: 'Agents run on testnet by default. Simulation mode shows projected earnings without real transactions. Mainnet requires you to acknowledge all risks and confirm each transaction.', cta: 'Configure Web4 Agent', ctaHref: '/web4', accent: '[#9D00FF]', riskNote: 'Testnet only until you explicitly enable mainnet.' },
      { index: 4, variant: 'buyer-pipeline', headline: 'Earnings, Gas Costs, and Sweep Schedule.', subheadline: 'Transparent accounting down to the wei.', body: 'Your agent ledger shows gross micropayment income, gas costs per transaction, net earnings, and the next scheduled profit sweep to your main wallet. Emergency pause and wallet revoke controls always accessible.', cta: 'Open Agent Ledger', ctaHref: '/web4', accent: '[#9D00FF]', riskNote: 'Gas fees and failed transactions reduce net returns.' },
      { index: 5, variant: 'launch-economics', headline: 'Irreversible. Transparent. Yours.', subheadline: 'Blockchain accountability with full audit trail.', body: 'Every on-chain action is logged with transaction hash, block number, gas used, and outcome. Withdrawals require confirmation. Emergency shutdown halts all agent activity immediately.', cta: 'Set Up Web4 Agents', ctaHref: '/web4', accent: '[#9D00FF]', riskNote: 'Blockchain transactions are irreversible. Not financial advice.' },
    ],
  },
  {
    number: 9,
    slug: 'ai-swarm-launch',
    title: 'AI Swarm Launch Command',
    subtitle: 'The engine that powers all 8 earning methods.',
    shortDescription: 'From any trend or task, deploy the full AI Swarm. The Brainstorm Chamber analyzes the opportunity, assembles the right agents, dispatches them in parallel, and surfaces buyers.',
    timeToFirstDollar: 'Depends on chosen method',
    capital: 'Depends on chosen method',
    difficulty: 'Beginner',
    riskLevel: 'Low',
    advantage: 'One launch command activates the entire Trendly earning stack',
    tags: ['swarm', 'automation', 'launch', 'all-methods'],
    requiresAuth: true,
    scenes: [
      { index: 1, variant: 'opportunity', headline: 'One Button. The Entire Earning Stack.', subheadline: 'Trend → Task → Brainstorm → Swarm → Buyers → Revenue.', body: 'The AI Swarm Launch is the central workflow connecting all 9 earning methods. From any live pulse item, trend card, or task page, click Deploy AI Swarm to activate the full autonomous stack.', cta: 'Deploy AI Swarm', accent: '[#00F0FF]' },
      { index: 2, variant: 'how-it-works', headline: 'Analyze → Plan → Confirm → Dispatch → Review → Sell', subheadline: 'Six phases. You control every gate.', body: 'The Brainstorm Chamber scans the trend or task and produces a complete execution brief: market vector, deliverables, accounts needed, estimated time and cost, buyer profile, and recommended earning method.', cta: 'Open Brainstorm Chamber', accent: '[#00F0FF]' },
      { index: 3, variant: 'swarm-execution', headline: 'All 16 Agents. Running in Parallel.', subheadline: 'Builders build. Scout hunts. QA verifies. Simultaneously.', body: 'Research, Validation, Scriptwriter, Voice, Video, Design, Code, Operations, Accounts, QA, Sales Scout, Buyer Qualification, Outreach, Packaging, Deployment, and Autonomy agents — activated based on your mission profile.', cta: 'Launch Full Swarm', accent: '[#00F0FF]' },
      { index: 4, variant: 'buyer-pipeline', headline: 'Buyers Found Before the Build Completes.', subheadline: 'Sales Scout runs concurrently with every builder agent.', body: 'While your deliverable is being generated, the Sales Scout identifies qualified buyers, estimates budgets, scores urgency, and drafts personalized pitches. By the time your asset is ready, the buyer list is waiting.', cta: 'View Buyer Pipeline', ctaHref: '/dashboard/sales', accent: '[#00F0FF]' },
      { index: 5, variant: 'launch-economics', headline: 'Launch. Measure. Compound.', subheadline: 'Every completed swarm feeds the next.', body: 'Completed swarms generate deliverables, sales leads, and data. Each run improves the next — better buyer matching, sharper deliverable quality, faster execution. Reinvest earnings into higher-yield methods as confidence grows.', cta: 'Deploy Your First Swarm', accent: '[#00F0FF]' },
    ],
  },
];

export function getMethodBySlug(slug: string): EarnMethod | undefined {
  return EARN_METHODS.find((m) => m.slug === slug);
}

export function isValidMethodSlug(slug: string): slug is EarnMethodSlug {
  return EARN_METHODS.some((m) => m.slug === slug);
}