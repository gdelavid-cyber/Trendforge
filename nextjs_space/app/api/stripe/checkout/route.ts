export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { stripe, PLANS } from '@/lib/core/stripe';

// Spec-compat: POST /api/stripe/checkout { plan, email, userId? }
// Creates a Stripe Checkout subscription session.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { plan, email, userId } = body as { plan?: string; email?: string; userId?: string };

    const key = (plan ?? '').toUpperCase() as keyof typeof PLANS;
    const planConfig = PLANS[key];
    if (!planConfig || !('priceId' in planConfig) || !(planConfig as { priceId?: string }).priceId) {
      return NextResponse.json({ error: 'Invalid plan. Use PREMIUM, PRO, or ENTERPRISE.' }, { status: 400 });
    }

    const priceId = (planConfig as { priceId: string }).priceId;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email || undefined,
      client_reference_id: userId || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?cancelled=true`,
      metadata: { plan: key, ...(userId ? { userId } : {}) },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create checkout session' }, { status: 500 });
  }
}
