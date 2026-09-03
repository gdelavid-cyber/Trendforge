import { OutreachFramework, OutreachMessage, QualifiedBuyer } from './types';

export function composeOutreachMessage(
  buyer: QualifiedBuyer,
  framework: OutreachFramework = 'FREE_SAMPLE',
  sampleUrl: string = 'https://trendly.io/preview/sample-demo'
): OutreachMessage {
  let subject = '';
  let body = '';

  if (framework === 'FREE_SAMPLE') {
    subject = `Made something for ${buyer.organization}`;
    body = `Hi ${buyer.name},\n\nI noticed ${buyer.signals[0] || 'your team is scaling active client services'}.\n\nSo I put together a turnkey implementation for ${buyer.organization}. Completely free for you to test — here is the interactive preview link:\n\n${sampleUrl}\n\nIf you like how it works and want us to connect it to your live line, we handle full setup and support for ${buyer.recommendedPrice}. If not, keep the assets with zero obligation.\n\nEither way, keep crushing the great work with your team.\n\nBest,\n[Your Name]`;
  } else if (framework === 'PAIN_MIRROR') {
    subject = `Quick operational question for ${buyer.organization}`;
    body = `Hi ${buyer.name},\n\n${buyer.personalizedHook}\n\nWe recently helped a similar trade business eliminate their after-hours missed call rate entirely, recovering an estimated $4,200 in monthly dispatch tickets.\n\nWould it be worth a brief 10-minute walkthrough to inspect the demo and see if the same approach works for ${buyer.organization}?\n\nZero sales pitch — just showing you the technical setup.\n\nBest,\n[Your Name]`;
  } else {
    // SOCIAL_PROOF
    subject = `New automated standard in ${buyer.location || 'your market'}`;
    body = `Hi ${buyer.name},\n\nThree leading regional operators in your space switched to our automated dispatch and video infrastructure this month.\n\nOne client went from losing 4 night calls weekly to a 100% emergency response rate within 48 hours of setup.\n\nWe have 2 onboarding slots open for this month. Would you like me to send over the 60-second interactive demo link for ${buyer.organization}?\n\nBest,\n[Your Name]`;
  }

  // Format by channel if needed
  if (buyer.contact.channel === 'X DM') {
    body = `Hey ${buyer.name}, saw your work at ${buyer.organization}. Made a turnkey preview demo for your team: ${sampleUrl}. If you want us to set it up live, it's ${buyer.recommendedPrice}. Enjoy the assets!`;
  } else if (buyer.contact.channel === 'Instagram DM') {
    body = `Hey ${buyer.name}! Saw your latest post. Put together a free sample preview for ${buyer.organization}: ${sampleUrl}. No obligation at all — let me know what you think!`;
  }

  const followUpCadence = [
    {
      day: 0,
      action: 'Initial Outreach',
      message: 'Deliver customized pitch with direct interactive sample link.',
    },
    {
      day: 2,
      action: 'Follow-Up #1 (Sample Check)',
      message: `Hi ${buyer.name}, just making sure the interactive demo link came through cleanly: ${sampleUrl}. Did you have a moment to test it?`,
    },
    {
      day: 5,
      action: 'Follow-Up #2 (Value Add / Case Study)',
      message: `Hi ${buyer.name}, quick note — we just published the ROI breakdown showing how a contractor recovered $4,200/mo using this exact setup. Happy to forward the 1-page PDF if you'd like to inspect it.`,
    },
    {
      day: 10,
      action: 'Follow-Up #3 (Soft Close / Availability)',
      message: `Hi ${buyer.name}, we are locking in our implementation slots for this week. If you'd like us to configure this for ${buyer.organization}, let me know and I will hold your onboarding slot.`,
    },
    {
      day: 21,
      action: 'Final Follow-Up (Door Open)',
      message: `Hi ${buyer.name}, assuming your dispatch is fully covered for now. I'll leave the demo link active for your team in case you ever want to revisit. All the best!`,
    },
  ];

  return {
    id: `msg-${buyer.id}-${Date.now()}`,
    buyerId: buyer.id,
    framework,
    channel: buyer.contact.channel,
    subject,
    body,
    followUpCadence,
    approved: false,
  };
}