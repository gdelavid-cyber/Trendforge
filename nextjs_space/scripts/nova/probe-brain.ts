import { prisma } from '../../lib/core/db';
import { answerWithOpenCodeBrain } from '../../lib/growth/nova/brain';

async function main(): Promise<void> {
  const email = `serve-probe-${Date.now()}@nova-test.local`;
  const user = await prisma.user.create({ data: { email, name: 'Serve Probe', passwordHash: 'x' } });
  try {
    const started = Date.now();
    const out = await answerWithOpenCodeBrain(user.id, 'FREE', 'How am I doing?', []);
    console.log(`latency=${((Date.now() - started) / 1000).toFixed(1)}s`);
    console.log(`grounded=${JSON.stringify(out.grounded)}`);
    console.log(`reply:\n${out.reply}`);
  } finally {
    await prisma.novaConversation.deleteMany({ where: { userId: user.id } });
    await prisma.agentQuota.deleteMany({ where: { userId: user.id } });
    const account = await prisma.userCredit.findUnique({ where: { userId: user.id } });
    if (account) {
      await prisma.creditTransaction.deleteMany({ where: { userCreditId: account.id } });
      await prisma.userCredit.deleteMany({ where: { userId: user.id } });
    }
    await prisma.user.deleteMany({ where: { id: user.id } });
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('PROBE FAILED:', err?.message ?? err);
  process.exit(1);
});
