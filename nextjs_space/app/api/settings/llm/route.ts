export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { encryptSecret, decryptSecret, maskSecret } from '@/lib/encryption';

const PROVIDERS = new Set(['openrouter', 'custom']);

/** GET — the user's connected brain (key always masked, never raw). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: session.user.email } });
    const row = await prisma.userLlmKey.findUnique({ where: { userId: user.id } });
    if (!row) return NextResponse.json({ success: true, connected: false });
    return NextResponse.json({
      success: true,
      connected: true,
      config: {
        provider: row.provider,
        model: row.model,
        baseUrl: row.baseUrl,
        maskedKey: maskSecret(row.encryptedKey),
        updatedAt: row.updatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lookup failed' }, { status: 500 });
  }
}

/** PUT — connect or update the personal brain. */
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: session.user.email } });
    const body = await request.json();

    const provider = typeof body?.provider === 'string' ? body.provider.trim() : '';
    const model = typeof body?.model === 'string' ? body.model.trim().slice(0, 120) : '';
    const baseUrlRaw = typeof body?.baseUrl === 'string' ? body.baseUrl.trim() : '';
    const apiKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : '';

    if (!PROVIDERS.has(provider)) {
      return NextResponse.json({ error: "provider must be 'openrouter' or 'custom'" }, { status: 400 });
    }
    if (!model) return NextResponse.json({ error: 'model is required' }, { status: 400 });

    const existing = await prisma.userLlmKey.findUnique({ where: { userId: user.id } });
    if (!apiKey && !existing) {
      return NextResponse.json({ error: 'apiKey is required' }, { status: 400 });
    }

    let baseUrl: string | null = null;
    if (provider === 'custom') {
      if (!baseUrlRaw) {
        return NextResponse.json({ error: 'baseUrl is required for custom providers' }, { status: 400 });
      }
      try {
        const url = new URL(baseUrlRaw);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('bad protocol');
        baseUrl = url.toString().replace(/\/+$/, '');
      } catch {
        return NextResponse.json({ error: 'baseUrl must be a valid http(s) URL' }, { status: 400 });
      }
    }

    const encryptedKey = apiKey ? encryptSecret(apiKey) : existing!.encryptedKey;

    await prisma.userLlmKey.upsert({
      where: { userId: user.id },
      create: { userId: user.id, provider, model, baseUrl, encryptedKey },
      update: { provider, model, baseUrl, encryptedKey },
    });

    return NextResponse.json({
      success: true,
      config: { provider, model, baseUrl, maskedKey: maskSecret(apiKey || decryptSecret(encryptedKey)) },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Save failed' }, { status: 500 });
  }
}

/** DELETE — disconnect the personal brain and fall back to platform defaults. */
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: session.user.email } });
    await prisma.userLlmKey.deleteMany({ where: { userId: user.id } });
    return NextResponse.json({ success: true, connected: false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Delete failed' }, { status: 500 });
  }
}
