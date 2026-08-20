import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function fastDedup() {
  console.log('--- Executing Fast Batch Deduplication ---');

  // 1. Delete duplicate Tasks (keep the lowest ID / earliest created for each unique title)
  const duplicateTasksDeleted = await prisma.$executeRawUnsafe(`
    DELETE FROM "Task"
    WHERE id NOT IN (
      SELECT DISTINCT ON (LOWER(TRIM(title))) id
      FROM "Task"
      ORDER BY LOWER(TRIM(title)), "createdAt" ASC
    )
  `);

  console.log(`Deleted ${duplicateTasksDeleted} duplicate tasks.`);

  // 2. Delete duplicate Trends (keep the earliest created for each unique name)
  const duplicateTrendsDeleted = await prisma.$executeRawUnsafe(`
    DELETE FROM "Trend"
    WHERE id NOT IN (
      SELECT DISTINCT ON (LOWER(TRIM(name))) id
      FROM "Trend"
      ORDER BY LOWER(TRIM(name)), "createdAt" ASC
    )
  `);

  console.log(`Deleted ${duplicateTrendsDeleted} duplicate trends.`);

  const remainingTrends = await prisma.trend.count();
  const remainingTasks = await prisma.task.count();

  console.log(`Database is now clean:`);
  console.log(`- Unique Trends remaining: ${remainingTrends}`);
  console.log(`- Unique Tasks remaining: ${remainingTasks}`);
}

fastDedup()
  .catch((e) => console.error('Fast dedup error:', e))
  .finally(async () => {
    await prisma.$disconnect();
  });
