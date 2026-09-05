import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma } from '../lib/core/db';
import { approveGate, startExecution } from '../lib/execution/engine';

// Proof-of-work trail: every executed step must land in stepResults with
// wall-clock stamps (startedAt/finishedAt/durationMs) so the run feed can
// show users WHEN and HOW LONG each piece of real work took — and artifacts
// must link to their step index as verifiable evidence.

vi.mock('@/lib/core/aws-config', () => ({
  getBucketConfig: () => ({ bucketName: '', folderPrefix: '' }),
  createS3Client: () => {
    throw new Error('S3 must not be constructed in engine tests');
  },
}));

const RUN = `proof-${Date.now()}`;

let userId: string;
let trendId: string;
const stubLlm = async () => 'PROOF_OUTPUT';

async function makeTask(stepsJson: unknown): Promise<string> {
  const t = await prisma.task.create({
    data: {
      id: `${RUN}-task-${Math.random().toString(36).slice(2, 8)}`,
      title: `Proof test task ${RUN}`,
      description: 'fixture',
      category: 'AI_TOOLS',
      steps: stepsJson as any,
      trendId,
    },
  });
  return t.id;
}

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: `${RUN}@proof-test.local`, name: 'Proof Test User', passwordHash: 'x' },
  });
  userId = user.id;
  const trend = await prisma.trend.create({ data: { name: `Proof trend ${RUN}` } });
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

describe('step proof trail', () => {
  it('stamps every executed entry with startedAt/finishedAt/durationMs', async () => {
    const taskId = await makeTask([
      { id: 's1', title: 'Summarize market', action: 'analyze' },
      { id: 's2', title: 'Build deliverable', action: 'export' }, // inline FILE artifact
      { id: 's3', title: 'Send pitches', action: 'send' }, // gate — stops the run
    ]);

    const res = await startExecution(userId, taskId, 'AUTOPILOT', {}, {
      llm: stubLlm,
      notify: async () => {},
      awaitLoops: true,
    });
    expect(res.ok).toBe(true);

    const ut = await prisma.userTask.findUniqueOrThrow({ where: { id: res.userTaskId! } });
    const log = ut.stepResults as any[];

    // Two internal steps executed before the gate.
    expect(log).toHaveLength(2);
    for (const entry of log) {
      expect(entry.startedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(entry.finishedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(typeof entry.durationMs).toBe('number');
      expect(entry.durationMs).toBeGreaterThanOrEqual(0);
      expect(new Date(entry.finishedAt).getTime()).toBeGreaterThanOrEqual(new Date(entry.startedAt).getTime());
    }
    expect(log[0].status).toBe('done');
    expect(log[1].status).toBe('done');

    // The export step's artifact is the evidence row linked to its step.
    const artifacts = await prisma.taskArtifact.findMany({ where: { userTaskId: ut.id } });
    expect(artifacts).toHaveLength(1);
    expect(artifacts[0]).toMatchObject({ stepIndex: 1, kind: 'FILE' });
    expect((artifacts[0].meta as any)?.inline).toBe(true);
    expect((artifacts[0].meta as any)?.bytes).toBeGreaterThan(0);
  });

  it('the post-approval execution carries its own proof stamps', async () => {
    const taskId = await makeTask([
      { id: 's1', title: 'Prepare outreach', action: 'analyze' },
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

    const ut = await prisma.userTask.findUniqueOrThrow({ where: { id: res.userTaskId! } });
    const log = ut.stepResults as any[];
    const sendEntry = log.find((e) => e.index === 1)!;

    // No email key connected → honest blocked, but still fully stamped.
    expect(sendEntry.status).toBe('blocked');
    expect(sendEntry.output).toContain('BLOCKED');
    expect(sendEntry.durationMs).toBeGreaterThanOrEqual(0);
    expect(sendEntry.finishedAt >= sendEntry.startedAt).toBe(true);
  });
});
