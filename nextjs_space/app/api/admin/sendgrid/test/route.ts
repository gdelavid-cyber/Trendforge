export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { sendEmail } from '@/lib/experience/email/sendgrid';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const body = await request.json();
    const { testEmail = session.user.email || 'admin@trendly.ai' } = body ?? {};

    const result = await sendEmail({
      to: testEmail,
      subject: '⚡ Trendly SendGrid Integration Verification',
      html: `
        <div style="font-family: monospace; background: #07070C; color: #FFFFFF; padding: 24px; border-radius: 8px; border: 1px solid #00F0FF;">
          <h2 style="color: #00F0FF;">[SENDGRID] VERIFICATION 200 OK</h2>
          <p style="color: #8892B0;">This test email confirms your SendGrid API Key and Sender identity are configured and operating with full deliverability.</p>
          <p style="color: #FFD700;">Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Verification email dispatched to ${testEmail}!`,
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to dispatch email via SendGrid',
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('SendGrid test error:', error);
    return NextResponse.json({ error: error?.message || 'SendGrid test failure' }, { status: 500 });
  }
}
