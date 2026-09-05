import { prisma } from '@/lib/core/db';
import { recordTrace } from '@/lib/growth/nova/traces';
import { parseSteps } from '@/lib/pipeline/steps';
import { makeLlm } from '@/lib/execution/llm';
import { createSkillRunner, type LlmFn, type StepContext, type StepOutcome } from './skills';

export type ExecutionMode = 'DIY' | 'CO_PILOT' | 'AUTOPILOT';

export interface StartResult {
  ok: boolean;
  error?: string;
  userTaskId?: string;
  status?: string;
  stepResult?: StepOutcome;
}

export interface EngineDeps {
  /** Test hook: await fire-and-forget loops so assertions are deterministic. */
  awaitLoops?: boolean;
  llm?: LlmFn;
  notify?: (userId: string, subject: string, body: string) => Promise<void>;
}

const DEFAULT_NOTIFY = async (userId: string, subject: string, body: string) => {
  try {
    const { sendNotificationEmail } = await import('@/lib/experience/email');
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (user?.email) {
      await sendNotificationEmail({
        notificationId: `approval_${Date.now()}`,
        recipientEmail: user.email,
        subject,
        body,
      });
    }
  } catch {
    // Email degrades to console per platform pattern; never block execution.
  }
};

function runnerFor(deps: EngineDeps) {
  return createSkillRunner(deps.llm ?? makeLlm());
}

/** Brain priority: user's own key â†’ platform default (opencode dev / Gemini / Abacus). */
async function resolveDeps(userId: string, deps: EngineDeps): Promise<EngineDeps> {
  if (deps.llm) return deps;
  try {
    const { getUserLlm } = await import('@/lib/intelligence/user-llm');
    const userLlm = await getUserLlm(userId);
    if (userLlm) return { ...deps, llm: userLlm };
  } catch {}
  return deps;
}

async function appendStepResult(userTaskId: string, index: number, entry: Record<string, unknown>) {
  const current = await prisma.userTask.findUnique({
    where: { id: userTaskId },
    select: { stepResults: true },
  });
  const log = Array.isArray(current?.stepResults) ? (current!.stepResults as unknown[]) : [];
  log.push({ index, at: new Date().toISOString(), ...entry });
  await prisma.userTask.update({
    where: { id: userTaskId },
    data: {
      stepResults: log as any,
      currentStep: index + 1,
      stepsCompleted: log.filter((e: any) => e.status === 'done').length,
    },
  });
}

/**
 * Logs a step outcome and persists any real-world artifact it produced.
 * Blocked outcomes are recorded honestly as 'blocked' — never 'done'.
 * Timing is stamped so the run feed can prove when and how long work took;
 * evidence (provider ids, links, sources) lives on the artifact meta.
 */
async function recordOutcome(
  userTaskId: string,
  index: number,
  step: { title: string; action: string },
  outcome: StepOutcome,
  timing: StepTiming
) {
  await appendStepResult(userTaskId, index, {
    title: step.title,
    action: step.action,
    status: outcome.blocked ? 'blocked' : 'done',
    output: outcome.output,
    startedAt: timing.startedAt,
    finishedAt: timing.finishedAt,
    durationMs: timing.durationMs,
  });
  // N3: blocked steps emit a why-trace (one owner lookup, blocked-only).
  if (outcome.blocked) {
    void recordTrace({
      userId: (await prisma.userTask.findUnique({ where: { id: userTaskId }, select: { userId: true } }).catch(() => null))?.userId ?? null,
      kind: 'STEP',
      subject: step.title,
      summary: `Step blocked, reported honestly instead of marked done.`,
      reasons: [String(outcome.output ?? 'blocked by runner').slice(0, 500)],
    });
  }
  if (outcome.artifact) {
    await prisma.taskArtifact.create({
      data: {
        userTaskId,
        stepIndex: index,
        kind: outcome.artifact.kind,
        name: outcome.artifact.name,
        url: outcome.artifact.url ?? null,
        meta: (outcome.artifact.meta ?? undefined) as any,
      },
    });
  }
}

interface StepTiming {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
}

