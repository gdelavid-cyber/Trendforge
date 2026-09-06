/**
 * Nova CLI for opencode sessions (Direction B).
 * Reads briefing/actions, proposes gated tools. Cannot approve — ever.
 *
 *   NOVA_BASE_URL=http://localhost:3100 NOVA_SERVICE_KEY=xxx
 *   npx tsx scripts/nova/nova.ts briefing --user <id>
 *   npx tsx scripts/nova/nova.ts actions --user <id>
 *   npx tsx scripts/nova/nova.ts propose --user <id> --tool worker.run --params '{"agentType":"reddit_scraper"}'
 */

import { readFileSync } from 'fs';

const base = (process.env.NOVA_BASE_URL || 'http://localhost:3100').replace(/\/+$/, '');
const key = process.env.NOVA_SERVICE_KEY;
if (!key) {
  console.error('NOVA_SERVICE_KEY is not set.');
  process.exit(1);
}

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}

async function call(path: string, init?: RequestInit): Promise<void> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'x-nova-key': key as string, 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const body = await res.text();
  console.log(`HTTP ${res.status}\n${body}`);
  if (!res.ok) process.exit(2);
}

async function main(): Promise<void> {
  const [cmd] = process.argv.slice(2);
  const userId = arg('user');
  if (!userId) {
    console.error('Missing --user <id>.');
    process.exit(1);
  }
  if (cmd === 'briefing') {
    await call(`/api/nova/briefing?userId=${encodeURIComponent(userId)}`);
  } else if (cmd === 'actions') {
    await call(`/api/nova/actions?userId=${encodeURIComponent(userId)}`);
  } else if (cmd === 'propose') {
    const tool = arg('tool');
    const paramsRaw = arg('params') ?? (arg('params-file') ? readFileSync(arg('params-file') as string, 'utf8') : '{}');
    if (!tool) {
      console.error('Missing --tool <name>.');
      process.exit(1);
    }
    let params: unknown;
    try {
      params = JSON.parse(paramsRaw);
    } catch {
      console.error('--params must be valid JSON.');
      process.exit(1);
    }
    await call(`/api/nova/actions?userId=${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: JSON.stringify({ tool, params }),
    });
  } else {
    console.error('Unknown command. Use: briefing | actions | propose');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('nova CLI failed:', err?.message ?? err);
  process.exit(1);
});
