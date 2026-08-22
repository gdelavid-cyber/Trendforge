/**
 * Trendly Web4 - Speech-To-Text (STT) Engine
 * Normalizes speech input, voice transcripts, and audio queries.
 */

export interface STTResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  detectedLanguage?: string;
}

export function normalizeSpeechTranscript(rawTranscript: string): string {
  if (!rawTranscript) return '';
  
  let clean = rawTranscript.trim();
  
  // Normalize common Web4 / crypto speech misheard terms
  const termsMap: Record<string, string> = {
    'web for': 'Web4',
    'web four': 'Web4',
    'poly market': 'Polymarket',
    'poly-market': 'Polymarket',
    'micro sas': 'Micro-SaaS',
    'micro-sas': 'Micro-SaaS',
    'open claw': 'OpenClaw',
    'open-claw': 'OpenClaw',
    'reddit scraper': 'Reddit scraper',
    'u s d c': 'USDC',
    'usdc': 'USDC',
  };

  for (const [misheard, corrected] of Object.entries(termsMap)) {
    const regex = new RegExp(`\\b${misheard}\\b`, 'gi');
    clean = clean.replace(regex, corrected);
  }

  return clean;
}
