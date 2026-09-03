import { InvoiceDraft, ObjectionResponse } from './types';

export const OBJECTION_DATABASE: ObjectionResponse[] = [
  {
    objectionKey: 'TOO_EXPENSIVE',
    buyerSaying: 'That is out of our budget right now / Too expensive.',
    tacticalReply:
      'I completely understand. Most trade businesses in your area were spending $2,500/month on manual answering services and still missing night calls. Capturing just one emergency dispatch ticket covers this setup permanently. Would you like to review the 60-second math breakdown?',
    psychologicalLever: 'Cost of inaction contrast vs active revenue loss.',
  },
  {
    objectionKey: 'NEED_TO_THINK',
    buyerSaying: 'I need to think about it / Call me next month.',
    tacticalReply:
      'Absolutely take all the time you need. In the meantime, I will leave the interactive demo line active on your phone so your team can test emergency routing during tonight’s calls. If it works as smoothly as expected, we can lock in setup next week. Sound fair?',
    psychologicalLever: 'Risk reversal and live experiential proof.',
  },
  {
    objectionKey: 'CAN_YOU_DO_CHEAPER',
    buyerSaying: 'Can you do this cheaper / Discount the price?',
    tacticalReply:
      'Our standard package is $750 because it includes custom emergency dispatch logic, weekend triaging, and zero monthly platform lock-in. I do have a starter tier at $450 that covers voice call answering without custom CRM webhooks. Which tier aligns better with your goals?',
    psychologicalLever: 'Scope down rather than discounting the master offer.',
  },
  {
    objectionKey: 'ALREADY_HAVE_SOMEONE',
    buyerSaying: 'We already have someone handling this in-house.',
    tacticalReply:
      'Glad you already value call coverage! Out of curiosity, how does your team handle calls between 10:00 PM and 6:00 AM? Most of our clients switched because human dispatchers either go to voicemail or cost $3,000/mo on night shift. Happy to show you a side-by-side comparison.',
    psychologicalLever: 'Exposing the hidden operational gap (night shifts/weekends).',
  },
  {
    objectionKey: 'SEND_MORE_INFO',
    buyerSaying: 'Send me more info / Email me a brochure.',
    tacticalReply:
      'Here is the 1-page executive brief: https://trendly.io/decks/ai-voice-hvac-roi.pdf. The quickest way to evaluate is the live phone demo I already built for your company. Would a 3-minute test call on your cell phone work better?',
    psychologicalLever: 'Bypassing brochure brush-off to live product engagement.',
  },
];

export function generateInvoiceDraft(
  clientName: string,
  amount: number,
  type: 'ONE_TIME' | 'MONTHLY_RETAINER' = 'ONE_TIME'
): InvoiceDraft {
  return {
    id: `inv-${Date.now()}`,
    clientName,
    amount,
    type,
    terms: type === 'ONE_TIME' ? '50% upon contract authorization, 50% upon live SIP handover' : 'Monthly recurring auto-debit via Stripe',
    deliverablesIncluded: [
      'Turnkey AI Voice / Video Production Setup',
      'Full technical documentation and handover guide',
      'Direct priority Slack / Email support channel',
    ],
    stripePaymentLink: `https://buy.stripe.com/test_trendly_${amount}`,
  };
}