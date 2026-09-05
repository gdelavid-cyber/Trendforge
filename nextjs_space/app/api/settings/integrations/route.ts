export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import {
  INTEGRATION_PROVIDERS,
  PROVIDER_KEY_FIELDS,
  deleteIntegration,
  getIntegration,
  listIntegrations,
  saveIntegration,
  type IntegrationProvider,
} from '@/lib/core/vault';

function isProvider(v: unknown): v is IntegrationProvider {
  return typeof v === 'string' && (INTEGRATION_PROVIDERS as readonly string[]).includes(v);
}

/** GET — list connected integrations (masked) or fetch one provider's status. */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const user = await prismaUser(session.user.email);
    const provider = new URL(request.url).searchParams.get('provider');
    if (provider) {
      if (!isProvider(provider)) {
        return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
      }
      const connected = (await getIntegration(user.id, provider)) !== null;
      return NextResponse.json({ success: true, provider, connected });
    }
    return NextResponse.json({
      success: true,
      integrations: await listIntegrations(user.id),
      available: INTEGRATION_PROVIDERS.map((p) => ({ provider: p, fields: PROVIDER_KEY_FIELDS[p] })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lookup failed' }, { status: 500 });
  }
}

/** PUT — connect or update an integration (credentials encrypted at rest). */
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const user = await prismaUser(session.user.email);
    const body = await request.json();
    if (!isProvider(body?.provider)) {
      return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
    }
    const creds = typeof body.creds === 'object' && body.creds !== null ? body.creds : {};
    const summary = await saveIntegration({
      userId: user.id,
      provider: body.provider,
      creds,
      meta: typeof body.meta === 'object' && body.meta !== null ? body.meta : undefined,
    });
    return NextResponse.json({ success: true, integration: summary });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Save failed' }, { status: 400 });
  }
}

/** DELETE — disconnect an integration (?provider=). */
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const user = await prismaUser(session.user.email);
    const provider = new URL(request.url).searchParams.get('provider');
    if (!isProvider(provider)) {
      return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
    }
    await deleteIntegration(user.id, provider);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Delete failed' }, { status: 500 });
  }
}

async function prismaUser(email: string) {
  return prisma.user.findUniqueOrThrow({ where: { email } });
}
