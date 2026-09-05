import { OpenRouterClient } from '@/lib/intelligence/openrouter/client';
import { OBJECTION_DATABASE } from '@/lib/earn/agents/sales-closer';
import { enforcePriceFloor } from './compliance';
import type { CopilotAnalysis, TranscriptMessage } from './types';

const openRouter = new OpenRouterClient();

export async function analyzeBuyerEngagement(params: {
  buyerMessage: string;
  leadContext?: {
    buyerName?: string | null;
    requestText?: string;
    source?: string;
  };
  productContext?: {
    priceOffer?: number | null;
    priceFloor?: number;
    description?: string;
  };
  transcriptHistory?: TranscriptMessage[];
}): Promise<CopilotAnalysis> {
  const { buyerMessage, leadContext, productContext, transcriptHistory = [] } = params;

  const priceOffer = productContext?.priceOffer || 450;
  const priceFloor = productContext?.priceFloor || 250;

  const prompt = `You are an elite, sub-second B2B sales co-pilot for Trendly. Analyze this incoming buyer message and produce live coaching tips and a tactical suggested response.

Context:
- Product/Offer: ${productContext?.description || 'Turnkey AI Service / Automated Asset Package'}
- Stated Offer Price: $${priceOffer}
- Absolute Price Floor: $${priceFloor} (NEVER suggest or accept anything lower)
- Prospect Info: Name: ${leadContext?.buyerName || 'Prospect'}, Context: ${leadContext?.requestText || 'Interested in solution'}, Source: ${leadContext?.source || 'Direct Outreach'}

Recent Conversation:
${transcriptHistory
  .slice(-4)
  .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
  .join('\n')}

Incoming Buyer Message:
"${buyerMessage}"

Respond with pure valid JSON matching this schema:
{
  "intent": "Short 2-4 word intent summary (e.g., Demo Request, Price Pushback, Timeline Question)",
  "objection": "Primary objection category if present (e.g. Budget, Timing, Authority, Scope) or null",
  "sentiment": "positive" | "neutral" | "negative" | "hostile",
  "urgency": "low" | "medium" | "high",
  "keyPoints": ["Bullet point 1", "Bullet point 2"],
  "coachingTip": "1-2 sentence tactical psychological advice for the human seller",
  "suggestedReply": "Polished, ready-to-send reply addressing their exact point and steering toward closing or next step."
}`;

  try {
    const response = await openRouter.chatCompletion(
      {
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an ultra-fast B2B sales intelligence engine. Output only valid JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      },
      'standard'
    );

    const rawContent = response.choices?.[0]?.message?.content;
    if (!rawContent) {
      return generateFallbackAnalysis(buyerMessage, priceOffer, priceFloor);
    }
    const parsed = JSON.parse(rawContent) as CopilotAnalysis;
    if (!parsed || !parsed.intent || !parsed.suggestedReply) {
      return generateFallbackAnalysis(buyerMessage, priceOffer, priceFloor);
    }

    // Enforce price floor on the suggested reply
    const { safeContent } = enforcePriceFloor(parsed.suggestedReply, priceFloor);
    parsed.suggestedReply = safeContent;

    return parsed;
  } catch (error) {
    console.warn('[CopilotAnalyzer] LLM fast analysis failed, using tactical rule engine fallback:', error);
    return generateFallbackAnalysis(buyerMessage, priceOffer, priceFloor);
  }
}

function generateFallbackAnalysis(
  buyerMessage: string,
  priceOffer: number,
  priceFloor: number
): CopilotAnalysis {
  const lower = buyerMessage.toLowerCase();

  // 1. Budget / Expensive pushback
  if (lower.includes('expensive') || lower.includes('cost') || lower.includes('price') || lower.includes('budget')) {
    const obj = OBJECTION_DATABASE.find((o) => o.objectionKey === 'TOO_EXPENSIVE') || OBJECTION_DATABASE[0];
    return {
      intent: 'Price Inquiry',
      objection: 'Budget / Cost',
      sentiment: 'neutral',
      urgency: 'high',
      keyPoints: ['Price is the primary focus', 'Wants to see ROI before committing'],
      coachingTip: obj.psychologicalLever,
      suggestedReply: `Our turnkey setup is $${priceOffer}. ${obj.tacticalReply}`,
    };
  }

  // 2. Demo / Proof request
  if (lower.includes('demo') || lower.includes('see') || lower.includes('sample') || lower.includes('link')) {
    return {
      intent: 'Demo Request',
      objection: null,
      sentiment: 'positive',
      urgency: 'high',
      keyPoints: ['Active interest in verification', 'Low friction to conversion'],
      coachingTip: 'Send the interactive demo immediately and schedule a 3-minute check-in call.',
      suggestedReply:
        'Here is the direct interactive link: https://trendly.io/demo. You can test live performance right on your phone. Would tomorrow afternoon work to review the handover?',
    };
  }

  // Default fallback
  return {
    intent: 'General Inquiry',
    objection: null,
    sentiment: 'neutral',
    urgency: 'medium',
    keyPoints: ['Buyer is engaging with outreach', 'Opportunity to qualify requirements'],
    coachingTip: 'Confirm their primary pain point before presenting full contract terms.',
    suggestedReply:
      'Thanks for getting back to me! I would be glad to walk you through how we handle this. What is your team’s top priority for this week?',
  };
}
