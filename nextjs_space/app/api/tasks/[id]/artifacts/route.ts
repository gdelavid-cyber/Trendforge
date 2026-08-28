import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    const artifacts = await prisma.artifact.findMany({
      where: { taskId },
      include: { milestone: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, artifacts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : null;
    const taskId = params.id;

    const body = await req.json();
    const { name, type, storageUrl, previewUrl, metadata, milestoneId } = body;

    if (!name || !storageUrl) {
      return NextResponse.json({ success: false, error: 'Missing required artifact fields' }, { status: 400 });
    }

    const fileHash = crypto.createHash('sha256').update(name + storageUrl + Date.now()).digest('hex');

    const artifact = await prisma.artifact.create({
      data: {
        taskId,
        userId,
        milestoneId: milestoneId || null,
        name,
        type: type || 'document',
        storageUrl,
        previewUrl: previewUrl || null,
        fileHash,
        metadata: metadata || {},
      },
    });

    return NextResponse.json({ success: true, artifact });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
