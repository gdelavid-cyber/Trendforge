export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { Header } from '@/components/header';
import { getMethodBySlug } from '@/lib/earn/methods';
import { MethodClient } from './_components/method-client';

export default async function MethodDetailPage({
  params,
}: {
  params: { method: string };
}) {
  const method = getMethodBySlug(params.method);
  if (!method) notFound();

  // If method requires auth, redirect if not signed in
  const session = await getServerSession(authOptions);
  if (method.requiresAuth && !session?.user) {
    redirect(`/auth/signin?callbackUrl=/earn/${params.method}`);
  }

  return (
    <div className="min-h-screen bg-transparent text-white overflow-hidden">
      <Header />
      <MethodClient method={method} user={session?.user} />
    </div>
  );
}