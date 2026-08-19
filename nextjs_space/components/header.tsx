'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { Flame, Menu, X, User, LogOut, LayoutDashboard, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header(props?: any) {
  const { data: session } = useSession() || {};
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = session?.user
    ? [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/tasks', label: 'Tasks', icon: Zap },
        { href: '/trends', label: 'Trends', icon: Flame },
        { href: '/community', label: 'Community', icon: User },
        { href: '/marketplace', label: 'Marketplace', icon: Flame },
      ]
    : [
        { href: '/pricing', label: 'Pricing', icon: Zap },
        { href: '/stories', label: 'Success Stories', icon: Flame },
      ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#0A0A0F]/80 border-b border-border-subtle">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-4 h-16">
        <Link href={session?.user ? '/dashboard' : '/'} className="flex items-center gap-2">
          <Flame className="w-7 h-7 text-gold" />
          <span className="font-display font-bold text-xl gold-text">Trendly</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-gold">
                <item.icon className="w-4 h-4 mr-1" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {session?.user ? (
            <>
              <Link href="/profile">
                <Button variant="ghost" size="sm"><User className="w-4 h-4 mr-1" /> Profile</Button>
              </Link>
              {(session.user as any)?.role === 'ADMIN' && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="text-red-400">Admin</Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
                <LogOut className="w-4 h-4 mr-1" /> Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="gold-gradient text-black font-semibold">Start Free</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border-subtle bg-[#0A0A0F] px-4 pb-4">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
              <div className="py-3 text-muted-foreground hover:text-gold flex items-center gap-2">
                <item.icon className="w-4 h-4" /> {item.label}
              </div>
            </Link>
          ))}
          {session?.user ? (
            <Button variant="ghost" className="w-full mt-2" onClick={() => signOut({ callbackUrl: '/' })}>
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              <Link href="/auth/signin" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full">Sign In</Button>
              </Link>
              <Link href="/auth/signup" onClick={() => setMobileOpen(false)}>
                <Button className="w-full gold-gradient text-black font-semibold">Start Free</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
