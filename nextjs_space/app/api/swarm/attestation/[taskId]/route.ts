import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAttestationSignature } from '@/lib/swarm/revenue/attestation';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const attestation = await prisma.attestation.findUnique({
      where: { taskId: params.taskId },
    });

    if (!attestation) {
      return NextResponse.json({ success: false, error: 'Attestation not found' }, { status: 404 });
    }

    const isValidSignature = verifyAttestationSignature(
      attestation.payload as Record<string, any>,
      attestation.signature
    );

    return NextResponse.json({
      success: true,
      attestation,
      verification: {
        isValidSignature,
        signerId: attestation.signerId,
        merkleRoot: attestation.merkleRoot,
        chainTxHash: attestation.chainTxHash,
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
