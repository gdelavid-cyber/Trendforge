// Enhanced Autonomous Viral Intelligence & Multi-Source Scraper Engine

export * from './classifier';

export function validatePipelineKey(request: Request): boolean {
  const valid = process.env.PIPELINE_API_KEY;
  if (!valid) return false;
  const key = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  const url = new URL(request.url);
  const queryKey = url.searchParams.get('key');
  return key === valid || queryKey === valid;
}

// Comprehensive catalog of 30+ money-making niches & viral vectors
export const TREND_BLUEPRINTS = [
  // 1. AI AGENTS & VOICE WORKERS
  {
    prefix: 'Deploy Autonomous AI Voice Receptionists for',
    targets: ['Dental Clinics', 'Luxury Med Spas', 'Emergency HVAC Contractors', 'Real Estate Brokerages', 'High-End Law Firms', 'Commercial Roofing Companies', 'Veterinary Hospitals'],
    platforms: ['Twitter', 'LinkedIn', 'ProductHunt'],
    category: 'LOCAL_SERVICES',
    baseEarningsLow: 450,
    baseEarningsHigh: 1800,
    startupCost: 0,
    time: '1-3 days',
    steps: [
      'Set up a demo phone number using Vapi AI or Retell AI configured with appointment booking logic',
      'Scrape Google Maps for local {TARGET} with 50+ reviews but slow response times',
      'Send personalized 45-second screen recordings demonstrating the AI booking appointments after hours',
      'Charge $350 setup + $199/month recurring retainer for automated call handling and calendar sync',
    ],
    proTip: 'Offer a 7-day risk-free pilot; local business owners convert immediately once they see booked appointments.',
  },
  // 2. KNOWLEDGE BASE & EMBEDDINGS
  {
    prefix: 'Build Custom AI Knowledge Base Chatbots for',
    targets: ['Shopify Brand Stores', 'SaaS Onboarding Teams', 'Private Equity Portfolios', 'Online Course Creators', 'Immigration Law Firms', 'Real Estate Wholesalers'],
    platforms: ['Twitter', 'GitHub', 'Reddit'],
    category: 'AI_TOOLS',
    baseEarningsLow: 500,
    baseEarningsHigh: 2200,
    startupCost: 0,
    time: '2-4 days',
    steps: [
      'Ingest client documentation and FAQs into LangChain/Flowise or Chatbase vector store',
      'Embed custom widget matching client website branding with zero-latency responses',
      'Demo support automation by resolving simulated tier-1 customer inquiries',
      'Contract service at $500 one-time build fee plus $150/mo maintenance retainer',
    ],
    proTip: 'Package this with automated lead capture to collect visitor emails directly before answering questions.',
  },
  // 3. COLD OUTREACH AGENTS
  {
    prefix: 'Launch Multi-Agent Cold Email Lead Funnels for',
    targets: ['B2B Marketing Agencies', 'Commercial Solar Installers', 'Corporate Headhunters', 'Fintech Startups', 'Logistics Freight Brokers', 'Cybersecurity Consultancies'],
    platforms: ['LinkedIn', 'Twitter', 'ProductHunt'],
    category: 'AI_TOOLS',
    baseEarningsLow: 600,
    baseEarningsHigh: 2800,
    startupCost: 15,
    time: '3-5 days',
    steps: [
      'Use Clay or Apollo to scrape verified executive emails filtered by hiring signals and recent funding',
      'Deploy GPT-4o-mini personalized research agents that write custom first lines referencing prospect podcasts or posts',
      'Warm up 3 secondary domains via Instantly.ai and sequence personalized 3-step outreach',
      'Bill clients $1,500/mo retainer or $75 per qualified sales demo booked',
    ],
    proTip: 'Charge per booked discovery call rather than per email sent to command 4x higher pricing.',
  },
  // 4. VIRAL UGC & SHORT FORM
  {
    prefix: 'Automated UGC Video Ads Creation for',
    targets: ['TikTok Shop E-Commerce Brands', 'Direct-to-Consumer Fitness Gear', 'Niche Supplement Startups', 'Mobile App Publishers', 'Organic Skincare Lines'],
    platforms: ['TikTok', 'Instagram', 'Twitter'],
    category: 'AI_CONTENT',
    baseEarningsLow: 350,
    baseEarningsHigh: 1500,
    startupCost: 0,
    time: '1-2 days',
    steps: [
      'Generate lifelike UGC presenter clips using HeyGen, Creatify, or CapCut AI voice sync',
      'Splice viral TikTok hooks and dynamic captions highlighting product pain points',
      'Deliver a batch pack of 5 ad variations optimized for 9:16 vertical feeds',
      'Upsell recurring weekly creative testing packages for $600/month',
    ],
    proTip: 'Study TikTok Creative Center top ads for current high-retention audio templates and pacing.',
  },
  // 5. FACELESS AI CHANNELS
  {
    prefix: 'Launch Faceless YouTube & TikTok Channels around',
    targets: ['Historical Conspiracies', 'Unsolved Wealth Mysteries', 'Tech Billionaire Feuds', 'Deep Ocean Discoveries', 'Sci-Fi AI Dilemmas', 'Ancient Engineering Secrets'],
    platforms: ['YouTube', 'TikTok', 'Reddit'],
    category: 'AI_CONTENT',
    baseEarningsLow: 300,
    baseEarningsHigh: 2400,
    startupCost: 0,
    time: '3-7 days',
    steps: [
      'Generate high-tension narrative scripts via Claude structured with 3-second retention hooks',
      'Synthesize cinematic voiceovers via ElevenLabs and match with AI image sequences from Midjourney',
      'Assemble with CapCut and publish 2 Shorts daily across YouTube, TikTok, and Instagram Reels',
      'Monetize via Creator Rewards Program, affiliate digital bundles, and sponsorships',
    ],
    proTip: 'Keep script pace under 145 words per minute with visual scene cuts every 2.5 seconds.',
  },
  // 6. NOTION OPERATING SYSTEMS
  {
    prefix: 'Curate & Sell Notion Executive Operating Systems for',
    targets: ['Fractional CMOs', 'Solopreneur Web Developers', 'Real Estate Wholesalers', 'Gym Owners & Personal Trainers', 'Freelance Video Editors', 'E-Commerce Media Buyers'],
    platforms: ['Twitter', 'ProductHunt', 'Gumroad'],
    category: 'ECOMMERCE',
    baseEarningsLow: 200,
    baseEarningsHigh: 1100,
    startupCost: 0,
    time: '1-2 days',
    steps: [
      'Design an end-to-end Notion workspace containing client pipelines, KPI trackers, and contract templates',
      'Record a clean 2-minute Loom walkthrough showing daily workflow efficiencies',
      'List on Gumroad / Lemon Squeezy priced at $37-$67 and promote across Twitter and Reddit communities',
      'Partner with niche creators on Twitter offering 40% affiliate commission for newsletter shoutouts',
    ],
    proTip: 'Give away a lightweight free version to build an email list, then upsell the full operating system.',
  },
  // 7. CRYPTO & ON-CHAIN ARBITRAGE
  {
    prefix: 'Solana DeFi Yield & MEV Arbitrage Tracking for',
    targets: ['Raydium Liquidity Pairs', 'Orca Concentrated Pools', 'Meme Coin Launchpads', 'Jupiter DEX Routing', 'Base Protocol Bridging'],
    platforms: ['Twitter', 'DexScreener', 'Telegram'],
    category: 'CRYPTO_FINANCE',
    baseEarningsLow: 500,
    baseEarningsHigh: 3500,
    startupCost: 50,
    time: '1-4 days',
    steps: [
      'Monitor new pool migrations and LP variance spreads using DexScreener and GMGN webhook bots',
      'Configure auto-slippage limits and test small micro-transactions on Solana mainnet',
      'Execute delta-neutral liquidity farming or capture DEX pool price disparities',
      'Compound rewards into stable yield vaults with verified on-chain proof',
    ],
    proTip: 'Never trade without pre-set stop losses and verify contract renunciation before entering new LP positions.',
  },
  // 8. LOCAL SERVICE GOOGLE 3-PACK
  {
    prefix: 'Google Business Profile 3-Pack Optimization & AI Review Engine for',
    targets: ['Local Plumbers', 'Auto Body Repair Shops', 'Cosmetic Dentists', 'Roofing Contractors', 'Local Pest Control', 'Tree Removal Services'],
    platforms: ['Google Maps', 'LinkedIn', 'Local Directories'],
    category: 'LOCAL_SERVICES',
    baseEarningsLow: 400,
    baseEarningsHigh: 1600,
    startupCost: 0,
    time: '1-3 days',
    steps: [
      'Audit local business listings lacking geotagged images, complete category tags, or frequent reviews',
      'Pitch owner on a 14-day local ranking boost to rank in the top 3 Google Maps pack',
      'Deploy automated SMS review requests that route 5-star reviews to Google and feedback to the owner',
      'Charge $499 upfront optimization fee + $149/mo review management retainer',
    ],
    proTip: 'Local business owners value Google Maps reviews more than any other marketing channel.',
  },
  // 9. NICHE MICRO-SAAS DIRECTORIES
  {
    prefix: 'Launch Niche Micro-SaaS Directory & Lead Job Board for',
    targets: ['AI Prompt Engineers', 'Remote Rust Developers', 'Shopify Plus Specialists', 'Cybersecurity Analysts', 'Next.js Solopreneurs'],
    platforms: ['ProductHunt', 'Twitter', 'IndieHackers'],
    category: 'AI_TOOLS',
    baseEarningsLow: 300,
    baseEarningsHigh: 1900,
    startupCost: 0,
    time: '2-5 days',
    steps: [
      'Deploy a curated directory template using Next.js, Airtable, or Softr',
      'Aggregate 100+ verified active opportunities and tools in the {TARGET} niche',
      'Charge companies $49-$99 for featured job placement and newsletter sponsor blast',
      'Distribute organically on Reddit r/freelance and specialized Discord servers',
    ],
    proTip: 'Offer the first 10 company listings for free to build initial authority and traffic proof.',
  },
  // 10. LOCAL LLM / DEEPSEEK DEPLOYMENT
  {
    prefix: 'Deploy On-Premise Private DeepSeek & Ollama LLMs for',
    targets: ['Regional Accounting Firms', 'Private Wealth Managers', 'Boutique Law Practices', 'Medical Records Teams'],
    platforms: ['GitHub', 'LinkedIn', 'HackerNews'],
    category: 'AI_TOOLS',
    baseEarningsLow: 800,
    baseEarningsHigh: 3200,
    startupCost: 0,
    time: '2-4 days',
    steps: [
      'Install Ollama with DeepSeek-R1 or Llama 3 on client local Mac Studio or private server hardware',
      'Set up OpenWebUI dashboard ensuring zero customer data leaves their local intranet',
      'Configure document indexing over local PDF archives and tax law databases',
      'Charge $1,200 setup fee + $250/mo security maintenance agreement',
    ],
    proTip: 'Data privacy is the #1 objection for professional firms; local AI guarantees 100% HIPAA/GDPR compliance.',
  },
];

