'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Zap } from 'lucide-react';
import { TaskCard } from '@/components/tasks/task-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DIFFICULTY_CONFIG, RISK_CONFIG } from '@/lib/core/constants';

export function TaskListClient({ tasks }: { tasks: any[] }) {
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  const filtered = (tasks ?? []).filter((t: any) => {
    const matchSearch = !search || (t?.title ?? '').toLowerCase().includes(search.toLowerCase()) || (t?.description ?? '').toLowerCase().includes(search.toLowerCase());
    const matchDiff = diffFilter === 'ALL' || t?.difficulty === diffFilter;
    const matchRisk = riskFilter === 'ALL' || t?.riskLevel === riskFilter;
    return matchSearch && matchDiff && matchRisk;
  });

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl flex items-center gap-2 mb-1">
          <Zap className="w-7 h-7 text-gold" /> All Tasks
        </h1>
        <p className="text-muted-foreground">Browse and launch money-making tasks</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-10 bg-card-bg border-border-subtle" placeholder="Search tasks..." value={search} onChange={(e: any) => setSearch(e.target?.value ?? '')} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['ALL', ...Object.keys(DIFFICULTY_CONFIG)].map((d) => (
            <Button key={d} size="sm" variant={diffFilter === d ? 'default' : 'outline'}
              className={diffFilter === d ? 'gold-gradient text-black' : 'border-border-subtle'}
              onClick={() => setDiffFilter(d)}>
              {d === 'ALL' ? 'All Levels' : (DIFFICULTY_CONFIG as any)[d]?.label ?? d}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {['ALL', ...Object.keys(RISK_CONFIG)].map((r) => (
            <Button key={r} size="sm" variant={riskFilter === r ? 'default' : 'outline'}
              className={riskFilter === r ? 'gold-gradient text-black' : 'border-border-subtle'}
              onClick={() => setRiskFilter(r)}>
              {r === 'ALL' ? 'All Risk' : (RISK_CONFIG as any)[r]?.label ?? r}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-tour="tasks-list">
        {filtered.map((task: any, i: number) => (
          <motion.div key={task?.id ?? i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <TaskCard task={task} />
          </motion.div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="bg-card-bg border border-border-subtle rounded-lg p-8 text-center">
          <Filter className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No tasks match your filters</p>
        </div>
      )}
    </div>
  );
}
