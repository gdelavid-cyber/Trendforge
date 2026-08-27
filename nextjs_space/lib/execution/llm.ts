import { execFile, spawn } from 'child_process';
import path from 'path';
import { callLLM } from '@/lib/pipeline';
import { opencodeServeLlm } from './opencode-serve';

// Pluggable brain for companions and the execution engine.
//
//   LLM_PROVIDER=opencode  → local opencode install (e.g. ox-alpha free).
//                            Zero API keys, dev-only: serverless prod cannot
//                            carry local auth.
//       OPENCODE_SERVE_URL → talks to a persistent `opencode serve` HTTP
//                            instance (fast, no process spawn per call).
//       (unset)            → spawns `opencode run` per call (~20-35s, stdin
//                            prompt contract, Windows .exe resolution below).
//   (unset/anything else)  → callLLM: OpenAI / Abacus endpoints.

export type LlmFn = (
  messages: { role: string; content: string }[],
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
    const child = spawn(
      bin,
      ['run', '--model', model],
      { stdio: ['pipe', 'pipe', 'pipe'], timeout: OPENCODE_TIMEOUT_MS }
    );
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    const timer = setTimeout(() => child.kill(), OPENCODE_TIMEOUT_MS);
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', (code) => {
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

export function makeLlm(): LlmFn {
  if (process.env.LLM_PROVIDER === 'opencode') {
    const serveUrl = process.env.OPENCODE_SERVE_URL;
    if (serveUrl) {
      const serveFn = opencodeServeLlm(serveUrl);
      return async (messages, jsonMode) => {
        try {
          return await serveFn(messages, jsonMode);
        } catch (err: any) {
          console.warn('[LLM] opencode serve unreachable, falling back to platform LLM:', err.message);
          return (callLLM as unknown as LlmFn)(messages, jsonMode);
        }
      };
    }
    const runFn = opencodeRunLlm();
    return async (messages, jsonMode) => {
      try {
        return await runFn(messages, jsonMode);
      } catch (err: any) {
        console.warn('[LLM] opencode run failed, falling back to platform LLM:', err.message);
        return (callLLM as unknown as LlmFn)(messages, jsonMode);
      }
    };
  }
  return callLLM as unknown as LlmFn;
}