// Fuzzy token overlap similarity checker to strictly prevent duplicate entries
export function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean));
  const words2 = new Set(str2.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }
  
  const union = words1.size + words2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

export function isDuplicate(text: string, existingList: Set<string> | string[], threshold = 0.55): boolean {
  const cleanTarget = text.toLowerCase().trim();
  const list = existingList instanceof Set ? Array.from(existingList) : existingList;
  
  for (const item of list) {
    const cleanItem = item.toLowerCase().trim();
    if (cleanItem === cleanTarget) return true;
    if (calculateSimilarity(cleanTarget, cleanItem) >= threshold) return true;
  }
  return false;
}

/**
 * Scrapes live viral stories from HackerNews Top Stories API
 */
export async function scrapeHackerNewsViral(): Promise<any[]> {
  try {
    const topRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', { next: { revalidate: 300 } });
    if (!topRes.ok) return [];
    const storyIds = (await topRes.json()).slice(0, 10);
    
    const stories = await Promise.all(
      storyIds.map(async (id: number) => {
        try {
          const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          return itemRes.ok ? await itemRes.json() : null;
        } catch {
          return null;
        }
      })
    );

    return stories.filter(Boolean).filter((s) => s.title && s.score > 25);
  } catch (err) {
    console.warn('[PIPELINE] HackerNews scrape fallback:', err);
    return [];
  }
}

