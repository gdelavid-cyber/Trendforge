import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { TASK_BLUEPRINTS } from '@/lib/execution/blueprints';

export async function GET(req: NextRequest) {
  try {
    const customBlueprints = await prisma.taskBlueprint.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const defaultList = Object.values(TASK_BLUEPRINTS);

    return NextResponse.json({
      success: true,
      defaults: defaultList,
      custom: customBlueprints,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : 'user';

    const body = await req.json();
    const { name, category, description, milestones, salesPipelineConfig } = body;

    if (!name || !category || !milestones) {
      return NextResponse.json({ success: false, error: 'Missing required blueprint fields' }, { status: 400 });
    }

    const blueprint = await prisma.taskBlueprint.create({
      data: {
        name,
        category,
        description: description || null,
        milestones: milestones as any,
        salesPipelineConfig: salesPipelineConfig || {},
        isCustom: true,
        createdBy: userId,
      },
    });

    return NextResponse.json({ success: true, blueprint });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
