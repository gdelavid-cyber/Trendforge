'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Zap,
  Bot,
  DollarSign,
  Users,
  ShieldCheck,
  ArrowRight,
  Check,
  X,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface TourStep {
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  targetHref: string;
  actionText: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: '1. Explore Live Power Moves',
    subtitle: 'High-Velocity Opportunities',
    description: 'Every 15 minutes, Trendly scrapes emerging market signals and generates step-by-step monetization moves with $0-$50 setup costs.',
    icon: Zap,
    targetHref: '/tasks',
    actionText: 'Next Step',
  },
  {
    title: '2. Deploy Autonomous Swarm Agents',
    subtitle: '1-Click Background Automation',
    description: 'Launch specialized AI workers that scrape subreddits, scan prediction market spreads, and scaffold micro-SaaS applications automatically.',
    icon: Bot,
    targetHref: '/agents',
    actionText: 'Next Step',
  },
  {
    title: '3. Track Your Real-Time Earnings',
    subtitle: 'Transparent Dollar Goals',
    description: 'Log verified task payouts, unlock your First $100 and $1,000 Milestone Badges, and track your global rank.',
    icon: DollarSign,
    targetHref: '/dashboard',
    actionText: 'Next Step',
  },
  {
    title: '4. Community Hub & Quests',
    subtitle: 'Peer-to-Peer Help & Badges',
    description: 'Exchange favors, claim daily quest rewards, earn Community Points, and share verified success stories.',
    icon: Users,
    targetHref: '/community',
    actionText: 'Next Step',
  },
  {
    title: '5. Success-Fee & Pro Expansion',
    subtitle: 'Zero Upfront Risk',
    description: 'Opt into the 5% Success-Fee model in your profile to unlock +2 bonus agent runs every week and priority execution queues.',
    icon: ShieldCheck,
    targetHref: '/profile',
    actionText: 'Complete Tour & Start Earning',
  },
];

export function OnboardingTour({ isNewUser }: { isNewUser?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeen = localStorage.getItem('trendly_tour_completed');
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('trendly_tour_completed', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#0B0B14] border border-[#00F0FF]/30 rounded-2xl max-w-lg w-full p-6 sm:p-8 relative shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#00F0FF]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close / Skip */}
          <button
            onClick={handleComplete}
            className="absolute top-4 right-4 text-[#8892B0] hover:text-white text-xs font-mono flex items-center gap-1"
          >
            Skip Tour <X className="w-4 h-4" />
          </button>

          {/* Progress dots */}
          <div className="flex gap-1.5 mb-6">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep
                    ? 'w-8 bg-[#00F0FF]'
                    : i < currentStep
                    ? 'w-3 bg-green-400'
                    : 'w-3 bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* Step Icon & Title */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center">
              <Icon className="w-5 h-5 text-[#00F0FF]" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#00F0FF]">
                {step.subtitle}
              </span>
              <h3 className="text-xl font-bold text-white uppercase tracking-wider">{step.title}</h3>
            </div>
          </div>

          {/* Step Description */}
          <p className="text-sm text-[#8892B0] leading-relaxed font-sans mt-4 mb-8">
            {step.description}
          </p>

          {/* Recommended Action at the end */}
          {currentStep === TOUR_STEPS.length - 1 && (
            <div className="mb-6 p-4 rounded-xl bg-black/60 border border-[#00F0FF]/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#00F0FF] block">RECOMMENDED FIRST MOVE</span>
                <span className="text-xs font-bold text-white">Run Free Reddit Problem Scraper</span>
              </div>
              <Link href="/agents">
                <Button size="sm" className="cyan-gradient text-black font-extrabold uppercase text-[11px] h-7 px-3">
                  <Play className="w-3 h-3 fill-black mr-1" /> Deploy
                </Button>
              </Link>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
            <span className="text-xs font-mono text-[#8892B0]">
              Step {currentStep + 1} of {TOUR_STEPS.length}
            </span>

            <Button
              onClick={handleNext}
              className="cyan-gradient text-black font-extrabold uppercase holographic-btn text-xs h-9 px-5"
            >
              {step.actionText} <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
