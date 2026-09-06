import { describe, expect, it } from 'vitest';
import * as fs from 'fs';

describe('transparency links', () => {
  it('task detail uses team hook', () => {
    const src = fs.readFileSync('app/tasks/[id]/_components/task-detail-client.tsx', 'utf8');
    expect(src.includes('useTeamActivity')).toBe(true);
  });
  it('approvals inbox uses ack gate', () => {
    const src = fs.readFileSync('app/approvals/_components/approvals-client.tsx', 'utf8');
    expect(src.includes('AckGate')).toBe(true);
  });
});
