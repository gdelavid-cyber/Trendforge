export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Poppins, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';
import { CyberBackground } from '@/components/backgrounds/cyber-background';
import { NovaAssistant } from '@/components/nova/nova-assistant';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  style: ['italic', 'normal'],
  weight: ['400', '500', '600'],
  variable: '--font-source-serif',
});

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
      <body className={`${poppins.variable} ${sourceSerif.variable} font-sans min-h-screen relative bg-[#02040A]`}>
        <Providers>
          <CyberBackground />
          <div className="relative z-10">
            {children}
          </div>
          <NovaAssistant />
          <Toaster position="top-right" theme="dark" richColors />
        </Providers>
      </body>
    </html>
  );
}
