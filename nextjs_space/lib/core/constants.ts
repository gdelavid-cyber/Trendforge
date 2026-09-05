export const TREND_CATEGORIES = [
  { value: 'AGENT_ECONOMY', label: 'Agent Economy', color: '#8B5CF6' },
  { value: 'AI_CONTENT', label: 'AI Content', color: '#3B82F6' },
  { value: 'AI_TOOLS', label: 'AI Tools', color: '#06B6D4' },
  { value: 'CRYPTO_FINANCE', label: 'Crypto & Finance', color: '#F59E0B' },
  { value: 'LOCAL_SERVICES', label: 'Local Services', color: '#10B981' },
  { value: 'ECOMMERCE', label: 'E-Commerce', color: '#EC4899' },
  { value: 'EDUCATION', label: 'Education', color: '#6366F1' },
  { value: 'HARDWARE', label: 'Hardware', color: '#EF4444' },
  { value: 'DATA_SCIENCE', label: 'Data Science', color: '#14B8A6' },
  { value: 'OTHER', label: 'Other', color: '#6B7280' },
] as const;

export const DIFFICULTY_CONFIG = {
  ZERO: { label: 'Zero Cost', color: '#A855F7', bg: 'bg-purple-500/20', text: 'text-purple-400' },
  LOW: { label: 'Low', color: '#3B82F6', bg: 'bg-blue-500/20', text: 'text-blue-400' },
  MEDIUM: { label: 'Medium', color: '#F59E0B', bg: 'bg-amber-500/20', text: 'text-amber-400' },
  HIGH: { label: 'High', color: '#EF4444', bg: 'bg-red-500/20', text: 'text-red-400' },
} as const;

export const RISK_CONFIG = {
  LOW: { label: 'Low Risk', color: '#22C55E', bg: 'bg-green-500/20', text: 'text-green-400' },
  MEDIUM: { label: 'Medium Risk', color: '#F59E0B', bg: 'bg-amber-500/20', text: 'text-amber-400' },
  HIGH: { label: 'High Risk', color: '#EF4444', bg: 'bg-red-500/20', text: 'text-red-400' },
} as const;

export const SUBSCRIPTION_TIERS = [
  {
    name: 'Free',
    price: 0,
    role: 'FREE',
    features: ['3 tasks per week (48h delay)', 'Community access', 'Basic trend feed', 'Favor system (3 credits)'],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    name: 'Premium',
    price: 19,
    role: 'PREMIUM',
    features: ['All 10 weekly tasks', 'Instant access', 'Full tool links', 'Template marketplace', 'Priority support'],
    cta: 'Go Premium',
    highlighted: true,
  },
  {
    name: 'Pro',
    price: 49,
    role: 'PRO',
    features: ['Everything in Premium', 'AI coaching chat', 'Early access to tasks', 'Mentor matching', 'Advanced analytics'],
    cta: 'Go Pro',
    highlighted: false,
  },
  {
    name: 'Enterprise',
    price: 999,
    role: 'ENTERPRISE',
    features: ['Everything in Pro', 'Custom trend API', 'Dedicated support', 'White-label reports', 'Custom integrations'],
    cta: 'Contact Sales',
    highlighted: false,
  },
] as const;
