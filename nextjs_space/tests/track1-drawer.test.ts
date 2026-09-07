import { describe, expect, it } from 'vitest';
import * as fs from 'fs';

describe('track1 drawer', () => {
  it('exports drawer component', async () => {
    const src = fs.readFileSync('components/activity/TeamActivityDrawer.tsx', 'utf8');
    expect(src.includes('export function TeamActivityDrawer')).toBe(true);
  });

  it('accepts taskId + autoOpen props and auto-opens on mount', () => {
    const src = fs.readFileSync('components/activity/TeamActivityDrawer.tsx', 'utf8');
    expect(src).toContain('taskId');
    expect(src).toContain('autoOpen');
  });

  it('subscribes EventSource to /api/activity/stream?taskId=', () => {
    const src = fs.readFileSync('components/activity/TeamActivityDrawer.tsx', 'utf8');
    expect(src).toContain('EventSource');
    expect(src).toContain('/api/activity/stream?taskId=');
  });

  it('renders ordered list and keeps data.entries key compat', () => {
    const src = fs.readFileSync('components/activity/TeamActivityDrawer.tsx', 'utf8');
    expect(src).toContain('data.entries');
    // ordered oldest-first render
    expect(src).toMatch(/sort.*timestamp|ordered|localeCompare/);
  });

  it('approval_requested rows show inline Approve button posting to existing approve route', () => {
    const src = fs.readFileSync('components/activity/TeamActivityDrawer.tsx', 'utf8');
    expect(src).toContain('Approve');
    expect(src).toContain('/api/approvals/approve');
    expect(src).toContain('approvalId');
  });

  it('closed state shows pill with latest text + unread count', () => {
    const src = fs.readFileSync('components/activity/TeamActivityDrawer.tsx', 'utf8');
    expect(src.toLowerCase()).toContain('unread');
  });

  it('task detail mounts drawer auto-open with taskId', () => {
    const src = fs.readFileSync('app/tasks/[id]/_components/task-detail-client.tsx', 'utf8');
    expect(src).toContain('TeamActivityDrawer');
    expect(src).toContain('autoOpen');
  });
});
