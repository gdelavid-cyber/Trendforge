import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma } from '../lib/db';
import { approveGate, rejectGate, startExecution } from '../lib/execution/engine';

// Execution-engine state machine, exercised against ephemeral rows in the dev
// database with a stubbed LLM and notification sink. These tests are the
// safety gate for enabling Autopilot in production.

// Force the FileRunner's inline path so tests never touch S3.
vi.mock('@/lib/aws-config', () => ({
  getBucketConfig: () => ({ bucketName: '', folderPrefix: '' }),
  createS3Client: () => {
    throw new Error('S3 must not be constructed in engine tests');
  },
}));

const RUN = `exec-test-${Date.now()}`;

let userId: string;
let taskId: string;
let trendId: string;
const stubLlm = async () => 'STUB_OUTPUT';

async function makeTask(stepsJson: unknown): Promise<string> {
  const t = await prisma.task.create({
    data: {
      id: `${RUN}-task-${Math.random().toString(36).slice(2, 8)}`,
      title: `Exec test task ${RUN} ${Math.random().toString(36).slice(2, 6)}`,
      description: 'state machine fixture',
      category: 'AI_TOOLS',
      steps: stepsJson as any,
      trendId,
    },
  });
  return t.id;
}

async function getUserTask(userTaskId: string) {
  return prisma.userTask.findUniqueOrThrow({ where: { id: userTaskId } });
}

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      email: `${RUN}@exec-test.local`,
      name: 'Engine Test User',
      passwordHash: 'test-fixture-not-a-login',
    },
  });
  userId = user.id;

  const trend = await prisma.trend.create({
    data: { name: `Trend fixture ${RUN}` },
  });
  trendId = trend.id;
});