/**
 * Scrapes live Reddit high-velocity posts
 */
export async function scrapeRedditViral(): Promise<any[]> {
  try {
    const res = await fetch('https://www.reddit.com/r/SaaS+SideProject+Entrepreneur+artificial/hot.json?limit=15', {
      headers: { 'User-Agent': 'Mozilla/5.0 TrendlyAI/2.0' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data?.children?.map((c: any) => c?.data) || [];
  } catch (err) {
    console.warn('[PIPELINE] Reddit scrape fallback:', err);
    return [];
  }
}

// Procedural generator that guarantees 0 duplicates against the database
export function generateProceduralTrends(count: number, existingNames: Set<string> = new Set()): any[] {
  const results: any[] = [];
  const shuffledBlueprints = [...TREND_BLUEPRINTS].sort(() => Math.random() - 0.5);

  for (const bp of shuffledBlueprints) {
    if (results.length >= count) break;

    const shuffledTargets = [...bp.targets].sort(() => Math.random() - 0.5);
    for (const target of shuffledTargets) {
      const trendName = `${bp.prefix} ${target}`;

      if (isDuplicate(trendName, existingNames, 0.6)) continue;

      const velocity = +(12 + Math.random() * 8.5).toFixed(1);
      const sentiment = +(0.8 + Math.random() * 0.18).toFixed(2);
      const confidence = +(0.88 + Math.random() * 0.1).toFixed(2);

      results.push({
        trend_name: trendName,
        source_platforms: bp.platforms,
        mention_velocity: velocity,
        sentiment_score: sentiment,
        initial_confidence: confidence,
        category: bp.category,
        blueprint: bp,
        target,
      });

      existingNames.add(trendName.toLowerCase());
      break;
    }
  }

  return results;
}

// Unified LLM and autonomous fallback dispatcher
export async function callLLM(messages: { role: string; content: string }[], jsonMode = false, existingNames: Set<string> = new Set()) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.ABACUSAI_API_KEY;

  if (apiKey) {
    try {
      const endpoint = process.env.OPENAI_API_KEY
        ? 'https://api.openai.com/v1/chat/completions'
        : 'https://apps.abacus.ai/v1/chat/completions';

      const body: any = {
        model: process.env.OPENAI_API_KEY ? 'gpt-4o-mini' : 'gpt-5.4-mini',
        messages,
        max_tokens: 4000,
      };
      if (jsonMode) {
        body.response_format = { type: 'json_object' };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        return data?.choices?.[0]?.message?.content ?? '';
      }
    } catch (err: any) {
      console.warn('External LLM call failed, engaging autonomous trend engine:', err.message);
    }
  }

  // Fallback generation
  const systemPrompt = messages.find((m) => m.role === 'system')?.content || '';
  const userPrompt = messages.find((m) => m.role === 'user')?.content || '';

  if (systemPrompt.includes('trend detection AI')) {
    const trends = generateProceduralTrends(3, existingNames);
    return JSON.stringify({ trends });
  }

  if (systemPrompt.includes('task generation AI')) {
    const matchingBlueprint = TREND_BLUEPRINTS.find((bp) => userPrompt.includes(bp.prefix));
    
    if (matchingBlueprint) {
      const targetMatch = matchingBlueprint.targets.find((t) => userPrompt.includes(t)) || matchingBlueprint.targets[0];
      const steps = matchingBlueprint.steps.map((s) => s.replace(/\{TARGET\}/g, targetMatch));
      const variance = Math.floor(Math.random() * 100);

      return JSON.stringify({
        title: `Monetize ${matchingBlueprint.prefix} ${targetMatch}`,
        description: `Actionable execution framework to acquire paying clients and deploy solutions for ${targetMatch}.`,
        steps,
        difficulty: 'LOW',
        startup_cost: matchingBlueprint.startupCost,
        time_to_first_dollar: matchingBlueprint.time,
        earnings_low: matchingBlueprint.baseEarningsLow + variance,
        earnings_high: matchingBlueprint.baseEarningsHigh + variance * 2,
        risk_level: 'LOW',
        risk_explanation: 'Minimal startup capital required. Downside limited to setup and outreach time.',
        mitigation_strategy: 'Offer free demonstration or pilot before locking in full retainer.',
        pro_tip: matchingBlueprint.proTip,
        category: matchingBlueprint.category,
      });
    }

    const topic = userPrompt.replace(/Generate one (custom )?task about:?|Generate one money-making task for trend:?|\. Output JSON only\./gi, '').trim() || 'Trending Opportunity';
    
    return JSON.stringify({
      title: `Monetize ${topic}`,
      description: `Step-by-step framework to capitalize on ${topic} using zero-cost tooling and automated lead funnels.`,
      steps: [
        `Identify high-intent buyer personas and analyze market demand for ${topic}`,
        `Deploy free baseline workflow using open APIs and no-code templates`,
        `Launch automated outreach sequence to close first paying client`,
        `Scale operations into a recurring $500+/mo service package`,
      ],
      difficulty: 'LOW',
      startup_cost: 0,
      time_to_first_dollar: '1-3 days',
      earnings_low: 300,
      earnings_high: 1400,
      risk_level: 'LOW',
      risk_explanation: 'Zero capital required. Downside limited to setup time.',
      mitigation_strategy: 'Offer risk-free trial or performance-based pricing.',
      pro_tip: 'Leverage LinkedIn and personalized video demos for instant trust and high conversion.',
      category: 'AI_TOOLS',
    });
  }

  return JSON.stringify({ success: true });
}
