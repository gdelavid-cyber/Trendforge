import { SKILLS_LIBRARY, SkillDefinition } from './skills-library';
import { executeSkill } from './executor';

/**
 * Model Context Protocol (MCP) Server Adapter
 * Allows external LLMs and autonomous agents to discover and invoke Trendly tools via standard JSON-RPC.
 */

export interface MCPToolManifest {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
}

export function getMCPToolManifest(): MCPToolManifest[] {
  return SKILLS_LIBRARY.map((skill) => ({
    name: skill.id,
    description: `[Category: ${skill.category}] ${skill.description} (Compute: ${skill.computeCostUsdc} USDC)`,
    inputSchema: {
      type: 'object',
      properties: skill.inputs.reduce((acc, input) => {
        acc[input.name] = {
          type: input.type,
          description: input.placeholder || `${input.name} parameter`,
        };
        return acc;
      }, {} as any),
      required: skill.inputs.filter((i) => i.required).map((i) => i.name),
    },
  }));
}

export async function executeMCPTool(toolName: string, args: any): Promise<any> {
  const skill = SKILLS_LIBRARY.find((s) => s.id === toolName);
  if (!skill) {
    throw new Error(`MCP Tool ${toolName} not registered.`);
  }

  // Real execution when an executor exists; otherwise an explicitly-labeled sim.
  const res = await executeSkill(toolName, args ?? {});
  return {
    tool: toolName,
    status: res.status,
    simulated: res.simulated,
    timestamp: Date.now(),
    computeBurnUsdc: res.computeBurnUsdc,
    outputSummary: res.outputSummary,
    result: res.result,
    error: res.error,
  };
}
