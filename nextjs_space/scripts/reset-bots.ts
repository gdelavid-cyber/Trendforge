import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Resetting all Web4Agent balances and state in the database...');
  
  // Set all existing Web4Agent records to 0 balance, status DORMANT, profit 0
  const result = await prisma.web4Agent.updateMany({
    data: {
      walletBalance: 0.0,
      status: 'DORMANT',
      profit: 0.0,
      totalEarnings: 0.0,
      totalCosts: 0.0,
      survivalScore: 90,
    },
  });

  console.log(`Successfully reset ${result.count} Web4 agent records to clean unfunded state.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
