import { prisma } from '@/lib/core/db';
import { userRealIncomeUsdc } from '@/lib/money/ledger';
import { AGENT_CONFIGS, getUserQuota } from '@/lib/agents/quota';
import { isGlobalKillSwitchActive } from '@/lib/swarm/gatekeeper';

// N1 Nova OS — read adapters. Every section is independently fallible:
// a failed source yields `available: false`, never fabricated data.

export interface Insight {
  level: 'alert' | 'warning' | 'info';
  text: string;
}

export interface NovaBriefing {
  generatedAt: string;
  wallet: { available: boolean; realIncomeUsdc?: number; agents?: number; fundedAgents?: number };
  credits: { available: boolean; balance?: number; allocation?: number };
  quota: { available: boolean; workers?: { key: string; name: string; used: number; limit: number }[] };
  swarm: { available: boolean; status?: string; survivalMode?: boolean; activeTasks?: number; todayNet?: number; killSwitch?: boolean };
  trends: { available: boolean; featured?: number; top?: { title: string; score: number }[] };
  insights: Insight[];
}

async function section<T>(fn: () => Promise<T>): Promise<{ available: boolean; data?: T }> {
  try {
    return { available: true, data: await fn() };
  } catch {
    return { available: false };
  }
}

export async function getNovaBriefing(userId: string, userRole = 'FREE'): Promise<NovaBriefing> {
  const insights: Insight[] = [];

  const [wallet, credits, swarm, trends] = await Promise.all([
    section(async () => {
      const [realIncomeUsdc, agents, funded] = await Promise.all([
        userRealIncomeUsdc(userId),
        prisma.web4Agent.count({ where: { userId } }),
        prisma.web4Agent.count({ where: { userId, ledgerEntries: { some: {} } } }),
      ]);
      return { realIncomeUsdc, agents, fundedAgents: funded };
    }),
    section(async () => {
      const row = await prisma.userCredit.findUnique({ where: { userId } });
      return { balance: row?.creditBalance ?? 0, allocation: row?.totalAllocated ?? 100 };
    }),
    section(async () => {
      const [brain, killSwitch] = await Promise.all([
        prisma.swarmBrainState.findUnique({ where: { id: 'global' } }),
        isGlobalKillSwitchActive(),
      ]);
      return {
        status: brain?.status ?? 'UNKNOWN',
        survivalMode: brain?.survivalMode ?? false,
        activeTasks: brain?.activeTasks ?? 0,
        todayNet: brain?.todayNet ?? 0,
        killSwitch,
      };
    }),
    section(async () => {
      const [featured, top] = await Promise.all([
        prisma.task.count({ where: { isFeatured: true } }),
        prisma.task.findMany({ orderBy: { trendScore: 'desc' }, take: 3, select: { title: true, trendScore: true } }),
      ]);
      return { featured, top: top.map((t) => ({ title: t.title, score: t.trendScore ?? 0 })) };
    }),
  ]);

  // Quota across all five workers (creates rows on first read by design).
  const quota = await section(async () => {
    const workers = await Promise.all(
      Object.keys(AGENT_CONFIGS).map(async (key) => {
        const q = await getUserQuota(userId, key, userRole);
        return { key, name: AGENT_CONFIGS[key].name, used: q.runsUsed, limit: q.runsLimit };
      })
    );
    return workers;
  });

  // Derived insights — only from data actually read.
  if (credits.available && credits.data) {
    const { balance, allocation } = credits.data;
    if (allocation > 0 && balance / allocation <= 0.2) {
      insights.push({
        level: balance <= 0 ? 'alert' : 'warning',
        text: balance <= 0
          ? 'You are out of credits. Top up or upgrade to keep Nova and agents running.'
          : `Credits running low: ${balance} of ${allocation} left this month.`,
      });
    }
  }
  if (quota.available && quota.data) {
    const exhausted = quota.data.filter((w) => w.used >= w.limit);
    if (exhausted.length === quota.data.length && quota.data.length > 0) {
      insights.push({ level: 'warning', text: 'All worker quotas are used up for this week.' });
    } else if (exhausted.length > 0) {
      insights.push({ level: 'info', text: `Quota exhausted on: ${exhausted.map((w) => w.name).join(', ')}.` });
    }
  }
  if (swarm.available && swarm.data) {
    if (swarm.data.killSwitch) insights.push({ level: 'alert', text: 'Platform kill-switch is active. Agent runs are halted.' });
    if (swarm.data.survivalMode) insights.push({ level: 'warning', text: 'Swarm is in survival mode — cheaper models, tighter caps.' });
  }
  if (wallet.available && wallet.data && wallet.data.agents > wallet.data.fundedAgents) {
    insights.push({
      level: 'info',
      text: `${wallet.data.agents - wallet.data.fundedAgents} of your ${wallet.data.agents} agents have no funding yet.`,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    wallet: { available: wallet.available, ...wallet.data },
    credits: { available: credits.available, ...credits.data },
    quota: { available: quota.available, workers: quota.data },
    swarm: { available: swarm.available, ...swarm.data },
    trends: { available: trends.available, ...trends.data },
    insights,
  };
}

export function renderBriefingText(b: NovaBriefing): string {
  const lines: string[] = [];
  if (b.wallet.available) {
    lines.push(`Ledger income: $${(b.wallet.realIncomeUsdc ?? 0).toFixed(2)} across ${b.wallet.agents ?? 0} agents.`);
  }
  if (b.credits.available) {
    lines.push(`Credits: ${b.credits.balance} of ${b.credits.allocation} left this month.`);
  }
  if (b.quota.available && b.quota.workers) {
    const worst = [...b.quota.workers].sort((x, y) => x.limit - x.used - (y.limit - y.used))[0];
    if (worst) lines.push(`Tightest quota: ${worst.name} (${worst.used}/${worst.limit} used).`);
  }
  if (b.swarm.available) {
    lines.push(`Swarm: ${b.swarm.status}${b.swarm.survivalMode ? ' (survival mode)' : ''}, ${b.swarm.activeTasks ?? 0} active tasks.`);
  }
  if (b.trends.available && b.trends.top?.length) {
    lines.push(`Top trend: ${b.trends.top[0].title} (score ${b.trends.top[0].score.toFixed(1)}).`);
  }
  for (const i of b.insights) lines.push(`${i.level === 'alert' ? 'ALERT' : i.level === 'warning' ? 'Heads up' : 'Note'}: ${i.text}`);
  const missing = [
    !b.wallet.available && 'wallet',
    !b.credits.available && 'credits',
    !b.quota.available && 'quota',
    !b.swarm.available && 'swarm',
    !b.trends.available && 'trends',
  ].filter(Boolean);
  if (missing.length > 0) lines.push(`I couldn't reach: ${missing.join(', ')}. Those numbers are skipped, not guessed.`);
  return lines.join(' ');
}
