/**
 * Trendly Venture OS — Hierarchical Multi-Agent Operating System
 * 
 * Deterministic multi-agent coordination:
 * CEO -> [CFO, CTO, Growth, Sales, Operations, Research, CustomerSuccess]
 * 
 * Answers the primary CEO question: "What should happen next?"
 * Never uses an LLM where deterministic business logic is safer and more reliable.
 */

import { prisma } from '@/lib/prisma';
import {
  VentureLifecycleState,
  AutonomyLevel,
  RiskLevel,
  Prisma,
} from '@prisma/client';
import { calculateVentureEconomics } from '@/lib/finance/ledger';
import { instrumentedJevCall } from '@/lib/observability/collector';
import { transitionVentureState } from '@/lib/venture/engine';

export type CeoActionType =
  | 'RESEARCH'
  | 'VALIDATE'
  | 'BUILD'
  | 'LAUNCH_OFFER'
  | 'CHANGE_PRICING'
  | 'START_EXPERIMENT'
  | 'ALLOCATE_BUDGET'
  | 'ACQUIRE_CUSTOMERS'
  | 'FULFILL_ORDER'
  | 'PAUSE_VENTURE'
  | 'KILL_VENTURE'
  | 'SCALE_VENTURE'
  | 'REQUEST_HUMAN_APPROVAL';

export interface CeoRecommendation {
  ventureId: string;
  ventureName: string;
  currentState: VentureLifecycleState;
  recommendedAction: CeoActionType;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  rationale: string;
  actor: 'CEO_AGENT' | 'CFO_AGENT' | 'CTO_AGENT' | 'GROWTH_AGENT' | 'SALES_AGENT' | 'OPS_AGENT' | 'RESEARCH_AGENT';
  requiresHumanApproval: boolean;
  approvalRequestId?: string;
  proposedBudgetDeltaCents?: number;
  dataProvenance: string;
}

/**
 * Top-level CEO Agent deliberation loop for a venture.
 * "What should happen next?"
 */
