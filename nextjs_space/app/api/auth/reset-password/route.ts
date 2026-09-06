export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/core/db';
import crypto from 'crypto';

// Consumes a password-reset token: verifies hash + expiry + single use,
// then sets the new password and burns the token.
export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    if (!token || typeof password !== 'string' || password.length < 12) {
      return NextResponse.json({ error: 'Valid token and a 12+ character password are required.' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
    const user = await prisma.user.findFirst({
      where: { passwordResetToken: tokenHash },
    });
    if (!user || !user.passwordResetExpires || user.passwordResetExpires.getTime() <= Date.now()) {
      return NextResponse.json({ error: 'Reset link is invalid or expired.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordResetToken: null, passwordResetExpires: null },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Password reset failed.' }, { status: 500 });
  }
}
