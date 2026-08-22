import { Header } from '@/components/header';
import { COMPLIANCE_DISCLAIMERS } from '@/lib/compliance/disclaimers';
import { ShieldCheck, AlertTriangle, Scale, Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function CompliancePage() {
  return (
    <div className="min-h-screen text-white relative">
      <Header />
      <div className="max-w-[1000px] mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-xs font-mono mb-3">
            <Scale className="w-3.5 h-3.5" />
            <span>LEGAL & REGULATORY DISCLOSURE MATRIX</span>
          </div>
          <h1 className="font-orbitron text-3xl md:text-5xl font-black uppercase text-white">
            Compliance & <span className="cyan-gold-gradient-text">Risk Disclaimers</span>
          </h1>
          <p className="text-sm text-[#8E9BB4] font-sans max-w-xl mx-auto mt-2">
            Transparent operational standards, financial risk warnings, and Web4 Economic Darwinism terms.
          </p>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 border-l-4 border-l-[#00F0FF]">
            <h3 className="font-orbitron text-base font-bold text-white uppercase mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00F0FF]" /> General Educational & Automation Notice
            </h3>
            <p className="text-xs text-[#CCD6F6] font-sans leading-relaxed">
              {COMPLIANCE_DISCLAIMERS.GENERAL}
            </p>
          </div>

          <div className="glass-card p-6 border-l-4 border-l-[#FF007A]">
            <h3 className="font-orbitron text-base font-bold text-white uppercase mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FF007A]" /> High-Risk Financial & Arbitrage Warning
            </h3>
            <p className="text-xs text-[#CCD6F6] font-sans leading-relaxed">
              {COMPLIANCE_DISCLAIMERS.FINANCIAL_RISK}
            </p>
          </div>

          <div className="glass-card p-6 border-l-4 border-l-[#FFD700]">
            <h3 className="font-orbitron text-base font-bold text-white uppercase mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#FFD700]" /> Age Verification & Jurisdictional Clearance
            </h3>
            <p className="text-xs text-[#CCD6F6] font-sans leading-relaxed">
              {COMPLIANCE_DISCLAIMERS.AGE_VERIFICATION}
            </p>
          </div>

          <div className="glass-card p-6 border-l-4 border-l-purple-500">
            <h3 className="font-orbitron text-base font-bold text-white uppercase mb-2 flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-400" /> Economic Darwinism & Sovereign Account Safety
            </h3>
            <p className="text-xs text-[#CCD6F6] font-sans leading-relaxed">
              {COMPLIANCE_DISCLAIMERS.ECONOMIC_DARWINISM}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
