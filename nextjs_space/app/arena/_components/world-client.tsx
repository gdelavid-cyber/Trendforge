'use client';

import dynamic from 'next/dynamic';
import type { FighterLoadout } from '@/lib/cosmetics/stats';
import type { CompanionAppearanceConfig } from '@/lib/companion/appearance';

const WorldCanvas = dynamic(() => import('@/components/world/WorldCanvas').then((m) => m.WorldCanvas), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#04040A]">
      <div className="text-xs font-mono text-[#00F0FF]/70 uppercase tracking-widest animate-pulse">
        Entering The World…
      </div>
    </div>
  ),
});

export function WorldClient({
  loadout,
  config,
}: {
  loadout?: FighterLoadout;
  config?: CompanionAppearanceConfig;
}) {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#04040A]">
      <WorldCanvas loadout={loadout} config={config} />
    </div>
  );
}
