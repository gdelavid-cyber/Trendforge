import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMocks = vi.hoisted(() => ({
  $transaction: vi.fn(),
  trendIngestionLog: { findMany: vi.fn() },
  trend: { count: vi.fn() },
  task: { count: vi.fn() },
  executionLog: { count: vi.fn(), findMany: vi.fn() },
  agentActivityLog: { count: vi.fn(), findMany: vi.fn() },
  swarmBrainDecision: { count: vi.fn(), findMany: vi.fn() },
  novaTrace: { count: vi.fn(), findMany: vi.fn() },
  autonomousAgent: { count: vi.fn(), findMany: vi.fn() },
  web4Agent: { count: vi.fn(), findMany: vi.fn() },
  swarmTask: { count: vi.fn() },
  assetJob: { count: vi.fn(), findMany: vi.fn() },
  agentSpecies: { findMany: vi.fn() },
  user: { findUnique: vi.fn() },
}));

const authState = vi.hoisted(() => ({
  user: null as any,
}));

vi.mock('@/lib/core/db', () => ({ prisma: prismaMocks }));
vi.mock('@/lib/core/route-auth', async () => {
  return {
    getSessionUser: vi.fn().mockImplementation(async () => authState.user),
    requireAdminUser: vi.fn().mockImplementation(async () => {
      if (authState.user?.role === 'ADMIN') return authState.user;
      return null;
    }),
  };
});

describe('track5 telemetry honesty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.user = null;

    prismaMocks.$transaction.mockResolvedValue([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    prismaMocks.trendIngestionLog.findMany.mockResolvedValue([]);
    prismaMocks.autonomousAgent.findMany.mockResolvedValue([]);
    prismaMocks.web4Agent.findMany.mockResolvedValue([]);
    prismaMocks.assetJob.findMany.mockResolvedValue([]);
    prismaMocks.agentSpecies.findMany.mockResolvedValue([]);
    prismaMocks.executionLog.findMany.mockResolvedValue([]);
    prismaMocks.agentActivityLog.findMany.mockResolvedValue([]);
    prismaMocks.swarmBrainDecision.findMany.mockResolvedValue([]);
    prismaMocks.novaTrace.findMany.mockResolvedValue([]);
  });

  it('unauthenticated GET -> 401', async () => {
    authState.user = null;
    const { GET } = await import('../app/api/swarm/telemetry/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('health.status === NEVER_RUN when no TrendIngestionLog rows exist', async () => {
    authState.user = { id: 'u1', email: 'user@example.com', role: 'USER' };
    prismaMocks.trendIngestionLog.findMany.mockResolvedValue([]);

    const { GET } = await import('../app/api/swarm/telemetry/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.health.status).toBe('NEVER_RUN');
    expect(data.health.recordsIngested).toBe(0);
    expect(data.health.minutesSinceLastRun).toBeNull();
  });

  it('TrendIngestionLog row with status: FAILED yields health.status === BLOCKED and errorMessage preserved verbatim', async () => {
    authState.user = { id: 'admin1', email: 'admin@example.com', role: 'ADMIN' };
    const verbatimError = 'Fatal Reddit scraper HTTP 429 rate limited on sub cluster';
    prismaMocks.trendIngestionLog.findMany.mockResolvedValue([
      {
        id: 'log-fail',
        source: 'SCRAPLING_WORKER',
        status: 'FAILED',
        recordsIngested: 0,
        errorMessage: verbatimError,
        executedAt: new Date(),
        durationMs: 450,
      },
    ]);

    const { GET } = await import('../app/api/swarm/telemetry/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.health.status).toBe('BLOCKED');
    expect(data.health.errorMessage).toBe(verbatimError);
  });

  it('non-admin payload contains no cost keys and no species array', async () => {
    authState.user = { id: 'regular-user', email: 'user@example.com', role: 'USER' };
    prismaMocks.agentActivityLog.findMany.mockResolvedValue([
      {
        id: 'act-1',
        agentRole: 'DISCOVERER',
        activity: 'Scouting commercial signals',
        actionType: 'SCOUT',
        cost: 0.0042,
        timestamp: new Date(),
      },
    ]);

    const { GET } = await import('../app/api/swarm/telemetry/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.species).toBeUndefined();
    expect(data.eventLog.length).toBeGreaterThan(0);
    for (const ev of data.eventLog) {
      expect(ev.cost).toBeUndefined();
    }
  });

  it('eventLog entries all carry a type in [EXECUTION, AGENT, DECISION, TRACE]', async () => {
    authState.user = { id: 'user1', email: 'u@test.com', role: 'USER' };
    prismaMocks.executionLog.findMany.mockResolvedValue([
      { id: 'e1', logType: 'milestone_start', actionDescription: 'Starting milestone', timestamp: new Date() },
    ]);
    prismaMocks.agentActivityLog.findMany.mockResolvedValue([
      { id: 'a1', agentRole: 'BUILDER', activity: 'Compiling sales kit', actionType: 'BUILD', cost: 0.01, timestamp: new Date() },
    ]);
    prismaMocks.swarmBrainDecision.findMany.mockResolvedValue([
      { id: 'd1', decisionType: 'DISPATCH', reasoning: 'High monetization score verified', confidenceScore: 92, createdAt: new Date() },
    ]);
    prismaMocks.novaTrace.findMany.mockResolvedValue([
      { id: 't1', kind: 'GATE', subject: 'Payout Gate', summary: 'Verified ledger balance', createdAt: new Date() },
    ]);

    const { GET } = await import('../app/api/swarm/telemetry/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.eventLog.length).toBe(4);
    const validTypes = new Set(['EXECUTION', 'AGENT', 'DECISION', 'TRACE']);
    for (const ev of data.eventLog) {
      expect(validTypes.has(ev.type)).toBe(true);
      expect(ev.label).toBeDefined();
      expect(ev.text).toBeDefined();
    }
  });
});
