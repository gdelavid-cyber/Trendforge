import { callLLM } from '@/lib/pipeline';
import { db } from '@/lib/db';

// Adapter to support both object parameter and array parameter signatures
async function callLLMAdapter(args: { messages: { role: string; content: string }[]; temperature?: number; jsonMode?: boolean } | { role: string; content: string }[], jsonMode = false): Promise<{ content: string }> {
  if (Array.isArray(args)) {
    const res = await callLLM(args, jsonMode);
    return { content: res };
  }
  const res = await callLLM(args.messages, args.jsonMode ?? false);
  return { content: res };
}

/**
 * The coach plays a specific buyer persona. Given the offer + optional real lead,
 * it generates realistic buyer responses and critiques the user's messages.
 */

export async function startPitchSession(params: {
  userId?: string | null;
  executionId?: string;
  leadId?: string;
  scenario: 'cold_reply' | 'discovery_call' | 'price_objection' | 'custom' | string;
}) {
  // Build a buyer persona from the lead OR from the execution offer
  let buyerPersona: any;

  if (params.leadId) {
    const lead = await db.buyerLead.findUnique({
      where: { id: params.leadId },
      include: { execution: { include: { trend: true } } },
    });
    if (!lead) throw new Error('Lead not found');

    const { content } = await callLLMAdapter({
      messages: [
        {
          role: 'system',
          content: `You build a realistic B2B buyer persona from a public post. Output JSON: {"name":string,"role":string,"company_size":string,"mood":string,"top_priority":string,"biggest_objection":string,"communication_style":string,"budget_stance":string}.`,
        },
        {
          role: 'user',
          content: `They posted this on ${lead.source}:\nTitle: ${lead.postTitle || 'Inquiry'}\nBody: ${lead.postExcerpt}\nEngagement: ${lead.engagement} upvotes\n\nBuild the persona to practice against.`,
        },
      ],
      temperature: 0.4,
      jsonMode: true,
    });

    buyerPersona = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
  } else {
    // Generic persona based on scenario
    buyerPersona = defaultPersona(params.scenario);
  }

  const session = await db.pitchSession.create({
    data: {
      userId: params.userId || undefined,
      leadId: params.leadId || undefined,
      executionId: params.executionId || undefined,
      scenario: params.scenario,
      buyerPersona: buyerPersona as object,
    },
  });

  // Buyer opens
  const opener = await buyerOpen(session.id, buyerPersona, params.scenario);
  await db.pitchTurn.create({
    data: {
      sessionId: session.id,
      ordinal: 0,
      speaker: 'buyer_bot',
      message: opener,
    },
  });

  return { sessionId: session.id, buyerPersona, opener };
}

export async function userSpeaks(sessionId: string, message: string) {
  const session = await db.pitchSession.findUnique({
    where: { id: sessionId },
    include: { turns: { orderBy: { ordinal: 'asc' } } },
  });
  if (!session) throw new Error('Session not found');

  const nextOrdinal = session.turns.length;

  // Save user turn + critique in parallel
  const userTurn = await db.pitchTurn.create({
    data: {
      sessionId,
      ordinal: nextOrdinal,
      speaker: 'user',
      message,
    },
  });

  const critique = await critiqueUserMessage(session, message);
  await db.pitchTurn.update({
    where: { id: userTurn.id },
    data: { critique },
  });

  // Buyer responds
  const buyerReply = await buyerRespond(session, message);
  await db.pitchTurn.create({
    data: {
      sessionId,
      ordinal: nextOrdinal + 1,
      speaker: 'buyer_bot',
      message: buyerReply,
    },
  });

  return { critique, buyerReply };
}

export async function endPitchSession(sessionId: string) {
  const session = await db.pitchSession.findUnique({
    where: { id: sessionId },
    include: { turns: { orderBy: { ordinal: 'asc' } } },
  });
  if (!session) throw new Error('Session not found');

  const transcript = session.turns
    .map(t => `${t.speaker === 'user' ? 'YOU' : 'BUYER'}: ${t.message}`)
    .join('\n\n');

  const { content } = await callLLMAdapter({
    messages: [
      {
        role: 'system',
        content: `You score a sales practice session. Output JSON: {"score":0-100,"strengths":string[],"weaknesses":string[],"one_thing_to_fix":string,"would_this_close":boolean}. Be honest. Don't inflate.`,
      },
      {
        role: 'user',
        content: `Buyer persona: ${JSON.stringify(session.buyerPersona)}\nScenario: ${session.scenario}\n\nTranscript:\n${transcript}`,
      },
    ],
    temperature: 0.3,
    jsonMode: true,
  });

  const result = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] ?? '{}');

  await db.pitchSession.update({
    where: { id: sessionId },
    data: {
      score: typeof result.score === 'number' ? result.score : 70,
      strengths: result.strengths as object,
      weaknesses: result.weaknesses as object,
      completedAt: new Date(),
    },
  });

  return result;
}

