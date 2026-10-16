/**
 * Trendly OS — Live Opportunity Seeder
 * Injects 5 high-margin B2B opportunities into TrendSignal and initializes them in the Venture Factory.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '@/lib/prisma';
import { createVentureFromSignal } from '@/lib/ventures/factory';

const OPPORTUNITIES = [
  {
    query: 'AI Voice Receptionist and After-Hours Triage for Dental Clinics',
    platform: 'REDDIT_COMMUNITIES',
    velocity: 94.2,
    sentiment: 0.82,
    monetizationScore: 96.0,
    industry: 'Healthcare Services',
  },
  {
    query: 'Automated SOC2 Compliance Continuous Evidence Collector',
    platform: 'TWITTER_X',
    velocity: 91.5,
    sentiment: 0.76,
    monetizationScore: 98.0,
    industry: 'Cybersecurity',
  },
  {
    query: 'Shopify Multi-Warehouse Inventory Sync and Stockout Prevention',
    platform: 'SHOPIFY_COMMUNITY',
    velocity: 89.0,
    sentiment: 0.71,
    monetizationScore: 92.0,
    industry: 'E-commerce Infrastructure',
  },
  {
    query: 'Autonomous B2B Invoice Reconciliation and Failed Payment Dunning',
    platform: 'PRODUCT_HUNT',
    velocity: 87.4,
    sentiment: 0.79,
    monetizationScore: 95.0,
    industry: 'FinTech',
  },
  {
    query: 'Confidential Legal Contract Redaction and PII Masking Tool',
    platform: 'LEGAL_TECH_FORUMS',
    velocity: 85.8,
    sentiment: 0.85,
    monetizationScore: 90.0,
    industry: 'LegalTech',
  },
];

async function main() {
  console.log('Seeding 5 high-margin B2B opportunities...');

  for (const opp of OPPORTUNITIES) {
    const existing = await prisma.trendSignal.findFirst({
      where: { query: opp.query },
    });

    let signalId = existing?.id;

    if (!existing) {
      const signal = await prisma.trendSignal.create({
        data: {
          query: opp.query,
          platform: opp.platform,
          velocity: opp.velocity,
          sentiment: opp.sentiment,
          monetizationScore: opp.monetizationScore,
          status: 'ACTIVE',
        },
      });
      signalId = signal.id;
      console.log(`✅ Seeded TrendSignal: "${opp.query}"`);
    } else {
      console.log(`ℹ️  Signal already exists: "${opp.query}"`);
    }

    // Spawn venture via factory if signal active
    if (signalId) {
      const signal = await prisma.trendSignal.findUnique({ where: { id: signalId } });
      if (signal && signal.status === 'ACTIVE') {
        const spawned = await createVentureFromSignal(signal.id, {
          industry: opp.industry,
          initialBudgetCents: 50000,
          dailyBurnCapCents: 5000,
        });
        console.log(`   -> Spawned Venture: "${spawned.venture.name}" (${spawned.venture.id}) in DISCOVERED`);
      }
    }
  }

  console.log('--- Seeding complete ---');
}

main().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
