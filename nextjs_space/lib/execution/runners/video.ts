import type { LlmFn } from '../skills';
import type { ParsedStep } from '@/lib/pipeline/steps';

export interface VideoStepParams {
  step: ParsedStep;
  taskTitle: string;
  previousResults: string[];
  llm: LlmFn;
}

export interface VideoScene {
  sceneNumber: number;
  durationSec: number;
  visualDescription: string;
  voiceover: string;
  onScreenText: string;
}

export interface VideoStepResult {
  title: string;
  format: 'TIKTOK_9_16' | 'YOUTUBE_SHORTS' | 'INSTAGRAM_REELS';
  hook: string;
  scenes: VideoScene[];
  caption: string;
  hashtags: string[];
  estimatedViewsPotential: string;
  output: string;
}

export async function runVideoStep({
  step,
  taskTitle,
  previousResults,
  llm,
}: VideoStepParams): Promise<VideoStepResult> {
  const context = previousResults.length
    ? `Task Context & Previous Progress:\n${previousResults.map((r, i) => `Step ${i + 1}: ${r}`).join('\n\n')}`
    : 'No previous step results available.';

  const prompt = `You are a viral short-form video director and AI content producer executing: "${taskTitle}".
Current Step (${step.action}): "${step.title}"
Step Description: ${step.description}

${context}

Create a complete, high-retention viral 9:16 video storyboard & script optimized for TikTok / YouTube Shorts / Reels.
Format your output as clean JSON matching this exact structure (do NOT include markdown backticks or any extra text):
{
  "title": "Compelling Video Title",
  "format": "TIKTOK_9_16",
  "hook": "First 3-second visual and audio pattern interrupt hook",
  "scenes": [
    {
      "sceneNumber": 1,
      "durationSec": 3,
      "visualDescription": "Fast-paced screen capture or stylized cyber visual",
      "voiceover": "Spoken hook sentence",
      "onScreenText": "BOLD TEXT OVERLAY"
    },
    {
      "sceneNumber": 2,
      "durationSec": 12,
      "visualDescription": "Demonstration of the workflow/proof breakdown",
      "voiceover": "Explaining the breakthrough monetization insight",
      "onScreenText": "THE SECRET FORMULA"
    },
    {
      "sceneNumber": 3,
      "durationSec": 8,
      "visualDescription": "Call to action with live proof receipts",
      "voiceover": "Clear call to action to comment or click link",
      "onScreenText": "COMMENT 'FORGE' FOR ACCESS"
    }
  ],
  "caption": "Viral post description text with curiosity loop",
  "hashtags": ["#AIHustle", "#Trendly", "#Web4", "#Automation", "#PassiveIncome"],
  "estimatedViewsPotential": "50k - 250k"
}`;

  const raw = await llm([
    {
      role: 'system',
      content: 'You are an elite short-form video scriptwriter and viral content director. Output strictly valid JSON without markdown fences.',
    },
    { role: 'user', content: prompt },
  ]);

  let parsed: any;
  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = {
      title: step.title,
      format: 'TIKTOK_9_16',
      hook: 'Watch how an autonomous AI just built a full revenue stream in under 60 seconds.',
      scenes: [
        {
          sceneNumber: 1,
          durationSec: 4,
          visualDescription: 'Fast zoom on terminal code stream with revenue counter popping',
          voiceover: 'Stop wasting hours doing manual work when AI swarms can do it 10x faster.',
          onScreenText: 'STOP DOING THIS MANUALLY 🛑',
        },
        {
          sceneNumber: 2,
          durationSec: 15,
          visualDescription: 'Split screen showing live scraping and automated client deliverable',
          voiceover: 'Here is the exact step-by-step breakdown you can replicate right now.',
          onScreenText: 'STEP 1: AUTONOMOUS RADAR',
        },
        {
          sceneNumber: 3,
          durationSec: 6,
          visualDescription: 'Final proof card showing completed output deliverable',
          voiceover: 'Deploy your companion and get the receipts today.',
          onScreenText: 'GET THE BLUEPRINT ⚡',
        },
      ],
      caption: `How autonomous AI agents are revolutionizing monetization workflows. Full blueprint inside. 🚀`,
      hashtags: ['#Trendly', '#AIAutomation', '#Web4', '#Productivity'],
      estimatedViewsPotential: '25k - 100k',
    };
  }

  const scenes: VideoScene[] = Array.isArray(parsed.scenes) ? parsed.scenes : [];
  const scenesText = scenes
    .map(
      (s) =>
        `**Scene ${s.sceneNumber} (${s.durationSec}s):**\n- 🎬 *Visual:* ${s.visualDescription}\n- 🗣️ *Voiceover:* "${s.voiceover}"\n- 💬 *Overlay:* \`${s.onScreenText}\``
    )
    .join('\n\n');

  const summaryOutput = `🎬 **Viral Video Production Package (9:16 Shorts/TikTok)**\n\n**Title:** ${parsed.title || step.title}\n**Hook:** "${parsed.hook}"\n\n### Storyboard & Script:\n${scenesText}\n\n**Post Caption:**\n${parsed.caption}\n\n**Hashtags:** ${Array.isArray(parsed.hashtags) ? parsed.hashtags.join(' ') : '#Trendly #AI'}`;

  return {
    title: parsed.title || step.title,
    format: parsed.format || 'TIKTOK_9_16',
    hook: parsed.hook || '',
    scenes,
    caption: parsed.caption || '',
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
    estimatedViewsPotential: parsed.estimatedViewsPotential || '25k+',
    output: summaryOutput,
  };
}
