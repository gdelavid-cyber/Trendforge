export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';
import {
  DEFAULT_STATION_MODULES,
  resolveStationCapabilities,
  STATION_MODULES,
  type StationModuleId,
} from '@/lib/station/capability-registry';
import { getStationBeliefs } from '@/lib/station/reflect-and-verify';
import { runStationAutonomousLoop } from '@/lib/station/engine';
import { jevMissionGate } from '@/lib/intelligence/decision/mission-gate';

/**
 * GET /api/station/v1
 * Returns the live status of the native TrendForge Station engine:
 * active modules, granted tools, budget ceiling, and Cortex beliefs.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || session?.user?.email || 'anon';

  const resolved = resolveStationCapabilities({
    userId,
    agentId: 'overseer',
    enabledModules: DEFAULT_STATION_MODULES,
  });
  const beliefs = await getStationBeliefs(userId);

  return NextResponse.json({
    success: true,
    engine: 'trendforge-station-native',
    version: '1.0.0',
    modules: Object.values(STATION_MODULES).map((m) => ({
      id: m.id,
      name: m.name,
      zone: m.zone,
      description: m.description,
      enabled: resolved.enabledModules.includes(m.id),
      grantCount: m.grants.length,
    })),
    grantedTools: resolved.tools,
    maxBudgetUsdc: resolved.maxBudgetUsdc,
    cortexBeliefsCount: beliefs.length,
    recentBeliefs: beliefs.slice(-10),
  });
}

/**
 * POST /api/station/v1
 * Executes a multi-turn autonomous run on the native TrendForge Station engine.
 * Supports both OpenAI-compatible `{ messages, model, response_format }` payloads
 * and native `{ prompt, enabledModules, maxTurns, maxBudgetUsdc }` requests.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  const validServiceKey =
    (process.env.PIPELINE_API_KEY && bearerToken === process.env.PIPELINE_API_KEY) ||
    (process.env.STARNET_API_KEY && bearerToken === process.env.STARNET_API_KEY);

  if (!session?.user && !validServiceKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const userId = (session?.user as any)?.id || session?.user?.email || body.userId || 'service';
    const agentId = String(body.model || body.agentId || 'overseer');
    const jsonMode = body?.response_format?.type === 'json_object' || Boolean(body?.jsonMode);

    const messages = Array.isArray(body.messages)
      ? body.messages
      : [{ role: 'user' as const, content: String(body.prompt || '') }];

    const enabledModules: StationModuleId[] | undefined = Array.isArray(body.enabledModules)
      ? body.enabledModules
      : undefined;

    // JEV mission gate: the decision layer gives final go/no-go before the
    // Station Crew executes. Fail-open when JEV is disabled/unkeyed.
    const missionText = messages
      .map((m: any) => (typeof m?.content === 'string' ? m.content : ''))
      .filter(Boolean)
      .join('\n')
      .slice(0, 4000);
    const jevVerdict = await jevMissionGate({
      action: 'station_autonomous_run',
      agentId,
      userId,
      mission: missionText || '(empty mission)',
      context: {
        enabledModules: enabledModules ?? DEFAULT_STATION_MODULES,
        maxTurns: body.maxTurns,
        maxBudgetUsdc: body.maxBudgetUsdc,
        source: body.source || 'dashboard',
      },
    });
    if (!jevVerdict.allowed) {
      return NextResponse.json(
        {
          error: 'JEV_VETO',
          detail:
            'Jev (decision layer) blocked this Station run. Adjust the mission or the JEV_CONFIDENCE_THRESHOLD.',
          jev: jevVerdict,
        },
        { status: 403 }
      );
    }

    const result = await runStationAutonomousLoop(messages, jsonMode, {
      userId,
      agentId,
      enabledModules,
      maxTurns: body.maxTurns,
      maxBudgetUsdc: body.maxBudgetUsdc,
      enableReflection: body.enableReflection ?? true,
    });

    // Return both OpenAI-compatible `choices` and rich `station` telemetry
    return NextResponse.json({
      id: `stationcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: agentId,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: result.reply },
          finish_reason: result.status === 'complete' ? 'stop' : 'length',
        },
      ],
      station: {
        status: result.status,
        reason: result.reason,
        turnsUsed: result.turnsUsed,
        spentBudgetUsdc: result.spentBudgetUsdc,
        toolTraces: result.toolTraces,
        evidence: result.evidence,
        newBeliefs: result.newBeliefs,
        jev: jevVerdict,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'TrendForge Station run failed' },
      { status: 500 }
    );
  }
}
