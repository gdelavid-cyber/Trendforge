import { NextRequest, NextResponse } from 'next/server';
import {
  getActiveSwarmAgents,
  getTopScoutedOpportunities,
  buildDeliverablePackage,
  huntQualifiedBuyers,
} from '@/lib/earn/agents';

export async function GET(req: NextRequest) {
  try {
    const agents = getActiveSwarmAgents();
    const opportunities = getTopScoutedOpportunities();
    const leads = huntQualifiedBuyers('HVAC and Local Services');

    return NextResponse.json({
      ok: true,
      agents,
      opportunities,
      leads,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to orchestrate agents' },
      { status: 500 }
    );
  }
}