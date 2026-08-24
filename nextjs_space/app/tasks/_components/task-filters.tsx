'use client';

import { useState } from 'react';
import { Search, RotateCcw, Cpu, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DIFFICULTY_CONFIG, RISK_CONFIG, TREND_CATEGORIES } from '@/lib/constants';
import { toast } from 'sonner';

export interface TaskFilterState {
  category: string;
  difficulty: string;
  riskLevel: string;
  sort: string;
  search: string;
}

interface TaskFiltersProps {
  filters: TaskFilterState;
  onChange: (filters: TaskFilterState) => void;
  onReset: () => void;
  userRole?: string;
  onTaskGenerated?: (task: any) => void;
}

export function TaskFilters({
  filters,
  onChange,
  onReset,
  userRole = 'FREE',
  onTaskGenerated,
}: TaskFiltersProps) {
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);

  const updateFilter = (key: keyof TaskFilterState, val: string) => {
    onChange({ ...filters, [key]: val });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    if (userRole === 'FREE') {
      toast.error('On-demand generation requires a Pro or Elite subscription.');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/tasks/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Custom Power Move "${data.task.title}" generated!`);
        setTopic('');
        if (onTaskGenerated) onTaskGenerated(data.task);
      } else {
        toast.error(data.error ?? 'Failed to generate Power Move');
      }
    } catch {
      toast.error('Network error. Failed to generate Power Move');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="glass-card p-6 mb-8 space-y-6" data-tour="tasks-filters">
      {/* On-Demand AI Power Move Generator */}
      <div className="pb-6 border-b border-white/[0.06]">
        <h3 className="text-sm font-bold text-[#FFD700] mb-3 flex items-center gap-2 uppercase tracking-wide">
          <Cpu className="w-4 h-4 text-[#FFD700]" /> On-Demand AI Power Move Generator
        </h3>
        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder={
              userRole === 'FREE'
                ? 'Upgrade to Pro/Elite to generate custom Power Moves...'
                : 'Enter a niche business topic (e.g. Pet Grooming AI, Solar Leads)...'
            }
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={generating || userRole === 'FREE'}
            className="terminal-input flex-1 h-11"
          />
          <Button
            type="submit"
            disabled={generating || !topic.trim() || userRole === 'FREE'}
            className="h-11 px-6 text-xs"
          >
            {generating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Synthesizing...
              </>
            ) : (
              'Synthesize Move'
            )}
          </Button>
        </form>
      </div>

      {/* Standard Filters Grid */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8892B0]" />
          <Input
            placeholder="Search Power Moves by title or keyword..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="terminal-input pl-10 h-11 w-full"
          />
        </div>

        {/* Filters Select Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {/* Difficulty */}
          <select
            value={filters.difficulty}
            onChange={(e) => updateFilter('difficulty', e.target.value)}
            aria-label="Filter by difficulty"
            className="bg-white/[0.03] border border-white/[0.08] text-white text-xs rounded-full px-4 h-11 focus:outline-none focus:border-[#00F0FF] transition-colors"
          >
            <option value="ALL" className="bg-[#0B0B12] text-white">All Difficulties</option>
            {Object.keys(DIFFICULTY_CONFIG).map((d) => (
              <option key={d} value={d} className="bg-[#0B0B12] text-white">
                {(DIFFICULTY_CONFIG as any)[d]?.label ?? d}
              </option>
            ))}
          </select>

          {/* Category */}
          <select
            value={filters.category}
            onChange={(e) => updateFilter('category', e.target.value)}
            aria-label="Filter by category"
            className="bg-white/[0.03] border border-white/[0.08] text-white text-xs rounded-full px-4 h-11 focus:outline-none focus:border-[#00F0FF] transition-colors"
          >
            <option value="ALL" className="bg-[#0B0B12] text-white">All Categories</option>
            {TREND_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value} className="bg-[#0B0B12] text-white">
                {c.label}
              </option>
            ))}
          </select>

          {/* Risk */}
          <select
            value={filters.riskLevel}
            onChange={(e) => updateFilter('riskLevel', e.target.value)}
            aria-label="Filter by risk level"
            className="bg-white/[0.03] border border-white/[0.08] text-white text-xs rounded-full px-4 h-11 focus:outline-none focus:border-[#00F0FF] transition-colors"
          >
            <option value="ALL" className="bg-[#0B0B12] text-white">All Risk Levels</option>
            {Object.keys(RISK_CONFIG).map((r) => (
              <option key={r} value={r} className="bg-[#0B0B12] text-white">
                {(RISK_CONFIG as any)[r]?.label ?? r}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={filters.sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            aria-label="Sort power moves"
            className="bg-white/[0.03] border border-white/[0.08] text-white text-xs rounded-full px-4 h-11 focus:outline-none focus:border-[#00F0FF] transition-colors"
          >
            <option value="NEWEST" className="bg-[#0B0B12] text-white">Newest First</option>
            <option value="TRENDING" className="bg-[#0B0B12] text-white">Trending Score</option>
            <option value="POPULAR" className="bg-[#0B0B12] text-white">Most Popular</option>
            <option value="EARNINGS_HIGH" className="bg-[#0B0B12] text-white">Highest Potential Earnings</option>
            <option value="COST_LOW" className="bg-[#0B0B12] text-white">Lowest Startup Cost</option>
          </select>
        </div>

        {/* Reset Button */}
        <Button
          variant="outline"
          onClick={onReset}
          className="h-11 px-5 text-xs text-[#8892B0] border-white/[0.08] hover:border-white/20 hover:text-white"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset
        </Button>
      </div>
    </div>
  );
}
