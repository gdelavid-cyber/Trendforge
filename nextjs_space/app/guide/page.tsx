export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { Header } from '@/components/layouts/header';
import { GUIDE_PAGES } from '@/lib/experience/guide/content';
import { GuideHubClient } from './_components/guide-hub-client';

export default async function GuidePage() {
  const session = await getServerSession(authOptions);

  const groups = ['Earn', 'Companions & Agents', 'World & Market', 'Account'] as const;

  return (
    <div className="min-h-screen bg-transparent text-[#F3F3F5]">
      <Header />
      <GuideHubClient signedIn={Boolean(session?.user)}>
        <div className="max-w-[1100px] mx-auto px-4 py-10">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-xs font-mono mb-2">
              PLATFORM GUIDE
            </div>
            <h1 className="font-orbitron text-3xl md:text-5xl font-black uppercase tracking-wider text-white">
              How Trendly <span className="cyan-gold-gradient-text">Actually Works</span>
            </h1>
            <p className="text-sm text-[#8E9BB4] mt-2 max-w-2xl">
              Every page, what it really does, and what you can do there. No hype — this
              platform runs on real money and real work, so everything below describes
              actual behavior.
            </p>
          </div>

          {/* Anchor nav */}
          <nav className="sticky top-20 z-30 glass-card rounded-xl border border-white/10 px-4 py-3 mb-8 overflow-x-auto">
            <div className="flex gap-4 min-w-max">
              {groups.map((group) => (
                <a
                  key={group}
                  href={`#group-${group.replace(/[^a-z]/gi, '-').toLowerCase()}`}
                  className="text-xs font-mono uppercase tracking-wide text-[#8E9BB4] hover:text-[#00F0FF] whitespace-nowrap transition-colors"
                >
                  {group}
                </a>
              ))}
            </div>
          </nav>

          <div className="space-y-12">
            {groups.map((group) => (
              <section key={group} id={`group-${group.replace(/[^a-z]/gi, '-').toLowerCase()}`} className="scroll-mt-36">
                <h2 className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-gold mb-4">{group}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {GUIDE_PAGES.filter((p) => p.group === group).map((page) => (
                    <article key={page.path} id={page.path.replace(/\//g, '-').replace(/^-/, '') || 'home'} className="glass-card border border-white/[0.07] rounded-xl p-5 flex flex-col scroll-mt-36">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="font-bold text-white font-mono uppercase text-sm">{page.title}</h3>
                        {page.tour.length > 0 && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20 whitespace-nowrap">
                            TOUR AVAILABLE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#00F0FF]/90 font-mono mb-3">{page.tagline}</p>

                      <p className="text-xs text-[#B0B0C8] leading-relaxed mb-3">{page.whatItDoes}</p>

                      <div className="mb-3">
                        <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/60 mb-1">What you can do</h4>
                        <ul className="space-y-1 list-disc pl-4">
                          {page.actions.map((a, i) => (
                            <li key={i} className="text-xs text-[#B0B0C8]">{a}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/60 mb-1">Tips</h4>
                        <ul className="space-y-1 list-disc pl-4">
                          {page.tips.map((t, i) => (
                            <li key={i} className="text-xs text-[#B0B0C8]">{t}</li>
                          ))}
                        </ul>
                      </div>

                      {page.path.includes('[') ? (
                        // Pattern routes (/tasks/[id]) are templates, not
                        // navigable URLs — Link rejects them at render.
                        <a
                          href={page.path.split('[')[0].replace(/\/$/, '') || '/'}
                          className="mt-auto inline-flex items-center gap-1 text-xs font-mono uppercase text-[#00F0FF] hover:text-white transition-colors"
                        >
                          Open {page.title} →
                        </a>
                      ) : (
                        <Link
                          href={page.path}
                          className="mt-auto inline-flex items-center gap-1 text-xs font-mono uppercase text-[#00F0FF] hover:text-white transition-colors"
                        >
                          Open {page.title} →
                        </Link>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </GuideHubClient>
    </div>
  );
}
