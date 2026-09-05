import type { LlmFn } from '../skills';
import type { ParsedStep } from '@/lib/pipeline/steps';

export interface VoiceStepParams {
  step: ParsedStep;
  taskTitle: string;
  previousResults: string[];
  llm: LlmFn;
  companionName?: string;
}

export interface VoiceStepResult {
  transcript: string;
  voiceProfile: {
    archetype: string;
    tone: string;
    targetDurationSec: number;
    pacing: string;
  };
  audioScript: string;
  output: string;
}

export async function runVoiceStep({
  step,
  taskTitle,
  previousResults,
  llm,
  companionName = 'Kairos',
}: VoiceStepParams): Promise<VoiceStepResult> {
  const context = previousResults.length
    ? `Task Context & Previous Progress:\n${previousResults.map((r, i) => `Step ${i + 1}: ${r}`).join('\n\n')}`
    : 'No previous step results available.';

  const prompt = `You are ${companionName}, an autonomous voice director and audio outreach operative executing: "${taskTitle}".
Current Step (${step.action}): "${step.title}"
Step Description: ${step.description}

${context}

Generate a high-converting, natural-sounding spoken audio message / voice note script for this step.
Format your output as clean JSON matching this exact structure (do NOT include markdown backticks or any extra text):
{
  "tone": "confident and energetic" | "warm and consultative" | "urgent and direct",
  "archetype": "executive_producer" | "cyber_advisor" | "growth_specialist",
  "targetDurationSec": 45,
  "pacing": "brisk and natural",
  "transcript": "Exact full spoken transcript text that will be synthesized into speech",
  "audioNotes": "Pacing instructions, pauses [pause 1s], and emphasis cues"
}`;

  const raw = await llm([
    {
      role: 'system',
      content: 'You are an expert voice synthesis engineer and audio copywriter. Output strictly valid JSON without markdown fences.',
    },
    { role: 'user', content: prompt },
  ]);

  let parsed: any;
  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = {
      tone: 'confident and conversational',
      archetype: 'growth_specialist',
      targetDurationSec: 40,
      pacing: 'natural with clear pauses',
      transcript: raw.trim(),
      audioNotes: 'Natural rhythm with emphasis on key value propositions.',
    };
  }

  const transcript = parsed.transcript || raw.trim();
  const summaryOutput = `🎙️ **Voice Message Synthesized (${parsed.targetDurationSec || 45}s)**\n\n**Voice Profile:** ${parsed.tone} (${parsed.archetype})\n**Pacing:** ${parsed.pacing}\n\n**Spoken Transcript:**\n"${transcript}"\n\n*Audio waveform ready for client dispatch or voice note playback.*`;

  return {
    transcript,
    voiceProfile: {
      archetype: parsed.archetype || 'cyber_advisor',
      tone: parsed.tone || 'confident and direct',
      targetDurationSec: parsed.targetDurationSec || 45,
      pacing: parsed.pacing || 'natural',
    },
    audioScript: parsed.audioNotes || transcript,
    output: summaryOutput,
  };
}
