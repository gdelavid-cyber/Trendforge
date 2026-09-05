'use client';

import { motion } from 'framer-motion';
import { Check, Crown } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SUBSCRIPTION_TIERS } from '@/lib/core/constants';

export function LandingPricing() {
  return (
    <section className="py-20 bg-dark-navy/30">
      <div className="max-w-[1200px] mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 text-gold mb-3">
            <Crown className="w-5 h-5" />
            <span className="font-medium">Plans</span>
          </div>
          <h2 className="font-display font-bold text-3xl tracking-tight">
            Choose Your Path to Wealth
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SUBSCRIPTION_TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative bg-card-bg border rounded-lg p-6 ${
                tier.highlighted ? 'border-gold shadow-[0_0_30px_rgba(245,166,35,0.15)]' : 'border-border-subtle'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-black text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}
              <h3 className="font-display font-bold text-lg mb-1">{tier.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gold">${tier.price}</span>
                {tier.price > 0 && <span className="text-sm text-muted-foreground">/mo</span>}
              </div>
              <ul className="space-y-2 mb-6">
                {tier.features.map((f: string) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={tier.price === 0 ? '/auth/signup' : '/pricing'}>
                <Button
                  className={`w-full ${
                    tier.highlighted ? 'gold-gradient text-black font-bold' : ''
                  }`}
                  variant={tier.highlighted ? 'default' : 'outline'}
                >
                  {tier.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-8">
          For educational purposes only. Trendly is not responsible for any financial losses.
        </p>
      </div>
    </section>
  );
}
