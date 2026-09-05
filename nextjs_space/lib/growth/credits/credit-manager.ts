export type UserTier = 'free' | 'pro' | 'elite';

export interface TierConfig {
  name: string;
  monthlyCredits: number;
  pricePerMonth: number;
  features: {
    novaText: boolean;
    novaVoiceMinutes: number;
    trendQueries: number;
    videoGenerations: number;
    customTasks: number;
  };
}

export const TIER_CONFIGS: Record<UserTier, TierConfig> = {
  free: {
    name: 'Free Starter',
    monthlyCredits: 100,
    pricePerMonth: 0,
    features: {
      novaText: true,
      novaVoiceMinutes: 0,
      trendQueries: 10,
      videoGenerations: 3,
      customTasks: 3,
    },
  },
  pro: {
    name: 'Pro Operator',
    monthlyCredits: 5000,
    pricePerMonth: 49,
    features: {
      novaText: true,
      novaVoiceMinutes: 100,
      trendQueries: 100,
      videoGenerations: 50,
      customTasks: 20,
    },
  },
  elite: {
    name: 'Elite Scaler',
    monthlyCredits: 25000,
    pricePerMonth: 197,
    features: {
      novaText: true,
      novaVoiceMinutes: 500,
      trendQueries: 500,
      videoGenerations: 250,
      customTasks: 100,
    },
  },
};

export type CreditAction =
  | 'NOVA_MESSAGE'
  | 'NOVA_VOICE_MINUTE'
  | 'TREND_SCOUT_QUERY'
  | 'VIDEO_GENERATION'
  | 'VIDEO_CLIPPING'
  | 'BUYER_DISCOVERY_BATCH'
  | 'OUTREACH_DRAFT'
  | 'SWARM_DEPLOYMENT';

export const ACTION_COSTS: Record<CreditAction, number> = {
  NOVA_MESSAGE: 2,
  NOVA_VOICE_MINUTE: 20,
  TREND_SCOUT_QUERY: 5,
  VIDEO_GENERATION: 25,
  VIDEO_CLIPPING: 15,
  BUYER_DISCOVERY_BATCH: 10,
  OUTREACH_DRAFT: 2,
  SWARM_DEPLOYMENT: 35,
};

export interface CreditAccount {
  userId: string;
  tier: UserTier;
  balance: number;
  monthlyAllocation: number;
  lifetimeUsed: number;
  emergencyLock: boolean;
  history: {
    id: string;
    action: CreditAction;
    amount: number;
    timestamp: string;
    description: string;
  }[];
}

// In-memory / Mock store fallback for fast client & server operation
const creditAccounts: Map<string, CreditAccount> = new Map();

export function getOrCreateCreditAccount(userId: string = 'default-user', tier: UserTier = 'free'): CreditAccount {
  if (!creditAccounts.has(userId)) {
    const config = TIER_CONFIGS[tier];
    creditAccounts.set(userId, {
      userId,
      tier,
      balance: config.monthlyCredits,
      monthlyAllocation: config.monthlyCredits,
      lifetimeUsed: 0,
      emergencyLock: false,
      history: [
        {
          id: `tx-init-${Date.now()}`,
          action: 'NOVA_MESSAGE',
          amount: 0,
          timestamp: new Date().toISOString(),
          description: `Initial monthly credit grant for ${config.name} (${config.monthlyCredits} credits)`,
        },
      ],
    });
  }
  return creditAccounts.get(userId)!;
}

export function verifyAndDeductCredits(
  userId: string = 'default-user',
  action: CreditAction,
  customDescription?: string
): { success: boolean; remainingBalance: number; cost: number; error?: string; warning?: string } {
  const account = getOrCreateCreditAccount(userId);
  const cost = ACTION_COSTS[action] || 1;

  if (account.emergencyLock) {
    return {
      success: false,
      remainingBalance: account.balance,
      cost,
      error: 'Platform emergency cost limit active. AI actions temporarily restricted by administrator.',
    };
  }

  if (account.balance < cost) {
    return {
      success: false,
      remainingBalance: account.balance,
      cost,
      error: `Insufficient credits. This action requires ${cost} credits, but you have ${account.balance} remaining. Please upgrade your tier.`,
    };
  }

  // Deduct
  account.balance -= cost;
  account.lifetimeUsed += cost;
  account.history.unshift({
    id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    action,
    amount: cost,
    timestamp: new Date().toISOString(),
    description: customDescription || `Executed ${action} (-${cost} credits)`,
  });

  // Keep max 50 items
  if (account.history.length > 50) {
    account.history = account.history.slice(0, 50);
  }

  const usageRatio = (account.monthlyAllocation - account.balance) / account.monthlyAllocation;
  let warning: string | undefined = undefined;
  if (usageRatio >= 0.8 && account.balance > 0) {
    warning = `Warning: You have used ${(usageRatio * 100).toFixed(0)}% of your monthly credits. (${account.balance} remaining)`;
  }

  return {
    success: true,
    remainingBalance: account.balance,
    cost,
    warning,
  };
}

export function getAdminCostOverview() {
  const accounts = Array.from(creditAccounts.values());
  const totalAllocated = accounts.reduce((acc, a) => acc + a.monthlyAllocation, 0);
  const totalUsed = accounts.reduce((acc, a) => acc + a.lifetimeUsed, 0);

  return {
    totalUsers: accounts.length || 1,
    totalCreditsAllocated: totalAllocated || 100,
    totalCreditsUsed: totalUsed,
    emergencyKillswitchActive: accounts.some((a) => a.emergencyLock),
    platformProviderSpendUSD: (totalUsed * 0.002).toFixed(2), // est $0.002 per credit
    breakdownByAction: {
      NOVA_MESSAGE: 140,
      TREND_SCOUT_QUERY: 85,
      VIDEO_GENERATION: 350,
      BUYER_DISCOVERY_BATCH: 120,
      OUTREACH_DRAFT: 40,
    },
  };
}

export function setEmergencyKillswitch(locked: boolean) {
  for (const account of creditAccounts.values()) {
    account.emergencyLock = locked;
  }
}