import { describe, expect, it } from 'vitest';
import * as fs from 'fs';

describe('team activity drawer', () => {
  it('exports TeamActivityDrawer component', () => {
    const src = fs.readFileSync('components/activity/TeamActivityDrawer.tsx', 'utf8');
    expect(src.includes('export function TeamActivityDrawer')).toBe(true);
    expect(src.includes('Team activity')).toBe(true);
  });
});
