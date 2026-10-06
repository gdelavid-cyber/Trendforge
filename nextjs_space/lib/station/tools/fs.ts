import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

const WORKSPACE_ROOT = path.resolve(process.cwd(), 'lib/station/workspace');

function resolveSafePath(filePath: string): string {
  const resolved = path.resolve(WORKSPACE_ROOT, filePath);
  if (!resolved.startsWith(WORKSPACE_ROOT)) {
    throw new Error(`Security fence: Path "${filePath}" attempts to traverse outside workspace sandbox.`);
  }
  return resolved;
}

export async function writeFile(filePath: string, content: string): Promise<{ success: boolean; bytes: number; path: string }> {
  const safe = resolveSafePath(filePath);
  const dir = path.dirname(safe);
  if (!fsSync.existsSync(dir)) {
    await fs.mkdir(dir, { recursive: true });
  }
  await fs.writeFile(safe, content, 'utf8');
  return { success: true, bytes: Buffer.byteLength(content, 'utf8'), path: path.relative(WORKSPACE_ROOT, safe) };
}

export async function readFile(filePath: string, maxLines = 500): Promise<{ content: string; lines: number; truncated: boolean }> {
  const safe = resolveSafePath(filePath);
  if (!fsSync.existsSync(safe)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const text = await fs.readFile(safe, 'utf8');
  const allLines = text.split(/\r?\n/);
  const truncated = allLines.length > maxLines;
  const content = allLines.slice(0, maxLines).join('\n');
  return { content, lines: allLines.length, truncated };
}

export async function listDirectory(dirPath = '.'): Promise<{ files: string[]; directories: string[] }> {
  const safe = resolveSafePath(dirPath);
  if (!fsSync.existsSync(safe)) {
    throw new Error(`Directory not found: ${dirPath}`);
  }
  const entries = await fs.readdir(safe, { withFileTypes: true });
  const files: string[] = [];
  const directories: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) directories.push(entry.name);
    else if (entry.isFile()) files.push(entry.name);
  }

  return { files, directories };
}
