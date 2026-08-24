export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getOrCreatePrimary } from '@/lib/companion/service';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: session.user.email } });
    const companion = await getOrCreatePrimary(user.id);
    return NextResponse.json({ success: true, companion });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Companion lookup failed' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: session.user.email } });
    const companion = await getOrCreatePrimary(user.id);

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (typeof body?.name === 'string' && body.name.trim()) {
      data.name = body.name.trim().slice(0, 40);
    }
    if (body?.personality && typeof body.personality === 'object') {
      data.personality = body.personality;
    }
    if (body?.config && typeof body.config === 'object') {
      // Merge config keys rather than replace, so partial updates are safe.
      data.config = { ...(companion.config as object ?? {}), ...body.config };
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const updated = await prisma.companion.update({ where: { id: companion.id }, data });
    return NextResponse.json({ success: true, companion: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Companion update failed' }, { status: 500 });
  }
}
