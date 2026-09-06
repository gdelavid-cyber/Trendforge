export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { stripe } from '@/lib/core/stripe';
import { sendNotificationEmail } from '@/lib/experience/email';
import type Stripe from 'stripe';

const PLAN_MAP: Record<string, string> = {
  [process.env.STRIPE_PRICE_PREMIUM ?? '']: 'PREMIUM',
  [process.env.STRIPE_PRICE_PRO ?? '']: 'PRO',
  [process.env.STRIPE_PRICE_ENTERPRISE ?? '']: 'ENTERPRISE',
};

function roleForPrice(priceId: string): string | null {
  return PLAN_MAP[priceId] ?? null;
}

async function alreadyProcessed(eventId: string): Promise<boolean> {
  const existing = await prisma.processedStripeEvent.findUnique({ where: { eventId } });
  return !!existing;
}

async function markProcessed(eventId: string, type: string): Promise<boolean> {
  try {
    await prisma.processedStripeEvent.create({ data: { eventId, type } });
    return true;
  } catch {
    return false; // unique-violation = concurrent replay already handled it
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err?.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency first: replays ack without re-running.
  if (await alreadyProcessed(event.id)) {
    return NextResponse.json({ received: true, deduplicated: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId ?? session.client_reference_id;
        if (!userId) break;

        // Prefer the purchased plan from metadata; fall back to the live price.
        let role: string | null = null;
        const metaPlan = (session.metadata?.plan ?? '').toUpperCase();
        if (['PREMIUM', 'PRO', 'ENTERPRISE', 'FREE'].includes(metaPlan)) {
          role = metaPlan === 'FREE' ? 'FREE' : metaPlan;
        }
        let status = 'active';
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          status = subscription.status;
          const priceId = subscription.items?.data?.[0]?.price?.id ?? '';
          role = role ?? roleForPrice(priceId);
        } else if (!role) {
          const priceId = (session as { metadata?: { priceId?: string } }).metadata?.priceId ?? '';
          role = roleForPrice(priceId);
        }

        // Fail closed: unknown prices grant nothing, loudly.
        if (!role) {
          console.error(`[stripe-webhook] unknown price for checkout ${session.id}; granting FREE pending review.`);
          role = 'FREE';
          status = 'incomplete';
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: (session.subscription as string) ?? null,
            subscriptionStatus: status,
            role: role as any,
          },
        });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user?.email && role !== 'FREE') {
          sendNotificationEmail({
            notificationId: process.env.NOTIF_ID_SUBSCRIPTION_CONFIRMATION ?? '',
            recipientEmail: user.email,
            subject: `Welcome to Trendly ${role}!`,
            body: `<div style="font-family: Arial; background: #0A0A0F; color: #E8E8E8; padding: 32px;"><h2 style="color: #F5A623;">You're now a ${role} member!</h2><p>Enjoy all the premium features including full task access, tools, and more.</p></div>`,
            isHtml: true,
          }).catch(() => {});
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const role = roleForPrice(sub.items?.data?.[0]?.price?.id ?? '');
        const live = ['active', 'trialing'].includes(sub.status);
        const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: sub.id } });
        if (user) {
          // Unknown prices leave the role untouched while paid; lapsed
          // subscriptions always fall back to FREE.
          const data: { subscriptionStatus: string; role?: any } = { subscriptionStatus: sub.status };
          if (role && live) data.role = role as any;
          else if (!live) data.role = 'FREE' as any;
          else console.error(`[stripe-webhook] unknown price on ${sub.id}; role left untouched.`);
          await prisma.user.update({ where: { id: user.id }, data });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: sub.id } });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: 'canceled', role: 'FREE' },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as any)?.id;
        if (customerId) {
          const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
          // Record arrears but keep the paid role through the grace window;
          // demotion happens on subscription.deleted or grace expiry, not first failure.
          if (user) {
            await prisma.user.update({
              where: { id: user.id },
              data: { subscriptionStatus: 'past_due' },
            });
          }
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as any)?.id;
        if (customerId) {
          const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
          if (user?.stripeSubscriptionId) {
            const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
            const role = roleForPrice(sub.items?.data?.[0]?.price?.id ?? '');
            await prisma.user.update({
              where: { id: user.id },
              data: {
                subscriptionStatus: sub.status,
                ...(role && ['active', 'trialing'].includes(sub.status) ? { role: role as any } : {}),
              },
            });
          }
        }
        break;
      }
    }
  } catch (error: any) {
    // Fail loud: Stripe retries, state converges instead of diverging silently.
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Handler failed, will retry.' }, { status: 500 });
  }

  if (!(await markProcessed(event.id, event.type))) {
    return NextResponse.json({ received: true, deduplicated: true });
  }
  return NextResponse.json({ received: true });
}
