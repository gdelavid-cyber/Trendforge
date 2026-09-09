import { NextRequest, NextResponse } from 'next/server';
import { resumeStalled } from '@/lib/execution/orchestrator';
import { validatePipelineKey } from '@/lib/pipeline';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!validatePipelineKey(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const resumed = await resumeStalled(5);
  return NextResponse.json({ resumed });
}
