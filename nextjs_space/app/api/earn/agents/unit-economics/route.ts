import { NextRequest, NextResponse } from 'next/server';
import { FULL_FINANCIAL_MODELS, getWeeklyIntelligenceReport } from '@/lib/earn/agents';

export async function GET(req: NextRequest) {
  try {
    const playKey = req.nextUrl.searchParams.get('play') || 'quick-wins-voice';
    const model = FULL_FINANCIAL_MODELS[playKey] || FULL_FINANCIAL_MODELS['quick-wins-voice'];
    const weeklyReport = getWeeklyIntelligenceReport();

    return NextResponse.json({
      ok: true,
      model,
      allModels: FULL_FINANCIAL_MODELS,
      weeklyReport,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch unit economics' },
      { status: 500 }
    );
  }
}