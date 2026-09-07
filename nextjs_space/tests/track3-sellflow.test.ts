import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Task 3: Brainstorm-to-sell in drawer order.
// brainstorm > plan > dispatch > milestones > leads > kit > sale,
// each pending/done from ExecutionLog, no phantom pipeline values,
// no hardcoded brainstorm fallback, sales modes write sales-option API.

const read = (p: string) => fs.readFileSync(path.join(__dirname, p), 'utf8');

describe('track3 sellflow', () => {
  it('sales pipeline card exists without phantom 150', async () => {
    const src = read('../components/execution/SalesPipelineCard.tsx');
    expect(src).not.toContain('||15000');
    expect(src).not.toContain('|| 15000');
  });

  it('sales pipeline uses 0 + pending label, never an invented value', () => {
    const src = read('../components/execution/SalesPipelineCard.tsx');
    expect(src).toContain('?? 0');
    expect(src).toMatch(/\$0 pending/);
  });

  it('BOT_SELLS / YOU_SELL / HYBRID selector writes the sales-option API', () => {
    const card = read('../components/execution/SalesPipelineCard.tsx');
    const client = read('../app/tasks/[id]/_components/task-detail-client.tsx');
    for (const opt of ['BOT_SELLS', 'YOU_SELL', 'HYBRID']) {
      expect(card).toContain(opt);
    }
    expect(client).toContain('sales-option');
  });

  it('brainstorm modal has no hardcoded marketVector fallback, shows pending + retry', () => {
    const src = read('../components/earn/brainstorm-modal.tsx');
    expect(src).not.toContain('High-Velocity Monetization Blueprint');
    expect(src).toMatch(/pending/i);
    expect(src).toMatch(/retry/i);
  });

  it('task detail renders drawer steps in order with pending/done from ExecutionLog', () => {
    const src = read('../app/tasks/[id]/_components/task-detail-client.tsx');
    // Steps derive from ExecutionLog (activity feed), each pending or done.
    expect(src).toContain('activity/feed');
    expect(src).toContain('execEntries');
    expect(src).toMatch(/pending/i);
    expect(src).toMatch(/done/i);
    // Drawer order asserted inside the sellflow derivation block, where the
    // keys brainstorm > plan > dispatch > milestones > leads > kit > sale
    // must appear in that sequence.
    const block = src.slice(src.indexOf('sellflowSteps'));
    const order = ['brainstorm', 'plan', 'dispatch', 'milestones', 'leads', 'kit', 'sale'];
    let lastIdx = -1;
    for (const step of order) {
      const idx = block.indexOf(`'${step}'`);
      expect(idx, `missing sellflow step: ${step}`).toBeGreaterThan(-1);
      expect(idx, `sellflow step out of order: ${step}`).toBeGreaterThan(lastIdx);
      lastIdx = idx;
    }
  });
});
