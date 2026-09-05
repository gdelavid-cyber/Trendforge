import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { executeTool, getTool, listTools } from '@/lib/growth/nova/tools';

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

// List my actions (proposals, receipts) + the tool catalog.
export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Sign in to view actions.' }, { status: 401 });
  const actions = await prisma.novaAction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  return NextResponse.json({ ok: true, actions, tools: listTools() });
}

// Propose a tool call. Approval-gated tools return 202 with an actionId;
// immediate tools execute at once and return a receipt.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ ok: false, error: 'Sign in to use Nova actions.' }, { status: 401 });

    const { tool: toolName, params } = await req.json();
    const tool = typeof toolName === 'string' ? getTool(toolName) : null;
    if (!tool) return NextResponse.json({ ok: false, error: 'Unknown tool.' }, { status: 400 });

    const safeParams = params && typeof params === 'object' ? (params as Record<string, unknown>) : {};
    const invalid = tool.validate(safeParams);
    if (invalid) return NextResponse.json({ ok: false, error: invalid }, { status: 400 });

    if (!tool.requiresApproval) {
      try {
        const { receipt, remainingBalance } = await executeTool(user.id, String(user.role ?? 'FREE'), tool, safeParams);
        return NextResponse.json({ ok: true, executed: true, receipt, remainingBalance });
      } catch (e: any) {
        return NextResponse.json({ ok: false, error: e?.message ?? 'Tool failed.' }, { status: 500 });
      }
    }

    const action = await prisma.novaAction.create({
      data: { userId: user.id, tool: tool.name, params: safeParams as object, status: 'PROPOSED' },
    });
    return NextResponse.json(
      { ok: true, executed: false, actionId: action.id, status: 'PROPOSED', message: 'Proposal recorded. Approve it to execute — nothing has run yet.' },
      { status: 202 }
    );
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not record the proposal.' }, { status: 500 });
  }
}
