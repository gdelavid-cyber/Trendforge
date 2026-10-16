import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { transitionStage, VentureLifecycleState } from '@/lib/ventures/lifecycle';
import { ApprovalStatus } from '@prisma/client';

/**
 * GET /api/approvals/requests
 * Returns pending or filtered ApprovalRequest records.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = (searchParams.get('status') as ApprovalStatus) || ApprovalStatus.PENDING;
  const ventureId = searchParams.get('ventureId') || undefined;

  try {
    const requests = await prisma.approvalRequest.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(ventureId ? { ventureId } : {}),
      },
      include: {
        venture: {
          select: {
            id: true,
            name: true,
            slug: true,
            lifecycleState: true,
            capitalAllocatedCents: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ ok: true, count: requests.length, requests });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Failed to fetch approval requests' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/approvals/requests
 * Resolves an approval request (APPROVED / REJECTED) and resumes venture if approved.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, action, notes } = body;

    if (!requestId || !['APPROVED', 'REJECTED'].includes(action)) {
      return NextResponse.json(
        { ok: false, error: 'requestId and valid action (APPROVED | REJECTED) required' },
        { status: 400 }
      );
    }

    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: { venture: true },
    });

    if (!request) {
      return NextResponse.json({ ok: false, error: 'ApprovalRequest not found' }, { status: 404 });
    }

    const updated = await prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: action as ApprovalStatus,
        resolvedAt: new Date(),
        rationale: notes ? `${request.rationale} [Resolution: ${notes}]` : request.rationale,
      },
    });

    // If approved and was paused for CAPITAL_LIMIT_OVERRIDE, restore to VALIDATING or BUILDING
    if (action === 'APPROVED' && request.proposedAction === 'CAPITAL_LIMIT_OVERRIDE') {
      if (request.venture.lifecycleState === VentureLifecycleState.PAUSED) {
        // Expand allocation plan or budget by 50%
        await prisma.venture.update({
          where: { id: request.ventureId },
          data: {
            capitalAllocatedCents: request.venture.capitalAllocatedCents + (request.estimatedCostCents * 2 || 10000),
          },
        });

        await transitionStage(
          request.ventureId,
          VentureLifecycleState.VALIDATING,
          { approvalId: request.id },
          'HUMAN_OPERATOR',
          'Human operator approved capital override. Resumed execution.'
        );
      }
    }

    return NextResponse.json({ ok: true, approval: updated });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Failed to resolve approval request' },
      { status: 500 }
    );
  }
}
