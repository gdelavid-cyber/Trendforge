import { prisma } from '@/lib/core/db';
import { swarmMemory, SwarmMemory, AgentRole, AgentInstance, TaskState, TaskCheckpoint } from './memory';
import { masterBrain, MasterBrain, BrainDecision } from './masterBrain';
import { SWARM_TEMPLATES, TemplateType, PricingTier } from './templates';
import { DiscovererAgent } from './agents/discoverer';
import { AnalystAgent } from './agents/analyst';
import { BuilderAgent } from './agents/builder';
import { ValidatorAgent } from './agents/validator';
import { ListerAgent } from './agents/lister';
import { OutreacherAgent } from './agents/outreacher';
import { SellerAgent } from './agents/seller';
import { CloserAgent } from './agents/closer';
import { DelivererAgent } from './agents/deliverer';
import { LoggerAgent } from './agents/logger';
import { DisputeHandlerAgent } from './agents/disputeHandler';
import { ModelTierKey } from '@/lib/intelligence/openrouter/client';

export interface PulseResult {
  success: boolean;
  timestamp: string;
  decisions: BrainDecision[];
  tasksProcessed: number;
  tasksAdvanced: string[];
  agentsActive: number;
  survivalMode: boolean;
  dryRun: boolean;
  errors: string[];
}

export class SwarmCoordinator {
  constructor(
    private memory: SwarmMemory = swarmMemory,
    private brain: MasterBrain = masterBrain
  ) {}

  /**
   * Seeds or reconciles the initial agent workforce
   */
  async ensureAgentWorkforce(): Promise<void> {
    await this.memory.ensureInitialized();
    const active = await this.memory.getActiveAgents();

    const targetCounts: Record<AgentRole, { count: number; tier: ModelTierKey }> = {
      DISCOVERER: { count: 2, tier: 'cheap' },
      ANALYST: { count: 1, tier: 'standard' },
      BUILDER: { count: 2, tier: 'premium' },
      VALIDATOR: { count: 1, tier: 'standard' },
      LISTER: { count: 1, tier: 'standard' },
      OUTREACHER: { count: 2, tier: 'standard' },
      SELLER: { count: 2, tier: 'standard' },
      CLOSER: { count: 2, tier: 'premium' },
      DELIVERER: { count: 1, tier: 'cheap' },
      LOGGER: { count: 1, tier: 'cheap' },
      DISPUTE_HANDLER: { count: 1, tier: 'premium' },
    };

    for (const [roleStr, config] of Object.entries(targetCounts)) {
      const role = roleStr as AgentRole;
      const existingInRole = active.filter(a => a.role === role);
      const needed = config.count - existingInRole.length;
      for (let i = 0; i < needed; i++) {
        await this.memory.spawnAgent(role, config.tier, {
          maxConcurrentTasks: 2,
          timeoutMs: 120000,
          retryAttempts: 2,
        });
      }
    }
  }

  /**
   * Main Autonomous Pulse Cycle
   */
  async executePulse(): Promise<PulseResult> {
    await this.ensureAgentWorkforce();
    const errors: string[] = [];
    const tasksAdvanced: string[] = [];

    const brainDb = await prisma.swarmBrainState.findUnique({ where: { id: 'global' } });
    const isDryRun = brainDb?.dryRun ?? false;

    // 1. Master Brain Strategic Reasoner & Pre-Flight Checks
    const decisions = await this.brain.runStrategicCycle();

    for (const d of decisions) {
      if (d.action === 'SPAWN_AGENT' && d.payload?.role) {
        await this.memory.spawnAgent(
          d.payload.role,
          d.payload.modelTier || 'standard',
          d.payload.config || {}
        );
      } else if (d.action === 'START_TASK' && (d.payload?.templateType || d.payload?.templateId)) {
        const templateType = (d.payload.templateType || d.payload.templateId || 'FACELESS_VIDEO').toUpperCase() as TemplateType;
        const preflight = await this.brain.evaluatePreFlight({
          templateType,
          tier: d.payload.pricingTier || 'STANDARD',
        });

        if (preflight.approved) {
          await this.memory.createTask({
            templateId: templateType,
            templateType,
            pricingTier: preflight.tier,
            trendId: d.payload.trendId,
            costEstimate: preflight.estimatedCost,
            estimatedCost: preflight.estimatedCost,
            salePrice: preflight.expectedRevenue,
          });
        }
      }
    }

    // 2. Fetch Active Tasks & Agents
    const activeTasks = await this.memory.getActiveTasks();
    const activeAgents = await this.memory.getActiveAgents();

    // If no active tasks exist, seed one that passed preflight
    if (activeTasks.length === 0) {
      const templateType: TemplateType = brainDb?.survivalMode ? 'LOGO_PACK' : 'FACELESS_VIDEO';
      const preflight = await this.brain.evaluatePreFlight({
        templateType,
        tier: 'STANDARD',
      });

      const defaultTask = await this.memory.createTask({
        templateId: templateType,
        templateType,
        pricingTier: preflight.tier,
        costEstimate: preflight.estimatedCost,
        estimatedCost: preflight.estimatedCost,
        salePrice: preflight.expectedRevenue,
      });
      activeTasks.push(defaultTask as any);
    }

    // Process tasks in queue (up to max concurrency)
    const maxConcurrent = brainDb?.maxConcurrentTasks || 5;
    const tasksToProcess = activeTasks.slice(0, maxConcurrent);

    for (const task of tasksToProcess) {
      try {
        const advanced = await this.advanceTaskPipeline(task, activeAgents, isDryRun);
        if (advanced) {
          tasksAdvanced.push(task.id);
        }
      } catch (err: any) {
        console.error(`Task ${task.id} execution error:`, err);
        errors.push(`Task ${task.id}: ${err?.message || 'Execution error'}`);
        await this.memory.updateTask(task.id, {
          errorMessage: err?.message,
          state: 'FAILED',
        });
      }
    }

    return {
      success: errors.length === 0,
      timestamp: new Date().toISOString(),
      decisions,
      tasksProcessed: tasksToProcess.length,
      tasksAdvanced,
      agentsActive: activeAgents.length,
      survivalMode: brainDb?.survivalMode ?? false,
      dryRun: isDryRun,
      errors,
    };
  }

