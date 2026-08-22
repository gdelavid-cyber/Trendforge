import { SKILLS_LIBRARY, SkillDefinition } from './skills-library';

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

  // Simulated live execution payload return
  return {
    tool: toolName,
    status: 'SUCCESS',
    timestamp: Date.now(),
    computeBurnUsdc: skill.computeCostUsdc,
    result: {
      summary: `Successfully executed ${skill.name}`,
      dataGenerated: { ...args, sampleYield: 150 + Math.random() * 350 },
    },
  };
}
