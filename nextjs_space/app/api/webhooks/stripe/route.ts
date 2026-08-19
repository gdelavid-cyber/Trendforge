export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { sendNotificationEmail } from '@/lib/email';
import type Stripe from 'stripe';

const PLAN_MAP: Record<string, string> = {
  [process.env.STRIPE_PRICE_PREMIUM ?? '']: 'PREMIUM',
  [process.env.STRIPE_PRICE_PRO ?? '']: 'PRO',
  [process.env.STRIPE_PRICE_ENTERPRISE ?? '']: 'ENTERPRISE',
};

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

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId ?? session.client_reference_id;
        if (!userId) break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = subscription.items?.data?.[0]?.price?.id ?? '';
        const role = PLAN_MAP[priceId] ?? 'PREMIUM';

        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            subscriptionStatus: 'active',
            role: role as any,
          },
        });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user?.email) {
          sendNotificationEmail({
            notificationId: process.env.NOTIF_ID_SUBSCRIPTION_CONFIRMATION ?? '',
            recipientEmail: user.email,
            subject: `Welcome to TrendForge ${role}!`,
            body: `<div style="font-family: Arial; background: #0A0A0F; color: #E8E8E8; padding: 32px;"><h2 style="color: #F5A623;">You're now a ${role} member! 🎉</h2><p>Enjoy all the premium features including full task access, tools, and more.</p></div>`,
            isHtml: true,
          }).catch(() => {});
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const priceId = sub.items?.data?.[0]?.price?.id ?? '';
        const role = PLAN_MAP[priceId] ?? 'FREE';

        const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: sub.id } });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: sub.status, role: role as any },
          });
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
          if (user) {
            await prisma.user.update({
              where: { id: user.id },
              data: { subscriptionStatus: 'past_due', role: 'FREE' },
            });
          }
        }
        break;
      }
    }
  } catch (error: any) {
    console.error('Webhook handler error:', error);
  }

  return NextResponse.json({ received: true });
}
