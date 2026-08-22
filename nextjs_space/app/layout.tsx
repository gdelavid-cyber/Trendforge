export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Inter, Orbitron, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';
import { CyberBackground } from '@/components/cyber-background';
import { FloatingCompanionWidget } from '@/components/chat/FloatingCompanionWidget';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),
  title: 'Trendly — Autonomous Wealth Operating System & AI Swarm',
  description: 'Deploy specialized 1-click autonomous agents and execute verified wealth moves from real-time market trends.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'Trendly — Autonomous Wealth Operating System & AI Swarm',
    description: 'Deploy specialized 1-click autonomous agents and execute verified wealth moves from real-time market trends.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js" />
      </head>
      <body className={`${inter.variable} ${orbitron.variable} ${spaceGrotesk.variable} font-sans min-h-screen relative bg-[#040408]`}>
        <Providers>
          <CyberBackground />
          <div className="relative z-10">
            {children}
          </div>
          <FloatingCompanionWidget />
          <Toaster position="top-right" theme="dark" richColors />
        </Providers>
      </body>
    </html>
  );
}
