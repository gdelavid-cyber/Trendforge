import { NextRequest, NextResponse } from 'next/server';
import { verifyAndDeductCredits } from '@/lib/growth/credits/credit-manager';
import { getNovaQuickAnswers, NOVA_SYSTEM_PROMPT } from '@/lib/growth/nova/nova-knowledge';

export async function POST(req: NextRequest) {
  try {
    const { message, userId = 'default-user' } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ ok: false, error: 'Message required' }, { status: 400 });
    }

    // Deduct 2 credits for Nova message
    const creditResult = verifyAndDeductCredits(userId, 'NOVA_MESSAGE', `Nova chat: "${message.slice(0, 30)}..."`);
    if (!creditResult.success) {
      return NextResponse.json(
        { ok: false, error: creditResult.error, remainingBalance: creditResult.remainingBalance },
        { status: 402 }
      );
    }

    // Check quick answer or synthesized response
    const quickAnswer = getNovaQuickAnswers(message);
    let reply = quickAnswer;

    if (!reply) {
      // Intelligent fallback answer
      reply = `I understand you're asking about "${message}". As your Trendly companion, I'm monitoring live trends and ready to assist. You can execute Video Empire Play 1 (Local Business Video Packages) right now to target local contractors and dentists with turnkey 9:16 sample videos. Would you like me to guide you through setting up a campaign?`;
    }

    return NextResponse.json({
      ok: true,
      reply,
      creditsDeducted: creditResult.cost,
      remainingBalance: creditResult.remainingBalance,
      warning: creditResult.warning,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}