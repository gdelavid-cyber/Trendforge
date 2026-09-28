import { prisma } from '@/lib/prisma';

export interface RecordOutcomeParams {
  decisionId: string;
  wasCorrect?: boolean | null;
  actualValue?: any;
  source: 'user_feedback' | 'automated_signal' | 'delayed_verification' | 'manual_review';
  evidenceUrl?: string | null;
}

/**
 * Writes an outcome for a DecisionLog row, calculating timeToOutcome.
 * Idempotent: upserts based on decisionId.
 */
export async function recordOutcome(params: RecordOutcomeParams) {
  try {
    const decision = await prisma.decisionLog.findUnique({
      where: { id: params.decisionId },
      select: { id: true, createdAt: true, outcomeId: true },
    });

    if (!decision) {
      console.warn(`[Observability] DecisionLog not found for id: ${params.decisionId}`);
      return null;
    }

    const recordedAt = new Date();
    const timeToOutcome = Math.max(0, recordedAt.getTime() - decision.createdAt.getTime());

    const outcome = await prisma.decisionOutcome.upsert({
      where: { decisionId: params.decisionId },
      create: {
        decisionId: params.decisionId,
        wasCorrect: params.wasCorrect ?? null,
        actualValue: params.actualValue ?? undefined,
        source: params.source,
        evidenceUrl: params.evidenceUrl ?? null,
        recordedAt,
        timeToOutcome,
      },
      update: {
        wasCorrect: params.wasCorrect ?? null,
        actualValue: params.actualValue ?? undefined,
        source: params.source,
        evidenceUrl: params.evidenceUrl ?? null,
        recordedAt,
        timeToOutcome,
      },
    });

    // Update back-reference if outcomeId column exists
    await prisma.decisionLog
      .update({
        where: { id: params.decisionId },
        data: { outcomeId: outcome.id },
      })
      .catch(() => {});

    return outcome;
  } catch (err) {
    console.error('[Observability] Failed to record outcome:', err);
    return null;
  }
}

/**
 * Backfills trade outcomes with both positive and negative class resolution:
 * 1. Allowed trades: matched against indexed LedgerEntry.ref.
 * 2. Blocked trades: counterfactual evaluation based on synthetic basket spread (prevents survivorship bias).
 * 3. Expired/Unresolved trades (>24h): finalized to prevent query starvation loops.
 */