/** Wraps a runner call with wall-clock stamps for the proof trail. */
async function executeTimed(
  runner: { run: (step: any, ctx: StepContext) => Promise<StepOutcome> },
  step: any,
  ctx: StepContext
): Promise<{ outcome: StepOutcome; timing: StepTiming }> {
  const started = new Date();
  const outcome = await runner.run(step, ctx);
  const finished = new Date();
  return {
    outcome,
    timing: {
      startedAt: started.toISOString(),
      finishedAt: finished.toISOString(),
      durationMs: finished.getTime() - started.getTime(),
    },
  };
}

/**
 * Starts (or resumes) execution of a task in the given mode.
 * - DIY: marks started; companion advises only.
 * - CO_PILOT: executes a single step (stepIndex or first pending) synchronously.
 * - AUTOPILOT: runs all steps hands-off, halting at external gates.
 */
export async function startExecution(
  userId: string,
  taskId: string,
  mode: ExecutionMode,
  opts: { stepIndex?: number; companionId?: string } = {},
  deps: EngineDeps = {}
): Promise<StartResult> {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return { ok: false, error: 'Task not found' };

  const effectiveDeps = await resolveDeps(userId, deps);

  // Resolve the executing companion (explicit â†’ primary).
  let companionId = opts.companionId;
  if (!companionId) {
    try {
      const { getOrCreatePrimary } = await import('@/lib/intelligence/companion/service');
      const companion = await getOrCreatePrimary(userId);
      companionId = companion.id;
    } catch {
      companionId = undefined;
    }
  }

  const steps = parseSteps(task.steps);

  let userTask = await prisma.userTask.findUnique({
    where: { userId_taskId: { userId, taskId } },
  });

  if (!userTask) {
    userTask = await prisma.userTask.create({
      data: {
        userId,
        taskId,
        mode,
        status: 'IN_PROGRESS',
        currentStep: 0,
        launchedAt: new Date(),
        companionId,
      },
    });
  } else {
    // Concurrency guard: a live run may not be re-entered.
    if (userTask.status === 'STEP_EXECUTING') {
      return { ok: false, error: 'Execution already in progress', userTaskId: userTask.id };
    }
    userTask = await prisma.userTask.update({
      where: { id: userTask.id },
      data: { mode, launchedAt: userTask.launchedAt ?? new Date(), ...(companionId ? { companionId } : {}) },
    });
  }

  if (mode === 'DIY') {
    await prisma.userTask.update({ where: { id: userTask.id }, data: { status: 'IN_PROGRESS' } });
    return { ok: true, userTaskId: userTask.id, status: 'IN_PROGRESS' };
  }

  const startIndex =
    mode === 'CO_PILOT' && typeof opts.stepIndex === 'number'
      ? Math.min(Math.max(opts.stepIndex, 0), Math.max(steps.length - 1, 0))
      : userTask.currentStep ?? 0;

  if (mode === 'CO_PILOT') {
    const result = await runSingleStep(userTask.id, userId, taskId, steps, startIndex, effectiveDeps);
    return { ok: result.ok, error: result.error, userTaskId: userTask.id, stepResult: result.outcome };
  }

  // AUTOPILOT â€” loop (awaited only under test for determinism)
  const loop = runAutopilot(userTask.id, userId, taskId, steps, startIndex, effectiveDeps);
  if (deps.awaitLoops) await loop;
  return { ok: true, userTaskId: userTask.id, status: 'STEP_EXECUTING' };
}

async function runSingleStep(
  userTaskId: string,
  userId: string,
  taskId: string,
  steps: ReturnType<typeof parseSteps>,
  index: number,
  deps: EngineDeps
): Promise<{ ok: boolean; error?: string; outcome?: StepOutcome }> {
  const step = steps[index];
  if (!step) return { ok: false, error: 'No such step' };
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { title: true } });

  if (step.external) {
    await queueApproval(userTaskId, userId, index, step, deps);
    return { ok: true };
  }

  const ctx = await buildContext(userTaskId, userId, index, task?.title ?? 'task');
  const { outcome, timing } = await executeTimed(runnerFor(deps), step, ctx);
  await recordOutcome(userTaskId, index, step, outcome, timing);
  return { ok: true, outcome };
}

