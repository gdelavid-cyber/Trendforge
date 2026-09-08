import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fingerprint, isDuplicate, generateProceduralTrends } from '../lib/pipeline/index';

const prismaMocks = vi.hoisted(() => ({
  trend: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
  task: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
  trendIngestionLog: { create: vi.fn() },
  executionLog: { findFirst: vi.fn(), create: vi.fn() },
  user: { findUnique: vi.fn() },
}));

vi.mock('@/lib/core/db', () => ({ prisma: prismaMocks }));
vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}));
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}));

const OLD_PIPE = process.env.PIPELINE_API_KEY;

beforeEach(() => {
  vi.clearAllMocks();
  prismaMocks.trend.findMany.mockResolvedValue([]);
  prismaMocks.task.findMany.mockResolvedValue([]);
  prismaMocks.trend.findFirst.mockResolvedValue(null);
  prismaMocks.task.findFirst.mockResolvedValue(null);
  prismaMocks.trendIngestionLog.create.mockResolvedValue({ id: 'log-1' });
});

afterEach(() => {
  if (OLD_PIPE === undefined) delete process.env.PIPELINE_API_KEY;
  else process.env.PIPELINE_API_KEY = OLD_PIPE;
});

describe('track4 ingest honesty', () => {
  it('rejects unauthenticated POST with 401', async () => {
    process.env.PIPELINE_API_KEY = 'valid-secret-key-123';
    const { POST } = await import('../app/api/pipeline/ingest/route');
    const req = new Request('http://localhost:3000/api/pipeline/ingest', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ signals: [] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('empty signals: [] produces recordsIngested === 0 and logs honestly', async () => {
    process.env.PIPELINE_API_KEY = 'valid-secret-key-123';
    const { POST } = await import('../app/api/pipeline/ingest/route');
    const req = new Request('http://localhost:3000/api/pipeline/ingest', {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-secret-key-123',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ signals: [] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.recordsIngested).toBe(0);
    expect(data.monetizableMovesAdded).toBe(0);
    expect(data.marketNewsAdded).toBe(0);
    expect(prismaMocks.trendIngestionLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: 'SCRAPLING_WORKER',
          recordsIngested: 0,
        }),
      })
    );
    expect(prismaMocks.trend.create).not.toHaveBeenCalled();
    expect(prismaMocks.task.create).not.toHaveBeenCalled();
  });

  it('fingerprint and isDuplicate behave as in track2 (dedup unchanged)', () => {
    expect(isDuplicate('AI voice agents for HVAC', ['ai voice agents for hvac!!'], 0.45)).toBe(true);
    expect(fingerprint('  AI Voice Agents for HVAC!! ')).toBe('ai voice agents for hvac');
    expect(fingerprint('Hello,  WORLD!!!')).toBe('hello  world');
    expect(
      isDuplicate(
        'Deploy voice agents for dental clinics',
        ['Launch micro-saas directory for rust developers'],
        0.45
      )
    ).toBe(false);
  });

  it('generateProceduralTrends returns mention_velocity === 0 and source_platforms containing SYSTEM_BLUEPRINT', () => {
    const trends = generateProceduralTrends(5);
    expect(trends.length).toBeGreaterThan(0);
    for (const t of trends) {
      expect(t.mention_velocity).toBe(0);
      expect(t.source_platforms).toContain('SYSTEM_BLUEPRINT');
      expect(t.sentiment_score).toBeUndefined();
      expect(t.initial_confidence).toBeUndefined();
    }
  });
});
