import Link from 'next/link';

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Product',
    links: [
      { href: '/tasks', label: 'Weekly Tasks' },
      { href: '/trends', label: 'Trends Radar' },
      { href: '/stories', label: 'Success Stories' },
      { href: '/pricing', label: 'Pricing' },
    ],
  },
  {
    title: 'Companion',
    links: [
      { href: '/avatar-studio', label: 'The Forge' },
      { href: '/arena', label: 'The World' },
      { href: '/marketplace', label: 'Marketplace' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/legal', label: 'Legal' },
      { href: '/compliance', label: 'Compliance' },
      { href: '/status', label: 'Status' },
      { href: '/enterprise', label: 'Enterprise' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative z-10 mt-16 border-t border-white/[0.06] bg-black/40">
      <div className="max-w-[1260px] mx-auto px-4 md:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="font-orbitron font-black text-lg tracking-wider text-white">
              TREND<span className="text-[#00F0FF]">LY</span>
            </div>
            <p className="mt-2 text-[11px] font-mono text-[#8E9BB4] leading-relaxed max-w-[220px]">
              Forge your AI companion. Pick a trending task. One click — it does
              the rest. You own everything.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 mb-3">
                {col.title}
              </div>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs font-mono text-[#8E9BB4] hover:text-[#00F0FF] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-[11px] font-mono text-white/30">
            © {new Date().getFullYear()} Trendly · Companion Economy
          </span>
          <span className="text-[10px] font-mono text-white/20 tracking-widest uppercase">
            Own your AI // Everywhere
          </span>
        </div>
      </div>
    </footer>
  );
}
