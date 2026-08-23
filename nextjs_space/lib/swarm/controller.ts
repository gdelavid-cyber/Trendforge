import { prisma } from '@/lib/db';
import { JobStage, SpeciesRole, InstanceStatus } from '@prisma/client';
import { ensureSpeciesSeeded, reconcileInstances } from './registry';
import { checkGate, isGlobalKillSwitchActive, recordSpeciesSuccess, recordSpeciesFailure } from './gatekeeper';
import { recordSpend } from './spend';
import { runScout } from './species/scout';
import { runDesigner } from './species/designer';
import { runArtWorker } from './species/art-worker';
import { runModeler } from './species/modeler';
import { runQAInspector } from './species/qa-inspector';
import { runPublisher } from './species/publisher';
import { SpeciesResult } from './species/types';

export interface SwarmPulseResult {
  success: boolean;
  timestamp: string;
  durationMs: number;
  jobsProcessed: number;
  details: any[];
  killSwitchActive: boolean;
  sweptStaleInstances: number;
}

/**
 * Sweeps worker instances with heartbeats older than 10 minutes and flags them as ERROR.
 */
export async function sweepStaleInstances(): Promise<number> {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const result = await prisma.agentInstance.updateMany({
    where: {
      status: InstanceStatus.WORKING,
      heartbeatAt: { lt: tenMinutesAgo },
    },
    data: {
      status: InstanceStatus.ERROR,
    },
  });
  return result.count;
}

/**
 * Executes one complete swarm pulse cycle.
 * Non-blocking; advances at most 2 active jobs through their current stage transition.
 */
export async function executeSwarmPulse(dryRun: boolean = false): Promise<SwarmPulseResult> {
  const startTime = Date.now();
  const details: any[] = [];

  // 1. Check Global Kill-Switch
  const killSwitchActive = await isGlobalKillSwitchActive();
  if (killSwitchActive) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      jobsProcessed: 0,
      details: [{ message: 'Swarm pulse halted: Global kill-switch is active' }],
      killSwitchActive: true,
      sweptStaleInstances: 0,
    };
  }

  // 2. Ensure Species Seeded & Headcounts Reconciled
  if (!dryRun) {
    await ensureSpeciesSeeded();
    await reconcileInstances();
  }
  const sweptStaleInstances = dryRun ? 0 : await sweepStaleInstances();

  // 3. Run Scout to detect demand & ensure jobs in flight
  const scoutSpecies = await prisma.agentSpecies.findUnique({ where: { role: SpeciesRole.SCOUT } });
  if (scoutSpecies) {
    const scoutGate = await checkGate(scoutSpecies);
    if (scoutGate.allowed) {
      const scoutRes = await runScout({ dryRun });
      details.push({ stage: 'SCOUT_PULSE', result: scoutRes });
    } else {
      details.push({ stage: 'SCOUT_PULSE_BLOCKED', reason: scoutGate.reason });
    }
  }

  // 4. Process up to 2 queued jobs per pulse
  let processedCount = 0;
  const maxJobsPerPulse = 2;

  // First check in-flight jobs in DB that need stage advancement
  const activeJobs = await prisma.assetJob.findMany({
    where: {
      stage: {
        in: [
          JobStage.SPEC_DESIGN,
          JobStage.ART_GENERATION,
          JobStage.MODELING_3D,
          JobStage.QA_INSPECTION,
          JobStage.PUBLISHING,
        ],
      },
    },
    take: maxJobsPerPulse,
    orderBy: { priority: 'asc' },
  });

  for (const job of activeJobs) {
    if (processedCount >= maxJobsPerPulse) break;

    // Determine target species role for this job stage
    let role: SpeciesRole | null = null;
    if (job.stage === JobStage.SPEC_DESIGN) role = SpeciesRole.DESIGNER;
    else if (job.stage === JobStage.ART_GENERATION) role = SpeciesRole.ART_WORKER;
    else if (job.stage === JobStage.MODELING_3D) role = SpeciesRole.MODELER;
    else if (job.stage === JobStage.QA_INSPECTION) role = SpeciesRole.QA_INSPECTOR;
    else if (job.stage === JobStage.PUBLISHING) role = SpeciesRole.PUBLISHER;

    if (!role) continue;

    const species = await prisma.agentSpecies.findUnique({
      where: { role },
      include: { instances: true },
    });

    if (!species) continue;

    const gate = await checkGate(species);
    if (!gate.allowed) {
      details.push({
        jobId: job.id,
        stage: job.stage,
        blocked: true,
        reason: gate.reason,
      });
      continue;
    }

    // Acquire idle instance
    const instance = species.instances.find((i) => i.status === InstanceStatus.IDLE) || species.instances[0];

    if (!dryRun && instance) {
      await prisma.agentInstance.update({
        where: { id: instance.id },
        data: { status: InstanceStatus.WORKING, currentJobId: job.id, heartbeatAt: new Date() },
      });
    }

    let result: SpeciesResult = { success: false };

    try {
      if (job.stage === JobStage.SPEC_DESIGN) {
        result = await runDesigner(job, { instance, dryRun });
      } else if (job.stage === JobStage.ART_GENERATION) {
        result = await runArtWorker(job, { instance, dryRun });
      } else if (job.stage === JobStage.MODELING_3D) {
        result = await runModeler(job, { instance, dryRun });
      } else if (job.stage === JobStage.QA_INSPECTION) {
        result = await runQAInspector(job, { instance, dryRun });
      } else if (job.stage === JobStage.PUBLISHING) {
        result = await runPublisher(job, { instance, dryRun });
      }

      if (result.success) {
        recordSpeciesSuccess(species.role);
      } else {
        recordSpeciesFailure(species.role);
      }

      if (!dryRun && (result.costUsd || 0) > 0) {
        await recordSpend(species.id, instance?.id, job.id, result.costUsd || 0);
      }
    } catch (err: any) {
      recordSpeciesFailure(species.role);
      result = { success: false, errorMessage: err.message || String(err) };
    } finally {
      if (!dryRun && instance) {
        await prisma.agentInstance.update({
          where: { id: instance.id },
          data: { status: InstanceStatus.IDLE, currentJobId: null, heartbeatAt: new Date() },
        });
      }
    }

    details.push({
      jobId: job.id,
      catalogItemId: job.catalogItemId,
      previousStage: job.stage,
      nextStage: result.nextStage || job.stage,
      costUsd: result.costUsd || 0,
      success: result.success,
      data: result.data,
      errorMessage: result.errorMessage,
    });

    processedCount++;
  }

  return {
    success: true,
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    jobsProcessed: processedCount,
    details,
    killSwitchActive: false,
    sweptStaleInstances,
  };
}
