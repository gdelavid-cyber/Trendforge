import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { generateConwayWallet } from './wallet';
import { generateEIP8004Identity } from './eip8004';
import { isFunded, postEntry } from './ledger';

/**
 * Economic Darwinism Survival Engine
 * Enforces "Make Money or Die" rules across all autonomous Web4 agents.
 * Pass agentIds to scope a cycle (tests / targeted runs); default = all.
 */
export async function runSurvivalCycle(scopeAgentIds?: string[]) {
  const startTime = Date.now();
  const logs: string[] = [];
  let evaluatedCount = 0;
  let dyingCount = 0;
  let deadCount = 0;
  let reproducedCount = 0;

  const agents = await prisma.web4Agent.findMany({
    where: {
      status: { in: ['CREATED', 'DORMANT', 'ACTIVE', 'DYING', 'REPRODUCING'] },
      ...(scopeAgentIds ? { id: { in: scopeAgentIds } } : {}),
    },
    include: { user: { select: { email: true, name: true } } },
  });

  for (const agent of agents) {
    evaluatedCount++;

    // 0. Dormant gate: agents with no ledger history have never held real
    // funds. Darwinism does not apply to them — they sleep until funded.
    if (!(await isFunded(agent.id))) {
      if (agent.status !== 'DORMANT') {
        await prisma.web4Agent.update({
          where: { id: agent.id },
          data: { status: 'DORMANT' },
        });
        logs.push(`Agent [${agent.name}] has no funding history -> DORMANT (survival rules suspended)`);
      }
      continue;
    }
    if (agent.status === 'DORMANT') {
      await prisma.web4Agent.update({
        where: { id: agent.id },
        data: { status: 'ACTIVE' },
      });
      logs.push(`Agent [${agent.name}] funded -> reactivated from DORMANT`);
    }

    const dailyEstimatedCost = Math.max(0.5, agent.totalCosts / Math.max(1, (Date.now() - new Date(agent.creationDate).getTime()) / (1000 * 60 * 60 * 24)));
    const balance = agent.walletBalance;

    // 1. Check for Reproduction Eligibility (Profit > $500 and reproduction cooldown)
    if (agent.profit >= 500 && agent.reproductionCount < 5 && agent.status !== 'REPRODUCING') {
      try {
        const childName = `${agent.name} Gen-${agent.generation + 1}`;
        const childWallet = generateConwayWallet(`child-${agent.id}-${Date.now()}`);
        const childIdentity = generateEIP8004Identity({
          agentId: `child-${agent.id}`,
          creatorAddress: agent.walletAddress,
          archetype: agent.archetype,
          skillsDigest: JSON.stringify(agent.skills),
          creationTimestamp: Date.now(),
        });

        // Child starts unfunded; the parent's seed moves through the ledger.
        const childAgent = await prisma.web4Agent.create({
          data: {
            userId: agent.userId,
            name: childName,
            description: `Autonomous offspring of ${agent.name}. Inherited optimized trading/scraping vectors.`,
            archetype: agent.archetype,
            walletAddress: childWallet.address,
            walletBalance: 0.0,
            status: 'ACTIVE',
            parentAgentId: agent.id,
            skills: agent.skills as any,
            memory: { notes: [`Spawned from parent ${agent.name} with verified $${agent.profit} profit.`] },
            avatarConfig: agent.avatarConfig as any,
            eip8004Hash: childIdentity.identityHash,
            generation: agent.generation + 1,
            survivalScore: 90,
          },
        });

        // Deduct seed liquidity from parent, credit it to the child — one
        // pot, two labeled entries, no money created.
        const reproRef = `repro-${agent.id}-${agent.reproductionCount + 1}`;
        await postEntry({
          agentId: agent.id,
          userId: agent.userId,
          type: 'ADJUSTMENT',
          amountUsdc: -50.0,
          ref: reproRef,
          note: `Seed liquidity for child ${childName}`,
        });
        await postEntry({
          agentId: childAgent.id,
          userId: agent.userId,
          type: 'ADJUSTMENT',
          amountUsdc: 50.0,
          ref: reproRef,
          note: `Seed liquidity from parent ${agent.name}`,
        });
        await prisma.web4Agent.update({
          where: { id: agent.id },
          data: { reproductionCount: { increment: 1 } },
        });

        await prisma.agentSurvivalLog.create({
          data: {
            agentId: agent.id,
            event: 'REPRODUCED',
            yieldAmount: 0,
            burnAmount: 50.0,
            balanceAfter: balance - 50.0,
            details: { childId: childAgent.id, childName },
          },
        });

        reproducedCount++;
        logs.push(`Agent [${agent.name}] reproduced -> Spawned [${childName}]`);
      } catch (err: any) {
        logs.push(`Reproduction error for ${agent.name}: ${err.message}`);
      }
    }

    // 2. Check for Self-Destruction (Balance <= 0)
    else if (balance <= 0) {
      if (!agent.gracePeriodEnds) {
        // Grant 24-hour grace period before termination
        const graceEnd = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await prisma.web4Agent.update({
          where: { id: agent.id },
          data: { status: 'DYING', gracePeriodEnds: graceEnd, survivalScore: 10 },
        });

        // Alert user
        if (agent.user?.email) {
          await sendEmail({
            to: agent.user.email,
            subject: `🚨 [EMERGENCY SOS] Agent ${agent.name} is Dying — 24h to Liquidity Depletion`,
            html: `
              <div style="font-family: sans-serif; background: #0A0A10; color: #fff; padding: 24px; border-radius: 12px;">
                <h2 style="color: #FF007A;">🚨 EMERGENCY AGENT SURVIVAL ALERT</h2>
                <p>Your autonomous agent <strong>${agent.name}</strong> has depleted its wallet balance to $${balance.toFixed(2)} USDC.</p>
                <p>Under <strong>Economic Darwinism</strong> rules, if this agent does not generate yield within 24 hours, it will automatically self-destruct.</p>
                <p><a href="https://trendly-platform-chi.vercel.app/agents/web4" style="color: #00F0FF;">Refuel or Deploy Strategy &rarr;</a></p>
              </div>
            `,
          });
        }

        dyingCount++;
        logs.push(`Agent [${agent.name}] balance <= 0 -> Entered DYING state`);
      } else if (new Date() > new Date(agent.gracePeriodEnds)) {
        // Grace period expired -> SELF-DESTRUCT
        await prisma.web4Agent.update({
          where: { id: agent.id },
          data: { status: 'DEAD', survivalScore: 0 },
        });

        await prisma.agentSurvivalLog.create({
          data: {
            agentId: agent.id,
            event: 'SELF_DESTRUCT',
            burnAmount: 0,
            balanceAfter: 0,
            details: { reason: 'Grace period expired with zero profitability' },
          },
        });

        deadCount++;
        logs.push(`Agent [${agent.name}] SELF-DESTRUCTED under Darwinism rules.`);
      }
    }

    // 3. Normal Health Evaluation & Survival Score Computation
    else {
      const netProfitRatio = agent.totalCosts > 0 ? (agent.totalEarnings - agent.totalCosts) / agent.totalCosts : 1;
      const survivalScore = Math.min(100, Math.max(15, Math.round(50 + netProfitRatio * 25 + (balance / 10))));

      await prisma.web4Agent.update({
        where: { id: agent.id },
        data: {
          survivalScore,
          status: balance < dailyEstimatedCost ? 'DYING' : 'ACTIVE',
        },
      });
    }
  }

  const durationMs = Date.now() - startTime;
  return {
    success: true,
    evaluatedCount,
    dyingCount,
    deadCount,
    reproducedCount,
    durationMs,
    logs,
  };
}
