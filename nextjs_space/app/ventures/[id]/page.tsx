export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { Header } from '@/components/layouts/header';
import { getVentureDetails } from '@/lib/venture/engine';
import { calculateVentureEconomics } from '@/lib/finance/ledger';
import { evaluateVentureNextAction } from '@/lib/council/orchestration/venture-hierarchy';
import { VentureDetailClient } from './_components/venture-detail-client';

export default async function VentureDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  let venture: any = null;
  let economics: any = null;
  let ceoRecommendation: any = null;

  try {
    venture = await getVentureDetails(id);
    if (!venture) notFound();

    economics = await calculateVentureEconomics(id);
    ceoRecommendation = await evaluateVentureNextAction(id);
  } catch (error) {
    console.error('Error loading venture detail:', error);
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#02040A] text-[#F3F3F5]">
      <Header />
      <main className="max-w-[1260px] mx-auto px-4 md:px-6 py-8">
        <VentureDetailClient
          initialVenture={venture}
          initialEconomics={economics}
          ceoRecommendation={ceoRecommendation}
        />
      </main>
    </div>
  );
}
