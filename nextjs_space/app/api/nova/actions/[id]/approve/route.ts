import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { executeTool, getTool } from '@/lib/growth/nova/tools';

// Approve a PROPOSED action: atomic claim, bill, execute, receipt.
// Double-approval returns 409 — a proposal executes at most once.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ ok: false, error: 'Sign in.' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ ok: false, error: 'Account not found.' }, { status: 404 });

    // Atomic claim: only a PROPOSED row owned by this user flips to APPROVED.
    const claimed = await prisma.novaAction.updateMany({
      where: { id: params.id, userId: user.id, status: 'PROPOSED' },
      data: { status: 'APPROVED', decidedAt: new Date() },
    });
    if (claimed.count === 0) {
      const existing = await prisma.novaAction.findFirst({ where: { id: params.id, userId: user.id } });
      if (!existing) return NextResponse.json({ ok: false, error: 'Action not found.' }, { status: 404 });
      return NextResponse.json({ ok: false, error: `Already ${existing.status.toLowerCase()}. A proposal executes at most once.` }, { status: 409 });
    }

    const action = await prisma.novaAction.findUnique({ where: { id: params.id } });
    const tool = getTool(action!.tool);
    if (!tool) {
      await prisma.novaAction.update({ where: { id: params.id }, data: { status: 'FAILED', error: 'Tool retired.' } });
      return NextResponse.json({ ok: false, error: 'Tool retired.' }, { status: 410 });
    }

    try {
      const { receipt, remainingBalance } = await executeTool(
        user.id, String(user.role ?? 'FREE'), tool, (action!.params ?? {}) as Record<string, unknown>
      );
      await prisma.novaAction.update({ where: { id: params.id }, data: { status: 'EXECUTED', receipt: receipt as object } });
      return NextResponse.json({ ok: true, status: 'EXECUTED', receipt, remainingBalance });
    } catch (e: any) {
      await prisma.novaAction.update({ where: { id: params.id }, data: { status: 'FAILED', error: String(e?.message ?? e).slice(0, 500) } });
      return NextResponse.json({ ok: false, status: 'FAILED', error: e?.message ?? 'Execution failed.' }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: 'Approval failed.' }, { status: 500 });
  }
}
