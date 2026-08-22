import { NextRequest, NextResponse } from 'next/server';
import { generateSpeechAudio } from '@/lib/agent/tts';
import { generateVisemesFromText } from '@/lib/agent/lipsync';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text') || 'Hello! I am your sovereign Web4 companion.';
    const voiceId = searchParams.get('voiceId') || '21m00Tcm4TlvDq8ikWAM';
    const archetype = searchParams.get('archetype') || 'CYBER_HUMANOID';

    const speech = await generateSpeechAudio({ text, voiceId, archetype });
    const lipSync = generateVisemesFromText(text, speech.durationEstimate);

    return NextResponse.json({
      success: true,
      audioBase64: speech.audioBase64,
      provider: speech.provider,
      durationEstimate: speech.durationEstimate,
      lipSync,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate voice' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, voiceId, archetype } = body;

    if (!text) {
      return NextResponse.json({ error: 'Missing text parameter' }, { status: 400 });
    }

    const speech = await generateSpeechAudio({ text, voiceId, archetype });
    const lipSync = generateVisemesFromText(text, speech.durationEstimate);

    return NextResponse.json({
      success: true,
      audioBase64: speech.audioBase64,
      provider: speech.provider,
      durationEstimate: speech.durationEstimate,
      lipSync,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate voice stream' }, { status: 500 });
  }
}