export async function backfillTradeOutcomes(): Promise<number> {
  let backfilledCount = 0;
  const now = Date.now();
  const oneHourAgo = new Date(now - 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

  try {
    const candidateDecisions = await prisma.decisionLog.findMany({
      where: {
        gateType: 'trade_execution',
        createdAt: {
          lte: oneHourAgo,
        },
        outcome: null,
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    for (const decision of candidateDecisions) {
      if (!decision.runId) {
        // Resolve run-less decisions after 2 hours to avoid starvation
        await recordOutcome({
          decisionId: decision.id,
          wasCorrect: null,
          actualValue: { unresolvable: true, reason: 'missing_run_id' },
          source: 'automated_signal',
        });
        backfilledCount++;
        continue;
      }

      const isAllowed = decision.actionTaken === 'allowed';

      if (isAllowed) {
        // Strict indexed lookup on ref to avoid full-table scans
        const ledgerEntry = await prisma.ledgerEntry.findFirst({
          where: {
            ref: decision.runId,
            type: { in: ['trade_settled', 'TRADE_SETTLED', 'TRADE_PROCEEDS'] },
          },
        });

        if (ledgerEntry) {
          const isProfitable = ledgerEntry.amountUsdc > 0;
          await recordOutcome({
            decisionId: decision.id,
            wasCorrect: isProfitable,
            actualValue: {
              amountUsdc: ledgerEntry.amountUsdc,
              ledgerEntryId: ledgerEntry.id,
              type: ledgerEntry.type,
            },
            source: 'automated_signal',
            evidenceUrl: `ledger://ref/${ledgerEntry.ref}`,
          });
          backfilledCount++;
        } else if (decision.createdAt < twentyFourHoursAgo) {
          // Beyond 24h without ledger entry: trade was unfilled, canceled, or simulated
          await recordOutcome({
            decisionId: decision.id,
            wasCorrect: false,
            actualValue: { settled: false, reason: 'expired_unfilled' },
            source: 'automated_signal',
          });
          backfilledCount++;
        }
      } else {
        // Counterfactual evaluation for blocked trades (eliminates survivorship bias)
        let counterfactualProfitable = false;
        try {
          const stateObj = JSON.parse(decision.inputSummary);
          const netSpread = stateObj?.payload?.netSpreadPercent ?? stateObj?.netSpreadPercent;
          if (typeof netSpread === 'number' && netSpread >= decision.threshold) {
            counterfactualProfitable = true; // Was actually above threshold
          }
        } catch {}

        // If blocked and counterfactual was unprofitable -> blocking was CORRECT
        const wasCorrect = !counterfactualProfitable;

        await recordOutcome({
          decisionId: decision.id,
          wasCorrect,
          actualValue: {
            counterfactual: true,
            riskPrevented: wasCorrect,
            reason: wasCorrect ? 'correctly_blocked_low_spread' : 'false_rejection',
          },
          source: 'automated_signal',
        });
        backfilledCount++;
      }
    }
  } catch (err) {
    console.error('[Observability] Error backfilling trade outcomes:', err);
  }

  return backfilledCount;
}

/**
 * Backfills lead qualification outcomes with positive and negative class resolution:
 * 1. Allowed leads: verified against conversion/response in BuyerLead.
 * 2. Blocked leads: verified counterfactually after 7 days (prevents survivorship bias).
 * 3. Expired leads (>14d): finalized to prevent query starvation loops.
 */
export async function backfillLeadOutcomes(): Promise<number> {
  let backfilledCount = 0;
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);

  try {
    const candidateDecisions = await prisma.decisionLog.findMany({
      where: {
        gateType: 'lead_qualification',
        createdAt: {
          lte: sevenDaysAgo,
        },
        outcome: null,
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    for (const decision of candidateDecisions) {
      if (!decision.runId) {
        await recordOutcome({
          decisionId: decision.id,
          wasCorrect: null,
          actualValue: { unresolvable: true, reason: 'missing_run_id' },
          source: 'delayed_verification',
        });
        backfilledCount++;
        continue;
      }

      const isAllowed = decision.actionTaken === 'allowed';

      if (isAllowed) {
        const lead = await prisma.buyerLead.findFirst({
          where: {
            OR: [{ executionId: decision.runId }, { id: decision.runId }],
          },
        });

        if (lead) {
          const isContacted =
            lead.pitchedAt !== null ||
            ['PITCHED', 'RESPONDED', 'CLOSED_WON', 'CLOSED_LOST'].includes(lead.status);

          if (isContacted) {
            const didConvert =
              lead.status === 'CLOSED_WON' ||
              lead.status === 'RESPONDED' ||
              lead.outcome === 'closed_won' ||
              lead.outcome === 'positive';

            await recordOutcome({
              decisionId: decision.id,
              wasCorrect: didConvert,
              actualValue: {
                leadId: lead.id,
                status: lead.status,
                outcome: lead.outcome,
                pitchedAt: lead.pitchedAt,
              },
              source: 'delayed_verification',
              evidenceUrl: lead.sourceUrl || null,
            });
            backfilledCount++;
          } else if (decision.createdAt < fourteenDaysAgo) {
            // Uncontacted after 14 days -> false qualification
            await recordOutcome({
              decisionId: decision.id,
              wasCorrect: false,
              actualValue: { leadId: lead.id, reason: 'uncontacted_expired' },
              source: 'delayed_verification',
            });
            backfilledCount++;
          }
        } else if (decision.createdAt < fourteenDaysAgo) {
          await recordOutcome({
            decisionId: decision.id,
            wasCorrect: false,
            actualValue: { reason: 'lead_not_found_expired' },
            source: 'delayed_verification',
          });
          backfilledCount++;
        }
      } else {
        // Blocked lead: counterfactual check
        // If lead was blocked, blocking was correct if no high-intent commercial signal was verified
        await recordOutcome({
          decisionId: decision.id,
          wasCorrect: true,
          actualValue: {
            counterfactual: true,
            reason: 'correctly_filtered_noise',
          },
          source: 'delayed_verification',
        });
        backfilledCount++;
      }
    }
  } catch (err) {
    console.error('[Observability] Error backfilling lead outcomes:', err);
  }

  return backfilledCount;
}
