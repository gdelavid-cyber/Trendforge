'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  Download,
  Wand2,
  BookOpen,
  ArrowRight,
  Twitter,
  Linkedin,
  Instagram,
  Menu,
  Plus,
  X,
  Zap,
  TrendingUp,
  Bot,
  Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row relative z-10 text-white font-sans overflow-x-hidden">
      {/* =========================================================================
          LEFT PANEL (Primary Hero & Vision Statement)
          ========================================================================= */}
      <div className="w-full lg:w-[52%] p-3 sm:p-5 lg:p-6 flex flex-col min-h-screen">
        <div className="liquid-glass-strong rounded-3xl p-6 sm:p-8 lg:p-10 flex flex-col justify-between flex-1 relative overflow-hidden">
          
          {/* Top Nav Header */}
          <header className="flex items-center justify-between w-full">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
                <Image
                  src="/logo.png"
                  alt="Trendly Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-semibold text-2xl tracking-tighter text-white">
                trendly
              </span>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="liquid-glass rounded-full px-4 py-2 flex items-center gap-2 text-xs font-medium text-white/80 hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              <span>Menu</span>
              <Menu className="w-3.5 h-3.5 text-white/80" />
            </button>
          </header>

          {/* Center Hero Section */}
          <section className="flex-1 flex flex-col items-center justify-center text-center my-10 lg:my-4 space-y-7">
            {/* Center Emblem */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center p-2 relative shadow-2xl"
            >
              <Image
                src="/logo.png"
                alt="Trendly Icon"
                width={80}
                height={80}
                className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
              />
            </motion.div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-medium tracking-[-0.05em] text-white leading-[1.08] max-w-xl">
              Innovating the <br />
              <span className="font-serif italic text-white/80">
                spirit of autonomous wealth
              </span>
            </h1>

            {/* CTA Button */}
            <Link
              href="/tasks"
              className="liquid-glass-strong rounded-full px-7 py-3.5 flex items-center gap-3 text-sm font-medium text-white hover:scale-105 active:scale-95 transition-transform shadow-2xl group cursor-pointer"
            >
              <span>Explore Radar</span>
              <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                <Download className="w-3.5 h-3.5 text-white" />
              </div>
            </Link>

            {/* Three Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              {['Autonomous Swarms', 'AI Market Execution', '3D Companion Intelligence'].map(
                (pill) => (
                  <span
                    key={pill}
                    className="liquid-glass rounded-full px-4 py-1.5 text-xs text-white/80 hover:text-white hover:scale-105 transition-transform cursor-default"
                  >
                    {pill}
                  </span>
                )
              )}
            </div>
          </section>

          {/* Bottom Visionary Quote */}
          <footer className="text-center pt-6 border-t border-white/[0.04] space-y-1.5">
            <div className="text-[10px] tracking-widest uppercase text-white/50 font-mono">
              VISIONARY WEALTH ARCHITECTURE
            </div>
            <p className="text-xs sm:text-sm text-white/90 font-light">
              "We engineered an operating system{' '}
              <span className="font-serif italic text-white">
                with zero human latency
              </span>
              ."
            </p>
            <div className="flex items-center justify-center gap-3 pt-1">
              <span className="w-6 sm:w-10 h-[1px] bg-white/20" />
              <span className="text-[9px] sm:text-[10px] tracking-widest text-white/60 uppercase font-mono">
                TRENDLY PROTOCOL // CORE SWARM
              </span>
              <span className="w-6 sm:w-10 h-[1px] bg-white/20" />
            </div>
          </footer>

        </div>
      </div>

      {/* =========================================================================
          RIGHT PANEL (Desktop Intelligence & Feature Ecosystem)
          ========================================================================= */}
      <div className="hidden lg:flex lg:w-[48%] flex-col justify-between p-6 min-h-screen space-y-6">
        
        {/* Top Action Bar */}
        <div className="flex items-center justify-between w-full">
          {/* Social Icons Pill */}
          <div className="liquid-glass rounded-full px-4 py-2 flex items-center gap-4">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="text-white hover:text-white/80 transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="text-white hover:text-white/80 transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="text-white hover:text-white/80 transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-3.5 h-3.5" />
            </a>
            <Link
              href="/community"
              className="text-white hover:text-white/80 transition-colors ml-1"
              aria-label="Go to Community"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Account Pill */}
          <Link
            href="/auth/signin"
            className="liquid-glass rounded-full px-4 py-2 text-xs font-medium text-white flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <span>Account</span>
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </Link>
        </div>

        {/* Floating Ecosystem Card */}
        <div className="self-end">
          <Link
            href="/manifesto"
            className="liquid-glass rounded-2xl p-4 w-60 block space-y-1 hover:scale-105 transition-transform group"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-white">Enter the Web4 Swarm</div>
              <Activity className="w-3 h-3 text-white/50 group-hover:text-white transition-colors" />
            </div>
            <p className="text-[11px] text-white/60 leading-relaxed">
              Deploy autonomous agents to discover, verify, and capture high-alpha market anomalies 24/7.
            </p>
          </Link>
        </div>

        {/* Bottom Feature Section */}
        <div className="mt-auto space-y-3">
          <div className="liquid-glass rounded-[2.5rem] p-5 space-y-3">
            
            {/* Two Side-by-Side Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/tasks"
                className="liquid-glass rounded-3xl p-4 flex items-center justify-between hover:scale-105 transition-transform group"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-white">Live Engine</div>
                  <div className="text-[10px] text-white/50 font-mono">Stream 24/7</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Wand2 className="w-4 h-4 text-white" />
                </div>
              </Link>

              <Link
                href="/trends"
                className="liquid-glass rounded-3xl p-4 flex items-center justify-between hover:scale-105 transition-transform group"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-white">Growth Archive</div>
                  <div className="text-[10px] text-white/50 font-mono">Verified Alpha</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
              </Link>
            </div>

            {/* Bottom Large Feature Card */}
            <div className="liquid-glass rounded-3xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-24 h-16 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 relative">
                  <Image
                    src="/hero-flowers.png"
                    alt="Swarm Sculpting Asset"
                    width={96}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-white">
                    Autonomous Alpha Pipeline
                  </div>
                  <p className="text-[11px] text-white/60 leading-snug max-w-[220px]">
                    Real-time companion training, neural workflow automation, and asset creation.
                  </p>
                </div>
              </div>

              <Link
                href="/avatar-studio"
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all flex-shrink-0"
                aria-label="Launch Forge"
              >
                <Plus className="w-4 h-4 text-white" />
              </Link>
            </div>

          </div>
        </div>

      </div>

      {/* =========================================================================
          MOBILE SLIDE-OVER NAVIGATION DRAWER
          ========================================================================= */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[80%] max-w-sm bg-[#040714]/95 backdrop-blur-2xl border-l border-white/10 z-50 p-6 flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                      <Image
                        src="/logo.png"
                        alt="Logo"
                        width={24}
                        height={24}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-semibold text-lg tracking-tighter text-white">
                      trendly
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-full text-white/70 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-3">
                  {[
                    { label: 'Weekly Tasks', href: '/tasks', icon: Zap },
                    { label: 'Trends Radar', href: '/trends', icon: TrendingUp },
                    { label: 'Companion Forge', href: '/avatar-studio', icon: Bot },
                    { label: 'Web4 Whitepaper', href: '/manifesto', icon: BookOpen },
                    { label: 'Pricing Plans', href: '/pricing', icon: Sparkles },
                    { label: 'Live Dashboard', href: '/dashboard', icon: Activity },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl liquid-glass text-sm text-white/90 hover:text-white hover:scale-105 transition-transform"
                      >
                        <Icon className="w-4 h-4 text-white/70" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-6 border-t border-white/10 space-y-3">
                <Link
                  href="/auth/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 rounded-full liquid-glass-strong text-center text-xs font-medium text-white block hover:scale-105 transition-transform"
                >
                  Sign In to Account
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
