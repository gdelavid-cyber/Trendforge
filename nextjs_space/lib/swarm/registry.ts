import { prisma } from '@/lib/core/db';
import { SpeciesRole, SpeciesStatus, InstanceStatus } from '@prisma/client';

export interface SpeciesSeedConfig {
  role: SpeciesRole;
  name: string;
  description: string;
  dailyBudgetUsd: number;
  costPerUnitUsd: number;
  targetHeadcount: number;
  maxHeadcount: number;
  modelProvider: string;
}

// A2 Approved Headcounts & Ceilings (Sum < $15.00/day global cap)
export const SEED_SPECIES: SpeciesSeedConfig[] = [
  {
    role: SpeciesRole.SCOUT,
    name: 'Forge Scout',
    description: 'Scans catalog for pending art items and queues asset production jobs.',
    dailyBudgetUsd: 1.0,
    costPerUnitUsd: 0.0,
    targetHeadcount: 1,
    maxHeadcount: 2,
    modelProvider: 'internal_db',
  },
  {
    role: SpeciesRole.DESIGNER,
    name: 'Forge Concept Designer',
    description: 'Generates structured visual prompts, color palettes, and procedural geometry specs.',
    dailyBudgetUsd: 2.0,
    costPerUnitUsd: 0.005,
    targetHeadcount: 1,
    maxHeadcount: 4,
    modelProvider: 'openai',
  },
  {
    role: SpeciesRole.ART_WORKER,
    name: 'Forge 2D Art Worker',
    description: 'Renders 1024x1024 32-bit RGBA PNG cosmetic artwork.',
    dailyBudgetUsd: 6.0,
    costPerUnitUsd: 0.04,
    targetHeadcount: 1,
    maxHeadcount: 8,
    modelProvider: 'repo_image_engine',
  },
  {
    role: SpeciesRole.MODELER,
    name: 'Forge Procedural 3D Modeler',
    description: 'Builds procedural Three.js geometry and exports lightweight GLBs (zero external spend).',
    dailyBudgetUsd: 0.0,
    costPerUnitUsd: 0.0,
    targetHeadcount: 1,
    maxHeadcount: 4,
    modelProvider: 'procedural_three',
  },
  {
    role: SpeciesRole.QA_INSPECTOR,
    name: 'Forge QA Inspector',
    description: 'Performs 4 binary/structural checks (magic bytes, alpha, dimensions, GLB/catalog fit).',
    dailyBudgetUsd: 1.0,
    costPerUnitUsd: 0.001,
    targetHeadcount: 1,
    maxHeadcount: 6,
    modelProvider: 'qa_validator',
  },
  {
    role: SpeciesRole.PUBLISHER,
    name: 'Forge Catalog Publisher',
    description: 'Writes approved renderConfig and assetUrl to database and invalidates catalog cache.',
    dailyBudgetUsd: 0.0,
    costPerUnitUsd: 0.0,
    targetHeadcount: 1,
    maxHeadcount: 2,
    modelProvider: 'internal_db',
  },
];

export async function loadSpecies() {
  return prisma.agentSpecies.findMany({
    include: {
      instances: true,
    },
    orderBy: { role: 'asc' },
  });
}

/**
 * Idempotently seeds the 6 swarm species roles with approved budgets and caps.
 */
export async function ensureSpeciesSeeded() {
  for (const s of SEED_SPECIES) {
    await prisma.agentSpecies.upsert({
      where: { role: s.role },
      update: {
        name: s.name,
        description: s.description,
        dailyBudgetUsd: s.dailyBudgetUsd,
        maxHeadcount: s.maxHeadcount,
        costPerUnitUsd: s.costPerUnitUsd,
      },
      create: {
        role: s.role,
        name: s.name,
        description: s.description,
        status: SpeciesStatus.ACTIVE,
        targetHeadcount: s.targetHeadcount,
        maxHeadcount: s.maxHeadcount,
        dailyBudgetUsd: s.dailyBudgetUsd,
        costPerUnitUsd: s.costPerUnitUsd,
      },
    });
  }
}

/**
 * Reconciles instance headcount to match targetHeadcount without deleting DB records (soft lifecycle).
 */
export async function reconcileInstances() {
  const speciesList = await prisma.agentSpecies.findMany({
    include: { instances: true },
  });

  for (const species of speciesList) {
    const desired = Math.min(species.targetHeadcount, species.maxHeadcount);
    const current = species.instances;

    // Create new instances if under target
    for (let idx = 0; idx < desired; idx++) {
      const existing = current.find((inst) => inst.instanceIndex === idx);
      if (!existing) {
        await prisma.agentInstance.create({
          data: {
            speciesId: species.id,
            instanceIndex: idx,
            status: InstanceStatus.IDLE,
            heartbeatAt: new Date(),
          },
        });
      }
    }

    // Set surplus instances to IDLE (never delete rows)
    for (const inst of current) {
      if (inst.instanceIndex >= desired && inst.status !== InstanceStatus.IDLE) {
        await prisma.agentInstance.update({
          where: { id: inst.id },
          data: { status: InstanceStatus.IDLE },
        });
      }
    }
  }
}
