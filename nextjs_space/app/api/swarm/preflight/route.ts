import { NextResponse } from 'next/server';
import { masterBrain } from '@/lib/swarm/revenue/masterBrain';
import { TemplateType, PricingTier } from '@/lib/swarm/revenue/templates';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const templateType: TemplateType = (body.templateType || 'FACELESS_VIDEO').toUpperCase();
    const tier: PricingTier = (body.tier || 'STANDARD').toUpperCase();

    const result = await masterBrain.evaluatePreFlight({
      templateType,
      tier,
      trendScore: body.trendScore || 85,
    });

    return NextResponse.json({
      success: true,
      templateType,
      tier,
      preflight: result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
