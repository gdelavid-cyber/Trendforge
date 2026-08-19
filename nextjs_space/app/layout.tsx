export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Inter, Orbitron, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';
import { Starfield } from '@/components/starfield';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),
  title: 'FORGE — Infinite Wealth Stream',
  description: 'Step into 2050. Stream real-time Power Moves, earn Wealth Points, and level up your financial terminal.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'FORGE — Infinite Wealth Stream',
    description: 'Money moves. Infinite. Real-time. Yours.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js" />
      </head>
      <body className={`${inter.variable} ${orbitron.variable} ${spaceGrotesk.variable} font-sans min-h-screen relative`}>
        <Providers>
          <Starfield />
          <div className="relative z-10">
            {children}
          </div>
          <Toaster position="top-right" theme="dark" richColors />
        </Providers>
      </body>
    </html>
  );
}
