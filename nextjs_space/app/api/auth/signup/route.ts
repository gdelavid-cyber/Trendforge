export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { sendNotificationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body ?? {};

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name: name ?? email.split('@')[0], passwordHash },
    });

    // Send welcome email (non-blocking)
    sendNotificationEmail({
      notificationId: process.env.NOTIF_ID_WELCOME_EMAIL ?? '',
      recipientEmail: email,
      subject: 'Welcome to Trendly!',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0F; color: #E8E8E8; padding: 32px;">
        <h1 style="color: #F5A623;">Welcome to Trendly!</h1>
        <p>Hi ${name ?? 'there'},</p>
        <p>You're now part of a community turning viral trends into real income.</p>
        <p>Explore verified money-making tasks based on the hottest trending opportunities.</p>
        <p style="color: #F5A623; font-weight: bold;">Start building your wealth today!</p>
      </div>`,
      isHtml: true,
    }).catch(() => {});

    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
