'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Tracks whether the element intersects the viewport.
 * Used to freeze WebGL frameloops on offscreen canvases — browsers cap
 * active WebGL contexts and idle rAF loops burn GPU for nothing.
 */
export function useInViewport<T extends HTMLElement>(rootMargin = '160px') {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? true),
      { rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}
