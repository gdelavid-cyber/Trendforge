import React from 'react';

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-border/40 bg-card/20 px-6 py-5">
      <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">{title}</h1>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}
