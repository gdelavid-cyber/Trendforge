'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Compass,
  BookOpen,
  Sparkles,
  Info,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { guideForPath, PageGuide } from '@/lib/guide/content';
import Link from 'next/link';

interface Props {
  overrideGuide?: PageGuide;
  defaultExpanded?: boolean;
}

export function SectionHelpBanner({ overrideGuide, defaultExpanded = false }: Props) {
  const pathname = usePathname();
  const guide = overrideGuide || guideForPath(pathname);
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!guide) return null;

  const handleStartTour = () => {
    if (guide.tour.length > 0) {
      window.dispatchEvent(new CustomEvent('trendly:start-tour'));
    } else {
      window.location.href = `/guide#${guide.path.replace(/\//g, '-').replace(/^-/, '') || 'home'}`;
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-[#00F0FF]/25 bg-gradient-to-r from-[#00F0FF]/[0.06] via-black/40 to-purple-500/[0.05] p-4 text-left transition-all backdrop-blur-md shadow-[0_0_25px_rgba(0,240,255,0.06)]">
      {/* Banner Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF] shrink-0 mt-0.5 sm:mt-0">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                Section Guide: {guide.title}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/25 font-bold uppercase">
                {guide.group}
              </span>
            </div>
            <p className="text-xs text-[#8E9BB4] font-sans mt-0.5 line-clamp-1">
              {guide.tagline}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 font-mono">
          {guide.tour.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleStartTour}
              className="border-[#00F0FF]/40 text-[#00F0FF] hover:bg-[#00F0FF]/10 text-[11px] h-8 px-2.5 uppercase font-bold"
            >
              <Compass className="w-3.5 h-3.5 mr-1 animate-spin" />
              Start Tour
            </Button>
          )}

          <Link href={`/guide#${guide.path.replace(/\//g, '-').replace(/^-/, '') || 'home'}`}>
            <Button
              size="sm"
              variant="ghost"
              className="text-[#8E9BB4] hover:text-white text-[11px] h-8 px-2.5 uppercase"
            >
              <BookOpen className="w-3.5 h-3.5 mr-1" />
              Manual
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="bg-white/10 hover:bg-white/15 text-white text-[11px] h-8 px-3 uppercase font-bold border border-white/10"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 mr-1" /> Hide Guide
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 mr-1" /> Section Info
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Expanded Guide Drawer */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden pt-4 mt-3 border-t border-white/10 space-y-4"
          >
            {/* What It Does */}
            <div>
              <span className="text-[10px] font-mono font-bold text-[#00F0FF] uppercase flex items-center gap-1 mb-1">
                <Info className="w-3.5 h-3.5" /> What This Section Does:
              </span>
              <p className="text-xs text-[#E0E7FF] font-sans leading-relaxed">
                {guide.whatItDoes}
              </p>
            </div>

            {/* Key Actions & Tips Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Key Actions */}
              <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2">
                <span className="text-[10px] font-mono font-bold text-green-400 uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Key Actions You Can Take:
                </span>
                <ul className="space-y-1.5 pl-1">
                  {guide.actions.map((action, idx) => (
                    <li key={idx} className="text-xs text-[#CCD6F6] font-sans flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-green-500/10 text-green-400 font-mono text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pro Tips */}
              <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2">
                <span className="text-[10px] font-mono font-bold text-[#FFD700] uppercase flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5" /> Important Tips & Mechanics:
                </span>
                <ul className="space-y-1.5 pl-1">
                  {guide.tips.map((tip, idx) => (
                    <li key={idx} className="text-xs text-[#CCD6F6] font-sans flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] shrink-0 mt-1.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