export async function evaluateVentureNextAction(ventureId: string): Promise<CeoRecommendation> {
  const venture = await prisma.venture.findUnique({
    where: { id: ventureId },
    include: {
      offers: true,
      customers: true,
      leads: true,
      validations: { orderBy: { validatedAt: 'desc' }, take: 1 },
      fulfillmentOrders: { where: { status: { in: ['PENDING', 'IN_PROGRESS', 'QA_VERIFICATION'] } } },
      experiments: { where: { status: 'RUNNING' } },
      approvalRequests: { where: { status: 'PENDING' } },
      capitalPlans: { take: 1 },
    },
  });

  if (!venture) {
    throw new Error(`Venture not found: ${ventureId}`);
  }

  const economics = await calculateVentureEconomics(ventureId);
  const state = venture.lifecycleState;

  // 1. Critical Fail-Safe Checks (CFO circuit breaker)
  if (economics.unitEconomicsHealth === 'CRITICAL_BURN' && state !== 'PAUSED' && state !== 'KILLED') {
    return {
      ventureId,
      ventureName: venture.name,
      currentState: state,
      recommendedAction: 'PAUSE_VENTURE',
      priority: 'CRITICAL',
      rationale: `Unit economics critical: AI cost / revenue is ${economics.aiCostToRevenuePct}%. Pausing execution to prevent capital drain.`,
      actor: 'CFO_AGENT',
      requiresHumanApproval: false,
      dataProvenance: 'VERIFIED_FINANCIAL_METRICS',
    };
  }

  // 2. Pending Human Approvals Block Autonomous Execution
  if (venture.approvalRequests.length > 0) {
    const pending = venture.approvalRequests[0];
    return {
      ventureId,
      ventureName: venture.name,
      currentState: state,
      recommendedAction: 'REQUEST_HUMAN_APPROVAL',
      priority: 'HIGH',
      rationale: `Pending human review required for action "${pending.proposedAction}" (Risk: ${pending.riskLevel}, Est. Cost: $${(pending.estimatedCostCents / 100).toFixed(2)}).`,
      actor: 'CEO_AGENT',
      requiresHumanApproval: true,
      approvalRequestId: pending.id,
      dataProvenance: 'HUMAN_APPROVAL_QUEUE',
    };
  }

  // 3. Operational Delivery Bottleneck
  if (venture.fulfillmentOrders.length > 0) {
    const activeOrder = venture.fulfillmentOrders[0];
    return {
      ventureId,
      ventureName: venture.name,
      currentState: state,
      recommendedAction: 'FULFILL_ORDER',
      priority: 'HIGH',
      rationale: `Active customer order ${activeOrder.id} pending completion (${activeOrder.status}). Fulfilling customer delivery takes precedence over acquisition.`,
      actor: 'OPS_AGENT',
      requiresHumanApproval: false,
      dataProvenance: 'FULFILLMENT_PIPELINE',
    };
  }

  // 4. State-Driven Deterministic Progression
  switch (state) {
    case 'DISCOVERED':
      return {
        ventureId,
        ventureName: venture.name,
        currentState: state,
        recommendedAction: 'RESEARCH',
        priority: 'MEDIUM',
        rationale: 'Newly discovered venture requires competitive profiling and customer persona research.',
        actor: 'RESEARCH_AGENT',
        requiresHumanApproval: false,
        dataProvenance: 'VENTURE_LIFECYCLE',
      };

    case 'RESEARCHING':
      return {
        ventureId,
        ventureName: venture.name,
        currentState: state,
        recommendedAction: 'VALIDATE',
        priority: 'HIGH',
        rationale: 'Execute empirical demand validation against raw market signals to test willingness to pay.',
        actor: 'RESEARCH_AGENT',
        requiresHumanApproval: false,
        dataProvenance: 'OPPORTUNITY_SIGNALS',
      };

    case 'VALIDATING': {
      const validation = venture.validations[0];
      if (validation?.recommendation === 'VALIDATE') {
        return {
          ventureId,
          ventureName: venture.name,
          currentState: state,
          recommendedAction: 'BUILD',
          priority: 'HIGH',
          rationale: `Demand validated (${validation.rationale}). Advance to building core offer and deliverables.`,
          actor: 'CTO_AGENT',
          requiresHumanApproval: false,
          dataProvenance: 'DEMAND_VALIDATION_REPORT',
        };
      }
      return {
        ventureId,
        ventureName: venture.name,
        currentState: state,
        recommendedAction: 'VALIDATE',
        priority: 'MEDIUM',
        rationale: 'Gather additional customer pain data points before deploying capital to product build.',
        actor: 'RESEARCH_AGENT',
        requiresHumanApproval: false,
        dataProvenance: 'DEMAND_VALIDATION_REPORT',
      };
    }

    case 'VALIDATED':
      return {
        ventureId,
        ventureName: venture.name,
        currentState: state,
        recommendedAction: 'BUILD',
        priority: 'HIGH',
        rationale: 'Initialize MVP product specification and landing page build.',
        actor: 'CTO_AGENT',
        requiresHumanApproval: false,
        dataProvenance: 'VENTURE_LIFECYCLE',
      };

    case 'BUILDING':
      if (venture.offers.length === 0) {
        return {
          ventureId,
          ventureName: venture.name,
          currentState: state,
          recommendedAction: 'LAUNCH_OFFER',
          priority: 'HIGH',
          rationale: 'Build completed. Create and publish initial standardized VentureOffer with pricing.',
          actor: 'GROWTH_AGENT',
          requiresHumanApproval: false,
          dataProvenance: 'OFFER_INVENTORY',
        };
      }
      return {
        ventureId,
        ventureName: venture.name,
        currentState: state,
        recommendedAction: 'LAUNCH_OFFER',
        priority: 'HIGH',
        rationale: 'Configure payment rails and transition to READY_TO_SELL.',
        actor: 'GROWTH_AGENT',
        requiresHumanApproval: false,
        dataProvenance: 'OFFER_INVENTORY',
      };

    case 'READY_TO_SELL':
    case 'SELLING': {
      const qualifiedLeads = venture.leads.filter((l) => l.pipelineStage === 'QUALIFIED');
      if (qualifiedLeads.length > 0) {
        return {
          ventureId,
          ventureName: venture.name,
          currentState: state,
          recommendedAction: 'ACQUIRE_CUSTOMERS',
          priority: 'HIGH',
          rationale: `${qualifiedLeads.length} qualified leads ready for proposal dispatch. Focus Sales Agent on conversion.`,
          actor: 'SALES_AGENT',
          requiresHumanApproval: false,
          dataProvenance: 'CRM_LEAD_PIPELINE',
        };
      }
      return {
        ventureId,
        ventureName: venture.name,
        currentState: state,
        recommendedAction: 'ACQUIRE_CUSTOMERS',
        priority: 'MEDIUM',
        rationale: 'Initiate outbound channel discovery and problem-matched lead scraping.',
        actor: 'GROWTH_AGENT',
        requiresHumanApproval: false,
        dataProvenance: 'CRM_LEAD_PIPELINE',
      };
    }

    case 'FIRST_REVENUE':
    case 'PROFITABLE':
      if (economics.netProfitCents > 0 && economics.grossMarginPct > 60) {
        return {
          ventureId,
          ventureName: venture.name,
          currentState: state,
          recommendedAction: 'SCALE_VENTURE',
          priority: 'HIGH',
          rationale: `Unit economics strong: ${economics.grossMarginPct}% gross margin, $${(economics.netProfitCents / 100).toFixed(2)} net profit. Recommend capital expansion into validated channels.`,
          actor: 'CEO_AGENT',
          requiresHumanApproval: venture.autonomyLevel < AutonomyLevel.LEVEL_4,
          dataProvenance: 'VERIFIED_FINANCIAL_METRICS',
        };
      }
      return {
        ventureId,
        ventureName: venture.name,
        currentState: state,
        recommendedAction: 'ACQUIRE_CUSTOMERS',
        priority: 'MEDIUM',
        rationale: 'Continue customer acquisition while maintaining operational margin discipline.',
        actor: 'SALES_AGENT',
        requiresHumanApproval: false,
        dataProvenance: 'VERIFIED_FINANCIAL_METRICS',
      };

    case 'SCALING':
      return {
        ventureId,
        ventureName: venture.name,
        currentState: state,
        recommendedAction: 'START_EXPERIMENT',
        priority: 'MEDIUM',
        rationale: 'Launch price elasticity and customer segment expansion experiments.',
        actor: 'GROWTH_AGENT',
        requiresHumanApproval: false,
        dataProvenance: 'GROWTH_ENGINE',
      };

    default:
      return {
        ventureId,
        ventureName: venture.name,
        currentState: state,
        recommendedAction: 'RESEARCH',
        priority: 'LOW',
        rationale: `Venture in state ${state}. Monitoring for telemetry changes.`,
        actor: 'CEO_AGENT',
        requiresHumanApproval: false,
        dataProvenance: 'VENTURE_LIFECYCLE',
      };
  }
}

