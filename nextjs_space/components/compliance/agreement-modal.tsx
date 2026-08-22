'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { COMPLIANCE_DISCLAIMERS, TERMS_AND_CONDITIONS } from '@/lib/compliance/disclaimers';

export function AgreementModal({
  isOpen,
  onClose,
  onAgreed,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAgreed: () => void;
}) {
  const [isOver18, setIsOver18] = useState(false);
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!isOver18 || !riskAcknowledged) {
      toast.error('You must affirm age verification (18+) and acknowledge financial risk.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/compliance/agree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOver18, riskAcknowledged, termsAccepted: true }),
      });

      if (res.ok) {
        toast.success('Compliance agreement recorded.');
        onAgreed();
        onClose();
      } else {
        toast.error('Failed to record compliance verification.');
      }
    } catch {
      toast.error('Network error during compliance verification.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#0B0B14] border border-[#FFD700]/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-[0_0_50px_rgba(255,215,0,0.15)] relative"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center text-xl text-[#FFD700]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-orbitron text-lg font-bold uppercase text-white">
                Regulatory Risk & Compliance Disclosure
              </h3>
              <span className="text-[10px] font-mono text-[#8E9BB4]">MANDATORY FINANCIAL CLEARANCE</span>
            </div>
          </div>

          <div className="p-3.5 bg-black/60 rounded-xl border border-white/10 text-xs font-sans text-[#8E9BB4] leading-relaxed space-y-2 mb-6 max-h-48 overflow-y-auto">
            <p><strong className="text-white">NOT FINANCIAL ADVICE:</strong> {COMPLIANCE_DISCLAIMERS.GENERAL}</p>
            <p><strong className="text-[#FF007A]">RISK DISCLOSURE:</strong> {COMPLIANCE_DISCLAIMERS.FINANCIAL_RISK}</p>
            <p><strong className="text-[#00F0FF]">DARWINISM RULES:</strong> {COMPLIANCE_DISCLAIMERS.ECONOMIC_DARWINISM}</p>
          </div>

          <div className="space-y-3 mb-6 text-xs font-mono text-white">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isOver18}
                onChange={(e) => setIsOver18(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-black/60 text-[#00F0FF] focus:ring-0"
              />
              <span>I confirm I am at least 18 years of age.</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={riskAcknowledged}
                onChange={(e) => setRiskAcknowledged(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-black/60 text-[#00F0FF] focus:ring-0"
              />
              <span>I acknowledge financial risk and accept Economic Darwinism rules.</span>
            </label>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-1/3 border-white/10 text-xs font-mono uppercase text-[#8E9BB4]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !isOver18 || !riskAcknowledged}
              className="w-2/3 cyan-gradient text-black font-extrabold uppercase text-xs h-10 holographic-btn font-mono"
            >
              {submitting ? 'Verifying...' : 'Accept & Proceed'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
