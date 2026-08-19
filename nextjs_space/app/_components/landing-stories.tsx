'use client';

import { motion } from 'framer-motion';
import { Star, CheckCircle, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function LandingStories({ stories }: { stories: any[] }) {
  if ((stories?.length ?? 0) === 0) return null;

  return (
    <section className="py-20">
      <div className="max-w-[1200px] mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 text-green-400 mb-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Verified Success Stories</span>
          </div>
          <h2 className="font-display font-bold text-3xl tracking-tight">
            Real People, Real Earnings
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(stories ?? []).map((story: any, i: number) => (
            <motion.div
              key={story?.id ?? i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card-bg border border-border-subtle rounded-lg p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                  <span className="text-gold font-bold">{(story?.user?.name ?? 'U')?.[0]}</span>
                </div>
                <div>
                  <div className="font-medium text-sm">{story?.user?.name ?? 'Anonymous'}</div>
                  <div className="text-xs text-muted-foreground">{story?.task?.title ?? 'Unknown Task'}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 mb-3">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span className="text-2xl font-bold text-green-400">
                  {(story?.earningsAmount ?? 0).toLocaleString('en-US')}
                </span>
                <span className="text-xs text-green-400/70 ml-1">earned</span>
                <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {story?.description ?? ''}
              </p>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/stories">
            <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/10">
              View All Stories
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
