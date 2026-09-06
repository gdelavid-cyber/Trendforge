import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Central gate for the swarm control plane (Phase 1). Every /api/swarm/*
// route requires a signed-in ADMIN session — no exceptions, no per-file
// checks to forget. Cron uses the separate /api/cron/* key-gated paths.
export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/swarm/')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || (token as { role?: unknown }).role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/swarm/:path*'],
};
