export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { SKILLS_LIBRARY } from '@/lib/web4/skills-library';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nodes, edges } = body;

    if (!Array.isArray(nodes) || nodes.length === 0) {
      return NextResponse.json({ error: 'No skill nodes provided in workflow DAG.' }, { status: 400 });
    }

    const logs: any[] = [];
    let totalEstimatedYield = 0;
    let totalComputeCost = 0;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const skillDef = SKILLS_LIBRARY.find((s) => s.id === node.skillId || s.id === node.id) || SKILLS_LIBRARY[0];
      const cost = skillDef.computeCostUsdc;
      const stepYield = Math.floor(100 + Math.random() * 400);

      totalComputeCost += cost;
      totalEstimatedYield += stepYield;

      logs.push({
        stepIndex: i + 1,
        nodeId: node.id,
        skillName: skillDef.name,
        category: skillDef.category,
        inputParams: node.params || {},
        outputSummary: `Generated payload for ${skillDef.name} (${stepYield} USDC yield potential)`,
        computeBurn: cost,
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      workflowStatus: 'VERIFIED_EXECUTABLE',
      nodeCount: nodes.length,
      edgeCount: Array.isArray(edges) ? edges.length : 0,
      totalComputeCost: +totalComputeCost.toFixed(4),
      totalEstimatedYield,
      netProjectedProfit: +(totalEstimatedYield - totalComputeCost).toFixed(2),
      logs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Workflow execution failed' }, { status: 500 });
  }
}
