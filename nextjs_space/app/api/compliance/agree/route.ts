export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { isOver18, riskAcknowledged, termsAccepted } = body;

    const agreement = await prisma.complianceAgreement.create({
      data: {
        userId: user.id,
        isOver18: isOver18 ?? true,
        riskAcknowledged: riskAcknowledged ?? true,
        termsAccepted: termsAccepted ?? true,
        agreedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, agreement });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Agreement record failed' }, { status: 500 });
  }
}
