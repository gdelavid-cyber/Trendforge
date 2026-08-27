export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { executeSkill } from '@/lib/web4/executor';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nodes, edges } = body;

    if (!Array.isArray(nodes) || nodes.length === 0) {
      return NextResponse.json({ error: 'No skill nodes provided in workflow DAG.' }, { status: 400 });
    }

    const logs: any[] = [];
    let totalComputeCost = 0;
    let realCount = 0;
    let simCount = 0;
    let failedCount = 0;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const skillId = node.skillId || node.id;
      const res = await executeSkill(skillId, node.params || {});

      totalComputeCost += res.computeBurnUsdc;
      if (res.simulated) simCount++;
      else if (res.status === 'FAILED') failedCount++;
      else realCount++;

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
      workflowStatus: failedCount > 0 ? 'PARTIAL_FAILURE' : 'VERIFIED_EXECUTABLE',
      nodeCount: nodes.length,
      edgeCount: Array.isArray(edges) ? edges.length : 0,
      totalComputeCost: +totalComputeCost.toFixed(4),
      realExecuted: realCount,
      simulated: simCount,
      failed: failedCount,
      logs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Workflow execution failed' }, { status: 500 });
  }
}
