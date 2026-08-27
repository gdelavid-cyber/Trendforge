// Autonomous AI Trend Monetization Classifier & Router
// Classifies scraped trends into either:
// 1. Monetizable Power Moves -> routed to Task database
// 2. Market Intelligence & Daily News -> routed to Trend Radar

import { callLLM } from '@/lib/pipeline';
import { TrendCategory } from '@prisma/client';

export interface TrendClassificationResult {
  isMonetizable: boolean;
  monetizationScore: number; // 0.0 - 1.0
  monetizationType: 'B2B_SERVICE' | 'AI_TOOL' | 'CONTENT_CREATION' | 'ARBITRAGE' | 'ECOMMERCE' | 'INFORMATIONAL_NEWS';
  monetizationRationale: string;
  newsSummary: string;
  whyItMatters: string;
  category: TrendCategory;
  taskProposal?: {
    title: string;
    description: string;
    steps: string[];
    difficulty: 'ZERO' | 'LOW' | 'MEDIUM' | 'HIGH';
    startupCost: number;
    timeToFirstDollar: string;
    estimatedEarningsLow: number;
    estimatedEarningsHigh: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    riskExplanation: string;
    mitigationStrategy: string;
    proTip: string;
  } | null;
}

export async function classifyTrendMonetization(
  trend: {
    name: string;
    sourcePlatforms?: string[];
    description?: string;
    url?: string;
    score?: number;
  },
  existingTaskTitles: Set<string> = new Set()
): Promise<TrendClassificationResult> {
  const prompt = `You are an expert AI Monetization Analyst for Trendly.
Analyze this newly scraped trend/news signal:
Trend Name: "${trend.name}"
Source: ${trend.sourcePlatforms?.join(', ') || 'Web Scraper'}
Context: ${trend.description || 'N/A'}

Your goal: Determine if an everyday solopreneur, creator, or developer can directly make money from this trend (e.g. B2B service, AI tool, viral content, arbitrage, consulting, affiliate offer).

Criteria:
- isMonetizable: true if there is a concrete, direct revenue path right now.
- isMonetizable: false if this is purely macro news, general announcements, security CVEs, policy changes, or high-level tech news better suited for Market Radar & Daily News.
- monetizationScore: 0.0 to 1.0 (>= 0.65 qualifies for Task generation)
- monetizationType: one of "B2B_SERVICE", "AI_TOOL", "CONTENT_CREATION", "ARBITRAGE", "ECOMMERCE", "INFORMATIONAL_NEWS"
- monetizationRationale: 1 sentence explaining the revenue viability or why it is pure news
- newsSummary: 1-2 sentence executive briefing of the event
- whyItMatters: 1-2 sentences on market impact and why readers need to track this today
- category: AI_TOOLS | LOCAL_SERVICES | CRYPTO_FINANCE | ECOMMERCE | AI_CONTENT | AGENT_ECONOMY | DATA_SCIENCE | OTHER

If isMonetizable is true, provide a complete actionable taskProposal with:
- title: concise action title (e.g., "Deploy Autonomous Voice Receptionists for {Target}")
- description: clear overview
- steps: array of 4-5 concrete execution steps
- difficulty: ZERO | LOW | MEDIUM | HIGH
- startupCost: number (0-50)
- timeToFirstDollar: "1-3 days"
- estimatedEarningsLow: number (300-800)
- estimatedEarningsHigh: number (1200-3500)
- riskLevel: LOW | MEDIUM | HIGH
- riskExplanation: 1 sentence
- mitigationStrategy: 1 sentence
- proTip: 1 tactical tip

Output strictly valid JSON without markdown fences.`;

  let raw = '';
  try {
    raw = await callLLM(
      [
        {
          role: 'system',
          content: 'You are an autonomous monetization classifier. Output strictly valid JSON without markdown formatting.',
        },
        { role: 'user', content: prompt },
      ],
      true
    );
  } catch (err: any) {
    console.warn('[CLASSIFIER] LLM call failed, using procedural evaluation:', err.message);
  }

  try {
    const cleaned = (raw || '').replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    if (cleaned) {
      const parsed = JSON.parse(cleaned);
      if (typeof parsed.isMonetizable === 'boolean') {
        return {
          isMonetizable: parsed.isMonetizable,
          monetizationScore: typeof parsed.monetizationScore === 'number' ? parsed.monetizationScore : (parsed.isMonetizable ? 0.85 : 0.4),
          monetizationType: parsed.monetizationType || (parsed.isMonetizable ? 'B2B_SERVICE' : 'INFORMATIONAL_NEWS'),
          monetizationRationale: parsed.monetizationRationale || (parsed.isMonetizable ? 'Direct client service and tooling opportunity.' : 'Informational market news.'),
          newsSummary: parsed.newsSummary || `Signal detected: ${trend.name}.`,
          whyItMatters: parsed.whyItMatters || 'Highlights shifting internet attention and emerging market velocity.',
          category: (parsed.category as TrendCategory) || TrendCategory.AI_TOOLS,
          taskProposal: parsed.isMonetizable && parsed.taskProposal ? {
            title: parsed.taskProposal.title || `Capitalize on ${trend.name}`,
            description: parsed.taskProposal.description || `Actionable move around ${trend.name}.`,
            steps: Array.isArray(parsed.taskProposal.steps) ? parsed.taskProposal.steps : [
              'Identify target customer persona and verify demand',
              'Scaffold prototype solution using open tools',
              'Launch targeted outreach or content distribution',
              'Close first paying customer and retain monthly',
            ],
            difficulty: parsed.taskProposal.difficulty || 'LOW',
            startupCost: parsed.taskProposal.startupCost ?? 0,
            timeToFirstDollar: parsed.taskProposal.timeToFirstDollar || '1-3 days',
            estimatedEarningsLow: parsed.taskProposal.estimatedEarningsLow || 400,
            estimatedEarningsHigh: parsed.taskProposal.estimatedEarningsHigh || 1800,
            riskLevel: parsed.taskProposal.riskLevel || 'LOW',
            riskExplanation: parsed.taskProposal.riskExplanation || 'Low capital barrier. Primary cost is outreach time.',
            mitigationStrategy: parsed.taskProposal.mitigationStrategy || 'Offer risk-free pilot before locking in full retainer.',
            proTip: parsed.taskProposal.proTip || 'Lead with a personalized 45-second screen recording showing real proof.',
          } : null,
        };
      }
    }
  } catch (parseErr) {
    console.warn('[CLASSIFIER] Failed to parse classification JSON, falling back to heuristics:', parseErr);
  }

  // Heuristic-based classification fallback
  const nameLower = trend.name.toLowerCase();
  const isActionableHustle = /receptionist|voice|chatbot|cold email|lead|ugc|notion|arbitrage|google maps|seo|directory|deepseek|shopify|automation|scraper/i.test(nameLower);

  if (isActionableHustle) {
    return {
      isMonetizable: true,
      monetizationScore: 0.88,
      monetizationType: 'B2B_SERVICE',
      monetizationRationale: 'Clear commercial demand with ready-to-bill business clients or buyer personas.',
      newsSummary: `High-velocity demand signal detected for ${trend.name}.`,
      whyItMatters: 'Businesses are actively spending to solve this operational bottleneck right now.',
      category: TrendCategory.AI_TOOLS,
      taskProposal: {
        title: `Monetize ${trend.name}`,
        description: `Turn surging interest in ${trend.name} into a profitable service or micro-SaaS offer.`,
        steps: [
          `Scrape target businesses or niche communities interested in ${trend.name}`,
          `Build a working 1-click proof demonstration or sample workflow`,
          `Deploy personalized multi-touch outreach sequence with video proof`,
          `Close client at $350-$600 setup fee + $150/mo maintenance retainer`,
        ],
        difficulty: 'LOW',
        startupCost: 0,
        timeToFirstDollar: '1-3 days',
        estimatedEarningsLow: 450,
        estimatedEarningsHigh: 1850,
        riskLevel: 'LOW',
        riskExplanation: 'Zero upfront capital needed. Downside limited to setup and outreach time.',
        mitigationStrategy: 'Offer a 7-day risk-free pilot to secure instant trust.',
        proTip: 'Record a personalized 45-second screen demo tailored to the client business name.',
      },
    };
  }

  // Pure News / Macro Intelligence
  return {
    isMonetizable: false,
    monetizationScore: 0.35,
    monetizationType: 'INFORMATIONAL_NEWS',
    monetizationRationale: 'Macro technology news and ecosystem update; best tracked for industry awareness and strategic intelligence.',
    newsSummary: `Market telemetry detected significant buzz around "${trend.name}".`,
    whyItMatters: 'Tracking these macro trends provides early warning on ecosystem shifts before commercial opportunities emerge.',
    category: TrendCategory.OTHER,
    taskProposal: null,
  };
}
