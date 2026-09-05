/**
 * One-time backfill: existing Web4Agent wallet balances were simulated
 * (hardcoded $100 spawns + fake yield). This writes each agent's current
 * balance as a clearly-labeled ADJUSTMENT entry so the ledger sum matches
 * reality and history stays transparent. Idempotent — safe to re-run.
 *
 * Usage: npx tsx scripts/backfill-ledger.ts
 */
import { prisma } from '../lib/core/db';

async function main() {
  const agents = await prisma.web4Agent.findMany({
    select: { id: true, userId: true, walletBalance: true },
  });

  let written = 0;
  let skipped = 0;

  for (const agent of agents) {
    if (agent.walletBalance === 0) {
      skipped++;
      continue;
    }
    const existing = await prisma.ledgerEntry.findUnique({
      where: {
        agentId_type_ref: {
          agentId: agent.id,
          type: 'ADJUSTMENT',
          ref: 'legacy-simulated',
        },
      },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.$transaction(async (tx) => {
      await tx.ledgerEntry.create({
        data: {
          agentId: agent.id,
          userId: agent.userId,
          type: 'ADJUSTMENT',
          amountUsdc: agent.walletBalance,
          ref: 'legacy-simulated',
          note: 'Pre-ledger simulated balance (test liquidity + simulated yield). Not real money.',
        },
      });
    });
    written++;
  }

  console.log(`[backfill-ledger] agents=${agents.length} entriesWritten=${written} skipped=${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
