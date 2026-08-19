'use client';

import { TREND_CATEGORIES } from '@/lib/constants';

export function TrendCategoryBadge({ category }: { category: string }) {
  const cat = TREND_CATEGORIES.find((c) => c.value === category) ?? { label: category, color: '#6B7280' };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
    >
      {cat.label}
    </span>
  );
}
