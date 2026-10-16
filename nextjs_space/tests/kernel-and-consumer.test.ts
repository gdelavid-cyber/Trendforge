import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { KernelRuntime, kernelRuntime } from '@/lib/runtime/kernel';
import { callLLM } from '@/lib/pipeline';
import { makeLlm } from '@/lib/execution/llm';
import { queueJobForStarNet } from '@/lib/execution/runners/starnet';
import { GET as pullTasksRoute, POST as queueTaskRoute } from '@/app/api/starnet/tasks/pull/route';
import { POST as completeTaskRoute } from '@/app/api/starnet/complete/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

describe('Option A: Unified KernelRuntime & Telemetry Verification', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    delete process.env.BRAIN_LLM_COST_BUDGET;
    delete process.env.AGENT_USER_SPENDING_LIMIT;
    delete process.env.LLM_PROVIDER;
  });

  it('enforces system-level and per-user token and cost budgets', () => {
    process.env.BRAIN_LLM_COST_BUDGET = '50';
    process.env.AGENT_USER_SPENDING_LIMIT = '5';

    const runtime = KernelRuntime.getInstance();
    const statusBefore = runtime.checkBudget('user_test_1');
    expect(statusBefore.isAllowed).toBe(true);

    // Simulate user spend exceeding limit
    runtime.recordSpend(6.0, 'user_test_1');
    const statusAfter = runtime.checkBudget('user_test_1');
    expect(statusAfter.isAllowed).toBe(false);
    expect(statusAfter.reason).toContain('User daily spending limit reached');
  });

  it('blocks LLM calls and logs blocked telemetry when budget is exceeded', async () => {
    process.env.AGENT_USER_SPENDING_LIMIT = '1';
    const runtime = KernelRuntime.getInstance();
    runtime.recordSpend(2.0, 'blocked_user');

    await expect(
      runtime.call({
        messages: [{ role: 'user', content: 'Generate high-ticket SaaS idea' }],
        userId: 'blocked_user',
        gateType: 'model_routing',
      })
    ).rejects.toThrow(/User daily spending limit reached/);
  });

  it('delegates callLLM through KernelRuntime with automatic fallback', async () => {
    // When no external API keys are configured, it engages procedural blueprint synthesis
    const result = await callLLM(
      [
        { role: 'system', content: 'You are a task generation AI' },
        { role: 'user', content: 'Generate one money-making task for trend: Deploy Autonomous AI Voice Receptionists for Dental Clinics. Output JSON only.' },
      ],
      true
    );

    expect(result).toBeDefined();
    const parsed = JSON.parse(result);
    expect(parsed.title).toContain('Autonomous AI Voice Receptionists');
    expect(parsed.steps).toBeInstanceOf(Array);
    expect(parsed.difficulty).toBe('LOW');
  });

  it('makeLlm closure delegates through KernelRuntime seamlessly', async () => {
    const llmFn = makeLlm({ userId: 'test_dev', agent: 'specialist_scout' });
    const response = await llmFn([
      { role: 'system', content: 'You are a trend detection AI' },
      { role: 'user', content: 'Scan high-margin local service trends' },
    ]);

    expect(response).toBeDefined();
    const parsed = JSON.parse(response);
    expect(parsed.trends).toBeInstanceOf(Array);
    expect(parsed.trends.length).toBeGreaterThan(0);
  });
});

describe('Option C: StarNet Swarm Worker Task Queue & Consumer Integration', () => {
  const TEST_SECRET = 'test-station-bridge-secret-key-1234';

  beforeEach(() => {
    process.env.STARNET_BRIDGE_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    delete process.env.STARNET_BRIDGE_SECRET;
  });

  it('enqueues a heavy swarm job and atomically claims it via GET /api/starnet/tasks/pull', async () => {
    // 1. Enqueue job via POST /api/starnet/tasks/pull
    const reqBody = {
      agentGoal: 'Scrape 30 Reddit discussions on r/SaaS for billing grievances',
      tools: ['reddit_scraper'],
      ventureId: 'venture_test_42',
      taskId: 'task_scrape_01',
    };

    const postReq = new NextRequest('http://localhost:3000/api/starnet/tasks/pull', {
      method: 'POST',
      body: JSON.stringify(reqBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const postRes = await queueTaskRoute(postReq);
    expect(postRes.status).toBe(201);
    const postData = await postRes.json();
    expect(postData.ok).toBe(true);
    expect(postData.jobId).toBeDefined();

    // 2. Pull and atomically claim job via GET /api/starnet/tasks/pull
    const getReq = new NextRequest('http://localhost:3000/api/starnet/tasks/pull', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${TEST_SECRET}`,
        'x-starnet-station-id': 'starnet-test-node-01',
      },
    });

    const getRes = await pullTasksRoute(getReq);
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.ok).toBe(true);
    expect(getData.job).toBeDefined();
    expect(getData.job.id).toBe(postData.jobId);
    expect(getData.job.agentGoal).toContain('Scrape 30 Reddit discussions');
    expect(getData.job.ventureId).toBe('venture_test_42');

    // 3. Verify status in database transitioned to RUNNING
    const dbJob = await prisma.starNetJob.findUnique({
      where: { id: postData.jobId },
    });
    expect(dbJob?.status).toBe('RUNNING');

    // 4. Report task completion via POST /api/starnet/complete
    const completeBody = {
      jobId: postData.jobId,
      ventureId: 'venture_test_42',
      starnetRunId: 'starnet_run_abc',
      status: 'COMPLETE',
      costCents: 14,
      artifact: {
        summary: 'Identified 3 recurring SaaS billing pain points',
        problems: ['Stripe tax complexity', 'Failed webhooks', 'Currency conversion slippage'],
      },
      completedAt: new Date().toISOString(),
    };

    const rawComplete = JSON.stringify(completeBody);
    const hmacSig = 'sha256=' + crypto.createHmac('sha256', TEST_SECRET).update(rawComplete).digest('hex');

    const completeReq = new NextRequest('http://localhost:3000/api/starnet/complete', {
      method: 'POST',
      body: rawComplete,
      headers: {
        'Content-Type': 'application/json',
        'x-starnet-signature': hmacSig,
      },
    });

    const completeRes = await completeTaskRoute(completeReq);
    expect(completeRes.status).toBe(200);

    // 5. Verify database job settled as COMPLETE with artifact and cost
    const settledJob = await prisma.starNetJob.findUnique({
      where: { id: postData.jobId },
    });
    expect(settledJob?.status).toBe('COMPLETE');
    expect(settledJob?.costCents).toBe(14);
    expect((settledJob?.resultArtifact as any)?.summary).toContain('Identified 3 recurring');
  });

  it('returns job: null gracefully when no tasks are pending', async () => {
    // Empty the queue or pull until nothing is pending
    const getReq = new NextRequest('http://localhost:3000/api/starnet/tasks/pull', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${TEST_SECRET}`,
      },
    });

    // Mark any existing pending jobs as claimed for this test
    await prisma.starNetJob.updateMany({
      where: { status: 'PENDING' },
      data: { status: 'COMPLETE' },
    });

    const res = await pullTasksRoute(getReq);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.job).toBeNull();
  });
});
