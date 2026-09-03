import { VideoClipCandidate } from './types';

export function analyzeVideoClipCandidate(
  sourceUrl: string,
  targetNiche: string
): VideoClipCandidate[] {
  return [
    {
      id: 'clip-1',
      sourceTimestamp: '04:12 - 04:47',
      durationSeconds: 35,
      hookText: 'Most entrepreneurs waste 40 hours a week on this single mistake...',
      viralScore: 96,
      captionStyle: 'Hormozi',
      aspectRatio: '9:16',
      previewUrl: 'https://trendly.io/preview/sample-clip-1.mp4',
    },
    {
      id: 'clip-2',
      sourceTimestamp: '18:30 - 19:15',
      durationSeconds: 45,
      hookText: 'Why Wall Street is secretly accumulating cash in 2026...',
      viralScore: 92,
      captionStyle: 'MrBeast',
      aspectRatio: '9:16',
      previewUrl: 'https://trendly.io/preview/sample-clip-2.mp4',
    },
    {
      id: 'clip-3',
      sourceTimestamp: '32:05 - 32:50',
      durationSeconds: 45,
      hookText: 'The exact cold email script that booked $48,000 in retainers...',
      viralScore: 94,
      captionStyle: 'Hormozi',
      aspectRatio: '9:16',
      previewUrl: 'https://trendly.io/preview/sample-clip-3.mp4',
    },
    {
      id: 'clip-4',
      sourceTimestamp: '45:10 - 45:40',
      durationSeconds: 30,
      hookText: 'If you have $5,000 in the bank, do NOT start with ads...',
      viralScore: 89,
      captionStyle: 'Minimal',
      aspectRatio: '9:16',
      previewUrl: 'https://trendly.io/preview/sample-clip-4.mp4',
    },
  ];
}

export function getProductionParameters(playName: string) {
  return {
    outputResolution: '1080x1920 (9:16 Vertical)',
    audioSampleRate: '48kHz Stereo ElevenLabs Voice',
    subtitleEngine: 'Word-by-word kinetic animation',
    renderEngine: 'Remotion TSX WebAssembly Canvas',
    averageRenderTimeSeconds: 12,
  };
}