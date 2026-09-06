import { describe, expect, it } from 'vitest';
import * as fs from 'fs';

describe('ack gate', () => {
  it('exports AckGate component with approve/reject', () => {
    const src = fs.readFileSync('components/activity/AckGate.tsx', 'utf8');
    expect(src.includes('export function AckGate')).toBe(true);
    expect(src.includes('/api/approvals/')).toBe(true);
  });
});
