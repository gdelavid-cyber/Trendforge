import { Header } from '@/components/header';
import { AvatarStudioClient } from './_components/avatar-studio-client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

export default async function AvatarStudioPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen text-white relative">
      <Header />
      <AvatarStudioClient user={session?.user} />
    </div>
  );
}
