'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { guideForPath } from '@/lib/guide/content';

/**
 * Wraps the guide hub: marks guideSeenAt once on load (signed-in only) and
 * offers tour replay when the current page has a walkthrough.
 */
export function GuideHubClient({ signedIn, children }: { signedIn: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  const hasTour = Boolean(guideForPath(pathname ?? '')?.tour.length);

  useEffect(() => {
    if (!signedIn) return;
    fetch('/api/onboarding/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guideSeen: true }),
    }).catch(() => {});
  }, [signedIn]);

  const replayHere = () => {
    window.dispatchEvent(new CustomEvent('trendly:start-tour'));
  };

  return (
    <>
      {hasTour && (
        <div className="max-w-[1100px] mx-auto px-4">
          <div className="flex justify-end pt-6">
            <button
              onClick={replayHere}
              className="text-[10px] font-mono uppercase text-[#8E9BB4] hover:text-[#00F0FF] border border-white/10 rounded-lg px-3 py-1.5 transition-colors"
            >
              Replay tour (this page)
            </button>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
