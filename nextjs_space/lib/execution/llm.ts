import path from 'path';
import { type StarNetRunOptions } from './starnet-serve';


// Pluggable brain for companions and the execution engine.
//
//   LLM_PROVIDER=starnet   → StarNet Station sidecar (/v1/chat/completions on :8787).
//                            Routes tasks to your StarNet crew with tenant-isolated
//                            X-StarNet-Session-Id headers and truthful capdenied reporting.
//   LLM_PROVIDER=opencode  → local opencode install (e.g. ox-alpha free).
//                            Zero API keys, dev-only: serverless prod cannot
//                            carry local auth.
//       OPENCODE_SERVE_URL → talks to a persistent `opencode serve` HTTP
//                            instance (fast, no process spawn per call).
//       (unset)            → spawns `opencode run` per call (~20-35s, stdin
//                            prompt contract, Windows .exe resolution below).
//   (unset/anything else)  → callLLM: OpenAI / Abacus endpoints.

export type ChatMessage = { role: string; content: string };

export type LlmFn = (
  messages: ChatMessage[],
  jsonMode?: boolean
) => Promise<string>;

const OPENCODE_TIMEOUT_MS = 120_000;

/** Flattens chat messages into one prompt for single-shot CLI models. */
export function flattenMessages(messages: { role: string; content: string }[]): string {
  return messages
    .map((m) => {
      const tag = m.role === 'system' ? 'INSTRUCTIONS' : m.role === 'assistant' ? 'YOUR PREVIOUS REPLY' : 'USER';
      return `${tag}:\n${m.content}`;
    })
    .join('\n\n');
}

export function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, '').trim();
}

/**
 * Resolves the opencode executable. Windows npm installs expose .ps1/.cmd
 * shims that execFile cannot spawn directly, so we prefer the real
 * opencode.exe inside the global npm tree. Override with OPENCODE_BIN.
 */
function resolveOpencodeBin(): string {
  if (process.env.OPENCODE_BIN) return process.env.OPENCODE_BIN;
  if (process.platform === 'win32' && process.env.APPDATA) {
    return path.join(process.env.APPDATA, 'npm', 'node_modules', 'opencode-ai', 'bin', 'opencode.exe');
  }
  return 'opencode';
}

/**
 * Runs the prompt through the opencode CLI.
 * When spawned with a pipe for stdin, `opencode run` reads the message from
 * stdin (verified empirically on Windows); argv messages are ignored there,
 * so we always feed the flattened prompt via stdin and close it.
 */
function runOpencode(bin: string, model: string, prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Dynamic require so browser/webpack client bundles do not attempt to resolve child_process
    const { spawn } = require('child_process');
    const child = spawn(
      bin,
      ['run', '--model', model],
      { stdio: ['pipe', 'pipe', 'pipe'], timeout: OPENCODE_TIMEOUT_MS }
    );
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d: any) => (stdout += d));
    child.stderr.on('data', (d: any) => (stderr += d));
    const timer = setTimeout(() => child.kill(), OPENCODE_TIMEOUT_MS);
    child.on('error', (e: any) => { clearTimeout(timer); reject(e); });
    child.on('close', (code: any) => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout);
      else reject(new Error(`opencode exited ${code}: ${stderr.slice(0, 300)}`));
    });
    child.stdin.write(prompt);
    child.stdin.end();
  });
}

export function opencodeRunLlm(
  model: string = process.env.OPENCODE_MODEL || 'opencode/x-preview-f-free'
): LlmFn {
  const bin = resolveOpencodeBin();

  return async (messages) => {
    const prompt = flattenMessages(messages);
    let raw: string;
    try {
      raw = await runOpencode(bin, model, prompt);
    } catch (err: any) {
      // Fallback to PATH lookup (macOS/linux, or non-standard installs).
      if (bin !== 'opencode') {
        raw = await runOpencode('opencode', model, prompt);
      } else {
        throw err;
      }
    }
    // Strip ANSI noise and the "> build · <model>" banner line.
    return stripAnsi(raw)
      .split('\n')
      .filter((line) => !line.startsWith('> '))
      .join('\n')
      .trim();
  };
}

export function makeLlm(opts?: StarNetRunOptions): LlmFn {
  return async (messages: ChatMessage[], jsonMode?: boolean) => {
    const { kernelRuntime } = await import('@/lib/runtime/kernel');
    return kernelRuntime.call({
      messages,
      jsonMode,
      userId: opts?.userId,
      runId: opts?.sessionId || opts?.taskId,
      agentId: opts?.agent || opts?.model || 'starnet-runner',
      modelOverride: opts?.model,
      providerOverride: process.env.LLM_PROVIDER as any,
      gateType: 'model_routing',
    });
  };
}
