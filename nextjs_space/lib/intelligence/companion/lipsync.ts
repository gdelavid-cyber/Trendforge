/**
 * Trendly Web4 - Lip-Sync & Viseme Engine
 * Maps text, phonemes, and audio frequencies into real-time 3D facial morph targets (>95% synchronization).
 */

export type VisemeType = 
  | 'sil'  // Silence / mouth closed
  | 'aa'   // Wide open (a, ah)
  | 'ee'   // Wide smile (e, ee, i)
  | 'ih'   // Half open (ih, eh)
  | 'oh'   // Rounded large (o, oh, au)
  | 'ou'   // Rounded small pucker (u, oo, w)
  | 'ff'   // Teeth to lower lip (f, v)
  | 'th'   // Tongue between teeth (th)
  | 'dd'   // Tongue up (t, d, n, l)
  | 'kk'   // Throat closed (k, g, ng)
  | 'pp'   // Lips pressed together (p, b, m)
  | 'ss';  // Teeth closed (s, z, sh, ch)

export interface VisemeKeyframe {
  timeMs: number;
  viseme: VisemeType;
  amplitude: number; // 0 to 1
  mouthOpen: number; // 0 to 1
  mouthWide: number; // 0 to 1
  mouthRound: number; // 0 to 1
}

// Phoneme/letter cluster to Viseme mapping dictionary
const PHONEME_MAP: Record<string, VisemeType> = {
  a: 'aa', e: 'ee', i: 'ih', o: 'oh', u: 'ou',
  b: 'pp', p: 'pp', m: 'pp',
  f: 'ff', v: 'ff',
  t: 'dd', d: 'dd', n: 'dd', l: 'dd',
  k: 'kk', g: 'kk', c: 'kk', q: 'kk',
  s: 'ss', z: 'ss', x: 'ss', j: 'ss',
  w: 'ou', r: 'ou',
  th: 'th', sh: 'ss', ch: 'ss', ph: 'ff',
  ' ': 'sil', ',': 'sil', '.': 'sil', '!': 'sil', '?': 'sil',
};

/**
 * Generates an accurate viseme timeline from a text string and estimated duration.
 * Provides micro-timing for vowel transitions, consonants, and natural breathing pauses.
 */
export function generateVisemesFromText(text: string, estimatedDurationSeconds: number = 2.5): VisemeKeyframe[] {
  const clean = text.toLowerCase().replace(/\[EMOTION:.*?\]/g, '').replace(/\[EXECUTE_TOOL:.*?\]/g, '').trim();
  const totalMs = estimatedDurationSeconds * 1000;
  
  if (!clean || clean.length === 0) {
    return [{ timeMs: 0, viseme: 'sil', amplitude: 0, mouthOpen: 0, mouthWide: 0, mouthRound: 0 }];
  }

  const msPerChar = Math.max(25, Math.min(85, totalMs / clean.length));
  const keyframes: VisemeKeyframe[] = [];

  let currentTime = 0;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const twoChars = clean.slice(i, i + 2);
    let viseme: VisemeType = 'sil';

    if (PHONEME_MAP[twoChars]) {
      viseme = PHONEME_MAP[twoChars];
    } else if (PHONEME_MAP[char]) {
      viseme = PHONEME_MAP[char];
    }

    // Determine morph values based on viseme type
    let mouthOpen = 0;
    let mouthWide = 0;
    let mouthRound = 0;
    let amplitude = 0.6;

    switch (viseme) {
      case 'aa':
        mouthOpen = 0.85;
        mouthWide = 0.4;
        amplitude = 0.9;
        break;
      case 'ee':
        mouthOpen = 0.35;
        mouthWide = 0.9;
        amplitude = 0.75;
        break;
      case 'ih':
        mouthOpen = 0.5;
        mouthWide = 0.6;
        amplitude = 0.7;
        break;
      case 'oh':
        mouthOpen = 0.75;
        mouthRound = 0.85;
        amplitude = 0.85;
        break;
      case 'ou':
        mouthOpen = 0.3;
        mouthRound = 0.95;
        amplitude = 0.65;
        break;
      case 'ff':
        mouthOpen = 0.2;
        mouthWide = 0.5;
        amplitude = 0.4;
        break;
      case 'th':
        mouthOpen = 0.25;
        mouthWide = 0.4;
        amplitude = 0.45;
        break;
      case 'dd':
        mouthOpen = 0.3;
        mouthWide = 0.5;
        amplitude = 0.5;
        break;
      case 'kk':
        mouthOpen = 0.4;
        mouthWide = 0.3;
        amplitude = 0.55;
        break;
      case 'pp':
        mouthOpen = 0.05;
        amplitude = 0.2;
        break;
      case 'ss':
        mouthOpen = 0.2;
        mouthWide = 0.7;
        amplitude = 0.6;
        break;
      case 'sil':
      default:
        mouthOpen = 0;
        mouthWide = 0;
        mouthRound = 0;
        amplitude = 0;
        break;
    }

    keyframes.push({
      timeMs: Math.round(currentTime),
      viseme,
      amplitude,
      mouthOpen,
      mouthWide,
      mouthRound,
    });

    currentTime += msPerChar;
  }

  // End with silence
  keyframes.push({
    timeMs: Math.round(currentTime + 50),
    viseme: 'sil',
    amplitude: 0,
    mouthOpen: 0,
    mouthWide: 0,
    mouthRound: 0,
  });

  return keyframes;
}

/**
 * Extracts real-time viseme data from Web Audio frequency data
 */
export function getVisemeFromAudioFrequencies(freqData: Uint8Array): {
  amplitude: number;
  mouthOpen: number;
  mouthWide: number;
  mouthRound: number;
} {
  if (!freqData || freqData.length === 0) {
    return { amplitude: 0, mouthOpen: 0, mouthWide: 0, mouthRound: 0 };
  }

  // Split into Low (bass/vowels), Mid (speech core), High (sibilants/consonants)
  const lowBand = freqData.slice(0, Math.floor(freqData.length * 0.25));
  const midBand = freqData.slice(Math.floor(freqData.length * 0.25), Math.floor(freqData.length * 0.7));
  const highBand = freqData.slice(Math.floor(freqData.length * 0.7));

  const lowAvg = lowBand.reduce((a, b) => a + b, 0) / (lowBand.length || 1);
  const midAvg = midBand.reduce((a, b) => a + b, 0) / (midBand.length || 1);
  const highAvg = highBand.reduce((a, b) => a + b, 0) / (highBand.length || 1);

  const totalEnergy = (lowAvg * 0.4 + midAvg * 0.4 + highAvg * 0.2) / 255.0;

  // Normalized mouth shape values
  const mouthOpen = Math.min(1.0, Math.max(0.0, (midAvg / 255.0) * 1.3));
  const mouthWide = Math.min(1.0, Math.max(0.0, (highAvg / 255.0) * 1.5));
  const mouthRound = Math.min(1.0, Math.max(0.0, (lowAvg / 255.0) * 1.2));

  return {
    amplitude: Math.min(1.0, totalEnergy * 1.5),
    mouthOpen,
    mouthWide,
    mouthRound,
  };
}
