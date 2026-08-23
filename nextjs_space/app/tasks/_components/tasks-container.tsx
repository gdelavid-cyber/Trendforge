'use client';

import { useState } from 'react';
import { Zap } from 'lucide-react';
import { TaskFilters } from './task-filters';
import { InfiniteTaskList } from './infinite-task-list';
import { TrendingFeed } from './trending-feed';

interface FiltersState {
  search: string;
  difficulty: string;
  category: string;
  riskLevel: string;
  sort: string;
}

interface Props {
  userRole: string;
}

export function TasksContainer({ userRole }: Props) {
  const [activeTab, setActiveTab] = useState<'stream' | 'trending'>('stream');
  const [customTasks, setCustomTasks] = useState<any[]>([]);
  const [filters, setFilters] = useState<FiltersState>({
    search: '',
    difficulty: 'ALL',
    category: 'ALL',
    riskLevel: 'ALL',
    sort: 'newest',
  });

  const handleTaskGenerated = (newTask: any) => {
    setCustomTasks((prev) => [newTask, ...prev]);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl text-white uppercase tracking-wider flex items-center gap-2 mb-2">
          <Zap className="w-7 h-7 text-[#00F0FF]" /> Power Stream
        </h1>
        <p className="text-xs text-[#8892B0] font-mono uppercase tracking-wider">Access infinite money-making opportunities and real-time live pulses.</p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/[0.06] mb-8 gap-3">
        <button
          onClick={() => setActiveTab('stream')}
          className={`px-5 py-3 font-display font-bold text-xs tracking-wider uppercase transition-all relative flex items-center gap-2 rounded-t-lg ${
            activeTab === 'stream'
              ? 'text-[#00F0FF] border-b-2 border-[#00F0FF] bg-white/[0.02]'
              : 'text-[#8892B0] hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4 text-[#00F0FF]" /> All Power Moves
        </button>
        <button
          onClick={() => setActiveTab('trending')}
          className={`px-5 py-3 font-display font-bold text-xs tracking-wider uppercase transition-all relative flex items-center gap-2 rounded-t-lg ${
            activeTab === 'trending'
              ? 'text-[#00F0FF] border-b-2 border-[#00F0FF] bg-white/[0.02]'
              : 'text-[#8892B0] hover:text-white'
          }`}
        >
          <span className="live-pulse-dot">
            <span className="ping bg-[#FF6B9D]" />
            <span className="core bg-[#FF6B9D]" />
          </span>
          Live Pulse
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'stream' ? (
        <div className="space-y-6">
          <TaskFilters
            filters={filters}
            onChange={setFilters}
            onReset={() =>
              setFilters({
                search: '',
                difficulty: 'ALL',
                category: 'ALL',
                riskLevel: 'ALL',
                sort: 'newest',
              })
            }
            userRole={userRole}
            onTaskGenerated={handleTaskGenerated}
          />
          <InfiniteTaskList filters={filters} customTasks={customTasks} />
        </div>
      ) : (
        <TrendingFeed />
      )}
    </div>
  );
}
