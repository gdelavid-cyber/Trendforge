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
  Radio,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentCompanionModal } from '@/components/chat/AgentCompanionModal';
import { CreditBadge } from '@/components/credits/credit-badge';

export function Header({ userStats }: { userStats?: any } = {}) {
  const { data: session } = useSession() || {};
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCompanionOpen, setIsCompanionOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const pathname = usePathname();

  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/earn', label: 'Tasks & Earn', icon: Zap },
    { href: '/trends', label: 'Trends Radar', icon: Radio },
  ];

  const adminLinks = [
    { href: '/admin', label: 'Admin Command', icon: LayoutDashboard },
    { href: '/admin/swarms', label: 'The 2 AI Swarms', icon: Bot },
    { href: '/admin/council', label: 'Money Council', icon: Flame },
    { href: '/admin/compliance', label: 'Compliance Audit', icon: ShieldCheck },
  ];

  return (
    <>
      <div className="sticky top-3 z-50 w-full px-3 md:px-6 pointer-events-none">
        <header className="max-w-[1260px] mx-auto rounded-2xl backdrop-blur-2xl bg-[#06060E]/90 border border-white/[0.1] shadow-[0_10px_40px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all pointer-events-auto">
          <div className="flex items-center justify-between px-4 md:px-6 h-16">
            {/* Logo */}
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
                    AI REVENUE ENGINE
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation - Clean 3 Tabs */}
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`px-3.5 py-2 rounded-xl text-xs font-mono font-medium flex items-center gap-2 transition-all ${
                        isActive
                          ? 'text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/30 shadow-[0_0_15px_rgba(0,240,255,0.15)] font-bold'
                          : 'text-[#8E9BB4] hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#00F0FF]' : ''}`} />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Right Side: Visual AI Face of Trendly + User Actions */}
            <div className="hidden md:flex items-center gap-3">
              <CreditBadge />

              {/* The Face of Trendly: Visual AI button */}
              <Button
                onClick={() => setIsCompanionOpen(true)}
                size="sm"
                className="cyan-gradient text-black font-extrabold uppercase text-xs h-9 px-3.5 holographic-btn font-mono shadow-[0_0_15px_rgba(0,240,255,0.2)]"
              >
                <Bot className="w-4 h-4 mr-1.5 fill-black" />
                Talk to AI
              </Button>

              {isAdmin && (
                <div 
                  className="relative"
                  onMouseEnter={() => setAdminDropdownOpen(true)}
                  onMouseLeave={() => setAdminDropdownOpen(false)}
                >
                  <Link href="/admin">
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Admin</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </Link>

                  <AnimatePresence>
                    {adminDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-[#06060E]/95 backdrop-blur-xl border border-purple-500/30 shadow-2xl p-1.5 z-50"
                      >
                        {adminLinks.map((al) => (
                          <Link key={al.href} href={al.href}>
                            <div className="px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2 text-purple-200 hover:text-white hover:bg-purple-500/20 transition">
                              <al.icon className="w-3.5 h-3.5 text-purple-400" />
                              <span>{al.label}</span>
                            </div>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {session?.user ? (
                <>
                  <Link href="/profile">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs font-mono text-[#8E9BB4] hover:text-white hover:bg-white/[0.05] h-8 px-2.5"
                    >
                      <User className="w-3.5 h-3.5 mr-1 text-[#00F0FF]" /> Profile
                    </Button>
                  </Link>
                  <Button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    variant="ghost"
                    size="sm"
                    className="text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 px-2.5"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-1" /> Exit
                  </Button>
                </>
              ) : (
                <Link href="/auth/signin">
                  <Button size="sm" className="h-8 px-4 text-xs font-mono uppercase bg-white text-black font-bold hover:bg-slate-200">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Trigger */}
            <div className="flex md:hidden items-center gap-2">
              <Button
                onClick={() => setIsCompanionOpen(true)}
                size="sm"
                className="cyan-gradient text-black font-bold text-xs h-8 px-2.5 font-mono"
              >
                <Bot className="w-3.5 h-3.5 mr-1 fill-black" /> AI
              </Button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 rounded-lg text-[#8E9BB4] hover:text-white hover:bg-white/[0.05]"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t border-white/[0.08] px-4 py-4 space-y-2 bg-[#06060E]/95 rounded-b-2xl"
              >
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-mono ${
                        isActive
                          ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 font-bold'
                          : 'text-[#8E9BB4] hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20"
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>Admin Command & Swarms</span>
                  </Link>
                )}

                {session?.user && (
                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                    <Link
                      href="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="text-xs font-mono text-[#8E9BB4] hover:text-white flex items-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5 text-[#00F0FF]" /> Profile
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="text-xs font-mono text-rose-400 flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      </div>

      {/* Global Visual AI Companion Modal */}
      <AgentCompanionModal
        isOpen={isCompanionOpen}
        onClose={() => setIsCompanionOpen(false)}
        user={session?.user as any}
      />
    </>
  );
}
