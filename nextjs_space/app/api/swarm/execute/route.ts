export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { validatePipelineKey, callLLM } from '@/lib/pipeline';
import { getSessionUser, requireAdminUser } from '@/lib/core/route-auth';
import { swarmMemory } from '@/lib/swarm/revenue/memory';

// Spec-compat: POST /api/swarm/execute { templateId?, trendId?, prompt?, input? }
// Pipeline-key OR admin-session authed. Creates an autonomous swarm task and,
// when prompt/input is supplied, attaches an LLM-generated build spec.
export async function POST(request: Request) {
  const isKeyValid = validatePipelineKey(request);
  if (!isKeyValid) {
    const adminUser = await requireAdminUser();
    if (!adminUser) {
      const user = await getSessionUser();
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { templateId = 'faceless_video', trendId, prompt, input } = body as {
      templateId?: string;
      trendId?: string;
      prompt?: string;
      input?: unknown;
    };

    const task = await swarmMemory.createTask({
      templateId,
      trendId,
      costEstimate: 0,
    });

    let output: Record<string, unknown> = { taskId: task.id, templateId };
    const brief = (prompt ?? (typeof input === 'string' ? input : JSON.stringify(input ?? {}))).slice(0, 2000);
    if (brief) {
      try {
        const raw = await callLLM(
          [
            {
              role: 'system',
              content:
                'You are a micro-SaaS builder. Generate an MVP specification including: database schema, API endpoints, landing page copy, and pricing strategy. Output JSON only.',
            },
            { role: 'user', content: `Build an MVP specification for: ${brief}` },
          ],
          true,
        );
        output = { ...output, spec: JSON.parse(raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()) };
      } catch {
        output = { ...output, note: 'Spec generation deferred — task queued.' };
      }
    }

    return NextResponse.json({ success: true, taskId: task.id, output });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message ?? 'Swarm execute failed' }, { status: 500 });
  }
}
