import { prisma } from '../../lib/prisma';
import { executePredictionArbitrage } from '../../lib/agents/prediction-arbitrage';

async function main() {
  console.log('[Verify] Starting verification run on prediction-arbitrage...');
  const runId = `verify-${Date.now()}`;

  const res = await executePredictionArbitrage(
    { budget: 0, market: 'Polymarket', runId } as any,
    async (msg: string) => console.log('LOG:', msg)
  );

  console.log('[Verify] Execution returned success:', res.success);

  const decisions = await prisma.decisionLog.findMany({
    where: { runId },
  });

  console.log('[Verify] DecisionLog entries written:', decisions.length);
  for (const d of decisions) {
    console.log(`[Verify] Row -> Gate: ${d.gateType} | Q: ${d.question} | Action: ${d.actionTaken} | Latency: ${d.latencyMs}ms | Cost: $${d.costUsd}`);
  }

  const runCount = await prisma.observabilityRun.count();
  console.log('[Verify] Total ObservabilityRun cycles logged:', runCount);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
