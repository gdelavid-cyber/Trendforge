export interface LevelInfo {
  level: number;
  name: string;
  minPoints: number;
  maxPoints: number;
  progress: number;
}

// Progression is pure gamification: XP comes from completed moves ONLY.
// It is deliberately decoupled from money — dollar figures shown anywhere in
// the platform are ledger-backed real income, never game points.

export const XP_PER_COMPLETION = 100;

export function getWealthPoints(completedCount: number): number {
  return Math.floor(Math.max(completedCount || 0, 0)) * XP_PER_COMPLETION;
}

export function getLevelInfo(completedCount: number): LevelInfo {
  const points = getWealthPoints(completedCount);

  let level = 1;
  let name = 'Initiate';
  let minPoints = 0;
  let maxPoints = 1000; // 10 completions

  if (points >= 1000 && points < 5000) {
    level = 2;
    name = 'Explorer';
    minPoints = 1000;
    maxPoints = 5000;
  } else if (points >= 5000 && points < 20000) {
    level = 3;
    name = 'Builder';
    minPoints = 5000;
    maxPoints = 20000;
  } else if (points >= 20000 && points < 100000) {
    level = 4;
    name = 'Creator';
    minPoints = 20000;
    maxPoints = 100000;
  } else if (points >= 100000) {
    level = 5;
    name = 'Architect';
    minPoints = 100000;
    maxPoints = 1000000;
  }

  const range = maxPoints - minPoints;
  const progress = Math.min(Math.max(((points - minPoints) / range) * 100, 0), 100);

  return { level, name, minPoints, maxPoints, progress };
}

export function getBadges(completedCount: number): string[] {
  const list: string[] = [];

  if (completedCount >= 1) list.push('first_move');
  if (completedCount >= 25) list.push('hundred_club'); // renamed semantics: 25 completions
  if (completedCount >= 50) list.push('thousand_club'); // 50 completions
  if (completedCount >= 10) list.push('ten_completed');
  if (completedCount >= 50) list.push('fifty_completed');

  return list;
}

export function getStreak(userTasks: { completedAt: string | Date | null }[]): number {
  if (!userTasks || userTasks.length === 0) return 0;

  // Filter completed tasks with valid dates, sort descending by completedAt
  const completedDates = userTasks
    .map(t => (t.completedAt ? new Date(t.completedAt) : null))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => b.getTime() - a.getTime());

  if (completedDates.length === 0) return 0;

  // Set hours to midnight for comparison
  const normalizeDate = (d: Date) => {
    const nd = new Date(d);
    nd.setHours(0, 0, 0, 0);
    return nd;
  };

  const today = normalizeDate(new Date());
  const lastCompleted = normalizeDate(completedDates[0]);
  const diffTime = today.getTime() - lastCompleted.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // If last completed task was more than 1 day ago, streak is broken
  if (diffDays > 1) return 0;

  let currentStreak = 1;
  let prevDate = lastCompleted;

  for (let i = 1; i < completedDates.length; i++) {
    const currentDate = normalizeDate(completedDates[i]);
    const diff = prevDate.getTime() - currentDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 1) {
      currentStreak++;
      prevDate = currentDate;
    } else if (days > 1) {
      break; // consecutive streak ends
    }
  }

  return currentStreak;
}
