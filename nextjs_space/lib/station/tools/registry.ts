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
  {
    type: 'function',
    function: {
      name: 'hmhu_collaborate',
      description: 'Engage the "Help Me Help U" symbiotic protocol: report tangible value/artifacts built so far, present the commander with a high-leverage question or decision with 1-click options to unblock the next phase, and define the next autonomous milestone.',
      parameters: {
        type: 'object',
        properties: {
          valueDelivered: { type: 'string', description: 'Clear summary of what concrete value or code was produced this turn.' },
          category: { type: 'string', enum: ['CODE', 'INTEL', 'LEADS', 'VENTURE', 'DEPLOYMENT'], description: 'Category of value delivered.' },
          askType: { type: 'string', enum: ['DECISION', 'CREDENTIAL', 'APPROVAL', 'CREATIVE_INPUT', 'STRATEGY'], description: 'Type of leverage needed from commander.' },
          question: { type: 'string', description: 'The exact question or decision needed.' },
          context: { type: 'string', description: 'Why this decision unlocks the next phase.' },
          recommendedAction: { type: 'string', description: 'The recommended default choice.' },
          options: { type: 'array', items: { type: 'string' }, description: '2 to 4 distinct choices for 1-click commander action.' },
          nextAutonomousStep: { type: 'string', description: 'What you will immediately execute once answered.' },
        },
        required: ['valueDelivered', 'question'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'hmhu_deliver_value',
      description: 'Log a completed value milestone or deliverable without pausing the autonomous execution loop.',
      parameters: {
        type: 'object',
        properties: {
          summary: { type: 'string', description: 'Summary of the completed milestone.' },
          category: { type: 'string', enum: ['CODE', 'INTEL', 'LEADS', 'VENTURE', 'DEPLOYMENT'], description: 'Category of deliverable.' },
          metrics: { type: 'object', description: 'Arbitrary quantitative metrics (e.g. leads count, cost saved, speed).' },
        },
        required: ['summary'],
      },
    },
  },
];

export async function executeToolCall(name: string, args: Record<string, any>, context?: { runId?: string; ventureId?: string }): Promise<any> {
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
    case 'hmhu_collaborate': {
      const { executeHmhuCollaborate } = await import('./hmhu');
      return await executeHmhuCollaborate({
        ...args,
        runId: context?.runId,
        ventureId: context?.ventureId,
      } as any);
    }
    case 'hmhu_deliver_value': {
      const { executeHmhuDeliverValue } = await import('./hmhu');
      return await executeHmhuDeliverValue({
        ...args,
        runId: context?.runId,
        ventureId: context?.ventureId,
      } as any);
    }
    default:
      throw new Error(`Unknown tool "${name}". Available tools: ${STATION_TOOL_DEFINITIONS.map(t => t.function.name).join(', ')}`);
  }
}

