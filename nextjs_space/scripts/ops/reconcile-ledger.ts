/**
 * One-shot + ongoing reconciliation: walletBalance must equal the rounded
 * ledger sum per agent. Run: npx tsx scripts/ops/reconcile-ledger.ts [--fix]
 * Without --fix it only reports drift. With --fix it rounds every entry to
 * cents and resets each walletBalance to its ledger sum.
 */
import { prisma } from '../../lib/core/db';

async function main(): Promise<void> {
  const fix = process.argv.includes('--fix');
  const agents = await prisma.web4Agent.findMany({ select: { id: true, name: true, walletBalance: true } });
  let drifted = 0;
  for (const agent of agents) {
    const agg = await prisma.ledgerEntry.aggregate({
      where: { agentId: agent.id },
      _sum: { amountUsdc: true },
    });
    const sum = Math.round((agg._sum.amountUsdc ?? 0) * 100) / 100;
    const cached = Math.round(agent.walletBalance * 100) / 100;
    if (Math.abs(sum - cached) > 0.0001) {
      drifted++;
      console.log(`DRIFT agent=${agent.id} cached=${cached} ledger=${sum} diff=${(sum - cached).toFixed(4)}`);
      if (fix) {
        await prisma.$transaction(async (tx) => {
          // Round every entry to cents (idempotent — already-cent values untouched).
          const entries = await tx.ledgerEntry.findMany({ where: { agentId: agent.id }, select: { id: true, amountUsdc: true } });
          for (const e of entries) {
            const rounded = Math.round(e.amountUsdc * 100) / 100;
            if (rounded !== e.amountUsdc) {
              await tx.ledgerEntry.update({ where: { id: e.id }, data: { amountUsdc: rounded } });
            }
          }
          await tx.web4Agent.update({ where: { id: agent.id }, data: { walletBalance: sum } });
        });
        console.log(`FIXED agent=${agent.id} walletBalance=${sum}`);
      }
    }
  }
  console.log(fix ? `done. ${drifted} agent(s) drifted.` : `scan done. ${drifted} agent(s) drifted. Re-run with --fix to repair.`);
}

main()
  .catch((err) => {
    console.error('reconcile failed:', err?.message ?? err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
