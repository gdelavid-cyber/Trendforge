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
  ChevronDown,
  Globe,
  Coins,
  ListChecks,
  Radio,
  BookOpen,
  Users,
  Store,
  Gift,
  Tag,
  Wrench,
  ShieldCheck,
  CircleHelp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentCompanionModal } from '@/components/chat/AgentCompanionModal';
import { SpotlightTour } from '@/components/guide/spotlight-tour';
import { guideForPath } from '@/lib/guide/content';
import { CONTEST_MODE } from '@/lib/flags';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

type NavEntry = ({ kind: 'flat' } & NavItem) | ({ kind: 'group' } & NavGroup);

const EARN_GROUP: NavGroup = {
  label: 'Earn',
  icon: Coins,
  items: [
    { href: '/earn/start', label: '⚡ Make First $500', icon: Zap },
    { href: '/earn', label: 'Earn Overview', icon: Sparkles },
    { href: '/trends', label: 'Trends Radar', icon: Radio },
  ],
};

// Contest surface: the core guided loop
const EARN_GROUP_CORE: NavGroup = EARN_GROUP;

const COMPANION_GROUP: NavGroup = {
  label: 'My Companion',
  icon: Bot,
  items: [
    { href: '/avatar-studio', label: 'The Forge', icon: Sparkles },
    { href: '/approvals', label: 'Approval Inbox', icon: ListChecks },
  ],
};

const BUILD_GROUP: NavGroup = {
  label: 'Build',
  icon: Layers,
  items: [
    { href: '/builder', label: 'Agent Studio', icon: Wrench },
    { href: '/agents', label: 'My Agents', icon: Cpu },
    { href: '/agents/web4', label: 'Web4 Sovereign', icon: ShieldCheck },
    { href: '/workflows', label: 'Workflows', icon: Zap },
    { href: '/manifesto', label: 'Web4 Manifesto', icon: BookOpen },
  ],
};

const MARKET_GROUP: NavGroup = {
  label: 'Market',
  icon: Store,
  items: [
    { href: '/marketplace', label: 'Marketplace', icon: Flame },
    { href: '/referrals', label: 'Referrals', icon: Gift },
    { href: '/pricing', label: 'Pricing', icon: Tag },
  ],
};

