'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Element-spotlight walkthrough. Renders a full-viewport dim layer with a
// cutout over the current step's target (via data-tour selectors), keyboard
// navigation, prefers-reduced-motion respect, and a one-time auto-start
// persisted through /api/onboarding/status. Replays via the 'trendly:start-tour'
// window event (header Help button) or the /guide hub.

export interface TourStep {
  selector: string;
  title: string;
  body: string;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;

export function SpotlightTour({ steps }: { steps: TourStep[] }) {
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const persistedRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // One-time auto start: only when signed in AND tourDone is still false.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/onboarding/status', { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const body = await res.json();
        if (!cancelled && body?.success && body?.tourDone === false && steps.length > 0) {
          lastFocusedRef.current = document.activeElement as HTMLElement | null;
          setActive(true);
        }
      } catch {
        // anonymous or offline — never nag
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A11y: move focus into the dialog while open; restore it when closed.
  useEffect(() => {
    if (!active) {
      lastFocusedRef.current?.focus?.();
      lastFocusedRef.current = null;
      return;
    }
    dialogRef.current?.focus();
  }, [active]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Replay hook for header Help button + /guide.
  useEffect(() => {
    const start = () => {
      if (steps.length > 0) {
        lastFocusedRef.current = document.activeElement as HTMLElement | null;
        setIndex(0);
        setActive(true);
      }
    };
    window.addEventListener('trendly:start-tour', start);
    return () => window.removeEventListener('trendly:start-tour', start);
  }, [steps.length]);

  const finish = useCallback(() => {
    setActive(false);
    setRect(null);
    if (persistedRef.current) return;
    persistedRef.current = true;
    fetch('/api/onboarding/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tourDone: true }),
    }).catch(() => {});
  }, []);

  const measure = useCallback(() => {
    if (!active) return;
    const step = steps[index];
    const el = step ? document.querySelector(step.selector) : null;
    if (!el) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top - PAD,
      left: r.left - PAD,
      width: r.width + PAD * 2,
      height: r.height + PAD * 2,
    });
  }, [active, index, steps, reducedMotion]);

  useLayoutEffect(() => {
    measure();
    if (!active) return;
    // Re-measure on resize/scroll since the cutout is viewport-fixed.
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [measure, active]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        setIndex((i) => (i < steps.length - 1 ? i + 1 : i));
        if (index >= steps.length - 1) finish();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, index, steps.length, finish]);

  if (!active || typeof document === 'undefined') return null;

  const last = index >= steps.length - 1;
  const step = steps[index];
  // Tooltip placement: below target by default; above when it would overflow.
  const tooltipAbove = rect ? rect.top + rect.height + 220 > window.innerHeight : false;
  const tooltipStyle: React.CSSProperties = rect
    ? {
        top: tooltipAbove ? undefined : rect.top + rect.height + 12,
        bottom: tooltipAbove ? window.innerHeight - rect.top + 12 : undefined,
        left: Math.min(Math.max(12, rect.left), Math.max(12, window.innerWidth - 340)),
        maxWidth: 328,
      }
    : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: 328 };

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Guided tour">
      {/* Dim layer with cutout */}      {rect && (
        <div
          className={`fixed rounded-xl border-2 border-[#00F0FF] shadow-[0_0_0_9999px_rgba(4,4,10,0.82),0_0_30px_rgba(0,240,255,0.35)] pointer-events-none ${
            reducedMotion ? '' : 'transition-all duration-200'
          }`}
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
        />
      )}
      {!rect && (
        <div className="fixed inset-0 bg-[#04040A]/[0.82] pointer-events-none" />
      )}

      {/* Click-catcher so stray clicks don't fall through to the page */}
      <div className="fixed inset-0" onClick={() => {}} />

      {/* Tooltip card */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`fixed w-[328px] rounded-xl bg-[#0B0B18]/95 backdrop-blur-xl border border-[#00F0FF]/25 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.8)] outline-none ${
          reducedMotion ? '' : 'transition-all duration-200'
        }`}
        style={tooltipStyle}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-widest text-[#00F0FF]">
            <Compass className="w-3 h-3" /> Tour · {index + 1}/{steps.length}
          </span>
          <button onClick={finish} aria-label="Skip tour" className="text-[#8E9BB4] hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <h3 className="text-sm font-bold text-white font-mono uppercase mb-1">{step.title}</h3>
        <p className="text-xs text-[#B0B0C8] leading-relaxed">{step.body}</p>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
          <div className="flex gap-1" aria-hidden>
            {steps.map((_, i) => (
              <span key={i} className={`h-1 w-4 rounded-full ${i === index ? 'bg-[#00F0FF]' : 'bg-white/15'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {index > 0 && (
              <Button size="sm" variant="outline" onClick={() => setIndex(index - 1)} className="h-7 px-2 text-[10px] font-mono border-white/10 text-white">
                <ChevronLeft className="w-3 h-3 mr-0.5" /> Back
              </Button>
            )}
            {last ? (
              <Button size="sm" onClick={finish} className="h-7 px-3 text-[10px] font-mono font-bold uppercase cyan-gradient text-black holographic-btn">
                Done
              </Button>
            ) : (
              <Button size="sm" onClick={() => setIndex(index + 1)} className="h-7 px-3 text-[10px] font-mono font-bold uppercase cyan-gradient text-black holographic-btn">
                Next <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-[9px] text-[#8E9BB4] font-mono mt-2 opacity-70">← → navigate · Esc skips</p>
      </div>
    </div>,
    document.body
  );
}
