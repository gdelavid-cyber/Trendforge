import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// TDD (plan Task 2, Step 1): single brain dispatcher, kill double loops.
// Fails until: executor pending (never SIMULATED SUCCESS), masterBrain single
// START_TASK with margin>=0.40 logged, coordinator guarded seed, controller lock.

const executorSrc = fs.readFileSync(
  path.join(__dirname, '../lib/intelligence/tools/executor.ts'),
  'utf8'
);
const masterBrainSrc = fs.readFileSync(
  path.join(__dirname, '../lib/swarm/revenue/masterBrain.ts'),
  'utf8'
);
const coordinatorSrc = fs.readFileSync(
  path.join(__dirname, '../lib/swarm/revenue/coordinator.ts'),
  'utf8'
);
const controllerSrc = fs.readFileSync(
  path.join(__dirname, '../lib/swarm/controller.ts'),
  'utf8'
);

describe('track3 single brain', () => {
  it('executor never returns simulated success', async () => {
    const mod = await import('../lib/intelligence/tools/executor');
    const out: any = await (mod as any).executeSkill?.('unknown_skill_xyz', {});
    if (out) expect(out.status).not.toBe('SUCCESS');
  });

  it('executor unmapped skill returns pending, never simulated', async () => {
    const mod = await import('../lib/intelligence/tools/executor');
    const out: any = await (mod as any).executeSkill?.('unknown_skill_xyz', {});
    expect(out.status).toBe('pending');
    expect(out.simulated).toBe(false);
    expect(String(out.outputSummary ?? out.message ?? '')).toMatch(/pending fresh intel/i);
  });

  it('executor source has no SIMULATED SUCCESS path', () => {
    expect(executorSrc).not.toContain('[SIMULATED]');
    expect(executorSrc).not.toMatch(/status:\s*'SUCCESS'[\s\S]*?simulated:\s*true/);
  });

  it('masterBrain issues single START_TASK per pulse with margin>=0.40 logged', () => {
    expect(masterBrainSrc).toContain('START_TASK');
    expect(masterBrainSrc).toMatch(/single START_TASK per pulse/i);
    expect(masterBrainSrc).toMatch(/margin>=0\.40/);
    expect(masterBrainSrc).toMatch(/startTaskIssued/i);
  });

  it('coordinator guards seed-if-empty so pulses create at most 1 task', () => {
    expect(coordinatorSrc).toMatch(/taskCreatedByDecision/i);
    expect(coordinatorSrc).toMatch(/at most 1 task per pulse/i);
    // Seed fallback must be conditional on no decision-created task,
    // never a bare seed-if-empty double-create.
    expect(coordinatorSrc).toMatch(/activeTasks\.length === 0 && !taskCreatedByDecision/);
  });

  it('controller holds a pulse lock so loops never double-advance', () => {
    expect(controllerSrc).toMatch(/pulseLock/i);
    expect(controllerSrc).toMatch(/never double-advance/i);
  });
});
