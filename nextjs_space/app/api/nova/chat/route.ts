import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { deductCreditsDb } from '@/lib/growth/credits/credit-manager';
import { getNovaQuickAnswers } from '@/lib/growth/nova/nova-knowledge';

export async function POST(req: NextRequest) {
  try {
    // N0: identity comes from the session only. No client-supplied userId.
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: 'Sign in to talk to Nova.' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Account not found.' }, { status: 404 });
    }

    const { message } = await req.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ ok: false, error: 'Message required' }, { status: 400 });
    }

    // Server-authoritative billing against the session owner's ledger.
    const creditResult = await deductCreditsDb(user.id, 'NOVA_MESSAGE', `Nova chat: "${message.slice(0, 30)}..."`);
    if (!creditResult.success) {
      return NextResponse.json(
        { ok: false, error: creditResult.error, remainingBalance: creditResult.remainingBalance },
        { status: 402 }
      );
    }

    await prisma.novaConversation.create({
      data: { userId: user.id, role: 'user', content: message.slice(0, 4000) },
    });

    const quickAnswer = getNovaQuickAnswers(message);
    let reply: string;
    let grounded: Record<string, unknown>;
    if (quickAnswer) {
      reply = quickAnswer;
      grounded = { source: 'knowledge-base' };
    } else {
      // Honest fallback: grounded in real account state, never fake monitoring.
      const [credit, tasks, agents] = await Promise.all([
        prisma.userCredit.findUnique({ where: { userId: user.id } }),
        prisma.novaCustomTask.count({ where: { userId: user.id, status: 'ACTIVE' } }),
        prisma.web4Agent.count({ where: { userId: user.id } }),
      ]);
      reply =
        `I don't have a ready answer for that yet — and I won't guess about live data I can't see. ` +
        `Here's what I can see right now: you hold ${credit?.creditBalance ?? 0} credits, ` +
        `run ${agents} agent${agents === 1 ? '' : 's'}, and have ${tasks} active background task${tasks === 1 ? '' : 's'}. ` +
        `I can check your balance, quotas, and trends, set up background monitors, draft outreach, or walk you through Video Empire Play 1. What should we do?`;
      grounded = {
        source: 'live-state',
        creditBalance: credit?.creditBalance ?? 0,
        activeTasks: tasks,
        agents,
      };
    }

    await prisma.novaConversation.create({
      data: { userId: user.id, role: 'assistant', content: reply.slice(0, 4000) },
    });

    return NextResponse.json({
      ok: true,
      reply,
      grounded,
      creditsDeducted: creditResult.cost,
      remainingBalance: creditResult.remainingBalance,
      warning: creditResult.warning,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: 'Nova ran into an error. Any deducted credits are listed in your transaction history.' }, { status: 500 });
  }
}
