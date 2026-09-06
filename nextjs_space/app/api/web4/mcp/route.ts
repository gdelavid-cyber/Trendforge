export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getMCPToolManifest, executeMCPTool } from '@/lib/intelligence/tools/mcp';
import { billCompute, getSessionUser, unauthorized } from '@/lib/core/route-auth';

// Model Context Protocol (MCP) JSON-RPC Discovery & Tool Gateway
export async function GET() {
  const tools = getMCPToolManifest();
  return NextResponse.json({
    protocol: 'mcp',
    version: '2024-11-05',
    serverInfo: {
      name: 'trendly-web4-mcp-gateway',
      version: '2.4.0',
    },
    tools,
  });
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const billed = await billCompute(user.id, 'MCP tool invocation');
    if (billed) return billed;
    const body = await request.json();
    const { tool, arguments: args } = body;

    if (!tool) {
      return NextResponse.json({ error: 'Missing tool name' }, { status: 400 });
    }

    const result = await executeMCPTool(tool, args || {});
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'MCP execution failed' }, { status: 500 });
  }
}
