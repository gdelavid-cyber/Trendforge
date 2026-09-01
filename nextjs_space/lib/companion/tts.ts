import { getVoicePresetById } from './voice-presets';

export interface TTSResponse {
  audioBase64?: string;
  audioUrl?: string;
  durationEstimate: number; // in seconds
  voiceId: string;
  provider: 'elevenlabs' | 'google' | 'browser_speech' | 'simulated';
}

export async function generateSpeechAudio(params: {
  text: string;
  voiceId?: string;
  archetype?: string;
}): Promise<TTSResponse> {
  const { text, voiceId } = params;
  const preset = getVoicePresetById(voiceId);
  const resolvedElevenLabsId = preset.elevenLabsVoiceId;
  
  // Clean special tags from spoken text
  const speechText = text
    .replace(/\[EMOTION:.*?\]/g, '')
    .replace(/\[EXECUTE_TOOL:.*?\]/g, '')
    .trim();

  // Estimate duration: average speech rate ~ 140 words/min => ~2.3 words/sec
  const wordCount = speechText.split(/\s+/).filter(Boolean).length;
  const durationEstimate = Math.max(1.2, Math.min(20, (wordCount / 2.3) + 0.4));

  const elevenLabsApiKey = process.env.TTS_API_KEY || process.env.ELEVENLABS_API_KEY;

  if (elevenLabsApiKey && elevenLabsApiKey !== 'your-tts-api-key') {
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${resolvedElevenLabsId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsApiKey,
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: speechText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.4,
            use_speaker_boost: true,
          },
        }),
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        return {
          audioBase64: `data:audio/mpeg;base64,${base64}`,
          durationEstimate,
          voiceId: preset.id,
          provider: 'elevenlabs',
        };
      } else {
        console.warn('[TTS] ElevenLabs responded with status:', response.status);
      }
    } catch (err: any) {
      console.error('[TTS] ElevenLabs error, falling back:', err.message);
    }
  }

  // Graceful browser-supported fallback format
  return {
    durationEstimate,
    voiceId: preset.id,
    provider: 'browser_speech',
  };
}
