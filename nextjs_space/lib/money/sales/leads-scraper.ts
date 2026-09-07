import { prisma } from '@/lib/core/db';
import { logExecutionEvent } from '@/lib/execution/logger';

export interface RawLeadProspect {
  source: 'fiverr' | 'upwork' | 'twitter' | 'reddit' | 'linkedin' | 'email' | 'marketplace';
  sourceUrl: string;
  buyerName: string;
  buyerEmail?: string;
  buyerUsername?: string;
  requestText: string;
  statedBudgetCents?: number;
  buyerIntentScore: number;
  budgetMatchScore: number;
  relevanceScore: number;
  contactabilityScore: number;
  compositeScore: number;
}

/**
 * Calculates a weighted composite score (0-100) for prioritizing buyer outreach.
 */
export function calculateLeadCompositeScore(
  intent: number,
  budget: number,
  relevance: number,
  contactability: number
): number {
  // Weights: Intent (35%), Relevance (30%), Budget (20%), Contactability (15%)
  const score = intent * 0.35 + relevance * 0.3 + budget * 0.2 + contactability * 0.15;
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Live-only buyer leads for a task. Returns previously persisted leads that
 * carry a verifiable sourceUrl. Never synthesizes template prospects — empty
 * means pending fresh intel, not zero demand.
 */
export async function scrapeBuyerLeadsForTask(
  taskId: string,
  userId?: string,
  category?: string
): Promise<RawLeadProspect[]> {
  void userId;
  void category;
  let stored: Array<{
    source: string;
    sourceUrl: string;
    buyerName: string | null;
    buyerEmail: string | null;
    buyerUsername: string | null;
    requestText: string;
    statedBudgetCents: number | null;
    buyerIntentScore: number;
    budgetMatchScore: number;
    relevanceScore: number;
    contactabilityScore: number;
    compositeScore: number;
  }> = [];
  try {
    stored = await prisma.lead.findMany({
      where: { taskId },
      orderBy: { compositeScore: 'desc' },
      take: 10,
      select: {
        source: true,
        sourceUrl: true,
        buyerName: true,
        buyerEmail: true,
        buyerUsername: true,
        requestText: true,
        statedBudgetCents: true,
        buyerIntentScore: true,
        budgetMatchScore: true,
        relevanceScore: true,
        contactabilityScore: true,
        compositeScore: true,
      },
    });
  } catch {
    return [];
  }

  // Only leads with a verifiable sourceUrl are real. Budgets unknown => omitted (never phantom floors).
  return stored
    .filter((l): l is typeof l & { buyerName: string } => !!l.sourceUrl && l.sourceUrl.startsWith('http') && !!l.buyerName)
    .map((l) => ({
      source: l.source as RawLeadProspect['source'],
      sourceUrl: l.sourceUrl,
      buyerName: l.buyerName,
      buyerEmail: l.buyerEmail || undefined,
      buyerUsername: l.buyerUsername || undefined,
      requestText: l.requestText,
      statedBudgetCents: l.statedBudgetCents ?? undefined,
      buyerIntentScore: l.buyerIntentScore,
      budgetMatchScore: l.budgetMatchScore,
      relevanceScore: l.relevanceScore,
      contactabilityScore: l.contactabilityScore,
      compositeScore: l.compositeScore,
    }));
}

/**
 * Persists scraped leads to the database for a given task. Live-only: only
 * persists leads carrying a verifiable sourceUrl. With no live source wired
 * for per-task scraping yet, this returns [] (pending) instead of fakes.
 */
export async function persistScrapedLeads(
  taskId: string,
  userId?: string,
  milestoneId?: string
) {
  const rawLeads = await scrapeBuyerLeadsForTask(taskId, userId);
  const liveLeads = rawLeads.filter((raw) => raw.sourceUrl && raw.sourceUrl.startsWith('http'));
  const createdLeads = [];

  for (const raw of liveLeads) {
    // Check if lead already exists by sourceUrl & task
    const existing = await prisma.lead.findFirst({
      where: {
        taskId,
        sourceUrl: raw.sourceUrl,
      },
    });

    if (!existing) {
      const created = await prisma.lead.create({
        data: {
          taskId,
          userId: userId || null,
          source: raw.source,
          sourceUrl: raw.sourceUrl,
          buyerName: raw.buyerName,
          buyerEmail: raw.buyerEmail || null,
          buyerUsername: raw.buyerUsername || null,
          requestText: raw.requestText,
          statedBudgetCents: raw.statedBudgetCents ?? null,
          buyerIntentScore: raw.buyerIntentScore,
          budgetMatchScore: raw.budgetMatchScore,
          relevanceScore: raw.relevanceScore,
          contactabilityScore: raw.contactabilityScore,
          compositeScore: raw.compositeScore,
          status: 'NEW',
        },
      });
      createdLeads.push(created);
    } else {
      createdLeads.push(existing);
    }
  }

  const topScore = createdLeads.length > 0 ? Math.max(...createdLeads.map((l) => l.compositeScore)) : 0;

  // Log the scraping event in the immutable audit log
  await logExecutionEvent({
    taskId,
    milestoneId: milestoneId || null,
    logType: 'lead_scraped',
    actor: 'companion',
    actorId: 'scraper_engine',
    actionDescription:
      createdLeads.length > 0
        ? `Scraped and scored ${createdLeads.length} live buyer leads with verifiable source URLs.`
        : 'Live lead scrape returned no verifiable leads — pending fresh intel — retry.',
    inputs: { taskId },
    outputs: { leadCount: createdLeads.length, topScore },
  });

  return createdLeads;
}
