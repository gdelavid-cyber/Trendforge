import { Header } from '@/components/layouts/header';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { redirect } from 'next/navigation';
import { ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminCompliancePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const agreements = await prisma.complianceAgreement.findMany({
    take: 50,
    orderBy: { agreedAt: 'desc' },
  });

  return (
    <div className="min-h-screen text-white relative">
      <Header />
      <div className="max-w-[1240px] mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-mono mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ADMIN COMPLIANCE AUDIT VAULT</span>
          </div>
          <h1 className="font-orbitron text-3xl font-black uppercase text-white">
            Operative <span className="cyan-gold-gradient-text">Compliance Audit</span>
          </h1>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-xs font-mono uppercase font-bold text-white mb-4">
            Recent 18+ Verification & Risk Disclosures ({agreements.length} Total Records)
          </h3>

          <div className="space-y-2">
            {agreements.map((a) => (
              <div key={a.id} className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-3">
                  <UserCheck className="w-4 h-4 text-green-400" />
                  <div>
                    <span className="text-white font-bold">User ID: {a.userId}</span>
                    <span className="text-[10px] text-[#8E9BB4] block">Agreed: {new Date(a.agreedAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="text-right text-[10px] text-green-400 font-bold">
                  ✓ 18+ Verified • Risk Acknowledged
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
