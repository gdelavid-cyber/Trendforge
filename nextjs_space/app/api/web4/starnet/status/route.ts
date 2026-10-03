export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { decryptSecret } from '@/lib/core/encryption';
import { checkStarNetCapabilities } from '@/lib/execution/starnet-serve';

/**
 * GET /api/web4/starnet/status
 * Queries the user's connected StarNet Station (or platform STARNET_SERVE_URL)
 * for live health, active floor furniture capabilities, and crew models.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const requiredParam = url.searchParams.get('required') || '';
    const requiredCapabilities = requiredParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const userLlm = user
      ? await prisma.userLlmKey.findUnique({ where: { userId: user.id } })
      : null;

    const baseUrl =
      (userLlm?.provider === 'starnet' ? userLlm.baseUrl : null) ||
      process.env.STARNET_SERVE_URL ||
      'http://127.0.0.1:8787';
    const apiKey =
      (userLlm?.provider === 'starnet' && userLlm.encryptedKey
        ? decryptSecret(userLlm.encryptedKey)
        : null) ||
      process.env.STARNET_API_KEY ||
      '';

    const status = await checkStarNetCapabilities({
      baseUrl,
      apiKey,
      requiredCapabilities,
    });

    return NextResponse.json({
      success: true,
      baseUrl,
      status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to check StarNet Station status' },
      { status: 500 }
    );
  }
}
