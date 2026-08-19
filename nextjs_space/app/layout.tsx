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
  title: 'Trendly — Forge Wealth from Trending Opportunities',
  description: 'Verified money-making tasks daily. Turn emerging trends into executable wealth moves.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'Trendly — Forge Wealth from Trending Opportunities',
    description: 'Turn emerging trends into executable wealth moves. Verified tasks drop daily.',
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
