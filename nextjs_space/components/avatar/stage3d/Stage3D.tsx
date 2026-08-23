'use client';

import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { FighterLoadout } from '@/lib/cosmetics/stats';

const DynamicStage3DCanvas = dynamic(
  () => import('./Stage3DCanvas').then((mod) => mod.Stage3DCanvas),
  {
    ssr: false,
    loading: () => null,
  }
);

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class Stage3DErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Graceful fallback without crashing
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export interface Stage3DProps {
  loadout?: FighterLoadout;
  fallback: React.ReactNode;
  overrideGlbUrl?: string;
  className?: string;
}

export function Stage3D({ loadout, fallback, overrideGlbUrl, className = '' }: Stage3DProps) {
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      setHasWebGL(Boolean(gl));
    } catch {
      setHasWebGL(false);
    }
  }, []);

  // WebGL not supported or still detecting
  if (hasWebGL === false) {
    return <>{fallback}</>;
  }

  return (
    <Stage3DErrorBoundary fallback={fallback}>
      <div className={`relative w-full h-full ${className}`}>
        <DynamicStage3DCanvas
          loadout={loadout}
          overrideGlbUrl={overrideGlbUrl}
          className={className}
        />
      </div>
    </Stage3DErrorBoundary>
  );
}
