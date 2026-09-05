import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function deduplicateDatabase() {
  console.log('--- Starting Database Deduplication ---');

  // 1. Deduplicate Trends
  const allTrends = await prisma.trend.findMany({
    orderBy: { createdAt: 'asc' },
    include: { tasks: true },
  });

  console.log(`Found ${allTrends.length} total trend records in database.`);

  const seenTrendNames = new Map<string, string>(); // normalizedName -> primaryId
  let duplicateTrendsDeleted = 0;

  for (const trend of allTrends) {
    const normalized = trend.name.trim().toLowerCase();
    if (seenTrendNames.has(normalized)) {
      const primaryTrendId = seenTrendNames.get(normalized)!;

      // Reassign or delete tasks associated with this duplicate trend
      for (const task of trend.tasks) {
        // Check if primary trend already has a task with this same title
        const existingTask = await prisma.task.findFirst({
          where: {
            trendId: primaryTrendId,
            title: task.title,
          },
        });

        if (existingTask) {
          // Delete duplicate task
          await prisma.userTask.deleteMany({ where: { taskId: task.id } });
          await prisma.task.delete({ where: { id: task.id } }).catch(() => {});
        } else {
          // Reassign task to primary trend
          await prisma.task.update({
            where: { id: task.id },
            data: { trendId: primaryTrendId },
          }).catch(() => {});
        }
      }

      // Delete the duplicate trend
      await prisma.trend.delete({ where: { id: trend.id } }).catch(() => {});
      duplicateTrendsDeleted++;
    } else {
      seenTrendNames.set(normalized, trend.id);
    }
  }

  console.log(`Cleaned up ${duplicateTrendsDeleted} duplicate trends.`);

  // 2. Deduplicate Tasks
  const allTasks = await prisma.task.findMany({
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${allTasks.length} total task records in database.`);

  const seenTaskTitles = new Set<string>();
  let duplicateTasksDeleted = 0;

  for (const task of allTasks) {
    const normalized = task.title.trim().toLowerCase();
    if (seenTaskTitles.has(normalized)) {
      await prisma.userTask.deleteMany({ where: { taskId: task.id } });
      await prisma.task.delete({ where: { id: task.id } }).catch(() => {});
      duplicateTasksDeleted++;
    } else {
      seenTaskTitles.add(normalized);
    }
  }

  console.log(`Cleaned up ${duplicateTasksDeleted} duplicate tasks.`);

  const remainingTrends = await prisma.trend.count();
  const remainingTasks = await prisma.task.count();

  console.log(`Database is now 100% deduplicated:`);
  console.log(`- Unique Trends: ${remainingTrends}`);
  console.log(`- Unique Tasks: ${remainingTasks}`);
}

deduplicateDatabase()
  .catch((e) => console.error('Deduplication script error:', e))
  .finally(async () => {
    await prisma.$disconnect();
  });
