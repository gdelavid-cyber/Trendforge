import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { sendOutreachToLead, simulateBuyerResponse } from '@/lib/money/sales/sales-engine';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : 'user';
    const leadId = params.id;

    const body = await req.json().catch(() => ({}));
    const { customContent, autoSimulateResponse = true } = body;

    const message = await sendOutreachToLead(leadId, userId, customContent);

    // Auto simulate a response after short delay if enabled for dynamic testing
    if (autoSimulateResponse) {
      setTimeout(async () => {
        try {
          await simulateBuyerResponse(leadId);
        } catch (e) {
          console.error('Auto buyer response error:', e);
        }
      }, 2500);
    }

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
