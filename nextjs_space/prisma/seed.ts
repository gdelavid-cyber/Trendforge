import { PrismaClient, VentureLifecycleState, VentureBusinessModel, AutonomyLevel, RiskLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Seeding Trendly OS foundation data...');

  // 1. Seed or find demo operator user
  const passwordHash = await bcrypt.hash('TrendlyDemo2026!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'operator@trendly.os' },
    update: {},
    create: {
      email: 'operator@trendly.os',
      name: 'Trendly Operator',
      passwordHash,
      role: 'ADMIN',
    },
  });
  console.log(`[Seed] Operator user ready: ${user.email} (${user.id})`);

  // 2. Seed sample venture in DISCOVERED stage
  const ventureSlug = 'autonomous-b2b-procurement-agent';
  const existingVenture = await prisma.venture.findUnique({
    where: { slug: ventureSlug },
  });

  let venture;
  if (!existingVenture) {
    venture = await prisma.venture.create({
      data: {
        userId: user.id,
        name: 'Autonomous B2B Procurement Agent',
        slug: ventureSlug,
        description: 'AI procurement intelligence automating software license audits and vendor price renegotiations.',
        problem: 'Enterprises overspend by 30% annually on unmanaged SaaS seats and forgotten contract renewals.',
        targetCustomer: 'Mid-market CFOs and VP of Operations (100-1000 employees)',
        industry: 'Enterprise Software & FinOps',
        businessModel: VentureBusinessModel.AI_SAAS,
        lifecycleState: VentureLifecycleState.DISCOVERED,
        autonomyLevel: AutonomyLevel.LEVEL_3,
        riskLevel: RiskLevel.MEDIUM,
        capitalAllocatedCents: 50000, // $500 initial budget
        capitalConsumedCents: 0,
        revenueCents: 0,
        costCents: 0,
        profitCents: 0,
        transitions: {
          create: {
            fromState: VentureLifecycleState.DISCOVERED,
            toState: VentureLifecycleState.DISCOVERED,
            actor: 'SYSTEM_SEED',
            reason: 'Initial seed venture created in DISCOVERED stage.',
            evidenceJson: { seed: true, timestamp: new Date().toISOString() },
          },
        },
        capitalPlans: {
          create: {
            allocatedCents: 50000,
            consumedCents: 0,
            maxDailyBurnCents: 5000, // $50/day max burn
            hardStopThresholdCents: 50000,
            reinvestmentPercentage: 20,
          },
        },
      },
    });
    console.log(`[Seed] Sample venture created: ${venture.name} (DISCOVERED)`);
  } else {
    venture = existingVenture;
    console.log(`[Seed] Sample venture already exists: ${venture.name}`);
  }

  // 3. Seed sample trend signal
  const trendSignal = await prisma.trendSignal.create({
    data: {
      query: 'saas license audit automation',
      platform: 'reddit/r/sysadmin',
      rawData: {
        mentions: 142,
        velocityPerHour: 4.8,
        complaintThemes: ['unmonitored seat sprawl', 'painful vendor renewals', 'lack of unified dashboard'],
        sampleUrls: ['https://reddit.com/r/sysadmin/comments/procurement_sprawl'],
      },
      velocity: 4.8,
      sentiment: -0.65, // High frustration = high monetization opportunity
      monetizationScore: 0.88,
      status: 'ACTIVE',
    },
  });
  console.log(`[Seed] Sample trend signal seeded: ${trendSignal.id} (${trendSignal.query})`);

  console.log('[Seed] Trendly OS seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('[Seed] Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
