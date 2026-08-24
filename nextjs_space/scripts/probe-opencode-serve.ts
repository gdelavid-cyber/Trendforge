/**
 * Live probe for the opencode serve brain transport.
 * Start a server first:  opencode serve --port 4096
 * Then run:              npx tsx scripts/probe-opencode-serve.ts
 */
import { makeLlm } from '../lib/execution/llm';

async function main() {
  process.env.LLM_PROVIDER = 'opencode';
  process.env.OPENCODE_SERVE_URL = process.env.OPENCODE_SERVE_URL || 'http://127.0.0.1:4096';

  const llm = makeLlm();
  const started = Date.now();
  const reply = await llm([
    { role: 'system', content: 'You are Nova, a terse platform guide. Answer in one sentence.' },
    { role: 'user', content: 'What does the /approvals page do?' },
  ]);
  const ms = Date.now() - started;

  console.log(`[probe] transport=serve model=${process.env.OPENCODE_MODEL ?? 'opencode/x-preview-f-free'}`);
  console.log(`[probe] latency=${(ms / 1000).toFixed(1)}s`);
  console.log(`[probe] reply:\n${reply}`);
}

main().catch((err) => {
  console.error('[probe] FAILED:', err.message);
  process.exit(1);
});
