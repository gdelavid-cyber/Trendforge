import { Header } from '@/components/header';
import { BuilderCanvas } from './_components/builder-canvas';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';

export const dynamic = 'force-dynamic';

export default async function AgentBuilderPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen text-white relative">
      <Header />
      <BuilderCanvas user={session?.user} />
    </div>
  );
}
