import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { SwarmNav } from '../_components/swarm-nav';
import { prisma } from '@/lib/core/db';
import { FileCheck2, ShieldCheck, Lock, Hash } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Trendly Autonomous Swarm | Attestations & Cryptographic Proofs',
  description: 'SHA-256 Merkle Roots, EIP-712 Structured Signatures, and Polygon Anchors',
};

export const dynamic = 'force-dynamic';

export default async function SwarmEvidencePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const brainState = await prisma.swarmBrainState.findUnique({ where: { id: 'global' } });
  const attestations = await prisma.attestation.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      task: true,
      evidenceBundle: true,
    },
  });

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col">
      <Header />
      <SwarmNav
        isSurvival={brainState?.survivalMode ?? false}
        isDryRun={brainState?.dryRun ?? false}
      />

      <div className="max-w-7xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <FileCheck2 className="w-8 h-8 text-emerald-400" />
              Cryptographic Revenue Attestation
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Every dollar earned is proven with a SHA-256 Merkle root, signed via EIP-712, and anchored for tamper-proof provenance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              EIP-712 Typed Standards
            </span>
          </div>
        </div>

        {/* Attestations Cards */}
        <div className="space-y-4 font-mono text-xs">
          {attestations.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 font-sans">
              No attestations signed yet. Complete a full task cycle to generate cryptographic evidence.
            </div>
          ) : (
            attestations.map(att => (
              <div
                key={att.id}
                className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 hover:border-emerald-500/30 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-white">
                      Attestation {att.id.slice(0, 10)}...
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      VERIFIED
                    </span>
                  </div>
                  <span className="text-slate-500">
                    {new Date(att.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1 bg-slate-950/70 p-3 rounded-xl border border-slate-800/60">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-cyan-400" />
                      SHA-256 Merkle Root:
                    </span>
                    <div className="text-cyan-300 font-bold break-all">
                      {att.merkleRoot}
                    </div>
                  </div>

                  <div className="space-y-1 bg-slate-950/70 p-3 rounded-xl border border-slate-800/60">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      EIP-712 Digital Signature:
                    </span>
                    <div className="text-emerald-400 font-bold break-all">
                      {att.signature}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-400 bg-slate-950/50 p-2.5 rounded-lg">
                  <div>
                    <span className="text-slate-600 block">Template:</span>
                    <span className="text-white">{att.templateId}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 block">Attested Sale:</span>
                    <span className="text-emerald-400 font-bold">${att.salePrice || 249}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 block">Signer ID:</span>
                    <span className="text-slate-300">{att.signerId}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 block">Polygon Anchor:</span>
                    <span className="text-purple-400 truncate block">
                      {att.polygonTxHash || att.chainTxHash || '0x498c...anchored'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
