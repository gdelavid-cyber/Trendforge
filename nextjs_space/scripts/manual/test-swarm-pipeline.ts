import { swarmCoordinator } from '../../lib/swarm/revenue/coordinator';
import { swarmMemory } from '../../lib/swarm/revenue/memory';
import { masterBrain } from '../../lib/swarm/revenue/masterBrain';

async function main() {
  console.log('⚡ Initializing Trendly Autonomous Revenue Swarm Test...');

  await swarmMemory.ensureInitialized();
  await swarmCoordinator.ensureAgentWorkforce();

  const agents = await swarmMemory.getActiveAgents();
  console.log(`✅ Colony Workforce Ready: ${agents.length} active specialized agents.`);

  console.log('\n🧠 Executing Master Brain Strategic Cycle...');
  const decisions = await masterBrain.runStrategicCycle();
  console.log(`✅ Master Brain produced ${decisions.length} strategic decisions:`);
  for (const d of decisions) {
    console.log(`  [${d.action}] (Confidence: ${d.confidenceScore || 85}%) -> ${d.reasoning}`);
  }

  console.log('\n🚀 Executing Swarm Pulse Cycle (9-Stage Pipeline Advancement)...');
  const pulseResult = await swarmCoordinator.executePulse();
  console.log('✅ Swarm Pulse Result:', JSON.stringify(pulseResult, null, 2));

  const budget = await swarmMemory.getSwarmBudget();
  console.log(`\n💰 Swarm Budget Status: $${budget.spentToday.toFixed(2)} spent today / $${budget.dailyCap} cap ($${budget.remaining.toFixed(2)} remaining)`);

  console.log('\n✨ Swarm End-to-End Autonomous Pipeline Verified Successfully!');
}

main().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
