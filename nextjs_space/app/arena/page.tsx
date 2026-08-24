export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Header } from '@/components/header';
import { WorldClient } from './_components/world-client';

export const metadata = {
  title: 'The World // Trendly',
  description: 'Walk your customized AI companion through a neon open plaza. Show off owned cosmetics. Pure identity, pure fun.',
};

export default async function ArenaPage() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  let loadout: Record<string, string> | undefined;
  let companionName: string | undefined;

  if (userEmail) {
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (user) {
      const [equipped, companion, agent] = await Promise.all([
        prisma.userCosmetic.findMany({ where: { userId: user.id, equipped: true } }),
        prisma.companion.findFirst({ where: { userId: user.id }, orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] }),
        prisma.web4Agent.findFirst({
          where: { userId: user.id },
          orderBy: { profit: 'desc' },
          select: { name: true, avatarConfig: true },
        }),
      ]);

      // Priority: Companion identity → agent avatar config → equipped inventory.
      const companionLoadout = (companion?.config as any)?.loadout;
      const agentLoadout = (agent?.avatarConfig as any)?.loadout;
      if (companionLoadout && typeof companionLoadout === 'object') {
        loadout = companionLoadout;
      } else if (agentLoadout && typeof agentLoadout === 'object') {
        loadout = agentLoadout;
      } else if (equipped.length > 0) {
        const { COSMETICS_CATALOG } = await import('@/lib/cosmetics/catalog');
        loadout = {};
        for (const uc of equipped) {
          const item = COSMETICS_CATALOG.find((c) => c.id === uc.cosmeticId);
          if (item?.slot && !loadout[item.slot]) loadout[item.slot] = item.id;
        }
      }
      companionName = companion?.name ?? agent?.name ?? undefined;
    }
  }

  return (
    <div className="min-h-screen bg-[#04040A] text-white relative overflow-hidden">
      <div className="relative z-20">
        <Header />
      </div>
      <WorldClient loadout={loadout as any} />
    </div>
  );
}
