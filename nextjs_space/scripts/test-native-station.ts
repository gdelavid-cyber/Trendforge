import { runStationAgent } from '../lib/station/engine/loop';

async function test() {
  console.log('[NativeStationTest] Starting agent test...');
  const res = await runStationAgent({
    goal: 'Create a file named status.txt containing "Trendly Native Station Engine is 100% operational." using fs_write, then confirm in one sentence.',
    model: 'nvidia/nemotron-3.5-lightning:free',
  });

  console.log('AGENT TEST SUCCESS:', res.success);
  console.log('TURNS:', res.turns);
  console.log('TOOLS CALLED:', res.toolTrace.map(t => t.name));
  console.log('AGENT DELIVERABLE:', res.text);
}

test().catch(err => {
  console.error('[NativeStationTest] ERROR:', err);
  process.exit(1);
});
