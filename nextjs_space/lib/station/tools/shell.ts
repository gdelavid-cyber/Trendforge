import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

const WORKSPACE_ROOT = path.resolve(process.cwd(), 'lib/station/workspace');

// Ensure workspace directory exists
if (!fs.existsSync(WORKSPACE_ROOT)) {
  fs.mkdirSync(WORKSPACE_ROOT, { recursive: true });
}

export interface ShellExecInput {
  command: string;
  cwd?: string;
  timeoutMs?: number;
}

export interface ShellExecOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

export async function executeShell(input: ShellExecInput): Promise<ShellExecOutput> {
  const { command, cwd, timeoutMs = 30000 } = input;

  // Resolve directory safely inside workspace or cwd
  const targetCwd = cwd ? path.resolve(WORKSPACE_ROOT, cwd) : WORKSPACE_ROOT;

  // Security guard against destructive host commands
  const blockedPatterns = [/rm\s+-rf\s+\/|del\s+\/s\s+[c-z]:\\/i, /format\s+[c-z]:/i, /shutdown/i];
  for (const pattern of blockedPatterns) {
    if (pattern.test(command)) {
      return {
        stdout: '',
        stderr: `Blocked: Command matched safety fence [${pattern}].`,
        exitCode: 1,
        durationMs: 0,
      };
    }
  }

  const start = Date.now();

  return new Promise((resolve) => {
    exec(command, { cwd: targetCwd, timeout: timeoutMs, maxBuffer: 1024 * 1024 * 2 }, (error, stdout, stderr) => {
      const durationMs = Date.now() - start;
      const exitCode = error ? (error.code ?? 1) : 0;
      resolve({
        stdout: stdout ? stdout.toString().trim() : '',
        stderr: stderr ? stderr.toString().trim() : (error ? error.message : ''),
        exitCode: typeof exitCode === 'number' ? exitCode : 1,
        durationMs,
      });
    });
  });
}
