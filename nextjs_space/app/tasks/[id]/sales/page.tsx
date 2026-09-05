import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { notFound } from 'next/navigation';
import { SalesPipelineClient } from './_components/sales-pipeline-client';
import { persistScrapedLeads } from '@/lib/money/sales/leads-scraper';

interface Props {
  params: { id: string };
}

export default async function TaskSalesPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const taskId = params.id;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { trend: true },
  });

  if (!task) notFound();

  let leads = await prisma.lead.findMany({
    where: { taskId },
    include: { messages: { orderBy: { timestamp: 'asc' } } },
    orderBy: { compositeScore: 'desc' },
  });

  if (leads.length === 0) {
    leads = (await persistScrapedLeads(taskId)) as any;
  }

  const plan = await prisma.executionPlan.findFirst({
    where: { taskId },
  });

  return (
    <SalesPipelineClient
      task={task}
      initialLeads={JSON.parse(JSON.stringify(leads))}
      plan={plan ? JSON.parse(JSON.stringify(plan)) : null}
      userRole={session?.user ? (session.user as any).role : 'FREE'}
    />
  );
}
