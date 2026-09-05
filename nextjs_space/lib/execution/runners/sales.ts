import type { LlmFn } from '../skills';
import type { ParsedStep } from '@/lib/pipeline/steps';

export interface SalesStepParams {
  step: ParsedStep;
  taskTitle: string;
  previousResults: string[];
  llm: LlmFn;
  companionName?: string;
}

export interface SalesStepResult {
  targetPersona: string;
  valueProposition: string;
  pricingOffer: string;
  outreachSequence: {
    stage: string;
    channel: 'EMAIL' | 'LINKEDIN_DM' | 'TWITTER_DM' | 'DISCORD';
    subject?: string;
    messageBody: string;
    callToAction: string;
  }[];
  objectionHandling: { objection: string; counter: string }[];
  output: string;
}

export async function runSalesStep({
  step,
  taskTitle,
  previousResults,
  llm,
  companionName = 'Midas',
}: SalesStepParams): Promise<SalesStepResult> {
  const context = previousResults.length
    ? `Task Context & Previous Progress:\n${previousResults.map((r, i) => `Step ${i + 1}: ${r}`).join('\n\n')}`
    : 'No previous step results available.';

  const prompt = `You are ${companionName}, an elite autonomous sales closer and monetization strategist executing: "${taskTitle}".
Current Step (${step.action}): "${step.title}"
Step Description: ${step.description}

${context}

Create a complete, high-converting Sales & Client Acquisition Package to monetize what was built or discovered in this task.
Format your output as clean JSON matching this exact structure (do NOT include markdown backticks or any extra text):
{
  "targetPersona": "Specific high-ticket buyer profile, company size, and pain point",
  "valueProposition": "Crisp 1-sentence value proposition explaining exact ROI",
  "pricingOffer": "$500 - $2,500 one-time or $300/mo retainer",
  "outreachSequence": [
    {
      "stage": "Cold Outreach (Touch 1)",
      "channel": "EMAIL",
      "subject": "Quick question regarding [Pain Point]",
      "messageBody": "High-impact cold pitch referencing specific findings without fluff.",
      "callToAction": "Are you open to a 2-minute loom demo showing how we solved this?"
    },
    {
      "stage": "Follow-Up (Touch 2 - 48h later)",
      "channel": "LINKEDIN_DM",
      "messageBody": "Dropping the direct proof asset / sample result here for you.",
      "callToAction": "Would next Tuesday work to walk through the implementation?"
    }
  ],
  "objectionHandling": [
    {
      "objection": "We already have an in-house tool/team for this.",
      "counter": "Our autonomous pipeline reduces turn-around from 3 days to 20 seconds at 1/10th the cost."
    },
    {
      "objection": "What is the guarantee?",
      "counter": "Every deliverable comes backed with full proof-of-work receipts before you pay."
    }
  ]
}`;

  const raw = await llm([
    {
      role: 'system',
      content: 'You are a top-tier B2B sales strategist and direct-response copywriter. Output strictly valid JSON without markdown fences.',
    },
    { role: 'user', content: prompt },
  ]);

  let parsed: any;
  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = {
      targetPersona: 'SaaS founders, agency owners, and digital creators looking to automate operations',
      valueProposition: 'Deploy instant AI workflows that capture high-intent leads and deliver verified deliverables on autopilot.',
      pricingOffer: '$750 - $2,000 setup fee + optional maintenance retainer',
      outreachSequence: [
        {
          stage: 'Initial Outreach',
          channel: 'EMAIL',
          subject: 'Automated solution for your pipeline',
          messageBody: 'We analyzed your current market bottlenecks and generated a working automated solution ready to deploy.',
          callToAction: 'Can I send over the 60-second walkthrough?',
        },
        {
          stage: 'Proof Follow-up',
          channel: 'TWITTER_DM',
          messageBody: 'Following up with the live data output we synthesized for your team.',
          callToAction: 'Let me know if you would like the full export.',
        },
      ],
      objectionHandling: [
        {
          objection: 'How do we know the quality is high?',
          counter: 'Every run produces transparent step receipts and verified proof artifacts.',
        },
      ],
    };
  }

  const sequence = Array.isArray(parsed.outreachSequence) ? parsed.outreachSequence : [];
  const seqText = sequence
    .map(
      (s: any) =>
        `**[${s.stage} // ${s.channel}]**\n${s.subject ? `*Subject:* ${s.subject}\n` : ''}${s.messageBody}\n👉 *CTA:* ${s.callToAction}`
    )
    .join('\n\n');

  const objections = Array.isArray(parsed.objectionHandling) ? parsed.objectionHandling : [];
  const objText = objections
    .map((o: any) => `- **"${o.objection}"** → *${o.counter}*`)
    .join('\n');

  const summaryOutput = `💼 **Autonomous Sales & Client Acquisition Package**\n\n**Target Buyer:** ${parsed.targetPersona}\n**Core Value Prop:** ${parsed.valueProposition}\n**Recommended Pricing Offer:** \`${parsed.pricingOffer}\`\n\n### Multi-Touch Outreach Sequence:\n${seqText}\n\n### Objection Handlers:\n${objText}`;

  return {
    targetPersona: parsed.targetPersona || '',
    valueProposition: parsed.valueProposition || '',
    pricingOffer: parsed.pricingOffer || '$500+',
    outreachSequence: sequence,
    objectionHandling: objections,
    output: summaryOutput,
  };
}
