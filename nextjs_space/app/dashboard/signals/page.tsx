export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { Header } from '@/components/layouts/header';

export default async function DashboardSignalsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');

  let signals: any[] = [];
  let total = 0;
  try {
    [signals, total] = await Promise.all([
      prisma.rawSignal.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.rawSignal.count(),
    ]);
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="min-h-screen bg-transparent text-[#F3F3F5]">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-bold">Raw Signals</h1>
        <p className="mt-1 text-sm text-white/60">
          {total} harvested signals from Reddit, Hacker News, and forums. Live list: <a className="underline" href="/api/signals?limit=100">/api/signals</a>
        </p>
        <div className="mt-6 overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-white/50">
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Signal</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {signals.map((s: any) => (
                <tr key={s.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-mono text-xs">{s.source}</td>
                  <td className="max-w-md truncate px-4 py-3">{s.title}</td>
                  <td className="px-4 py-3 font-mono text-xs">{s.score}/{s.comments}</td>
                  <td className="px-4 py-3 text-xs">{s.processed ? 'Processed' : 'Pending'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
