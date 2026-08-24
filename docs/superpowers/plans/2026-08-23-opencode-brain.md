# S4.5 Implementation Plan — opencode/ox-alpha Brain Wiring

Goal: companions think through opencode's ox-alpha free model where available,
and the Talk companion becomes task-aware — it sees your active task and can
drive the execution engine conversationally.

## Reality established by probe
- `opencode run --model opencode/x-preview-f-free "<prompt>"` works scripted;
  returns stdout with ANSI noise to strip.
- `opencode serve` exists for headless HTTP at machine scale (future).
- Vercel prod cannot carry local auth → prod keeps Gemini/Abacus chain.
  Dev gets free unlimited brains.

## Tasks

### T1 — Provider adapter (`lib/execution/llm.ts`)
- `makeLlm(): LlmFn` reading env:
  - `LLM_PROVIDER=opencode` → shell `opencode run --model $OPENCODE_MODEL <flattened prompt>` via child_process.execFile (120s timeout, ANSI-stripped stdout)
  - otherwise → existing `callLLM`
- Engine default LLM = `makeLlm()`.
- Unit test: adapter dispatch + message flattening (exec injected).

### T2 — Chat brain provider chain (`lib/agent/brain.ts`)
Text generation order becomes:
1. `LLM_PROVIDER=opencode` → adapter (dev brain, task-aware prompt below)
2. Gemini key → existing path
3. Heuristic fallback (unchanged)

### T3 — Task-aware companion
`buildTaskContext(userId)`: latest active UserTask (STEP_EXECUTING /
PENDING_APPROVAL / IN_PROGRESS) → { title, steps[], currentStep, mode,
pendingGate } injected into the system prompt so the companion guides the
user through their actual task.

### T4 — Conversational execution tools
Brain may emit two new markers, executed server-side against the S2 engine
and reported back in `toolExecution`:
- `[RUN_NEXT_STEP taskId]` → CO_PILOT single-step run
- `[START_AUTOPILOT taskId]` → Autopilot (still gated by AUTOPILOT_ENABLED)
Existing `[EXECUTE_TOOL]` agent-runs untouched.

## Env (local .env only)
LLM_PROVIDER=opencode · OPENCODE_MODEL=opencode/x-preview-f-free

## Verification
tsc + suite green; live probe: adapter returns real completion locally;
brain probe: ask companion "help me with my task" locally and observe
task-context reply.
