import { prisma } from '@/lib/core/db';

// N3 Nova OS — decision traces. recordTrace is fire-and-forget by contract:
// it never throws, never blocks, never changes the decision it records.

export type TraceKind = 'RUN_REJECTED' | 'STEP' | 'BATTLE' | 'TREND' | 'GATE';

export interface TraceInput {
  userId?: string | null;
  kind: TraceKind;
  subject: string;
  summary: string;
  reasons?: string[];
}

export async function recordTrace(input: TraceInput): Promise<void> {
  try {
    await prisma.novaTrace.create({
      data: {
        userId: input.userId ?? null,
        kind: input.kind,
        subject: input.subject.slice(0, 200),
        summary: input.summary.slice(0, 1000),
        reasons: (input.reasons ?? []).map((r) => String(r).slice(0, 500)),
      },
    });
  } catch {
    // Tracing is observability, not control flow. Swallow everything.
  }
}

export async function recentTraces(
  userId: string,
  opts: { kinds?: TraceKind[]; includeGlobal?: boolean; limit?: number } = {}
) {
  const { kinds, includeGlobal = true, limit = 5 } = opts;
  const kindFilter = kinds && kinds.length > 0 ? { in: kinds } : undefined;
  const where: Record<string, unknown> = includeGlobal
    ? { OR: [{ userId }, { userId: null }], ...(kindFilter ? { kind: kindFilter } : {}) }
    : { userId, ...(kindFilter ? { kind: kindFilter } : {}) };
  return prisma.novaTrace.findMany({ where, orderBy: { createdAt: 'desc' }, take: Math.min(limit, 10) });
}

export function renderTraceText(t: { kind: string; subject: string; summary: string; reasons: unknown; createdAt: Date }): string {
  const reasons = Array.isArray(t.reasons) ? t.reasons.map(String).filter(Boolean) : [];
  const when = t.createdAt.toISOString().slice(0, 16).replace('T', ' ');
  const body = reasons.length > 0 ? ` Because: ${reasons.join(' ')}` : '';
  return `[${t.kind} · ${when}] ${t.subject}: ${t.summary}.${body}`;
}
