export interface BlueprintMilestoneDef {
  order: number;
  name: string;
  description: string;
  type: 'RESEARCH' | 'PRODUCTION' | 'VALIDATION' | 'SALES_SETUP' | 'SALES_EXECUTION' | 'PAYMENT' | 'COMPLETED';
}

export interface TaskTypeBlueprint {
  category: string;
  name: string;
  description: string;
  defaultMilestones: BlueprintMilestoneDef[];
  deliverableTypes: string[];
  suggestedPlatforms: string[];
  defaultPricingCents: number;
}

export const TASK_BLUEPRINTS: Record<string, TaskTypeBlueprint> = {
  AI_CONTENT: {
    category: 'AI_CONTENT',
    name: 'Faceless Video & Viral Content Pipeline',
    description: 'Autonomous generation of video scripts, voiceover, visuals, editing metadata, and buyer outreach.',
    suggestedPlatforms: ['fiverr', 'upwork', 'twitter', 'email'],
    defaultPricingCents: 15000, // $150.00
    deliverableTypes: ['video', 'document', 'image'],
    defaultMilestones: [
      { order: 1, name: 'Market & Trend Intelligence', description: 'Scrape viral hooks, competitor retention metrics, and high-CTR thumbnails.', type: 'RESEARCH' },
      { order: 2, name: 'Video Package Production', description: 'Generate script, AI voiceover cues, stock footage prompts, and rendered video master.', type: 'PRODUCTION' },
      { order: 3, name: 'Quality & Retention Audit', description: 'Validate pacing, originality score, audio normalization, and compliance.', type: 'VALIDATION' },
      { order: 4, name: 'Buyer & Channel Lead Discovery', description: 'Scrape YouTubers, TikTok agencies, and brands looking for video editors and creators.', type: 'SALES_SETUP' },
      { order: 5, name: 'Sales Pipeline & Deal Execution', description: 'Execute outreach (Bot Sells, Sales Kit, or Hybrid) with proposal submissions.', type: 'SALES_EXECUTION' },
      { order: 6, name: 'Escrow Payment & Transfer', description: 'Collect buyer payment into escrow, verify asset delivery, and release payout.', type: 'PAYMENT' },
      { order: 7, name: 'Sale Provenance & Ledger Entry', description: 'Immutably record completed sale, delivery proof, and net profit in dashboard.', type: 'COMPLETED' },
    ],
  },
  ECOMMERCE: {
    category: 'ECOMMERCE',
    name: 'E-Commerce & Print-on-Demand Launchpad',
    description: 'Product mockup rendering, SEO listing copy, pricing matrix, and retail outreach.',
    suggestedPlatforms: ['etsy', 'fiverr', 'upwork', 'email', 'marketplace'],
    defaultPricingCents: 22000, // $220.00
    deliverableTypes: ['image', 'listing', 'data'],
    defaultMilestones: [
      { order: 1, name: 'Product Niche & Margin Research', description: 'Scan Amazon/Etsy bestseller velocity, profit margins, and keyword volume.', type: 'RESEARCH' },
      { order: 2, name: 'Design & Mockup Generation', description: 'Render high-res 3D product visuals, mockup composites, and packaging labels.', type: 'PRODUCTION' },
      { order: 3, name: 'SEO & Copy Validation', description: 'Validate keyword density, bullet points, price elasticity, and listing quality.', type: 'VALIDATION' },
      { order: 4, name: 'Buyer & Store Owner Discovery', description: 'Find boutique retailers, dropship store owners, and merchandise buyers.', type: 'SALES_SETUP' },
      { order: 5, name: 'Catalog Outreach & Negotiation', description: 'Pitch wholesale and direct buyers with ready-to-list product packages.', type: 'SALES_EXECUTION' },
      { order: 6, name: 'Payment Capture & Escrow Release', description: 'Process buyer purchase, transfer design rights, and credit user wallet.', type: 'PAYMENT' },
      { order: 7, name: 'E-Commerce Sale Settlement', description: 'Record transaction details, proof of deliverable, and portfolio statistics.', type: 'COMPLETED' },
    ],
  },
  EDUCATION: {
    category: 'EDUCATION',
    name: 'Digital Products & Knowledge Assets',
    description: 'Comprehensive guides, ebooks, checklists, video course outlines, and sales landing copy.',
    suggestedPlatforms: ['gumroad', 'twitter', 'reddit', 'email'],
    defaultPricingCents: 9700, // $97.00
    deliverableTypes: ['document', 'image', 'listing'],
    defaultMilestones: [
      { order: 1, name: 'Topic Demand & Search Query Analysis', description: 'Analyze high-intent search questions, forums, and problem statements.', type: 'RESEARCH' },
      { order: 2, name: 'Digital Asset Authoring & Formatting', description: 'Author complete actionable guide, design PDF layout, and create 3D cover.', type: 'PRODUCTION' },
      { order: 3, name: 'Accuracy & Value Review', description: 'Check readability index, actionable frameworks, and formatting integrity.', type: 'VALIDATION' },
      { order: 4, name: 'Audience & Community Sourcing', description: 'Identify target community members, Reddit threads, and newsletter subscribers.', type: 'SALES_SETUP' },
      { order: 5, name: 'Direct Sales & Distribution', description: 'Deploy promotional copy, affiliate outreach, and direct sales sequence.', type: 'SALES_EXECUTION' },
      { order: 6, name: 'Instant Payment & Download Handshake', description: 'Collect funds via Stripe escrow and automatically provide download access.', type: 'PAYMENT' },
      { order: 7, name: 'Revenue Reconciliation', description: 'Log sale record, royalty calculation, and earnings increment in dashboard.', type: 'COMPLETED' },
    ],
  },
  CRYPTO_FINANCE: {
    category: 'CRYPTO_FINANCE',
    name: 'Web3 Protocol & Smart Contract Pipeline',
    description: 'Smart contract code generation, tokenomics model, security audits, and DAO bounty pitches.',
    suggestedPlatforms: ['upwork', 'twitter', 'reddit', 'email'],
    defaultPricingCents: 50000, // $500.00
    deliverableTypes: ['code', 'document', 'data'],
    defaultMilestones: [
      { order: 1, name: 'Protocol Architecture & Spec Mining', description: 'Review target chain requirements, gas optimization specs, and security standards.', type: 'RESEARCH' },
      { order: 2, name: 'Smart Contract & DApp Construction', description: 'Write tested Solidity/Rust contracts, tokenomics calculator, and deployment scripts.', type: 'PRODUCTION' },
      { order: 3, name: 'Automated Security & Gas Audit', description: 'Run static analysis, reentrancy checks, and unit test suites.', type: 'VALIDATION' },
      { order: 4, name: 'DAO & Founder Discovery', description: 'Scrape Web3 job boards, hackathons, bounty registries, and founder DMs.', type: 'SALES_SETUP' },
      { order: 5, name: 'Contract Bidding & Technical Pitch', description: 'Submit audited code proposal, test coverage report, and quote to protocol teams.', type: 'SALES_EXECUTION' },
      { order: 6, name: 'Smart Escrow / Fiat Settlement', description: 'Receive client deposit into escrow, verify testnet deployment, and release funds.', type: 'PAYMENT' },
      { order: 7, name: 'On-Chain Proof & Dashboard Update', description: 'Log contract delivery hash, transaction IDs, and net compensation.', type: 'COMPLETED' },
    ],
  },
  AGENT_ECONOMY: {
    category: 'AGENT_ECONOMY',
    name: 'Micro-SaaS & AI Agent Builder',
    description: 'Custom AI agent tools, workflow scripts, automated scrapers, and agency integration packages.',
    suggestedPlatforms: ['upwork', 'fiverr', 'twitter', 'linkedin', 'email'],
    defaultPricingCents: 35000, // $350.00
    deliverableTypes: ['code', 'data', 'document'],
    defaultMilestones: [
      { order: 1, name: 'Agency Workflow Bottleneck Research', description: 'Scrape recurring manual tasks in marketing, sales, and data entry forums.', type: 'RESEARCH' },
      { order: 2, name: 'Autonomous Agent Tool Development', description: 'Build functional Next.js/Node script with API integrations and web UI.', type: 'PRODUCTION' },
      { order: 3, name: 'API Latency & Output Testing', description: 'Simulate concurrent requests, rate-limit resilience, and accuracy benchmarks.', type: 'VALIDATION' },
      { order: 4, name: 'B2B Business Lead Scraping', description: 'Extract agency owners, SaaS founders, and operations managers from LinkedIn & Twitter.', type: 'SALES_SETUP' },
      { order: 5, name: 'Demo Outreach & Value Pitch', description: 'Send personalized Loom-style demo scripts, ROI calculations, and free trial access.', type: 'SALES_EXECUTION' },
      { order: 6, name: 'Software License & Escrow Payout', description: 'Collect setup fee and subscription deposit, issue license keys, and transfer payout.', type: 'PAYMENT' },
      { order: 7, name: 'Enterprise Sale Record', description: 'Record B2B client details, license terms, and dashboard earnings.', type: 'COMPLETED' },
    ],
  },
  OTHER: {
    category: 'OTHER',
    name: 'General Autonomous Opportunity Blueprint',
    description: 'Universal 7-step autonomous research, asset generation, buyer sourcing, and deal closure.',
    suggestedPlatforms: ['fiverr', 'upwork', 'twitter', 'email'],
    defaultPricingCents: 18000, // $180.00
    deliverableTypes: ['document', 'image', 'data'],
    defaultMilestones: [
      { order: 1, name: 'Market Discovery & Intelligence', description: 'Gather competitive intelligence and customer pain points.', type: 'RESEARCH' },
      { order: 2, name: 'Deliverable Generation', description: 'Produce primary digital asset and supporting collateral.', type: 'PRODUCTION' },
      { order: 3, name: 'Quality Assurance', description: 'Verify asset standards, formatting, and compliance.', type: 'VALIDATION' },
      { order: 4, name: 'Target Buyer Sourcing', description: 'Scrape relevant buyer leads across freelance and social platforms.', type: 'SALES_SETUP' },
      { order: 5, name: 'Sales Pipeline Execution', description: 'Execute selected sales approach (Bot Sells, Sales Kit, or Hybrid).', type: 'SALES_EXECUTION' },
      { order: 6, name: 'Payment Collection & Escrow', description: 'Capture payment into escrow and verify customer satisfaction.', type: 'PAYMENT' },
      { order: 7, name: 'Settlement & Ledger Update', description: 'Record finalized transaction and update user metrics.', type: 'COMPLETED' },
    ],
  },
};

/**
 * Returns blueprint for a given category with fallback.
 */
export function getBlueprintForCategory(category: string): TaskTypeBlueprint {
  return TASK_BLUEPRINTS[category] || TASK_BLUEPRINTS.OTHER;
}