afterAll(async () => {
  await prisma.approval.deleteMany({ where: { userId } });
  await prisma.taskArtifact.deleteMany({ where: { userTask: { userId } } });
  await prisma.userTask.deleteMany({ where: { userId } });
  await prisma.companion.deleteMany({ where: { userId } });
  await prisma.task.deleteMany({ where: { trendId } });
  await prisma.trend.deleteMany({ where: { id: trendId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

describe('execution engine state machine', () => {
  it('DIY mode marks started without calling the LLM', async () => {
    const taskId = await makeTask(['Do it yourself step one']);
    let llmCalls = 0;
    const res = await startExecution(
      userId,
      taskId,
      'DIY',
      {},
      { llm: async () => ((llmCalls++, ''), ''), awaitLoops: true }
    );

    expect(res.ok).toBe(true);
    expect(llmCalls).toBe(0);
    const ut = await getUserTask(res.userTaskId!);
    expect(ut.status).toBe('IN_PROGRESS');
    expect(ut.mode).toBe('DIY');
  });

  it('AUTOPILOT runs internal steps then halts at an external gate', async () => {
    const taskId = await makeTask([
      { id: 's1', title: 'Summarize the market', action: 'analyze' },
      { id: 's2', title: 'Build the lead sheet', action: 'export' },
      { id: 's3', title: 'Send pitches', action: 'send' }, // gate
      { id: 's4', title: 'Draft follow-ups', action: 'draft' },
    ]);
    const notifications: string[] = [];

    const res = await startExecution(userId, taskId, 'AUTOPILOT', {}, {
      llm: stubLlm,
      notify: async (_uid, subject) => { notifications.push(subject); },
      awaitLoops: true,
    });

    expect(res.ok).toBe(true);
    const ut = await getUserTask(res.userTaskId!);
    expect(ut.status).toBe('PENDING_APPROVAL');
    expect(ut.currentStep).toBe(2);

    // Internal steps executed hands-off.
    const log = ut.stepResults as any[];
    expect(log[0]).toMatchObject({ index: 0, status: 'done', output: 'STUB_OUTPUT' });
    expect(log[1]).toMatchObject({ index: 1, status: 'done' });

    // The export step produced a real deliverable row (inline FILE — S3 mocked off).
    const artifacts = await prisma.taskArtifact.findMany({ where: { userTaskId: ut.id } });
    expect(artifacts).toHaveLength(1);
    expect(artifacts[0]).toMatchObject({ stepIndex: 1, kind: 'FILE' });
    expect(artifacts[0].url).toBeNull();
    expect((artifacts[0].meta as any)?.inline).toBe(true);

    // Gate row created; nothing beyond it ran.
    const approvals = await prisma.approval.findMany({ where: { userTaskId: ut.id } });
    expect(approvals).toHaveLength(1);
    expect(approvals[0].status).toBe('PENDING');
    expect(approvals[0].stepIndex).toBe(2);
    expect(log.some((e) => e.index === 3)).toBe(false);

    // The user was notified exactly once about the gate.
    expect(notifications).toHaveLength(1);
  });

  it('approving a gate runs the real step and resumes the run to completion', async () => {
    const taskId = await makeTask([
      { id: 's1', title: 'Research market', action: 'analyze' },
      { id: 's2', title: 'Send application', action: 'send' },
    ]);
    const res = await startExecution(userId, taskId, 'AUTOPILOT', {}, {
      llm: stubLlm,
      notify: async () => {},
      awaitLoops: true,
    });

    const approval = await prisma.approval.findFirstOrThrow({ where: { userTaskId: res.userTaskId! } });
    const approved = await approveGate(approval.id, userId, { llm: stubLlm, notify: async () => {}, awaitLoops: true });
    expect(approved.ok).toBe(true);

    const ut = await getUserTask(res.userTaskId!);
    expect(ut.status).toBe('COMPLETED');
    const log = ut.stepResults as any[];
    // Approval actually executes the gated step now. With no email key
    // connected it records an honest BLOCKED outcome — never a faked send.
    expect(log.map((e) => e.status)).toEqual(['done', 'blocked']);
    expect(log[1].output).toContain('BLOCKED');
    const artifacts = await prisma.taskArtifact.findMany({ where: { userTaskId: ut.id } });
    expect(artifacts).toHaveLength(0);
  });

  it('rejecting a gate skips the step but still finishes the run', async () => {
    const taskId = await makeTask([
      { id: 's1', title: 'Research market', action: 'analyze' },
      { id: 's2', title: 'Deploy bot to production', action: 'deploy' },
    ]);
    const res = await startExecution(userId, taskId, 'AUTOPILOT', {}, {
      llm: stubLlm,
      notify: async () => {},
      awaitLoops: true,
    });

    const approval = await prisma.approval.findFirstOrThrow({ where: { userTaskId: res.userTaskId! } });
    const rejected = await rejectGate(approval.id, userId, { llm: stubLlm, notify: async () => {}, awaitLoops: true });
    expect(rejected.ok).toBe(true);

    const ut = await getUserTask(res.userTaskId!);
    expect(ut.status).toBe('COMPLETED');
    const log = ut.stepResults as any[];
    expect(log.map((e) => e.status)).toEqual(['done', 'rejected_by_user']);
  });

  it('double-reviewing a gate is rejected', async () => {
    const taskId = await makeTask([{ id: 's1', title: 'Send it', action: 'send' }]);
    const res = await startExecution(userId, taskId, 'CO_PILOT', {}, { llm: stubLlm, awaitLoops: true });

    const approval = await prisma.approval.findFirstOrThrow({ where: { userTaskId: res.userTaskId! } });
    await approveGate(approval.id, userId);
    const again = await approveGate(approval.id, userId);
    expect(again.ok).toBe(false);
    expect(again.error).toContain('Already reviewed');
  });

  it('foreign users cannot review gates (404 semantics)', async () => {
    const taskId = await makeTask([{ id: 's1', title: 'Send it', action: 'send' }]);
    const res = await startExecution(userId, taskId, 'CO_PILOT', {}, { llm: stubLlm, awaitLoops: true });
    const approval = await prisma.approval.findFirstOrThrow({ where: { userTaskId: res.userTaskId! } });

    const strangerResult = await approveGate(approval.id, 'not-the-owner');
    expect(strangerResult.ok).toBe(false);
    expect(strangerResult.error).toBe('Not found');
  });

  it('a live STEP_EXECUTING run cannot be re-entered', async () => {
    const taskId = await makeTask([{ id: 's1', title: 'Analyze', action: 'analyze' }]);
    const res = await startExecution(userId, taskId, 'AUTOPILOT', {}, { llm: stubLlm, awaitLoops: true });

    await prisma.userTask.update({ where: { id: res.userTaskId! }, data: { status: 'STEP_EXECUTING' } });
    const reentry = await startExecution(userId, taskId, 'AUTOPILOT');
    expect(reentry.ok).toBe(false);
    expect(reentry.error).toContain('already in progress');
  });

  it('CO_PILOT executes only the requested step synchronously', async () => {
    const taskId = await makeTask([
      { id: 's1', title: 'Research', action: 'research' },
      { id: 's2', title: 'Draft deliverable', action: 'draft' },
    ]);
    let calls = 0;
    const res = await startExecution(
      userId,
      taskId,
      'CO_PILOT',
      { stepIndex: 1 },
      { llm: async () => ((calls++, 'STEP_TWO_OUT')), awaitLoops: true }
    );

    expect(calls).toBe(1);
    expect(res.ok).toBe(true);
    expect(res.stepResult?.output).toBe('STEP_TWO_OUT');
    const ut = await getUserTask(res.userTaskId!);
    const log = ut.stepResults as any[];
    expect(log.filter((e) => e.status === 'done')).toHaveLength(1);
    expect(log[0].index).toBe(1);
  });

  it('legacy string-step tasks stay advisory-safe: no external gates invented', async () => {
    const taskId = await makeTask(['Send emails to clients', 'Deploy everything']);
    const res = await startExecution(userId, taskId, 'AUTOPILOT', {}, {
      llm: stubLlm,
      notify: async () => {},
      awaitLoops: true,
    });

    // Legacy steps parse as non-external advisory entries → run completes
    // without creating any approval rows.
    const approvals = await prisma.approval.findMany({ where: { userTaskId: res.userTaskId! } });
    expect(approvals).toHaveLength(0);
    const ut = await getUserTask(res.userTaskId!);
    expect(ut.status).toBe('COMPLETED');
  });
});
