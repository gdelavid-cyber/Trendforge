import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { sendOutreachToLead } from '@/lib/money/sales/sales-engine';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : 'user';
    const leadId = params.id;

    const body = await req.json().catch(() => ({}));
    const { customContent } = body;

    const message = await sendOutreachToLead(leadId, userId, customContent);

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
