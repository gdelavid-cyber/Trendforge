'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskCard } from '@/components/tasks/task-card';
import { Loader2, Inbox } from 'lucide-react';

interface FiltersState {
  search: string;
  difficulty: string;
  category: string;
  riskLevel: string;
  sort: string;
}

interface Props {
  filters: FiltersState;
  customTasks: any[];
}

export function InfiniteTaskList({ filters, customTasks }: Props) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const observerTarget = useRef<HTMLDivElement | null>(null);

  // Fetch tasks helper
  const fetchTasks = async (cursorVal: string | null = null, reset = false) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        limit: '20',
        sort: filters.sort,
        difficulty: filters.difficulty,
        category: filters.category,
        riskLevel: filters.riskLevel,
      });
      if (cursorVal) queryParams.set('cursor', cursorVal);

      const res = await fetch(`/api/tasks/stream?${queryParams.toString()}`);
      const data = await res.json();
      if (res.ok) {
        if (reset) {
          setTasks(data.tasks ?? []);
        } else {
          setTasks((prev) => [...prev, ...(data.tasks ?? [])]);
        }
        setNextCursor(data.nextCursor ?? null);
      }
    } catch (e) {
      console.error('Failed to stream tasks:', e);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // Reset list and load first page on filter/sort changes
  useEffect(() => {
    setInitialLoading(true);
    fetchTasks(null, true);
  }, [filters.difficulty, filters.category, filters.riskLevel, filters.sort]);

  // Load next page callback
  const loadMore = useCallback(() => {
    if (loading || !nextCursor) return;
    fetchTasks(nextCursor, false);
  }, [loading, nextCursor]);

  // Set up IntersectionObserver to trigger loading at the bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const target = observerTarget.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [nextCursor, loading, loadMore]);

  // Prepend prepended custom generated tasks, filtering out duplicates
  const allTasks = [...customTasks, ...tasks];
  const uniqueTasks = allTasks.filter(
    (task, index, self) => self.findIndex((t) => t.id === task.id) === index
  );

  // Apply search filtering on client side for immediate response
  const filteredTasks = uniqueTasks.filter((t: any) => {
    const matchSearch =
      !filters.search ||
      (t?.title ?? '').toLowerCase().includes(filters.search.toLowerCase()) ||
      (t?.description ?? '').toLowerCase().includes(filters.search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      {initialLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-gold animate-spin mb-3" />
          <p className="text-muted-foreground text-sm font-mono uppercase tracking-wider">Streaming Power Moves...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-tour="tasks-list">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task: any, i: number) => (
                <motion.div
                  key={task?.id ?? i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <TaskCard task={task} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Observer Target */}
          {nextCursor && !loading && (
            <div ref={observerTarget} className="h-10 w-full" />
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 text-gold animate-spin" />
            </div>
          )}

          {/* End of Stream / Empty State */}
          {!nextCursor && !loading && filteredTasks.length > 0 && (
            <div className="text-center text-xs text-muted-foreground py-8 border-t border-white/5 font-mono uppercase tracking-wider">
              You have reached the end of the Power Stream.
            </div>
          )}

          {filteredTasks.length === 0 && (
            <div className="glass-card border border-white/5 rounded-lg p-12 text-center">
              <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No tasks found</h3>
              <p className="text-sm text-muted-foreground">Try relaxing your filters or query a custom topic above.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
