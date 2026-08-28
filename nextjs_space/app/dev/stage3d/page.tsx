export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { Stage3DQaClient } from './_components/stage3d-qa-client';

export const metadata = {
  title: 'Dev QA // Stage3D Engine Harness // Trendly',
  description: 'Stage3D vs Layered 2D side-by-side visual comparison and GLB testing booth.',
  robots: { index: false, follow: false },
};

export default function Stage3DDevPage() {
  if (process.env.NODE_ENV === 'production') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-transparent text-white relative overflow-hidden font-sans">
      <Header />
      <Stage3DQaClient />
    </div>
  );
}
