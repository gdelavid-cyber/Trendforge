import { prisma } from '../../lib/prisma';
import { runObservabilityCycle } from '../../worker/observability';
import { runAutonomousEcosystemPulse, getDynamicThreshold } from '../../lib/observability/ecosystem';

async function verifyEcosystem() {
  console.log('[Ecosystem] 1. Running Observability Cycle...');
  const obsResult = await runObservabilityCycle();
  console.log('[Ecosystem] Observability Cycle Result:', obsResult);

  console.log('[Ecosystem] 2. Running Autonomous Ecosystem Pulse...');
  const pulseResult = await runAutonomousEcosystemPulse();
  console.log('[Ecosystem] Pulse Result:', pulseResult);

  console.log('[Ecosystem] 3. Checking dynamic thresholds...');
  const gates = ['trade_execution', 'lead_qualification', 'approval', 'completion', 'tool_routing'];
  for (const g of gates) {
    const t = await getDynamicThreshold(g);
    console.log(`[Ecosystem] Dynamic Threshold for ${g}: ${t}`);
  }

  const gateConfigs = await prisma.dynamicGateConfig.findMany();
  console.log('[Ecosystem] Active DynamicGateConfig records:', gateConfigs.length);

  const decisionCount = await prisma.decisionLog.count();
  const outcomeCount = await prisma.decisionOutcome.count();
  console.log(`[Ecosystem] Total DecisionLog rows: ${decisionCount} | Total DecisionOutcome rows: ${outcomeCount}`);
}

verifyEcosystem()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
