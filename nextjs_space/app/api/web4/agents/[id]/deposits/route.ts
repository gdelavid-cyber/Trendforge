export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { ensureReferenceCode } from '@/lib/web4/deposits';

/**
 * Deposit instructions + history for one of the caller's agents. Generates
 * the reference code lazily so legacy agents get one on first visit.
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const agent = await prisma.web4Agent.findUnique({ where: { id: params.id } });
  if (!agent || agent.userId !== user.id) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const treasury = process.env.SOLANA_TREASURY_ADDRESS ?? null;
  const referenceCode = await ensureReferenceCode(agent.id);

  const deposits = await prisma.deposit.findMany({
    where: { agentId: agent.id },
    orderBy: { createdAt: 'desc' },
    take: 25,
    select: { id: true, txSignature: true, amountUsdc: true, status: true, createdAt: true },
  });

  return NextResponse.json({
    success: true,
    chain: 'SOLANA',
    token: 'USDC',
    configured: Boolean(treasury),
    treasury,
    referenceCode,
    deposits: deposits.map((d) => ({ ...d, createdAt: d.createdAt.toISOString() })),
  });
}
