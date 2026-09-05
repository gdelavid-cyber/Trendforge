/**
 * One-time honesty reset: User.totalEarnings was accumulated from
 * self-reported (unverified) task claim dollars — fabricated income.
 * Real income lives exclusively on the agent ledger. This zeroes the fake
 * column so no surface can ever display it again.
 *
 * Run once:  npx tsx scripts/reset-fake-earnings.ts
 */
import { prisma } from '../lib/core/db';

async function main() {
  const updated = await prisma.user.updateMany({
    where: { totalEarnings: { not: 0 } },
    data: { totalEarnings: 0 },
  });
  console.log(`[reset] zeroed totalEarnings on ${updated.count} user(s).`);

  const claims = await prisma.userTask.updateMany({
    where: { earningsReported: { not: null } },
    data: { earningsReported: null },
  });
  console.log(`[reset] cleared self-reported earnings on ${claims.count} task record(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
