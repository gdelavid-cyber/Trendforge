// lib/earn/unlocks.ts
// Progressive unlock engine for the Earn system.

export interface UserUnlockState {
  currentTier: 1 | 2 | 3 | 4;
  completedStep4Outreach: boolean;
  firstPaymentReceived: boolean;
  totalEarnings: number;
  unlockedFeatures: {
    guidedFlow: boolean;
    marketplaceListing: boolean;
    referrals: boolean;
    microSaas: boolean;
    advancedSalesAutomation: boolean;
    advancedLab: boolean; // Web4 agents & prediction markets
  };
}

export function computeUnlockState(
  totalEarnings: number = 0,
  completedStep4Outreach: boolean = false,
  firstPaymentReceived: boolean = false
): UserUnlockState {
  // Tier 1: Base / Step 1-4
  // Tier 2: Deliverable sent (Unlocks Marketplace & Referrals)
  // Tier 3: First payment received (Unlocks Micro-SaaS & Full-Auto Outreach)
  // Tier 4: $1,000+ earned (Unlocks Advanced Lab)

  const isTier4 = totalEarnings >= 1000;
  const isTier3 = isTier4 || firstPaymentReceived || totalEarnings > 0;
  const isTier2 = isTier3 || completedStep4Outreach;

  let currentTier: 1 | 2 | 3 | 4 = 1;
  if (isTier4) currentTier = 4;
  else if (isTier3) currentTier = 3;
  else if (isTier2) currentTier = 2;

  return {
    currentTier,
    completedStep4Outreach,
    firstPaymentReceived: firstPaymentReceived || totalEarnings > 0,
    totalEarnings,
    unlockedFeatures: {
      guidedFlow: true,
      marketplaceListing: isTier2,
      referrals: isTier2,
      microSaas: isTier3,
      advancedSalesAutomation: isTier3,
      advancedLab: isTier4,
    },
  };
}

export const LOCAL_STORAGE_FLOW_KEY = 'trendly_guided_earn_progress_v1';

export interface SavedFlowState {
  currentStep: number;
  selectedOpportunityId?: string;
  planApproved?: boolean;
  selectedBuyerIds?: string[];
  sentOutreachAt?: string;
}

export function loadSavedFlowState(): SavedFlowState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FLOW_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveFlowState(state: Partial<SavedFlowState>) {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadSavedFlowState() || { currentStep: 1 };
    const merged = { ...existing, ...state };
    localStorage.setItem(LOCAL_STORAGE_FLOW_KEY, JSON.stringify(merged));
  } catch (e) {
    console.warn('Failed to save flow state', e);
  }
}