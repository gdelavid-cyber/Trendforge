import Stripe from 'stripe';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log('Testing Stripe API Connection...');
  const key = process.env.STRIPE_SECRET_KEY;
  console.log(`Key Prefix: ${key?.slice(0, 15)}...`);

  if (!key) {
    throw new Error('STRIPE_SECRET_KEY not found in environment');
  }

  const stripe = new Stripe(key, {
    apiVersion: '2023-10-16' as any,
  });

  try {
    const balance = await stripe.balance.retrieve();
    console.log('✅ Stripe API Connected Successfully!');
    console.log('Account Livemode:', balance.livemode);
    console.log('Available Balance:', balance.available);
    console.log('Pending Balance:', balance.pending);
  } catch (err: any) {
    console.error('❌ Stripe Error:', err.message);
  }
}

main();
