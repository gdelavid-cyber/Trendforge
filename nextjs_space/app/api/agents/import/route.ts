export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { importAgentFromJSON } from '@/lib/experience/export/agent-exporter';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { package: exportPackage } = body;

    if (!exportPackage) {
      return NextResponse.json({ error: 'Missing export package JSON' }, { status: 400 });
    }

    const importedAgent = await importAgentFromJSON(user.id, exportPackage);
    return NextResponse.json({ success: true, agent: importedAgent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Import failed' }, { status: 500 });
  }
}
