import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function escapeCsvField(field: any): string {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function isAuthorized(req: NextRequest): boolean {
  if (process.env.NODE_ENV === 'development') return true;
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const apiKey = req.headers.get('x-api-key') || '';
  const validSecret =
    process.env.OBSERVABILITY_API_KEY ||
    process.env.CRON_SECRET ||
    process.env.NEXTAUTH_SECRET;
  if (!validSecret) return true;
  return token === validSecret || apiKey === validSecret;
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const gate = searchParams.get('gate');
    const sinceParam = searchParams.get('since');
    const format = (searchParams.get('format') || 'json').toLowerCase();
    const limitParam = searchParams.get('limit');
    const limit = Math.min(5000, Math.max(1, limitParam ? parseInt(limitParam, 10) : 1000));

    let sinceDate: Date | undefined;
    if (sinceParam) {
      const parsed = new Date(sinceParam);
      if (!isNaN(parsed.getTime())) {
        sinceDate = parsed;
      }
    }

    const decisions = await prisma.decisionLog.findMany({
      where: {
        ...(gate ? { gateType: gate } : {}),
        ...(sinceDate ? { createdAt: { gte: sinceDate } } : {}),
      },
      include: {
        outcome: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    if (format === 'csv') {
      const headers = [
        'id',
        'gateType',
        'primitive',
        'question',
        'probability',
        'confidence',
        'threshold',
        'actionTaken',
        'latencyMs',
        'wasCorrect',
        'source',
      ];

      const rows: string[] = [headers.join(',')];

      for (const d of decisions) {
        const answer = (d.answer as any) || {};
        const probability = answer.probability !== undefined ? answer.probability : '';
        const confidence = answer.confidence !== undefined ? answer.confidence : '';
        const wasCorrect =
          d.outcome?.wasCorrect !== undefined && d.outcome?.wasCorrect !== null
            ? d.outcome.wasCorrect
            : '';
        const source = d.outcome?.source || '';

        const row = [
          escapeCsvField(d.id),
          escapeCsvField(d.gateType),
          escapeCsvField(d.primitive),
          escapeCsvField(d.question),
          escapeCsvField(probability),
          escapeCsvField(confidence),
          escapeCsvField(d.threshold),
          escapeCsvField(d.actionTaken),
          escapeCsvField(d.latencyMs),
          escapeCsvField(wasCorrect),
          escapeCsvField(source),
        ];

        rows.push(row.join(','));
      }

      const csvContent = rows.join('\r\n');
      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="decision_logs.csv"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      count: decisions.length,
      gate: gate || 'all',
      decisions,
    });
  } catch (err: any) {
    console.error('[Observability API] Error exporting decisions:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
