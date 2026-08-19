export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any)?.id;
    const { skills, riskTolerance, currentPassword, newPassword } = await request.json();

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const updateData: any = {};
    if (skills) updateData.skills = skills;
    if (riskTolerance) updateData.riskTolerance = riskTolerance;

    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }
      if (existingUser.passwordHash && currentPassword) {
        const isMatch = await bcrypt.compare(currentPassword, existingUser.passwordHash);
        if (!isMatch) {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
        }
      }
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({ success: true, passwordUpdated: !!newPassword });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to update profile' }, { status: 500 });
  }
}
