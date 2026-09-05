import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { notFound } from 'next/navigation';
import { generateSalesKitForTask } from '@/lib/money/sales/sales-engine';
import { SalesKitClient } from './_components/sales-kit-client';

interface Props {
  params: { id: string };
}

export default async function TaskSalesKitPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const taskId = params.id;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { trend: true },
  });

  if (!task) notFound();

  let salesKit = await prisma.salesKit.findFirst({
    where: { taskId },
  });

  if (!salesKit) {
    salesKit = (await generateSalesKitForTask(taskId, session?.user ? (session.user as any).id : undefined)) as any;
  }

  return (
    <SalesKitClient
      task={task}
      salesKit={JSON.parse(JSON.stringify(salesKit))}
    />
  );
}
