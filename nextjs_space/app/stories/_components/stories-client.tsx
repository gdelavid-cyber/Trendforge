'use client';

import { motion } from 'framer-motion';
import { CheckCircle, DollarSign, Star, Flame } from 'lucide-react';
import { TrendCategoryBadge } from '@/components/trends/trend-badge';
import { SectionHelpBanner } from '@/components/guide/section-help-banner';

interface Props {
  stories: { id: string; earningsAmount: number; description: string; userName: string; taskTitle: string; taskCategory: string; createdAt: string | null }[];
}

export function StoriesClient({ stories }: Props) {
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 text-green-400 mb-3 font-mono text-xs uppercase">
          <CheckCircle className="w-4 h-4" />
          <span className="font-bold">Verified Proof-of-Work Stories</span>
        </div>
        <h1 className="font-display font-black text-3xl md:text-4xl tracking-tight text-white uppercase">Real People, Real Earnings</h1>
        <p className="text-muted-foreground text-sm mt-2">Every story is backed by real execution deliverables and proof-of-work receipts</p>
      </div>

      {/* Section Guide & Info */}
      <SectionHelpBanner />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(stories ?? []).map((story: any, i: number) => (
          <motion.div key={story.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
            className="bg-card-bg border border-border-subtle rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                <span className="text-gold font-bold">{(story.userName ?? 'A')?.[0]}</span>
              </div>
              <div>
                <div className="font-medium text-sm">{story.userName}</div>
                <div className="text-xs text-muted-foreground">{story.taskTitle}</div>
              </div>
              <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />
            </div>
            <TrendCategoryBadge category={story.taskCategory} />
            <div className="flex items-center gap-1 my-3">
              <DollarSign className="w-6 h-6 text-green-400" />
              <span className="text-3xl font-bold text-green-400">{(story.earningsAmount ?? 0).toLocaleString('en-US')}</span>
            </div>
            <p className="text-sm text-muted-foreground">{story.description}</p>
          </motion.div>
        ))}
      </div>

      {(stories?.length ?? 0) === 0 && (
        <div className="bg-card-bg border border-border-subtle rounded-lg p-8 text-center">
          <Flame className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No verified stories yet. Be the first!</p>
        </div>
      )}
    </div>
  );
}
