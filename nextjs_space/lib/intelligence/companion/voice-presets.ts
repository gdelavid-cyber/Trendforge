/**
 * Trendly Web4 - 5 Professional Neural Voice Engine Presets
 * Highly calibrated for maximum realism, natural prosody, and executive clarity.
 */

export interface VoicePreset {
  id: string;
  name: string;
  codename: string;
  gender: 'Female' | 'Male' | 'Synthetic';
  tone: string;
  elevenLabsVoiceId: string;
  pitch: number;
  rate: number;
  description: string;
  sampleText: string;
  tags: string[];
  preferredSystemVoices: string[];
}

export const VOICE_PRESETS: VoicePreset[] = [
  {
    id: 'nova_executive',
    name: 'Nova',
    codename: 'Executive AI Strategist',
    gender: 'Female',
    tone: 'Crisp, articulate & authoritative',
    elevenLabsVoiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel / Neural Pro
    pitch: 1.0,
    rate: 1.02,
    description: 'Polished executive voice designed for strategic market intel, business execution, and high-stakes decision making.',
    sampleText: 'Welcome to the execution layer. All autonomous agent pipelines are synchronized and operating at peak efficiency.',
    tags: ['Executive', 'Clarity', 'Strategic'],
    preferredSystemVoices: [
      'Google US English',
      'Microsoft Jenny Online (Natural)',
      'Microsoft Jenny',
      'Samantha',
      'Victoria',
      'en-US-Standard-C',
    ],
  },
  {
    id: 'nexus_sentinel',
    name: 'Nexus',
    codename: 'Deep Tech Sentinel',
    gender: 'Male',
    tone: 'Deep, resonant & commanding baritone',
    elevenLabsVoiceId: 'VR6AewLTigWG4xSOukaG', // Arnold / Deep Neural
    pitch: 0.72,
    rate: 0.96,
    description: 'Calm baritone authority tailored for financial telemetry, high-frequency arbitrage, and sovereign data systems.',
    sampleText: 'Market telemetry verified. Sovereign capital positions are locked and autonomous risk thresholds remain optimal.',
    tags: ['Baritone', 'Commanding', 'Crypto / DeFi'],
    preferredSystemVoices: [
      'Microsoft Guy Online (Natural)',
      'Microsoft Guy',
      'Google UK English Male',
      'Daniel',
      'Alex',
      'en-US-Standard-D',
    ],
  },
  {
    id: 'solaris_visionary',
    name: 'Solaris',
    codename: 'Charismatic Innovator',
    gender: 'Female',
    tone: 'Vibrant, engaging & persuasive',
    elevenLabsVoiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella / Dynamic
    pitch: 1.12,
    rate: 1.06,
    description: 'Dynamic, warm, and highly expressive narration perfect for viral growth campaigns, creator workflows, and social expansion.',
    sampleText: 'Viral sentiment is spiking across three major platforms. I have prepared your multi-channel deployment script.',
    tags: ['Charismatic', 'Viral Creator', 'Engaging'],
    preferredSystemVoices: [
      'Google US English Female',
      'Microsoft Aria Online (Natural)',
      'Microsoft Aria',
      'Karen',
      'Moira',
      'en-US-Standard-F',
    ],
  },
  {
    id: 'aether_quantum',
    name: 'Aether',
    codename: 'Ethereal Quantum Mind',
    gender: 'Synthetic',
    tone: 'Sleek, futuristic & hyper-precise',
    elevenLabsVoiceId: 'AZnzlk1XvdvUeBnXmlld', // Domi / Precision
    pitch: 0.92,
    rate: 0.98,
    description: 'Ultra-clean, crystalline neural voice engineered for deep research parsing, dark data mining, and technical synthesis.',
    sampleText: 'Quantum computational matrix initialized. Processing multi-threaded data signals across global endpoints.',
    tags: ['Futuristic', 'Precision', 'Analytical'],
    preferredSystemVoices: [
      'Google UK English Female',
      'Microsoft Sonia Online (Natural)',
      'Microsoft Zira',
      'Tessa',
      'en-GB-Standard-A',
    ],
  },
  {
    id: 'titan_apex',
    name: 'Titan',
    codename: 'Heavy Mecha Commander',
    gender: 'Male',
    tone: 'Heavy, tactical & battle-hardened',
    elevenLabsVoiceId: 'TxGEqnHWrfWFTfGW9XjX', // Josh / Tactical
    pitch: 0.62,
    rate: 0.92,
    description: 'Heavy tactical bass with military precision, built for multi-agent swarm coordination and automated mission execution.',
    sampleText: 'All task execution nodes active. Swarm coordination protocols deployed. Awaiting operator authorization.',
    tags: ['Tactical', 'Bass', 'Swarm Commander'],
    preferredSystemVoices: [
      'Microsoft Ryan Online (Natural)',
      'Google UK English Male',
      'Microsoft David',
      'Fred',
      'en-US-Standard-B',
    ],
  },
];

export function getVoicePresetById(voiceId?: string): VoicePreset {
  if (!voiceId) return VOICE_PRESETS[0];
  const found = VOICE_PRESETS.find(
    (v) => v.id === voiceId || v.elevenLabsVoiceId === voiceId || v.name.toLowerCase() === voiceId.toLowerCase()
  );
  return found || VOICE_PRESETS[0];
}