/**
 * Evaluates the entire venture portfolio and generates a daily strategic brief for the operator.
 */
export async function generateCeoPortfolioBrief(userId?: string) {
  const where: Prisma.VentureWhereInput = userId ? { userId } : {};
  const ventures = await prisma.venture.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  });

  const evaluations: CeoRecommendation[] = [];
  let totalPortfolioRevenueCents = 0;
  let totalPortfolioCostCents = 0;
  let totalActiveCustomers = 0;

  for (const v of ventures) {
    const rec = await evaluateVentureNextAction(v.id);
    evaluations.push(rec);

    const econ = await calculateVentureEconomics(v.id);
    totalPortfolioRevenueCents += econ.verifiedRevenueCents;
    totalPortfolioCostCents += econ.totalCostCents;
    totalActiveCustomers += econ.customerCount;
  }

  const totalPortfolioProfitCents = totalPortfolioRevenueCents - totalPortfolioCostCents;

  return {
    timestamp: new Date().toISOString(),
    portfolioSummary: {
      totalVentures: ventures.length,
      activeVentures: ventures.filter((v) => !['PAUSED', 'KILLED', 'ARCHIVED'].includes(v.lifecycleState)).length,
      totalVerifiedRevenueCents: totalPortfolioRevenueCents,
      totalCostCents: totalPortfolioCostCents,
      totalNetProfitCents: totalPortfolioProfitCents,
      totalActiveCustomers,
      pendingApprovalsCount: evaluations.filter((e) => e.requiresHumanApproval).length,
    },
    recommendations: evaluations,
  };
}
