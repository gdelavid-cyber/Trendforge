'use client';

import { TaskCard } from '@/components/tasks/task-card';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export function LandingTasks({ tasks }: { tasks: any[] }) {
  if ((tasks?.length ?? 0) === 0) return null;

  return (
    <section className="py-20 bg-dark-navy/30">
      <div className="max-w-[1200px] mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 text-gold mb-3">
            <Zap className="w-5 h-5" />
            <span className="font-medium">This Week&apos;s Featured Tasks</span>
          </div>
          <h2 className="font-display font-bold text-3xl tracking-tight">
            Ready to Execute — Right Now
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(tasks ?? []).map((task: any, i: number) => (
            <motion.div
              key={task?.id ?? i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <TaskCard task={task} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
