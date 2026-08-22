export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { exportAgentToJSON } from '@/lib/export/agent-exporter';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { agentId } = body;

    if (!agentId) {
      return NextResponse.json({ error: 'Missing agentId parameter' }, { status: 400 });
    }

    const exportPackage = await exportAgentToJSON(agentId);
    return NextResponse.json({ success: true, exportPackage });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 });
  }
}
