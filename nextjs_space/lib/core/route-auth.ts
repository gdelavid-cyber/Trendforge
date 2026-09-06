import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';

// Shared route guards (Phase 1). Every money-adjacent route uses these;
// never inline a bespoke session check again.

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

export function unauthorized(message = 'Sign in to continue.') {
  return NextResponse.json({ ok: false, success: false, error: message }, { status: 401 });
}

export function forbidden(message = 'Not permitted.') {
  return NextResponse.json({ ok: false, success: false, error: message }, { status: 403 });
}

export function isAdminRole(role: unknown): boolean {
  return String(role ?? '') === 'ADMIN';
}

export async function requireAdminUser() {
  const user = await getSessionUser();
  if (!user) return null;
  if (!isAdminRole((user as { role?: unknown }).role)) return null;
  return user;
}

// Bills compute invocations (MCP/sandbox/builder gateways) against the
// session owner's credit balance. Returns an error response when billing
// fails, so callers can return 402 before burning server credentials.
export async function billCompute(
  userId: string,
  label: string
): Promise<import('next/server').NextResponse | null> {
  const { deductCreditsDb } = await import('@/lib/growth/credits/credit-manager');
  const billing = await deductCreditsDb(userId, 'TREND_SCOUT_QUERY', label);
  if (!billing.success) {
    return NextResponse.json(
      { ok: false, success: false, error: billing.error, remainingBalance: billing.remainingBalance },
      { status: 402 }
    );
  }
  return null;
}

import { timingSafeEqual } from 'crypto';

function secretsEqual(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function headerKeys(request: Request): string[] {
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const apiKey = request.headers.get('x-api-key');
  return [bearer, apiKey].filter((v): v is string => Boolean(v));
}

// Cron auth: CRON_SECRET only, headers only (Bearer or x-api-key).
// Query-string keys are rejected — URLs land in logs, history, Referers.
// Fail closed when no secret is configured.
export function checkCronAuth(request: Request): { authorized: boolean; error?: string; status?: number } {
  const secret = process.env.CRON_SECRET || process.env.PIPELINE_API_KEY;
  if (!secret) {
    return { authorized: false, error: 'CRON auth not configured', status: 500 };
  }
  if (!headerKeys(request).some((k) => secretsEqual(k, secret))) {
    return { authorized: false, error: 'Unauthorized', status: 401 };
  }
  return { authorized: true };
}
