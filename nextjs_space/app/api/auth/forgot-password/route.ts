export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { sendPasswordResetEmail } from '@/lib/experience/email/sendgrid';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (user) {
      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Dispatch password reset email via SendGrid
      await sendPasswordResetEmail(user.email, resetToken);
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, instructions have been dispatched.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