export function Header(props?: any) {
  const { data: session } = useSession() || {};
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCompanionOpen, setIsCompanionOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const pathname = usePathname();

  const signedInNav: NavEntry[] = CONTEST_MODE
    ? [
        { kind: 'flat', href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { kind: 'group', ...EARN_GROUP_CORE },
        { kind: 'group', ...COMPANION_GROUP },
        { kind: 'flat', href: '/manifesto', label: 'White Paper', icon: BookOpen },
        { kind: 'flat', href: '/guide', label: 'Guide', icon: BookOpen },
      ]
    : [
        { kind: 'flat', href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { kind: 'group', ...EARN_GROUP },
        { kind: 'group', ...COMPANION_GROUP },
        { kind: 'group', ...BUILD_GROUP },
        { kind: 'flat', href: '/manifesto', label: 'White Paper', icon: BookOpen },
        { kind: 'flat', href: '/community', label: 'Community', icon: Users },
        { kind: 'group', ...MARKET_GROUP },
      ];

  const anonymousNav: NavEntry[] = CONTEST_MODE
    ? [
        { kind: 'group', ...EARN_GROUP_CORE },
        { kind: 'flat', href: '/manifesto', label: 'White Paper', icon: BookOpen },
        { kind: 'flat', href: '/guide', label: 'Guide', icon: BookOpen },
      ]
    : [
        { kind: 'group', ...EARN_GROUP },
        { kind: 'flat', href: '/manifesto', label: 'White Paper', icon: BookOpen },
        { kind: 'flat', href: '/marketplace', label: 'Marketplace', icon: Flame },
        { kind: 'flat', href: '/guide', label: 'Guide', icon: BookOpen },
        { kind: 'flat', href: '/pricing', label: 'Pricing', icon: Tag },
      ];

  const navEntries = session?.user ? signedInNav : anonymousNav;

  // Guide: current page's spotlight steps; Help replays them or opens /guide.
  const pageGuide = guideForPath(pathname ?? '/');
  const tourSteps = pageGuide?.tour ?? [];
  const replayTour = () => {
    if (tourSteps.length > 0) {
      window.dispatchEvent(new CustomEvent('trendly:start-tour'));
    } else {
      window.location.href = '/guide';
    }
  };

  const isEntryActive = (entry: NavEntry): boolean => {
    if (entry.kind === 'flat') return pathname === entry.href;
    return entry.items.some((i) => pathname === i.href || pathname.startsWith(i.href + '/'));
  };

  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  const adminLinks = [
    { href: '/web4/swarm', label: 'Revenue Swarm', icon: Zap, color: 'text-cyan-400' },
    { href: '/admin/brain', label: 'Brain', icon: Cpu, color: 'text-purple-400' },
    { href: '/admin/health', label: 'Health', icon: Activity, color: 'text-green-400' },
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
                  COMPANION ECONOMY
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1" onMouseLeave={() => setOpenGroup(null)}>
            {navEntries.map((entry) => {
              if (entry.kind === 'flat') {
                const isActive = isEntryActive(entry);
                return (
                  <Link key={entry.href} href={entry.href}>
                    <div
                      className={`relative px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
                        isActive
                          ? 'text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/30 shadow-[0_0_15px_rgba(0,240,255,0.15)] font-bold'
                          : 'text-[#8E9BB4] hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <entry.icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00F0FF]' : ''}`} />
                      <span>{entry.label}</span>
                    </div>
                  </Link>
                );
              }

              const active = isEntryActive(entry);
              const isOpen = openGroup === entry.label;
              return (
                <div
                  key={entry.label}
                  className="relative"
                  onMouseEnter={() => setOpenGroup(entry.label)}
                >
                  <button
                    onClick={() => setOpenGroup(isOpen ? null : entry.label)}
                    className={`relative px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
                      active
                        ? 'text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/30 font-bold'
                        : isOpen
                        ? 'text-white bg-white/[0.06] border border-white/10'
                        : 'text-[#8E9BB4] hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <entry.icon className={`w-3.5 h-3.5 ${active ? 'text-[#00F0FF]' : ''}`} />
                    <span>{entry.label}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-2 w-52 rounded-xl bg-[#06060E]/95 backdrop-blur-xl border border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.7)] p-1.5"
                      >
                        {entry.items.map((item) => {
                          const itemActive =
                            pathname === item.href || pathname.startsWith(item.href + '/');
                          return (
                            <Link key={item.href} href={item.href}>
                              <div
                                className={`px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2.5 transition-all ${
                                  itemActive
                                    ? 'text-[#00F0FF] bg-[#00F0FF]/10'
                                    : 'text-[#8E9BB4] hover:text-white hover:bg-white/[0.05]'
                                }`}
                              >
                                <item.icon
                                  className={`w-3.5 h-3.5 ${itemActive ? 'text-[#00F0FF]' : 'text-[#8E9BB4]'}`}
                                />
                                <span>{item.label}</span>
                              </div>
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* User & Action Controls */}
          <div className="hidden md:flex items-center gap-2.5">
            <Link href="/manifesto">
              <Button
                size="sm"
                variant="outline"
                className="border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10 bg-[#FFD700]/5 text-xs font-mono uppercase h-8 px-2.5 font-bold shadow-[0_0_10px_rgba(255,215,0,0.1)]"
              >
                <BookOpen className="w-3.5 h-3.5 mr-1 text-[#FFD700]" /> White Paper
              </Button>
            </Link>
            <Button
              onClick={replayTour}
              size="sm"
              variant="outline"
              aria-label="Help — replay the page tour or open the guide"
              className="border-white/10 text-[#8E9BB4] hover:text-white bg-white/[0.03] text-xs font-mono uppercase h-8 px-3"
            >
              <CircleHelp className="w-3.5 h-3.5 mr-1 text-[#00F0FF]" /> Help
            </Button>
            <Button
              onClick={() => setIsCompanionOpen(true)}
              size="sm"
              variant="outline"
              className="border-[#00F0FF]/30 text-[#00F0FF] bg-[#00F0FF]/10 text-xs font-mono uppercase h-8 px-3 hover:bg-[#00F0FF]/20 shadow-[0_0_12px_rgba(0,240,255,0.15)] font-bold"
            >
              <Bot className="w-3.5 h-3.5 mr-1 text-[#00F0FF] animate-pulse" /> Talk
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
                {isAdmin && (
                  <div
                    className="relative"
                    onMouseEnter={() => setOpenGroup('__admin')}
                    onMouseLeave={() => setOpenGroup(null)}
                  >
                    <button
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-all ${
                        openGroup === '__admin'
                          ? 'text-purple-300 bg-purple-500/10 border-purple-500/30'
                          : 'text-purple-400 hover:bg-purple-500/10 border-purple-500/20'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Admin
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <AnimatePresence>
                      {openGroup === '__admin' && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-[#06060E]/95 backdrop-blur-xl border border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.7)] p-1.5"
                        >
                          {adminLinks.map((link) => (
                            <Link key={link.href} href={link.href}>
                              <div className="px-3 py-2 rounded-lg text-xs font-mono text-[#8E9BB4] hover:text-white hover:bg-white/[0.05] flex items-center gap-2.5">
                                <link.icon className={`w-3.5 h-3.5 ${link.color}`} />
                                <span>{link.label}</span>
                              </div>
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
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
              className="xl:hidden border-t border-white/[0.08] px-4 py-4 space-y-1 bg-[#06060E]/95 rounded-b-2xl overflow-y-auto max-h-[70vh]"
            >
              {navEntries.map((entry) => {
                if (entry.kind === 'flat') {
                  return (
                    <Link key={entry.href} href={entry.href} onClick={() => setMobileOpen(false)}>
                      <div className="py-2.5 px-3 rounded-lg text-sm font-mono text-[#8E9BB4] hover:text-white hover:bg-white/[0.05] flex items-center gap-2.5">
                        <entry.icon className="w-4 h-4 text-[#00F0FF]" />
                        <span>{entry.label}</span>
                      </div>
                    </Link>
                  );
                }
                return (
                  <div key={entry.label} className="pt-2">
                    <div className="px-3 pb-1 text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                      <entry.icon className="w-3.5 h-3.5 text-[#00F0FF]/70" />
                      {entry.label}
                    </div>
                    {entry.items.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                        <div className="py-2 pl-8 pr-3 rounded-lg text-sm font-mono text-[#8E9BB4] hover:text-white hover:bg-white/[0.05] flex items-center gap-2.5">
                          <item.icon className="w-3.5 h-3.5 text-[#00F0FF]/50" />
                          <span>{item.label}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                );
              })}

              <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-2">
                <Link href="/guide" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-xs font-mono text-white">
                    <BookOpen className="w-4 h-4 mr-2 text-[#00F0FF]" /> Platform Guide
                  </Button>
                </Link>
                {session?.user ? (
                  <>
                    <Link href="/profile" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-xs font-mono text-white">
                        <User className="w-4 h-4 mr-2 text-[#00F0FF]" /> Profile
                      </Button>
                    </Link>
                    {isAdmin && (
                      <>
                        {adminLinks.map((link) => (
                          <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start text-xs font-mono text-white">
                              <link.icon className={`w-4 h-4 mr-2 ${link.color}`} /> {link.label}
                            </Button>
                          </Link>
                        ))}
                      </>
                    )}
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

    {/* Page spotlight tour — auto-shows once, replays via Help */}
    <SpotlightTour key={pathname} steps={tourSteps} />
  </>
  );
}
