'use client';

import React from 'react';

export function formatRelativeTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '—';

  const diffMs = Date.now() - d.getTime();
  if (diffMs < 45_000) return 'just now';

  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AgeBadge({
  date,
  className = '',
}: {
  date: string | Date | null | undefined;
  className?: string;
}) {
  const text = formatRelativeTime(date);
  return (
    <span
      className={`inline-flex items-center text-[10px] font-mono text-muted-foreground/80 bg-muted/30 px-1.5 py-0.5 rounded border border-border/40 ${className}`}
    >
      {text}
    </span>
  );
}
