import { prisma } from '../lib/db';
import { masterBrain } from '../lib/swarm/revenue/masterBrain';
import { swarmCoordinator } from '../lib/swarm/revenue/coordinator';
import { swarmMemory } from '../lib/swarm/revenue/memory';

async function diagnose() {
  console.log('====================================================');
  console.log('🔍 SWARM FULL SYSTEM DIAGNOSTIC & HEALTH AUDIT');
  console.log('====================================================\n');

  // 1. Check Database Brain State
  console.log('--- 1. Brain State in Database ---');
  const brainState = await prisma.swarmBrainState.findUnique({ where: { id: 'global' } });
  console.log('Brain State Record:', JSON.stringify(brainState, null, 2));

  // 2. Check Agents
  console.log('\n--- 2. Active Workforce Pool ---');
  const agents = await prisma.autonomousAgent.findMany();
  console.log(`Total Agents in Database: ${agents.length}`);
  const activeAgents = agents.filter(a => ['ACTIVE', 'IDLE', 'WORKING'].includes(a.status));
  console.log(`Active/Idle Agents: ${activeAgents.length}`);
  for (const a of activeAgents.slice(0, 5)) {
    console.log(`  - Agent ${a.role} [${a.modelTier}] | Score: ${a.performanceScore} | Rev: $${a.revenueContributed}`);
  }

  // 3. Check Tasks & Checkpoints
  console.log('\n--- 3. Tasks Status & Pipeline Queue ---');
  const allTasks = await prisma.swarmTask.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  console.log(`Total Tasks in Database: ${allTasks.length}`);
  for (const t of allTasks) {
    console.log(`  - Task ${t.id} [${t.templateId || t.templateType}] -> State: ${t.state}, Phase: ${t.phase}, Escrow: ${t.escrowStatus}, SalePrice: $${t.salePrice}`);
  }

  // 4. Test Live Pulse Execution
  console.log('\n--- 4. Executing Diagnostic Live Pulse ---');
  const startTime = Date.now();
  const pulseResult = await swarmCoordinator.executePulse();
  const duration = Date.now() - startTime;
  console.log(`Pulse Execution Completed in ${duration}ms:`, JSON.stringify(pulseResult, null, 2));

  // 5. Check Recent Brain Decisions
  console.log('\n--- 5. Recent Master Brain Decisions ---');
  const recentDecisions = await prisma.swarmBrainDecision.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  for (const d of recentDecisions) {
    console.log(`  [${d.decisionType}] (Confidence: ${d.confidenceScore}%) -> ${d.reasoning}`);
  }

  console.log('\n====================================================');
  console.log('DIAGNOSTIC COMPLETE');
  console.log('====================================================');
}

diagnose()
  .catch(err => {
    console.error('Diagnostic error:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