// ---------- LLM calls ----------

async function buyerOpen(sessionId: string, persona: any, scenario: string) {
  const openers: Record<string, string> = {
    cold_reply: `You are ${persona?.name ?? 'a potential buyer'}. The user is going to send you a cold message. Open with something short and skeptical, matching your ${persona?.communication_style ?? 'busy'} style. 1-2 sentences max.`,
    discovery_call: `You're on a discovery call. You just joined. Say hello briefly and wait for them to open. 1 sentence.`,
    price_objection: `You've heard the pitch. Now you're pushing back on price. Be firm but fair. Match your ${persona?.communication_style ?? 'direct'} style.`,
    custom: `You are ${persona?.name ?? 'the buyer'}. Start the conversation naturally.`,
  };

  const { content } = await callLLMAdapter({
    messages: [
      { role: 'system', content: `Persona: ${JSON.stringify(persona)}\n\n${openers[scenario] ?? openers.custom}` },
      { role: 'user', content: 'Open the conversation.' },
    ],
    temperature: 0.7,
  });

  return content.trim();
}

async function buyerRespond(session: any, userMessage: string) {
  const history = session.turns
    .slice(-6)
    .map((t: any) => `${t.speaker === 'user' ? 'SELLER' : 'ME'}: ${t.message}`)
    .join('\n');

  const { content } = await callLLMAdapter({
    messages: [
      {
        role: 'system',
        content: `You are role-playing a real buyer with this persona: ${JSON.stringify(session.buyerPersona)}.
Rules:
- React realistically to what the seller just said
- Don't be a pushover — real buyers push back, ask hard questions, get distracted
- If they earn it, warm up. If they whiff, disengage
- Match your persona's ${session.buyerPersona?.communication_style ?? 'communication style'}
- Keep responses under 3 sentences unless asking detailed questions
- Occasionally throw in realistic objections from your persona's ${session.buyerPersona?.biggest_objection ?? 'concerns'}
- NEVER break character or mention you're an AI`,
      },
      {
        role: 'user',
        content: `Recent conversation:\n${history}\n\nThe seller just said: "${userMessage}"\n\nRespond as the buyer.`,
      },
    ],
    temperature: 0.75,
  });

  return content.trim();
}

async function critiqueUserMessage(session: any, message: string) {
  const { content } = await callLLMAdapter({
    messages: [
      {
        role: 'system',
        content: `You give short realtime coaching to a salesperson. One sentence, actionable. If the message was strong, say what worked. If it was weak, say the specific fix. No pep talks, no vague praise.`,
      },
      {
        role: 'user',
        content: `Scenario: ${session.scenario}\nBuyer persona: ${JSON.stringify(session.buyerPersona)}\n\nThey just said: "${message}"\n\nOne sentence of coaching.`,
      },
    ],
    temperature: 0.4,
  });

  return content.trim();
}

function defaultPersona(scenario: string) {
  const map: Record<string, any> = {
    cold_reply: {
      name: 'Jamie',
      role: 'Ops Manager',
      company_size: '10-50',
      mood: 'skeptical but not hostile',
      top_priority: 'save time on repetitive work',
      biggest_objection: 'we can build it internally',
      communication_style: 'blunt, low patience for fluff',
      budget_stance: 'has budget but demands proof',
    },
    discovery_call: {
      name: 'Sam',
      role: 'Founder',
      company_size: '1-10',
      mood: 'curious, hopeful',
      top_priority: 'get to revenue faster',
      biggest_objection: 'not sure this is the right time',
      communication_style: 'friendly, talkative, easily distracted',
      budget_stance: 'bootstrapped, price-sensitive',
    },
    price_objection: {
      name: 'Alex',
      role: 'Head of Growth',
      company_size: '50-200',
      mood: 'engaged but pushing back on price',
      top_priority: 'ROI within 60 days',
      biggest_objection: 'we can get this cheaper elsewhere',
      communication_style: 'analytical, references numbers',
      budget_stance: 'has budget, wants a deal',
    },
    custom: {
      name: 'Practice Buyer',
      role: 'Decision Maker',
      company_size: 'varies',
      mood: 'realistic',
      top_priority: 'solve the problem',
      biggest_objection: 'trust',
      communication_style: 'professional',
      budget_stance: 'reasonable',
    },
  };
  return map[scenario] ?? map.custom;
}