async function runAutopilot(
  userTaskId: string,
  userId: string,
  taskId: string,
  steps: ReturnType<typeof parseSteps>,
  startIndex: number,
  deps: EngineDeps
): Promise<void> {
  const claimed = await prisma.userTask.updateMany({
    where: { id: userTaskId, NOT: { status: 'STEP_EXECUTING' } },
    data: { status: 'STEP_EXECUTING' },
  });
  if (claimed.count === 0) return; // another runner owns this task

  const runner = runnerFor(deps);
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { title: true } });

  try {
    for (let i = startIndex; i < steps.length; i++) {
      const step = steps[i];

      // Halt at pending gates created earlier for this index.
      const pending = await prisma.approval.findFirst({
        where: { userTaskId, stepIndex: i, status: 'PENDING' },
      });
      if (pending || step.external) {
        if (!pending) await queueApproval(userTaskId, userId, i, step, deps);
        await prisma.userTask.update({ where: { id: userTaskId }, data: { status: 'PENDING_APPROVAL', currentStep: i } });
        return;
      }

      const ctx = await buildContext(userTaskId, userId, i, task?.title ?? 'task');
      let outcome: StepOutcome;
      let timing: StepTiming;
      try {
        const executed = await executeTimed(runner, step, ctx);
        outcome = executed.outcome;
        timing = executed.timing;
      } catch (err: any) {
        const now = new Date().toISOString();
        await appendStepResult(userTaskId, i, { title: step.title, action: step.action, status: 'failed', output: err.message, startedAt: now, finishedAt: now, durationMs: 0 });
        void recordTrace({ userId, kind: 'STEP', subject: step.title, summary: 'Step threw and was skipped; the run continued.', reasons: [String(err?.message ?? 'unknown error').slice(0, 500)] });
        continue; // adapt: skip failed step, keep moving
      }
      await recordOutcome(userTaskId, i, step, outcome, timing);
    }

    // Companion stats: completed runs level the companion up.
    try {
      const utRow = await prisma.userTask.findUnique({ where: { id: userTaskId }, select: { companionId: true } });
      if (utRow?.companionId) {
        const { recordTaskCompleted } = await import('@/lib/intelligence/companion/service');
        await recordTaskCompleted(utRow.companionId);
      }
    } catch {}

    // N3: terminal why-trace — COMPLETED names its blocked/failed steps.
    try {
      const final = await prisma.userTask.findUnique({ where: { id: userTaskId }, select: { stepResults: true } });
      const raw = final?.stepResults;
      const log = Array.isArray(raw) ? raw as any[] : [];
      const bad = log.filter((e) => e.status === 'blocked' || e.status === 'failed');
      void recordTrace({
        userId,
        kind: 'STEP',
        subject: task?.title ?? 'task',
        summary: bad.length === 0 ? 'Run finished: every step done.' : `Run finished with ${bad.length} non-done step(s).`,
        reasons: bad.slice(0, 5).map((e) => `${e.title ?? 'step'}: ${e.status}${e.output ? ` — ${String(e.output).slice(0, 200)}` : ''}`),
      });
    } catch {}
    await prisma.userTask.update({ where: { id: userTaskId }, data: { status: 'COMPLETED', completedAt: new Date() } });
  } catch (err: any) {
    void recordTrace({ userId, kind: 'STEP', subject: 'run', summary: 'Run failed outright.', reasons: [String(err?.message ?? 'unknown').slice(0, 500)] });
    await prisma.userTask.update({ where: { id: userTaskId }, data: { status: 'FAILED' } });
    console.error('[EXECUTION_ENGINE] run failed:', err.message);
  }
}

async function queueApproval(
  userTaskId: string,
  userId: string,
  stepIndex: number,
  step: ReturnType<typeof parseSteps>[number],
  deps: EngineDeps
): Promise<void> {
  await prisma.approval.create({
    data: {
      userId,
      userTaskId,
      stepIndex,
      status: 'PENDING',
      action: { title: step.title, description: step.description, action: step.action } as any,
    },
  });
  await (deps.notify ?? DEFAULT_NOTIFY)(
    userId,
    'Your companion needs one click',
    `Step ${stepIndex + 1} ("${step.title}") is ready to go out. Review and approve it in your Approval Inbox.`
  );
}

