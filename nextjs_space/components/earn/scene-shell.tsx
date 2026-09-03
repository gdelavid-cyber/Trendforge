'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface SceneShellProps {
  totalScenes: number;
  methodNumber: number;
  methodTitle: string;
  children: React.ReactNode[];
}

export function SceneShell({ totalScenes, methodNumber, methodTitle, children }: SceneShellProps) {
  const [currentScene, setCurrentScene] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(totalScenes - 1, index));
      setCurrentScene(clamped);
      if (containerRef.current) {
        const scene = containerRef.current.children[clamped] as HTMLElement;
        scene?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    },
    [totalScenes, prefersReducedMotion]
  );

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        goTo(currentScene + 1);
      }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goTo(currentScene - 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentScene, goTo]);

  // IntersectionObserver to track visible scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const scenes = Array.from(container.children) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const idx = scenes.indexOf(entry.target as HTMLElement);
            if (idx !== -1) setCurrentScene(idx);
          }
        });
      },
      { threshold: 0.5 }
    );
    scenes.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [children]);

  return (
    <div className="relative">
      {/* Scroll Container */}
      <div
        ref={containerRef}
        className="h-screen overflow-y-scroll"
        style={{
          scrollSnapType: 'y mandatory',
          scrollBehavior: prefersReducedMotion ? 'auto' : 'smooth',
        }}
      >
        {children.map((child, i) => (
          <div
            key={i}
            style={{ scrollSnapAlign: 'start' }}
            className="h-screen flex-shrink-0 relative"
          >
            {child}
          </div>
        ))}
      </div>

      {/* Floating HUD — scene dots + method label */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-3 pointer-events-none">
        {/* Method tag */}
        <div className="writing-mode-vertical text-[9px] font-mono text-[#8E9BB4] tracking-[0.2em] uppercase mb-2 rotate-90 origin-center whitespace-nowrap select-none">
          {String(methodNumber).padStart(2, '0')} · {methodTitle.slice(0, 18)}
        </div>

        {/* Dots */}
        {Array.from({ length: totalScenes }).map((_, i) => (
          <button
            key={i}
            aria-label={`Go to scene ${i + 1}`}
            onClick={() => goTo(i)}
            className="pointer-events-auto group relative"
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                i === currentScene
                  ? 'w-2.5 h-2.5 bg-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.8)]'
                  : 'w-1.5 h-1.5 bg-white/20 group-hover:bg-white/50'
              }`}
            />
          </button>
        ))}

        {/* Scene label */}
        <div className="text-[9px] font-mono text-[#8E9BB4] mt-2 select-none">
          {currentScene + 1}/{totalScenes}
        </div>
      </div>

      {/* Prev / Next arrows — mobile-friendly bottom bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4">
        <button
          onClick={() => goTo(currentScene - 1)}
          disabled={currentScene === 0}
          aria-label="Previous scene"
          className="w-10 h-10 rounded-full bg-[#06060E]/80 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white disabled:opacity-30 hover:border-[#00F0FF]/40 transition-all"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <div className="text-xs font-mono text-[#8E9BB4] select-none">
          Scene {currentScene + 1}
        </div>
        <button
          onClick={() => goTo(currentScene + 1)}
          disabled={currentScene === totalScenes - 1}
          aria-label="Next scene"
          className="w-10 h-10 rounded-full bg-[#06060E]/80 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white disabled:opacity-30 hover:border-[#00F0FF]/40 transition-all"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}