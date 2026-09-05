export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { sendNotificationEmail } from '@/lib/experience/email';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { verificationStatus } = await request.json();

    const story = await prisma.successStory.update({
      where: { id: params.id },
      data: {
        verificationStatus,
        isPublished: verificationStatus === 'VERIFIED',
        verifiedAt: verificationStatus === 'VERIFIED' ? new Date() : null,
      },
      include: { user: { select: { email: true, name: true } } },
    });

    // Notify user
    if (story?.user?.email) {
      sendNotificationEmail({
        notificationId: process.env.NOTIF_ID_STORY_VERIFICATION_RESULT ?? '',
        recipientEmail: story.user.email,
        subject: `Success Story ${verificationStatus === 'VERIFIED' ? 'Verified!' : 'Update'}`,
        body: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto; background: #0A0A0F; color: #E8E8E8; padding: 32px;"><h2 style="color: #F5A623;">Story ${verificationStatus === 'VERIFIED' ? 'Verified ✅' : 'Update'}</h2><p>Hi ${story.user.name ?? 'there'},</p><p>Your success story has been ${verificationStatus?.toLowerCase()}${verificationStatus === 'VERIFIED' ? ' and is now live on Trendly!' : '.'}.</p></div>`,
        isHtml: true,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update story' }, { status: 500 });
  }
}
