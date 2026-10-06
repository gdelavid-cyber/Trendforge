import { executeShell } from './shell';
import { writeFile, readFile, listDirectory } from './fs';
import { updateVentureProgress } from './venture';

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export const STATION_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'shell_exec',
      description: 'Execute a bash/shell command inside the isolated project sandbox (e.g. npm test, git status, compiling code).',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'The shell command line to run.' },
          timeoutMs: { type: 'number', description: 'Timeout in milliseconds (default 30000).' },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fs_write',
      description: 'Write or overwrite a file in the workspace sandbox.',
      parameters: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Relative path of the file to write.' },
          content: { type: 'string', description: 'The file contents.' },
        },
        required: ['filePath', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fs_read',
      description: 'Read the contents of a file in the workspace sandbox.',
      parameters: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Relative path of the file to read.' },
          maxLines: { type: 'number', description: 'Maximum lines to return (default 500).' },
        },
        required: ['filePath'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fs_list',
      description: 'List files and directories in a workspace folder.',
      parameters: {
        type: 'object',
        properties: {
          dirPath: { type: 'string', description: 'Relative path to list (default ".").' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'venture_update',
      description: 'Update the Trendforge venture lifecycle state and record progress in the venture OS.',
      parameters: {
        type: 'object',
        properties: {
          ventureId: { type: 'string', description: 'ID of the venture to update.' },
          statusSummary: { type: 'string', description: 'Human-readable progress summary.' },
          lifecycleState: {
            type: 'string',
            enum: ['DISCOVERY', 'VALIDATION', 'OFFER_CREATION', 'BUILDING', 'PRE_LAUNCH', 'LAUNCHED', 'SCALING'],
            description: 'New lifecycle state if progressing.',
          },
        },
        required: ['ventureId'],
      },
    },
  },
];

export async function executeToolCall(name: string, args: Record<string, any>): Promise<any> {
  switch (name) {
    case 'shell_exec':
      return await executeShell({ command: args.command, timeoutMs: args.timeoutMs });
    case 'fs_write':
      return await writeFile(args.filePath, args.content);
    case 'fs_read':
      return await readFile(args.filePath, args.maxLines);
    case 'fs_list':
      return await listDirectory(args.dirPath || '.');
    case 'venture_update':
      return await updateVentureProgress(args as any);
    default:
      throw new Error(`Unknown tool "${name}". Available tools: ${STATION_TOOL_DEFINITIONS.map(t => t.function.name).join(', ')}`);
  }
}
