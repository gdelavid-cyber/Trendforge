export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getMCPToolManifest, executeMCPTool } from '@/lib/intelligence/tools/mcp';
import { billCompute, checkCronAuth, getSessionUser, unauthorized } from '@/lib/core/route-auth';

function matchesStarNetServiceKey(request: Request): boolean {
  const starnetKey = process.env.STARNET_API_KEY?.trim();
  if (!starnetKey || starnetKey.length < 16) return false;
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  const apiKey = request.headers.get('x-api-key')?.trim();
  const candidate = bearer || apiKey;
  if (!candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(starnetKey);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Model Context Protocol (MCP) JSON-RPC 2.0 Streamable-HTTP & REST Tool Gateway
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
    const isServiceAuthed =
      !user && (checkCronAuth(request).authorized || matchesStarNetServiceKey(request));

    if (!user && !isServiceAuthed) {
      return unauthorized();
    }

    const body = await request.json();

    // Standard MCP JSON-RPC 2.0 Streamable-HTTP surface (used by StarNet & external MCP harnesses)
    if (body && body.jsonrpc === '2.0') {
      const { id = null, method, params } = body;

      if (method === 'initialize') {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: { listChanged: false } },
            serverInfo: {
              name: 'trendly-web4-mcp-gateway',
              version: '2.4.0',
            },
          },
        });
      }

      if (method === 'notifications/initialized') {
        return new NextResponse(null, { status: 204 });
      }

      if (method === 'ping') {
        return NextResponse.json({ jsonrpc: '2.0', id, result: {} });
      }

      if (method === 'tools/list') {
        const tools = getMCPToolManifest();
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: { tools },
        });
      }

      if (method === 'tools/call') {
        const toolName = params?.name;
        const toolArgs = params?.arguments || {};
        if (!toolName) {
          return NextResponse.json(
            {
              jsonrpc: '2.0',
              id,
              error: { code: -32602, message: 'Invalid params: missing tool name' },
            },
            { status: 400 }
          );
        }

        if (user) {
          const billed = await billCompute(user.id, `MCP tool invocation: ${toolName}`);
          if (billed) return billed;
        }

        const execResult = await executeMCPTool(toolName, toolArgs);
        const isError = execResult.status === 'FAILED' || execResult.status === 'pending';

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(execResult, null, 2),
              },
            ],
            isError,
            structuredContent: execResult,
          },
        });
      }

      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${String(method)}` },
        },
        { status: 404 }
      );
    }

    // Legacy REST format ({ tool, arguments / args })
    if (user) {
      const billed = await billCompute(user.id, 'MCP tool invocation');
      if (billed) return billed;
    }

    const tool = body?.tool;
    const args = body?.arguments ?? body?.args ?? {};

    if (!tool) {
      return NextResponse.json({ error: 'Missing tool name' }, { status: 400 });
    }

    const result = await executeMCPTool(tool, args);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'MCP execution failed' }, { status: 500 });
  }
}
