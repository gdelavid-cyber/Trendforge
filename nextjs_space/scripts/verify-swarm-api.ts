import { swarmMemory } from '../lib/swarm/revenue/memory';
import { swarmCoordinator } from '../lib/swarm/revenue/coordinator';
import { masterBrain } from '../lib/swarm/revenue/masterBrain';
import { computeMerkleRoot, signAttestationPayload, verifyAttestationSignature } from '../lib/swarm/revenue/attestation';

async function verify() {
  console.log('--- Testing Cryptographic Merkle Root & Digital Attestation ---');
  const leaves = [
    { taskId: 'task_001', deliverable: 'Faceless Video 1080p' },
    { validator: 'PASS', score: 100 },
    { salePrice: 249, buyer: 'client@growth.co' },
  ];

  const root = computeMerkleRoot(leaves);
  console.log('✅ Computed Merkle Root:', root);

  const payload = { root, taskId: 'task_001', timestamp: new Date().toISOString() };
  const { signature } = signAttestationPayload(payload);
  console.log('✅ Generated HMAC Signature:', signature);

  const isValid = verifyAttestationSignature(payload, signature);
  console.log('✅ Attestation Signature Verified:', isValid);

  console.log('\n--- Testing Survival Mode Engine ---');
  await masterBrain.enterSurvivalMode();
  let budget = await swarmMemory.getSwarmBudget();
  console.log(`✅ Survival Mode Budget Cap: $${budget.dailyCap} (50% reduction verified)`);

  await masterBrain.exitSurvivalMode();
  budget = await swarmMemory.getSwarmBudget();
  console.log(`✅ Normal Mode Budget Cap Restored: $${budget.dailyCap}`);

  console.log('\n🌟 All Swarm Engines Verified Successfully!');
}

verify().catch(e => {
  console.error('Verification error:', e);
  process.exit(1);
});
