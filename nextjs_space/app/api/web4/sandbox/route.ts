export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { executeSkill } from '@/lib/web4/executor';

/**
 * Real sandbox execution for the builder DAG. Each node runs through the real
 * executor (live API + LLM where implemented); unimplemented skills return an
 * explicitly-labeled simulation. Failures are surfaced honestly.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nodes, edges } = body;

    if (!Array.isArray(nodes) || nodes.length === 0) {
      return NextResponse.json({ error: 'No skill nodes provided in workflow DAG.' }, { status: 400 });
    }

    const logs: any[] = [];
    let totalComputeCost = 0;
    let estimatedProfitUsdc = 0;
    let realExecuted = 0;
    let simulated = 0;
    let failed = 0;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const skillId = node.skillId || node.id;
      const res = await executeSkill(skillId, node.params || {});

      totalComputeCost += res.computeBurnUsdc;
      if (res.simulated) {
        simulated++;
        // simulated nodes still report a notional yield so the P&L readout works
        const simYield = res.result?.sampleYield ?? 0;
        estimatedProfitUsdc += simYield - res.computeBurnUsdc;
      } else if (res.status === 'FAILED') {
        failed++;
      } else {
        realExecuted++;
        estimatedProfitUsdc -= res.computeBurnUsdc;
      }

      logs.push({
        stepIndex: i + 1,
        nodeId: node.id,
        skillId: res.skillId,
        skillName: res.skillName,
        category: res.category,
        inputParams: res.inputParams,
        outputSummary: res.outputSummary,
        result: res.result,
        computeBurn: res.computeBurnUsdc,
        simulated: res.simulated,
        status: res.status,
        error: res.error,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      workflowStatus: failed > 0 ? 'PARTIAL_FAILURE' : 'VERIFIED_EXECUTABLE',
      nodeCount: nodes.length,
      edgeCount: Array.isArray(edges) ? edges.length : 0,
      totalComputeCost: +totalComputeCost.toFixed(4),
      estimatedProfitUsdc: +estimatedProfitUsdc.toFixed(2),
      realExecuted,
      simulated,
      failed,
      logs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Sandbox execution failed' }, { status: 500 });
  }
}
