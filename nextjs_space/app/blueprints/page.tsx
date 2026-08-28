import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { TASK_BLUEPRINTS } from '@/lib/execution/blueprints';
import { BlueprintsClient } from './_components/blueprints-client';

export default async function BlueprintsPage() {
  const session = await getServerSession(authOptions);

  const customBlueprints = await prisma.taskBlueprint.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <BlueprintsClient
      defaults={Object.values(TASK_BLUEPRINTS)}
      customBlueprints={JSON.parse(JSON.stringify(customBlueprints))}
    />
  );
}
