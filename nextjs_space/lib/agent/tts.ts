/**
 * Trendly Web4 - Text-To-Speech (TTS) Engine
 * Integrates ElevenLabs API, Google TTS, and browser Web Speech audio fallback.
 */

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
  const { text, voiceId = '21m00Tcm4TlvDq8ikWAM' } = params;
  
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
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
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
          voiceId,
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
    voiceId,
    provider: 'browser_speech',
  };
}