  /**
   * Advances a task through its 9-stage pipeline with Task Checkpointing
   */
  async advanceTaskPipeline(
    task: any,
    availableAgents: AgentInstance[],
    isDryRun = false
  ): Promise<boolean> {
    const templateKey = (task.templateType || task.templateId || 'FACELESS_VIDEO').toUpperCase();
    const template = SWARM_TEMPLATES[templateKey] || SWARM_TEMPLATES.FACELESS_VIDEO;
    const currentState = (task.state || 'DISCOVERY') as TaskState;

    const findAgentForRole = (role: AgentRole) => {
      return (
        availableAgents.find(a => a.role === role && a.status === 'IDLE') ||
        availableAgents.find(a => a.role === role) ||
        availableAgents[0]
      );
    };

    // Checkpoint helper
    const saveProgress = async (
      nextState: TaskState,
      stepName: string,
      stepData: any,
      agentRole: string
    ) => {
      const existingCheckpoint = (task.checkpoint as TaskCheckpoint) || {
        currentPhase: currentState,
        completedSteps: [],
        currentStep: currentState,
        stepData: {},
        agentStates: {},
        timestamp: new Date().toISOString(),
      };

      const updatedCheckpoint: TaskCheckpoint = {
        currentPhase: nextState,
        completedSteps: [...(existingCheckpoint.completedSteps || []), stepName],
        currentStep: nextState,
        stepData: { ...(existingCheckpoint.stepData || {}), [stepName]: stepData },
        agentStates: {
          ...(existingCheckpoint.agentStates || {}),
          [agentRole]: { status: 'COMPLETED', lastAction: stepName, data: stepData },
        },
        timestamp: new Date().toISOString(),
      };

      await this.memory.saveTaskCheckpoint(task.id, updatedCheckpoint);
    };

    switch (currentState) {
      case 'DISCOVERY': {
        const agentInst = findAgentForRole('DISCOVERER');
        if (!agentInst) return false;
        const worker = new DiscovererAgent(agentInst);
        const res = await worker.execute({ taskId: task.id, trendLimit: 20 });
        if (res.success) {
          await this.memory.updateTask(task.id, {
            trendId: res.output.trendId,
            state: 'ANALYSIS',
            phase: 'ANALYSIS',
          });
          await saveProgress('ANALYSIS', 'DISCOVERY', res.output, 'DISCOVERER');
          return true;
        }
        return false;
      }

      case 'ANALYSIS':
      case 'EVALUATION': {
        const agentInst = findAgentForRole('ANALYST');
        if (!agentInst) return false;
        const worker = new AnalystAgent(agentInst);
        const trends = await this.memory.getRecentTrends(5);
        const currentTrend = trends.find(t => t.id === task.trendId) || trends[0];
        const res = await worker.execute({
          taskId: task.id,
          trendSignal: currentTrend,
          availableTemplates: Object.keys(SWARM_TEMPLATES),
          template,
        });

        if (res.success && res.output.goNoGo !== false) {
          await this.memory.updateTask(task.id, {
            analysisResult: res.output,
            salePrice: res.output.expectedRevenue || task.salePrice || 249,
            state: 'BUILDING',
            phase: 'BUILDING',
          });
          await saveProgress('BUILDING', 'ANALYSIS', res.output, 'ANALYST');
          return true;
        } else {
          await this.memory.updateTask(task.id, {
            errorMessage: 'Analyst determined unit economics margin ratio < 0.40',
            state: 'FAILED',
          });
          return false;
        }
      }

      case 'BUILDING': {
        const agentInst = findAgentForRole('BUILDER');
        if (!agentInst) return false;
        const worker = new BuilderAgent(agentInst);
        const res = await worker.execute({
          taskId: task.id,
          template,
          analysis: task.analysisResult,
          trendSignal: { topic: 'Faceless Video & High Conversion Creatives' },
        });

        if (res.success) {
          await this.memory.updateTask(task.id, {
            state: 'VALIDATION',
            phase: 'VALIDATION',
          });
          await saveProgress('VALIDATION', 'BUILDING', res.output, 'BUILDER');
          return true;
        }
        return false;
      }

      case 'VALIDATION': {
        const agentInst = findAgentForRole('VALIDATOR');
        if (!agentInst) return false;
        const worker = new ValidatorAgent(agentInst);
        const res = await worker.execute({
          taskId: task.id,
          template,
          deliverable: task.analysisResult,
        });

        if (res.success) {
          await this.memory.updateTask(task.id, {
            validationResult: res.output,
            state: 'LISTING',
            phase: 'LISTING',
          });
          await saveProgress('LISTING', 'VALIDATION', res.output, 'VALIDATOR');
          return true;
        } else {
          await this.memory.updateTask(task.id, {
            validationResult: res.output,
            errorMessage: 'Deliverable failed critical quality validation criteria',
            state: 'FAILED',
          });
          return false;
        }
      }

      case 'LISTING': {
        const agentInst = findAgentForRole('SELLER') || findAgentForRole('LISTER');
        if (!agentInst) return false;
        const worker = new SellerAgent(agentInst);
        const res = await worker.execute({
          taskId: task.id,
          template,
          deliverable: task.analysisResult,
        });

        if (res.success && res.output) {
          await this.memory.updateTask(task.id, {
            listingResult: res.output.listing,
            outreachResult: res.output.warmLeads,
            state: isDryRun ? 'LISTING' : 'OUTREACH',
            phase: isDryRun ? 'LISTING' : 'OUTREACH',
          });
          await saveProgress(isDryRun ? 'LISTING' : 'OUTREACH', 'LISTING', res.output, 'SELLER');
          return true;
        }
        return false;
      }

      case 'OUTREACH':
      case 'NEGOTIATION': {
        if (isDryRun) {
          console.log(`[Coordinator] Dry-Run Mode active: Pausing task ${task.id} before real outreach.`);
          return false;
        }

        const agentInst = findAgentForRole('CLOSER');
        if (!agentInst) return false;
        const worker = new CloserAgent(agentInst);
        const targetLead = task.outreachResult?.[0] || {
          profile: 'buyer.partner@growthagency.co',
          platform: 'fiverr',
        };

        const res = await worker.execute({
          taskId: task.id,
          template,
          analysis: task.analysisResult,
          lead: targetLead,
        });

        if (res.success && res.output.action === 'AUTO_CLOSED') {
          await this.memory.updateTask(task.id, {
            closeResult: res.output,
            stripePaymentIntentId: res.output.paymentIntentId,
            escrowStatus: 'HELD',
            state: 'DELIVERY',
            phase: 'DELIVERY',
          });
          await saveProgress('DELIVERY', 'CLOSING', res.output, 'CLOSER');
          return true;
        }
        return false;
      }

      case 'DELIVERING':
      case 'DELIVERY': {
        const agentInst = findAgentForRole('DELIVERER');
        if (!agentInst) return false;
        const worker = new DelivererAgent(agentInst);
        const res = await worker.execute({
          taskId: task.id,
          template,
          stripePaymentIntentId: task.stripePaymentIntentId,
          salePrice: task.salePrice || 249,
        });

        if (res.success) {
          await this.memory.updateTask(task.id, {
            deliveryResult: res.output,
            escrowStatus: 'CAPTURED',
            state: 'LOGGING',
            phase: 'LOGGING',
          });
          await saveProgress('LOGGING', 'DELIVERY', res.output, 'DELIVERER');
          return true;
        }
        return false;
      }

      case 'LOGGING': {
        const agentInst = findAgentForRole('LOGGER');
        if (!agentInst) return false;
        const worker = new LoggerAgent(agentInst);
        const res = await worker.execute({
          taskId: task.id,
          runId: 'run_' + Math.random().toString(36).substring(2, 9),
          template,
          salePrice: task.salePrice || 249,
          totalCost: task.actualCost || 18.5,
          validationResult: task.validationResult,
        });

        if (res.success) {
          await this.memory.updateTask(task.id, {
            evidenceBundleId: res.output.bundleId,
            attestationId: res.output.attestationId,
            state: 'COMPLETED',
            phase: 'COMPLETE',
            completedAt: new Date(),
          });
          await saveProgress('COMPLETED', 'LOGGING', res.output, 'LOGGER');
          return true;
        }
        return false;
      }

      default:
        return false;
    }
  }
}

export const swarmCoordinator = new SwarmCoordinator();
