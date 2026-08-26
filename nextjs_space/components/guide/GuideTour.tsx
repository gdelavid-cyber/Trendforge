'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, ChevronLeft, ChevronRight, Compass } from 'lucide-react';

export interface GuideStep {
  title: string;
  body: string;
}

export interface GuideTourProps {
  /** storage key suffix — tour auto-opens once per browser */
  id: string;
  steps: GuideStep[];
}

/**
 * Contextual walkthrough: auto-opens once, "?" bubble reopens it anytime.
 * Fixed-position cards — no DOM anchoring, safe against layout churn.
 */
export function GuideTour({ id, steps }: GuideTourProps) {
  const storageKey = `guide-done-${id}`;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    let done = false;
    try {
      done = window.localStorage.getItem(storageKey) === '1';
    } catch {
      /* private mode — just show once */
    }
    if (!done) {
      const t = setTimeout(() => {
        setOpen(true);
        setArmed(true);
      }, 900);
      return () => clearTimeout(t);
    }
    setArmed(true);
  }, [storageKey]);

  const close = (markDone: boolean) => {
    setOpen(false);
    setStep(0);
    if (markDone) {
      try {
        window.localStorage.setItem(storageKey, '1');
      } catch {
        /* ignore */
      }
    }
  };

  const next = () => {
    if (step >= steps.length - 1) close(true);
    else setStep((s) => s + 1);
  };

  return (
    <>
      {/* Reopen bubble */}
      {armed && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open guide"
          className="fixed bottom-6 left-6 z-[190] w-11 h-11 rounded-full flex items-center justify-center bg-black/80 border border-[#00F0FF]/40 text-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.25)] hover:scale-110 hover:border-[#00F0FF] transition-all"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00F0FF] animate-ping opacity-60" />
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end justify-center p-4 pb-10 bg-black/60 backdrop-blur-[2px]"
            onClick={() => close(true)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-[#00F0FF]/30 bg-[#0A0A14]/95 shadow-[0_0_50px_rgba(0,240,255,0.18)] overflow-hidden"
            >
              {/* header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                <div className="flex items-center gap-2 text-[#00F0FF] font-mono text-xs font-bold uppercase tracking-wider">
                  <Compass className="w-4 h-4" />
                  <span>Guide</span>
                  <span className="text-[#8E9BB4] font-normal">
                    · {step + 1}/{steps.length}
                  </span>
                </div>
                <button
                  onClick={() => close(true)}
                  className="text-[#8E9BB4] hover:text-white transition-colors"
                  aria-label="Close guide"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* body */}
              <div className="px-5 py-4 min-h-[110px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.18 }}
                  >
                    <h3 className="text-white font-bold font-mono text-sm uppercase tracking-wide mb-1.5">{steps[step].title}</h3>
                    <p className="text-[#B8C4DA] text-xs leading-relaxed font-sans">{steps[step].body}</p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-white/10">
                <div className="flex gap-1.5">
                  {steps.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-[#00F0FF]' : 'w-1.5 bg-white/20'}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {step > 0 && (
                    <button
                      onClick={() => setStep((s) => s - 1)}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase text-[#8E9BB4] hover:text-white border border-white/10 transition-colors flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Back
                    </button>
                  )}
                  <button
                    onClick={next}
                    className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase bg-[#00F0FF] text-black hover:brightness-110 transition-all flex items-center gap-1 shadow-[0_0_14px_rgba(0,240,255,0.35)]"
                  >
                    {step >= steps.length - 1 ? 'Got it' : 'Next'} <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default GuideTour;
