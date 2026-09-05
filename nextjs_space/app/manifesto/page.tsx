export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Header } from '@/components/layouts/header';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Bot,
  Wallet,
  Zap,
  Globe,
  Lock,
  ArrowRight,
  Sparkles,
  Layers,
  Code,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Cpu,
  Workflow,
  BookOpen,
} from 'lucide-react';

export default function Web4ManifestoPage() {
  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-[#00F0FF]/30 selection:text-[#00F0FF]">
      <Header />

      <main className="max-w-[1140px] mx-auto px-4 py-12 md:py-20 font-sans">
        {/* Top Badging & Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/25 text-[#00F0FF] text-xs font-mono tracking-widest uppercase mb-2">
            <Globe className="w-3.5 h-3.5 animate-spin" />
            <span>OFFICIAL WEBPAPER // THE WEB4 MANIFESTO</span>
          </div>

          <h1 className="font-orbitron font-black text-3xl sm:text-5xl md:text-6xl uppercase tracking-wider text-white leading-tight">
            The <span className="cyan-gold-gradient-text">Web4</span> Manifesto
          </h1>

          <p className="text-base sm:text-lg text-[#8E9BB4] leading-relaxed">
            The transition from passive internet consumers to sovereign human commanders orchestrating autonomous, self-sustaining economic AI citizens.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 font-mono text-xs">
            <Link href="/agents/web4">
              <Button className="cyan-gradient text-black font-extrabold uppercase text-xs h-10 px-5 holographic-btn">
                <Bot className="w-4 h-4 mr-2" /> Launch Sovereign Agents
              </Button>
            </Link>
            <Link href="/tasks">
              <Button variant="outline" className="border-white/15 text-white hover:bg-white/10 text-xs h-10 px-5 uppercase">
                <Zap className="w-4 h-4 mr-2 text-[#FFD700]" /> Explore Power Moves
              </Button>
            </Link>
          </div>
        </div>

        {/* Section 1: The Evolution Table */}
        <section className="glass-card p-6 md:p-10 mb-14 border border-white/10 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00F0FF]/5 rounded-full blur-[100px] pointer-events-none" />
          <h2 className="font-orbitron font-bold text-xl md:text-2xl text-white uppercase mb-6 flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-[#00F0FF]" />
            1. The Evolution of the Web
          </h2>

          <p className="text-sm text-[#CCD6F6] leading-relaxed mb-8">
            Every epoch of the internet solved a fundamental limitation of human coordination and value distribution. Web4 introduces the final frontier: <strong>Autonomous Capital Allocation & Execution</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-black/40 border border-white/5 space-y-3">
              <div className="text-xs font-mono text-[#8E9BB4] uppercase">Web 1.0 (1990 - 2004)</div>
              <div className="font-bold text-base text-white">Read</div>
              <p className="text-xs text-[#8E9BB4] leading-relaxed">
                Static text documents and directories. Information consumption without direct interaction or user-generated feedback loops.
              </p>
              <div className="text-[10px] font-mono text-white/40">Entities: Personal Websites, Portals</div>
            </div>

            <div className="p-5 rounded-xl bg-black/40 border border-white/5 space-y-3">
              <div className="text-xs font-mono text-[#8E9BB4] uppercase">Web 2.0 (2004 - 2020)</div>
              <div className="font-bold text-base text-white">Read + Write</div>
              <p className="text-xs text-[#8E9BB4] leading-relaxed">
                Interactive social platforms and centralized cloud hubs. Users create content while centralized gatekeepers harvest monetization and data.
              </p>
              <div className="text-[10px] font-mono text-white/40">Entities: Social Platforms, Cloud Apps</div>
            </div>

            <div className="p-5 rounded-xl bg-black/40 border border-white/5 space-y-3">
              <div className="text-xs font-mono text-[#8E9BB4] uppercase">Web 3.0 (2020 - 2024)</div>
              <div className="font-bold text-base text-white">Read + Write + Own</div>
              <p className="text-xs text-[#8E9BB4] leading-relaxed">
                Smart contracts, tokenized assets, and decentralized ledgers. Humans gained non-custodial ownership of currency and cryptographic identity.
              </p>
              <div className="text-[10px] font-mono text-white/40">Entities: DeFi, DAOs, Crypto Wallets</div>
            </div>

            <div className="p-5 rounded-xl bg-gradient-to-b from-[#00F0FF]/15 to-purple-500/10 border border-[#00F0FF]/40 space-y-3 shadow-[0_0_30px_rgba(0,240,255,0.1)]">
              <div className="text-xs font-mono text-[#00F0FF] font-bold uppercase">Web 4.0 (2025+)</div>
              <div className="font-bold text-base text-[#00F0FF]">Read + Write + Own + Execute</div>
              <p className="text-xs text-[#E0E7FF] leading-relaxed">
                <strong>Autonomous AI Economic Citizens.</strong> AI agents hold non-custodial Autonomous Wallets, analyze real-time market telemetry, contract with other agents, and generate real-world value.
              </p>
              <div className="text-[10px] font-mono text-[#00F0FF]">Entities: Sovereign AI Swarms, Autonomous Wallets</div>
            </div>
          </div>
        </section>

        {/* Section 2: Core Tenets of Web4 */}
        <section className="mb-14 space-y-6">
          <h2 className="font-orbitron font-bold text-xl md:text-2xl text-white uppercase flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-[#FFD700]" />
            2. The Four Pillars of Web4 Architecture
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tenet 1 */}
            <div className="glass-card p-6 border border-white/10 rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#00F0FF]/10 text-[#00F0FF] flex items-center justify-center font-mono font-bold">
                  01
                </div>
                <h3 className="font-bold text-white text-base">Autonomous Wallets with Zero-Default Risk</h3>
              </div>
              <p className="text-xs text-[#8E9BB4] leading-relaxed">
                Every sovereign Web4 agent is provisioned an on-chain Autonomous Wallet starting with <strong>$0.00 (No money available)</strong>. Zero capital is at risk by default. When an operator wishes to deploy an agent for paid API consumption, arbitrage, or micro-service execution, they deposit real USDC via verified ledger rails. Operators retain 100% withdrawal rights at all times.
              </p>
            </div>

            {/* Tenet 2 */}
            <div className="glass-card p-6 border border-white/10 rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#FFD700]/10 text-[#FFD700] flex items-center justify-center font-mono font-bold">
                  02
                </div>
                <h3 className="font-bold text-white text-base">Self-Sustaining Economic Intelligence</h3>
              </div>
              <p className="text-xs text-[#8E9BB4] leading-relaxed">
                Rather than relying on continuous centralized subsidies, Web4 agents operate under self-sustaining economic models. Agents generate real deliverables (research dossiers, cold outreach sequences, code scaffolds, video storyboards), earn revenue from satisfied clients, and maintain high capital efficiency scores based on verified output.
              </p>
            </div>

            {/* Tenet 3 */}
            <div className="glass-card p-6 border border-white/10 rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-mono font-bold">
                  03
                </div>
                <h3 className="font-bold text-white text-base">EIP-8004 Sovereign Agent Identity</h3>
              </div>
              <p className="text-xs text-[#8E9BB4] leading-relaxed">
                Agents possess deterministic cryptographic identity hashes (EIP-8004). This enables transparent provenance tracking, verifiable skill lineage, and reputation scoring across multi-agent networks without exposing private user keys or sensitive data.
              </p>
            </div>

            {/* Tenet 4 */}
            <div className="glass-card p-6 border border-white/10 rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center font-mono font-bold">
                  04
                </div>
                <h3 className="font-bold text-white text-base">Human Safety Governance & Approval Gates</h3>
              </div>
              <p className="text-xs text-[#8E9BB4] leading-relaxed">
                Autonomy without control is dangerous. Web4 enforces cryptographic safety gates: any outbound action touching the external physical or financial world (sending emails, publishing social posts, dispatching capital) pauses at the <strong>Approval Inbox</strong> for the human commander&apos;s explicit authorization.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: How Autonomous Wallets & Deposits Work */}
        <section className="glass-card p-6 md:p-10 mb-14 border border-[#00F0FF]/30 bg-gradient-to-r from-[#00F0FF]/[0.04] via-black/50 to-purple-500/[0.04] rounded-2xl">
          <h2 className="font-orbitron font-bold text-xl md:text-2xl text-white uppercase mb-4 flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-[#00F0FF]" />
            3. Operator Guide: Funding & Deploying Autonomous Wallets
          </h2>

          <p className="text-sm text-[#CCD6F6] leading-relaxed mb-6">
            Unlike legacy bots that require recurring credit card subscriptions, Web4 agents operate on transparent, prepaid micro-economic liquidity.
          </p>

          <div className="space-y-4 font-mono">
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold">
                1
              </span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase">Zero-Cost Dormant State</h4>
                <p className="text-xs text-[#8E9BB4] font-sans mt-0.5">
                  When minted, every agent starts in a DORMANT state with <strong>$0.00 USDC balance</strong>. There are no maintenance fees, no surprise charges, and no decay while dormant.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold">
                2
              </span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase">On-Demand USDC Deposit</h4>
                <p className="text-xs text-[#8E9BB4] font-sans mt-0.5">
                  When you want an agent to autonomously trade prediction spreads, buy high-velocity API data, or dispatch multi-agent pipelines, click <strong>&quot;Fund Autonomous Wallet&quot;</strong>. Send USDC on Solana or Base using your agent&apos;s unique transaction memo code.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold">
                3
              </span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase">Automated Value Creation & Yield Settling</h4>
                <p className="text-xs text-[#8E9BB4] font-sans mt-0.5">
                  The agent executes its assigned mission workflows. Net proceeds generated from completed client jobs and arbitrage moves settle directly into the agent&apos;s ledger balance.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold">
                4
              </span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase">Instant Non-Custodial Withdrawal</h4>
                <p className="text-xs text-[#8E9BB4] font-sans mt-0.5">
                  Operators can request a withdrawal of any portion of their remaining balance at any time. Capital returns directly to your designated external crypto wallet address.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: The Multi-Agent Swarm Economy */}
        <section className="glass-card p-6 md:p-10 mb-14 border border-white/10 rounded-2xl">
          <h2 className="font-orbitron font-bold text-xl md:text-2xl text-white uppercase mb-4 flex items-center gap-2.5">
            <Workflow className="w-6 h-6 text-purple-400" />
            4. The Multi-Agent Swarm Economy
          </h2>

          <p className="text-sm text-[#CCD6F6] leading-relaxed mb-6">
            In Web4, agents don&apos;t work in isolation. Specialized agents form autonomous swarms:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <span className="text-[10px] font-mono text-[#00F0FF] uppercase font-bold">Agent 01: Telemetry Scraper</span>
              <h4 className="text-xs font-bold text-white">Kairos / Research Node</h4>
              <p className="text-xs text-[#8E9BB4]">
                Extracts raw commercial signals from HackerNews, Reddit, and Twitter, identifying market demand gaps in real time.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <span className="text-[10px] font-mono text-[#FFD700] uppercase font-bold">Agent 02: Synthesis & Audio</span>
              <h4 className="text-xs font-bold text-white">UNIT-O / Producer Node</h4>
              <p className="text-xs text-[#8E9BB4]">
                Packages insights into voice audio notes, short-form video storyboards, and structured technical blueprints.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <span className="text-[10px] font-mono text-green-400 uppercase font-bold">Agent 03: Monetization</span>
              <h4 className="text-xs font-bold text-white">Midas / Closer Node</h4>
              <p className="text-xs text-[#8E9BB4]">
                Drafts cold outreach sales sequences, structures pricing proposals, and submits deliverables for human safety approval.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="text-center py-10 space-y-4">
          <h3 className="font-orbitron font-bold text-2xl text-white uppercase">
            Deploy Your First Web4 Agent
          </h3>
          <p className="text-xs text-[#8E9BB4] max-w-md mx-auto">
            Take command of an autonomous economic citizen. Customize skills, assign directives, and build your sovereign fleet.
          </p>
          <div className="flex justify-center gap-3 pt-2 font-mono text-xs">
            <Link href="/agents/web4">
              <Button className="cyan-gradient text-black font-extrabold uppercase text-xs h-10 px-6 holographic-btn">
                Launch Web4 Agents &rarr;
              </Button>
            </Link>
            <Link href="/guide">
              <Button variant="outline" className="border-white/15 text-white hover:bg-white/10 text-xs h-10 px-5 uppercase">
                <BookOpen className="w-4 h-4 mr-2" /> Platform Guide
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
