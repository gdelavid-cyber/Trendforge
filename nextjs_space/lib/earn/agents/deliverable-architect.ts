import { DeliverablePackage } from './types';

export function buildDeliverablePackage(
  type: 'AI_VOICE' | 'FACELESS_VIDEO' | 'GBP_PACK' | 'UGC_ADS' | 'CONTENT_MULTIPLICATION',
  clientName?: string
): DeliverablePackage {
  const client = clientName || 'Client Operations';

  switch (type) {
    case 'AI_VOICE':
      return {
        id: `del-voice-${Date.now()}`,
        title: 'Emergency HVAC Turnkey AI Voice Receptionist System',
        deliverableType: 'AI_VOICE',
        filesGenerated: [
          {
            name: 'vapi_receptionist_config.json',
            fileType: 'JSON Configuration',
            description: 'Vapi / Retell AI webhook routing and prompt configuration payload.',
          },
          {
            name: 'call_flow_architecture_diagram.pdf',
            fileType: 'System Architecture',
            description: 'Visual decision tree from incoming emergency call to technician SMS dispatch.',
          },
          {
            name: 'greeting_and_after_hours_scripts.md',
            fileType: 'Markdown Script',
            description: '3 situational caller scripts (Standard Night, Urgent Leak/Freezing, Billing).',
          },
          {
            name: 'client_roi_pitch_deck.pdf',
            fileType: 'Presentation Deck',
            description: '1-page quantitative calculation showing how capturing 2 night calls covers the setup cost.',
          },
        ],
        executiveBrief: `Configured specifically for ${client}. Replaces voicemail with instant 24/7 emergency triaging and SMS escalation.`,
        setupInstructions: [
          'Log in to Twilio or phone provider and set after-hours forward to the assigned AI SIP endpoint.',
          'Verify on-call technician phone number in vapi_receptionist_config.json line 42.',
          'Trigger test call using the provided interactive demo simulator.',
        ],
        clientPitchDeck: 'https://trendly.io/decks/ai-voice-hvac-roi.pdf',
        sampleAssetUrl: 'https://trendly.io/audio/samples/hvac-emergency-call-demo.mp3',
        qualityScore: 9.6,
      };

    case 'FACELESS_VIDEO':
      return {
        id: `del-video-${Date.now()}`,
        title: '20x Branded Short-Form Video Asset Package',
        deliverableType: 'FACELESS_VIDEO',
        filesGenerated: [
          {
            name: 'remotion_video_batch_bundle.zip',
            fileType: 'Archive / TSX',
            description: '20 high-retention 9:16 vertical video renders with animated kinetic captions.',
          },
          {
            name: '30_day_viral_content_calendar.csv',
            fileType: 'Spreadsheet Schedule',
            description: 'Optimized posting cadence for TikTok, Instagram Reels, and YouTube Shorts.',
          },
          {
            name: 'hook_framework_master_sheet.pdf',
            fileType: 'Strategy Guide',
            description: '3-second psychological retention hooks and audio track metadata.',
          },
        ],
        executiveBrief: `20 turnkey short-form videos tailored to ${client} with custom color grading and brand watermark.`,
        setupInstructions: [
          'Unzip video bundle to mobile device or scheduling suite (Metricool/Buffer).',
          'Copy pre-written descriptions and hashtags directly from the CSV.',
          'Post 1 video daily between 11:30 AM and 1:00 PM local time.',
        ],
        clientPitchDeck: 'https://trendly.io/decks/video-retainer-offer.pdf',
        sampleAssetUrl: 'https://trendly.io/preview/sample-video-render.mp4',
        qualityScore: 9.8,
      };

    case 'GBP_PACK':
      return {
        id: `del-gbp-${Date.now()}`,
        title: 'Google Business Profile AI Citation & Review Automation Pack',
        deliverableType: 'GBP_PACK',
        filesGenerated: [
          {
            name: 'gbp_profile_optimization_audit.pdf',
            fileType: 'Audit Report',
            description: 'Complete audit of primary categories, attributes, and geo-targeted service areas.',
          },
          {
            name: '30_prewritten_google_updates.docx',
            fileType: 'Content Pack',
            description: 'Weekly promotional and educational posts infused with local SEO keywords.',
          },
          {
            name: 'review_response_matrix.json',
            fileType: 'AI Prompt Matrix',
            description: 'Instant response formulas for 5-star praise and negative resolution scenarios.',
          },
        ],
        executiveBrief: `Local authority enhancement package designed to push ${client} into Google Maps 3-Pack rankings.`,
        setupInstructions: [
          'Paste optimized description into Google Business Profile Manager.',
          'Schedule 2 Google Updates weekly from the content pack.',
          'Set up automated review notification webhook.',
        ],
        clientPitchDeck: 'https://trendly.io/decks/gbp-local-seo-blueprint.pdf',
        sampleAssetUrl: 'https://trendly.io/samples/gbp-scorecard.pdf',
        qualityScore: 9.4,
      };

    case 'UGC_ADS':
      return {
        id: `del-ugc-${Date.now()}`,
        title: '10x Concept Direct-Response UGC Ad Bundle (30 Variations)',
        deliverableType: 'UGC_ADS',
        filesGenerated: [
          {
            name: '30_ugc_hook_variation_videos.zip',
            fileType: 'Video Bundle',
            description: '10 core product ad concepts with 3 hook variations each (curiosity, pain, social proof).',
          },
          {
            name: 'meta_tiktok_media_buyer_brief.pdf',
            fileType: 'Ad Ops Guide',
            description: 'Targeting suggestions, campaign naming conventions, and A/B test pacing.',
          },
        ],
        executiveBrief: `High-conversion video creative library engineered to decrease customer acquisition cost for ${client}.`,
        setupInstructions: [
          'Import videos into Meta Ads Manager creative hub.',
          'Launch dynamic creative test campaign with 3 hook variations per ad set.',
        ],
        clientPitchDeck: 'https://trendly.io/decks/ugc-performance-brief.pdf',
        sampleAssetUrl: 'https://trendly.io/preview/ugc-hook-sample.mp4',
        qualityScore: 9.7,
      };

    case 'CONTENT_MULTIPLICATION':
    default:
      return {
        id: `del-clipping-${Date.now()}`,
        title: '60x Viral Short-Form Clipping & Repurposing Package',
        deliverableType: 'CONTENT_MULTIPLICATION',
        filesGenerated: [
          {
            name: '60_repurposed_clips_master.zip',
            fileType: 'Master Video Archive',
            description: '60 curated clips extracted from source audio/video, reframed to 9:16 with animated subtitles.',
          },
          {
            name: 'viral_moment_scoring_index.csv',
            fileType: 'Data Log',
            description: 'Hook intensity scores, emotional velocity analysis, and topic classifications.',
          },
        ],
        executiveBrief: `Transformed 4 hours of raw content into 60 viral moments ready for 60 days of omni-channel distribution.`,
        setupInstructions: [
          'Upload top-ranked clips (scores 90+) to YouTube Shorts and TikTok first.',
          'Track 24-hour engagement to pick winning clips for paid boosting.',
        ],
        clientPitchDeck: 'https://trendly.io/decks/creator-clipping-retainer.pdf',
        sampleAssetUrl: 'https://trendly.io/preview/clipping-sample.mp4',
        qualityScore: 9.9,
      };
  }
}