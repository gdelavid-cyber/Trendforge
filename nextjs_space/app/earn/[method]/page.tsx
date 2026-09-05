export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { Header } from '@/components/layouts/header';
import { getMethodBySlug } from '@/lib/earn/methods';
import { MethodClient } from './_components/method-client';
import { computeUnlockState } from '@/lib/earn/unlocks';
import Link from 'next/link';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function MethodDetailPage({
  params,
}: {
  params: { method: string };
}) {
  const method = getMethodBySlug(params.method);
  if (!method) notFound();

  const session = await getServerSession(authOptions);
  if (method.requiresAuth && !session?.user) {
    redirect(`/auth/signin?callbackUrl=/earn/${params.method}`);
  }

  // Check user unlock level
  const userId = (session?.user as any)?.id;
  let userEarnings = 0;
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalEarnings: true },
    });
    if (user) userEarnings = user.totalEarnings;
  }

  const unlockState = computeUnlockState(userEarnings, false, false);

  // Method 7 (prediction-arbitrage) & Method 8 (web4-agents) require Tier 4 ($1,000+ earned)
  const isAdvancedLab = params.method === 'prediction-arbitrage' || params.method === 'web4-agents';
  const isMicroSaas = params.method === 'micro-saas' || params.method === 'autonomous-sales';

  const isLocked =
    (isAdvancedLab && !unlockState.unlockedFeatures.advancedLab) ||
    (isMicroSaas && !unlockState.unlockedFeatures.microSaas);

  if (isLocked) {
    return (
      <div className="min-h-screen bg-[#06060E] text-white">
        <Header />
        <div className="max-w-xl mx-auto px-4 py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-6 h-6 text-[#FFD700]" />
          </div>
          <div className="text-[11px] font-mono text-[#FFD700] uppercase tracking-wider mb-2 font-bold">
            PROGRESSIVE UNLOCK REQUIRED
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 font-sans">
            {method.title} is Locked
          </h1>
          <p className="text-sm text-[#8E9BB4] mb-8 leading-relaxed font-sans">
            This advanced earning vector unlocks progressively after reaching real milestones in the 5-step guided flow. New operatives start with their first verified deliverable.
          </p>

          <Link href="/earn/start">
            <Button size="lg" className="cyan-gradient text-black font-extrabold uppercase px-8 h-12 font-mono shadow-[0_0_25px_rgba(0,240,255,0.4)]">
              Start Guided Flow ($500 Goal) <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white overflow-hidden">
      <Header />
      <MethodClient method={method} user={session?.user} />
    </div>
  );
}