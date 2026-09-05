import { prisma } from '@/lib/core/db';
import { deductCreditsDb, type CreditAction } from '@/lib/growth/credits/credit-manager';
import { AGENT_CONFIGS } from '@/lib/agents/quota';
import { launchAgentRun } from '@/lib/agents/orchestrator';
import { claimUserGrant } from '@/lib/money/grants/micro-grant';
import { getNovaBriefing } from '@/lib/growth/nova/reads';

// N2 Nova OS — tool registry. Law: Nova proposes, the user approves,
// the tool executes. Immediate tools are read-only or zero-side-effect;
// everything else runs only from an APPROVED NovaAction row.

export interface ToolDef {
  name: string;
  description: string;
  creditCost: number;
  creditAction: CreditAction;
  requiresApproval: boolean;
  validate: (params: Record<string, unknown>) => string | null;
  execute: (userId: string, userRole: string, params: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

function str(v: unknown, max = 200): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim().slice(0, max) : null;
}

export const NOVA_TOOLS: Record<string, ToolDef> = {
  'swarm.status': {
    name: 'swarm.status',
    description: 'Read current swarm state. Free, immediate, no side effects.',
    creditCost: 0,
    creditAction: 'NOVA_MESSAGE',
    requiresApproval: false,
    validate: () => null,
    execute: async (userId) => {
      const b = await getNovaBriefing(userId);
      return { status: b.swarm.available ? b.swarm.status : 'UNKNOWN', ...b.swarm };
    },
  },

  'outreach.draft': {
    name: 'outreach.draft',
    description: 'Draft an outreach message from a template. Zero side effects — nothing is sent.',
    creditCost: 2,
    creditAction: 'OUTREACH_DRAFT',
    requiresApproval: false,
    validate: (p) => {
      if (!str(p.business)) return 'business is required';
      if (!str(p.offer)) return 'offer is required';
      return null;
    },
    execute: async (_userId, _role, p) => {
      const business = str(p.business)!;
      const offer = str(p.offer)!;
      const channel = str(p.channel, 20) ?? 'email';
      return {
        draft:
          `Hi ${business} — quick one. We do ${offer}. ` +
          `Reply STOP to opt out at any time. — Sent via Trendly (AI-drafted, human-approved before send)`,
        channel,
        note: 'Template draft only. Sending requires a separate approved action.',
      };
    },
  },

  'worker.run': {
    name: 'worker.run',
    description: 'Launch a swarm worker run. Approval-gated; consumes weekly quota.',
    creditCost: 5,
    creditAction: 'TREND_SCOUT_QUERY',
    requiresApproval: true,
    validate: (p) => {
      if (typeof p.agentType !== 'string' || !AGENT_CONFIGS[p.agentType]) {
        return `agentType must be one of: ${Object.keys(AGENT_CONFIGS).join(', ')}`;
      }
      return null;
    },
    execute: async (userId, userRole, p) => {
      const run = await launchAgentRun({
        userId,
        agentType: p.agentType as string,
        parameters: (p.parameters ?? {}) as Record<string, unknown>,
        userRole,
      });
      return { runId: run.runId, status: run.status, agentType: p.agentType };
    },
  },

  'grant.claim': {
    name: 'grant.claim',
    description: 'Claim your platform micro-grant. Approval-gated, idempotent.',
    creditCost: 0,
    creditAction: 'NOVA_MESSAGE',
    requiresApproval: true,
    validate: () => null,
    execute: async (userId) => {
      const result = await claimUserGrant(userId);
      return { claimed: true, grantId: (result as { id?: string })?.id ?? null };
    },
  },

  'monitor.create': {
    name: 'monitor.create',
    description: 'Create a background monitor task. Approval-gated.',
    creditCost: 5,
    creditAction: 'TREND_SCOUT_QUERY',
    requiresApproval: true,
    validate: (p) => {
      if (!str(p.title)) return 'title is required';
      return null;
    },
    execute: async (userId, _role, p) => {
      const task = await prisma.novaCustomTask.create({
        data: {
          userId,
          title: str(p.title)!,
          schedule: str(p.schedule, 120) ?? 'Daily at 8:00 AM',
          taskType: typeof p.type === 'string' ? p.type.slice(0, 40) : 'RESEARCH_SUMMARY',
        },
      });
      return { taskId: task.id, title: task.title, schedule: task.schedule };
    },
  },
};

export function getTool(name: string): ToolDef | null {
  return NOVA_TOOLS[name] ?? null;
}

export function listTools(): { name: string; description: string; requiresApproval: boolean; creditCost: number }[] {
  return Object.values(NOVA_TOOLS).map((t) => ({
    name: t.name,
    description: t.description,
    requiresApproval: t.requiresApproval,
    creditCost: t.creditCost,
  }));
}

// Execute with billing. Called only from an APPROVED action or for
// immediate (approval-free) tools. Never call tool handlers directly.
export async function executeTool(
  userId: string,
  userRole: string,
  tool: ToolDef,
  params: Record<string, unknown>
): Promise<{ receipt: Record<string, unknown>; remainingBalance: number }> {
  if (tool.creditCost > 0) {
    const billing = await deductCreditsDb(userId, tool.creditAction, `Nova action: ${tool.name}`);
    if (!billing.success) throw new Error(billing.error ?? 'Insufficient credits.');
  }
  const receipt = await tool.execute(userId, userRole, params);
  const balance = await prisma.userCredit.findUnique({ where: { userId } });
  return { receipt, remainingBalance: balance?.creditBalance ?? 0 };
}
