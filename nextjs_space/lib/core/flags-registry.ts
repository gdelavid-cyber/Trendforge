export interface FeatureFlag {
  name: string;
  enabled: boolean;
  phase: number;
  description: string;
}

export const INITIAL_FLAGS: Record<string, FeatureFlag> = {
  // Phase 1 Active Flags
  nova_enabled: {
    name: 'nova_enabled',
    enabled: true,
    phase: 1,
    description: 'Persistent 24/7 Nova AI Assistant (Text chat only)',
  },
  earn_video_empire_enabled: {
    name: 'earn_video_empire_enabled',
    enabled: true,
    phase: 1,
    description: 'Video Empire pathway in Earn section',
  },
  video_empire_play_1_enabled: {
    name: 'video_empire_play_1_enabled',
    enabled: true,
    phase: 1,
    description: 'Play 1: Local Business Video Packages',
  },
  ai_swarm_enabled: {
    name: 'ai_swarm_enabled',
    enabled: true,
    phase: 1,
    description: 'Deploy AI Swarm button and brainstorm chamber',
  },
  sales_pipeline_enabled: {
    name: 'sales_pipeline_enabled',
    enabled: true,
    phase: 1,
    description: 'Sales pipeline with manual-only sending mode',
  },

  // Phase 2 Flags (Disabled in Phase 1)
  nova_voice_enabled: {
    name: 'nova_voice_enabled',
    enabled: false,
    phase: 2,
    description: 'Nova Fable 5.1 voice audio synthesizer',
  },
  nova_chassis_customization_enabled: {
    name: 'nova_chassis_customization_enabled',
    enabled: false,
    phase: 2,
    description: '8 custom chassis themes and color controls',
  },
  video_empire_play_2_enabled: {
    name: 'video_empire_play_2_enabled',
    enabled: false,
    phase: 2,
    description: 'Play 2: Creator Clipping Service',
  },

  // Phase 3 Flags
  earn_quick_wins_enabled: {
    name: 'earn_quick_wins_enabled',
    enabled: false,
    phase: 3,
    description: 'Full Quick Wins column with all 3 deliverables',
  },
  earn_automated_assets_enabled: {
    name: 'earn_automated_assets_enabled',
    enabled: false,
    phase: 3,
    description: 'Marketplace assets and referral program',
  },

  // Phase 4 & 5
  council_system_enabled: {
    name: 'council_system_enabled',
    enabled: false,
    phase: 4,
    description: 'Weekly Council agent brainstorm sessions',
  },
  web4_wallets_enabled: {
    name: 'web4_wallets_enabled',
    enabled: false,
    phase: 5,
    description: 'Web4 autonomous wallets (requires legal review)',
  },
};

const flagStore: Map<string, FeatureFlag> = new Map(Object.entries(INITIAL_FLAGS));

export function isFeatureEnabled(flagName: string): boolean {
  const flag = flagStore.get(flagName);
  return flag ? flag.enabled : false;
}

export function getAllFeatureFlags(): FeatureFlag[] {
  return Array.from(flagStore.values());
}

export function setFeatureFlag(flagName: string, enabled: boolean): boolean {
  const flag = flagStore.get(flagName);
  if (flag) {
    flag.enabled = enabled;
    return true;
  }
  return false;
}