/** Approving a gate marks it approved and resumes an AUTOPILOT run after it. */
export async function approveGate(approvalId: string, userId: string, deps: EngineDeps = {}): Promise<StartResult> {
  deps = await resolveDeps(userId, deps);
  const approval = await prisma.approval.findUnique({ where: { id: approvalId }, include: { userTask: true } });
  if (!approval || approval.userId !== userId) return { ok: false, error: 'Not found' };
  if (approval.status !== 'PENDING') return { ok: false, error: 'Already reviewed' };

  await prisma.approval.update({ where: { id: approvalId }, data: { status: 'APPROVED', reviewedAt: new Date() } });

  const ut = approval.userTask;
  const taskRow = await prisma.task.findUnique({ where: { id: ut.taskId }, select: { title: true, steps: true } });
  const steps = parseSteps(taskRow?.steps);
  const step = steps[approval.stepIndex];

  // The gate was the only thing holding this step back — now it actually runs.
  if (step) {
    try {
      const ctx = await buildContext(ut.id, userId, approval.stepIndex, taskRow?.title ?? 'task');
      const { outcome, timing } = await executeTimed(runnerFor(deps), step, ctx);
      await recordOutcome(ut.id, approval.stepIndex, step, outcome, timing);
    } catch (err: any) {
      const now = new Date().toISOString();
      await appendStepResult(ut.id, approval.stepIndex, {
        title: step.title,
        action: step.action,
        status: 'failed',
        output: err.message,
        startedAt: now,
        finishedAt: now,
        durationMs: 0,
      });
    }
  } else {
    await appendStepResult(ut.id, approval.stepIndex, { status: 'approved_by_user' });
  }

  if (ut.mode === 'AUTOPILOT') {
    const resume = runAutopilot(ut.id, userId, ut.taskId, steps, approval.stepIndex + 1, deps);
    if (deps.awaitLoops) await resume;
  }
  return { ok: true, userTaskId: ut.id };
}

export async function rejectGate(approvalId: string, userId: string, deps: EngineDeps = {}): Promise<StartResult> {
  deps = await resolveDeps(userId, deps);
  const approval = await prisma.approval.findUnique({ where: { id: approvalId }, include: { userTask: true } });
  if (!approval || approval.userId !== userId) return { ok: false, error: 'Not found' };
  if (approval.status !== 'PENDING') return { ok: false, error: 'Already reviewed' };

  await prisma.approval.update({ where: { id: approvalId }, data: { status: 'REJECTED', reviewedAt: new Date() } });
  const ut = approval.userTask;
  await appendStepResult(ut.id, approval.stepIndex, { status: 'rejected_by_user' });

  if (ut.mode === 'AUTOPILOT') {
    const steps = parseSteps((await prisma.task.findUnique({ where: { id: ut.taskId }, select: { steps: true } }))?.steps);
    const resume = runAutopilot(ut.id, userId, ut.taskId, steps, approval.stepIndex + 1, deps);
    if (deps.awaitLoops) await resume;
  }
  return { ok: true, userTaskId: ut.id };
}

async function buildRunContext(userTaskId: string, taskTitle: string) {
  const ut = await prisma.userTask.findUnique({
    where: { id: userTaskId },
    select: { stepResults: true, companionId: true },
  });
  const log = Array.isArray(ut?.stepResults) ? (ut!.stepResults as any[]) : [];
  const previousResults = log.filter((e) => e.status === 'done').map((e) => `${e.title}: ${String(e.output).slice(0, 400)}`);

  let companionName = 'Nova';
  if (ut?.companionId) {
    const c = await prisma.companion.findUnique({ where: { id: ut.companionId }, select: { name: true } });
    if (c?.name) companionName = c.name;
  }
  return { taskTitle, companionName, previousResults };
}

async function buildContext(
  userTaskId: string,
  userId: string,
  stepIndex: number,
  taskTitle: string
): Promise<StepContext> {
  const base = await buildRunContext(userTaskId, taskTitle);
  return { ...base, userId, userTaskId, stepIndex };
}


