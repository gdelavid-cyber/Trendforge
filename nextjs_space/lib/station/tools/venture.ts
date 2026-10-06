import { prisma } from '@/lib/prisma';

export interface VentureUpdateInput {
  ventureId: string;
  statusSummary?: string;
  artifactJson?: any;
  lifecycleState?: string;
}

export async function updateVentureProgress(input: VentureUpdateInput) {
  const { ventureId, statusSummary, artifactJson, lifecycleState } = input;

  const venture = await prisma.venture.findUnique({
    where: { id: ventureId },
  });

  if (!venture) {
    throw new Error(`Venture not found: ${ventureId}`);
  }

  const updates: any = {};
  if (lifecycleState && ['DISCOVERY', 'VALIDATION', 'OFFER_CREATION', 'BUILDING', 'PRE_LAUNCH', 'LAUNCHED', 'SCALING'].includes(lifecycleState)) {
    updates.lifecycleState = lifecycleState;
  }

  const updated = await prisma.venture.update({
    where: { id: ventureId },
    data: updates,
  });

  return {
    success: true,
    ventureId: updated.id,
    lifecycleState: updated.lifecycleState,
    summaryRecorded: statusSummary || null,
    hasArtifact: Boolean(artifactJson),
  };
}
