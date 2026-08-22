'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Flame,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Zap,
  Bot,
  Cpu,
  Layers,
  Activity,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentCompanionModal } from '@/components/chat/AgentCompanionModal';

export function Header(props?: any) {
  const { data: session } = useSession() || {};
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCompanionOpen, setIsCompanionOpen] = useState(false);
  const pathname = usePathname();

  const navItems = session?.user
    ? [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/agents', label: 'Web4 Agents', icon: Bot, isSpecial: true },
        { href: '/builder', label: 'Agent Studio', icon: Layers },
        { href: '/avatar-studio', label: 'Avatar Studio', icon: Sparkles },
        { href: '/marketplace', label: 'Marketplace', icon: Flame },
        { href: '/battles', label: 'Battles', icon: Zap },
        { href: '/community', label: 'Community', icon: User },
      ]
    : [
        { href: '/agents', label: 'Web4 Agents', icon: Bot, isSpecial: true },
        { href: '/builder', label: 'Agent Studio', icon: Layers },
        { href: '/avatar-studio', label: 'Avatar Studio', icon: Sparkles },
        { href: '/marketplace', label: 'Marketplace', icon: Flame },
        { href: '/battles', label: 'Battles', icon: Zap },
        { href: '/pricing', label: 'Pricing', icon: Cpu },
      ];

  return (
    <>
      <div className="sticky top-3 z-50 w-full px-3 md:px-6 pointer-events-none">
      <header className="max-w-[1260px] mx-auto rounded-2xl backdrop-blur-2xl bg-[#06060E]/80 border border-white/[0.1] shadow-[0_10px_40px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all pointer-events-auto">
        <div className="flex items-center justify-between px-4 md:px-6 h-16">
          {/* Logo & Status Beacon */}
          <div className="flex items-center gap-3">
            <Link href={session?.user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#00F0FF]/20 to-[#FFD700]/20 border border-[#00F0FF]/30 group-hover:border-[#00F0FF] transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                <Flame className="w-5 h-5 text-[#00F0FF] group-hover:text-[#FFD700] transition-colors animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="font-orbitron font-black text-xl tracking-wider text-white flex items-center gap-1">
                  TREND<span className="text-[#00F0FF]">LY</span>
                </span>
                <span className="text-[8px] font-mono text-[#8E9BB4] tracking-widest uppercase -mt-1 hidden sm:block">
                  AUTONOMOUS // OS 2.4
                </span>
              </div>
            </Link>

            {/* Live Telemetry Beacon (Desktop) */}
            <div className="hidden lg:flex items-center gap-1.5 ml-4 px-2.5 py-1 rounded-full bg-black/40 border border-white/5 text-[10px] font-mono text-[#8E9BB4]">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
              <span className="text-green-400 font-bold">100% NOMINAL</span>
              <span className="text-white/20">|</span>
              <span>38ms</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`relative px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
                      isActive
                        ? 'text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/30 shadow-[0_0_15px_rgba(0,240,255,0.15)] font-bold'
                        : 'text-[#8E9BB4] hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <item.icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00F0FF]' : item.isSpecial ? 'text-[#00F0FF]' : ''}`} />
                    <span>{item.label}</span>
                    {item.isSpecial && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User & Action Controls */}
          <div className="hidden md:flex items-center gap-2.5">
            <Button
              onClick={() => setIsCompanionOpen(true)}
              size="sm"
              variant="outline"
              className="border-[#00F0FF]/30 text-[#00F0FF] bg-[#00F0FF]/10 text-xs font-mono uppercase h-8 px-3 hover:bg-[#00F0FF]/20 shadow-[0_0_12px_rgba(0,240,255,0.15)] font-bold"
            >
              <Bot className="w-3.5 h-3.5 mr-1 text-[#00F0FF] animate-pulse" /> 🎙️ Talk
            </Button>
            {session?.user ? (
              <>
                <Link href="/profile">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-mono text-[#8E9BB4] hover:text-white hover:bg-white/[0.05] h-8 px-3"
                  >
                    <User className="w-3.5 h-3.5 mr-1 text-[#00F0FF]" /> Profile
                  </Button>
                </Link>
                {(session.user as any)?.role === 'ADMIN' && (
                  <>
                    <Link href="/admin/brain">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs font-mono text-purple-400 hover:bg-purple-500/10 h-8 px-3 border border-purple-500/20"
                      >
                        <Cpu className="w-3.5 h-3.5 mr-1" /> Brain
                      </Button>
                    </Link>
                    <Link href="/admin/health">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs font-mono text-green-400 hover:bg-green-500/10 h-8 px-3 border border-green-500/20"
                      >
                        <Activity className="w-3.5 h-3.5 mr-1" /> Health
                      </Button>
                    </Link>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-xs font-mono text-red-400/80 hover:text-red-400 hover:bg-red-500/10 h-8 px-3"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1" /> Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-mono text-[#8E9BB4] hover:text-white hover:bg-white/[0.05] h-8 px-4"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button
                    size="sm"
                    className="cyan-gradient text-black font-extrabold uppercase text-xs h-8 px-4 holographic-btn font-mono tracking-wider"
                  >
                    Launch Free <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <button
            className="xl:hidden p-2 rounded-lg bg-white/[0.04] border border-white/10 text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5 text-[#00F0FF]" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Slide-Down HUD */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="xl:hidden border-t border-white/[0.08] px-4 py-4 space-y-2 bg-[#06060E]/95 rounded-b-2xl"
            >
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                  <div className="py-2 px-3 rounded-lg text-sm font-mono text-[#8E9BB4] hover:text-white hover:bg-white/[0.05] flex items-center gap-2.5">
                    <item.icon className="w-4 h-4 text-[#00F0FF]" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              ))}

              <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-2">
                {session?.user ? (
                  <>
                    <Link href="/profile" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-xs font-mono text-white">
                        <User className="w-4 h-4 mr-2 text-[#00F0FF]" /> Profile
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-xs font-mono text-red-400"
                      onClick={() => signOut({ callbackUrl: '/' })}
                    >
                      <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </Button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/auth/signin" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full text-xs font-mono border-white/10 text-white">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/signup" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full cyan-gradient text-black font-extrabold text-xs font-mono">
                        Launch Free
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </div>

    {/* Global AI Companion Header Modal */}
    <AgentCompanionModal
      isOpen={isCompanionOpen}
      onClose={() => setIsCompanionOpen(false)}
      user={session?.user}
    />
  </>
  );
}
