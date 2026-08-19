import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_build_placeholder_key', {
  apiVersion: '2024-06-20' as any,
  typescript: true,
});

export const PLANS = {
  FREE: { name: 'Free', price: 0, tasksPerWeek: 3, delayHours: 48 },
  PREMIUM: { name: 'Premium', price: 19, tasksPerWeek: 10, delayHours: 0, priceId: process.env.STRIPE_PRICE_PREMIUM ?? '' },
  PRO: { name: 'Pro', price: 49, tasksPerWeek: 10, delayHours: 0, priceId: process.env.STRIPE_PRICE_PRO ?? '', aiCoaching: true },
  ENTERPRISE: { name: 'Enterprise', price: 999, tasksPerWeek: 10, delayHours: 0, priceId: process.env.STRIPE_PRICE_ENTERPRISE ?? '', apiAccess: true },
} as const;
