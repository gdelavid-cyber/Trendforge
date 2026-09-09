'use client';

import { SessionProvider } from 'next-auth/react';
import { MyWorkProvider } from '@/lib/hooks/use-my-work';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MyWorkProvider>
        {children}
      </MyWorkProvider>
    </SessionProvider>
  );
}

