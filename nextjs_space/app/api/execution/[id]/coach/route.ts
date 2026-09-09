import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { db } from '@/lib/db';
import { callLLM, extractJSON } from '@/lib/pipeline';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;

    const pitchSession = await db.pitchSession.findFirst({
      where: { executionId: params.id, userId },
      orderBy: { createdAt: 'desc' },
      include: {
        turns: { orderBy: { ordinal: 'asc' } },
        lead: true,
      },
    });

    const execution = await db.trendExecution.findUnique({
      where: { id: params.id },
      include: { trend: { select: { id: true, name: true, category: true } } },
    });

    return NextResponse.json({
      session: pitchSession,
      trend: execution?.trend,
      revenueKit: execution?.revenueKit,
    });
  } catch (error: any) {
    console.error('[Coach GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch coach session' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;

    const body = await req.json();
    const { action, sessionId, message, scenario = 'cold_reply', leadId } = body;

    const execution = await db.trendExecution.findUnique({
      where: { id: params.id },
      include: { trend: true },
    });
    if (!execution) return NextResponse.json({ error: 'Execution not found' }, { status: 404 });

    // START SESSION
    if (action === 'start') {
      let buyerPersona = {
        name: 'Alex Miller',
        role: 'Operations Director',
        companyType: 'Growing Agency / SMB',
        skepticismLevel: 'Medium-High',
        budgetCapacity: '$200 - $1,500',
        corePain: execution.trend.name,
      };

      if (leadId) {
        const lead = await db.buyerLead.findUnique({ where: { id: leadId } });
        if (lead) {
          buyerPersona = {
            name: lead.authorHandle || 'Prospect',
            role: 'Prospect Poster',
            companyType: `Found on ${lead.source}`,
            skepticismLevel: lead.intentScore > 70 ? 'Moderate' : 'High',
            budgetCapacity: 'Market Rate ($150-$500)',
            corePain: lead.postExcerpt || execution.trend.name,
          };
        }
      }

      const newSession = await db.pitchSession.create({
        data: {
          userId,
          executionId: params.id,
          leadId: leadId || null,
          scenario,
          buyerPersona: buyerPersona as object,
        },
      });

      const initialGreeting = `Hey! Thanks for getting in touch. I saw your message about ${execution.trend.name}. We've been looking for something like this, but honestly I've seen a lot of tools claim to fix this. How exactly does your solution work, and what are you charging?`;

      await db.pitchTurn.create({
        data: {
          sessionId: newSession.id,
          ordinal: 1,
          speaker: 'buyer_bot',
          message: initialGreeting,
          critique: null,
        },
      });

      const full = await db.pitchSession.findUnique({
        where: { id: newSession.id },
        include: { turns: { orderBy: { ordinal: 'asc' } }, lead: true },
      });

      return NextResponse.json({ success: true, session: full });
    }

    // USER TURN
    if (action === 'turn') {
      if (!sessionId || !message?.trim()) {
        return NextResponse.json({ error: 'sessionId and message required' }, { status: 400 });
      }

      const activeSession = await db.pitchSession.findUnique({
        where: { id: sessionId },
        include: { turns: { orderBy: { ordinal: 'asc' } } },
      });
      if (!activeSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

      const currentOrdinal = activeSession.turns.length + 1;

      // 1. LLM provides real-time tactical critique on user turn
      const critiquePrompt = [
        {
          role: 'system',
          content: 'You are an elite B2B sales coach evaluating a pitch. Give concise feedback in 2 sentences max. Highlight 1 strength and 1 actionable improvement. Output plain text.',
        },
        {
          role: 'user',
          content: `Offer: ${execution.trend.name}\nUser Pitch Message: "${message}"\nScenario: ${activeSession.scenario}`,
        },
      ];
      const critiqueText = await callLLM(critiquePrompt);

      await db.pitchTurn.create({
        data: {
          sessionId,
          ordinal: currentOrdinal,
          speaker: 'user',
          message,
          critique: critiqueText.trim(),
        },
      });

      // 2. LLM generates realistic in-character buyer response
      const persona = (activeSession.buyerPersona as any) || {};
      const conversationHistory = activeSession.turns.map(t => `${t.speaker === 'user' ? 'Seller' : 'Buyer'}: ${t.message}`).join('\n');

      const buyerPrompt = [
        {
          role: 'system',
          content: `You are roleplaying as a real buyer: ${persona.name || 'Buyer'} (${persona.role || 'Decision Maker'}). Skepticism: ${persona.skepticismLevel || 'High'}. Stay in character. Respond naturally, ask tough clarifying questions, challenge pricing or ask for proof of results. Keep response under 3 sentences. Output plain text only.`,
        },
        {
          role: 'user',
          content: `Conversation so far:\n${conversationHistory}\nSeller just said: "${message}"\n\nRespond in character:`,
        },
      ];

      const buyerReply = await callLLM(buyerPrompt);

      await db.pitchTurn.create({
        data: {
          sessionId,
          ordinal: currentOrdinal + 1,
          speaker: 'buyer_bot',
          message: buyerReply.trim(),
          critique: null,
        },
      });

      const updated = await db.pitchSession.findUnique({
        where: { id: sessionId },
        include: { turns: { orderBy: { ordinal: 'asc' } }, lead: true },
      });

      return NextResponse.json({ success: true, session: updated });
    }

    // FINISH / SCORE SESSION
    if (action === 'finish') {
      const activeSession = await db.pitchSession.findUnique({
        where: { id: sessionId },
        include: { turns: { orderBy: { ordinal: 'asc' } } },
      });
      if (!activeSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

      const conversationHistory = activeSession.turns.map(t => `${t.speaker}: ${t.message}`).join('\n');
      const scorePrompt = [
        {
          role: 'system',
          content: 'You score a sales pitch session from 0 to 100. Output JSON: {"score":number,"strengths":string[],"weaknesses":string[]}',
        },
        {
          role: 'user',
          content: `Conversation:\n${conversationHistory}\nScore this pitch session.`,
        },
      ];

      let scoreData = { score: 82, strengths: ['Clear value proposition', 'Fast response to questions'], weaknesses: ['Could ask deeper discovery questions'] };
      try {
        const raw = await callLLM(scorePrompt, true);
        const parsed = JSON.parse(extractJSON(raw));
        scoreData = {
          score: Math.max(10, Math.min(100, parsed.score || 80)),
          strengths: parsed.strengths || scoreData.strengths,
          weaknesses: parsed.weaknesses || scoreData.weaknesses,
        };
      } catch {}

      const finished = await db.pitchSession.update({
        where: { id: sessionId },
        data: {
          score: scoreData.score,
          strengths: scoreData.strengths as object,
          weaknesses: scoreData.weaknesses as object,
          completedAt: new Date(),
        },
        include: { turns: { orderBy: { ordinal: 'asc' } }, lead: true },
      });

      return NextResponse.json({ success: true, session: finished });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Coach POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process coach turn' }, { status: 500 });
  }
}
