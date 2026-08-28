import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateSalesKitForTask } from '@/lib/sales/sales-engine';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    let salesKit = await prisma.salesKit.findFirst({
      where: { taskId },
    });

    if (!salesKit) {
      salesKit = (await generateSalesKitForTask(taskId)) as any;
    }

    return NextResponse.json({ success: true, salesKit });
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
    const userId = session?.user ? (session.user as any).id : undefined;
    const taskId = params.id;

    const salesKit = await generateSalesKitForTask(taskId, userId);
    return NextResponse.json({ success: true, salesKit });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
