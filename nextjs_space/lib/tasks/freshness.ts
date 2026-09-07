export const NEW_TASK_WINDOW_MS = 24 * 60 * 60 * 1000;
export const LIVE_TREND_SCORE = 80;

export function isNewTask(createdAt: string | Date | null | undefined, now: Date = new Date()): boolean {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return false;
  return now.getTime() - t < NEW_TASK_WINDOW_MS;
}

export function isLiveTask(trendScore: number | null | undefined): boolean {
  return (trendScore ?? 0) >= LIVE_TREND_SCORE;
}

export function formatTaskAge(createdAt: string | Date | null | undefined, now: Date = new Date()): string {
  if (!createdAt) return 'pending fresh intel';
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return 'pending fresh intel';
  const diffMs = Math.max(0, now.getTime() - t);
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function issuedLabel(createdAt: string | Date | null | undefined, now: Date = new Date()): string {
  if (!createdAt || Number.isNaN(new Date(createdAt).getTime())) return 'Issued pending fresh intel';
  const d = new Date(createdAt).toLocaleDateString();
  return `Issued ${d} · ${formatTaskAge(createdAt, now)}`;
}

export function dedupeTasksById<T extends { id: string }>(tasks: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const t of tasks) {
    if (!t || seen.has(t.id)) continue;
    seen.add(t.id);
    out.push(t);
  }
  return out;
}
