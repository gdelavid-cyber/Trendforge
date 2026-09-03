'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, DollarSign, Zap, Shield } from 'lucide-react';
import type { EarnMethod } from '@/lib/earn/methods';

const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner: 'text-[#00FF66] bg-[#00FF66]/10 border-[#00FF66]/20',
  Intermediate: 'text-[#FFD700] bg-[#FFD700]/10 border-[#FFD700]/20',
  Advanced: 'text-[#FF007A] bg-[#FF007A]/10 border-[#FF007A]/20',
  Expert: 'text-[#9D00FF] bg-[#9D00FF]/10 border-[#9D00FF]/20',
};

const RISK_COLOR: Record<string, string> = {
  Low: 'text-[#00FF66]',
  Medium: 'text-[#FFD700]',
  High: 'text-[#FF007A]',
  'Very High': 'text-red-400',
};

interface MethodCardProps {
  method: EarnMethod;
  index: number;
}

export function MethodCard({ method, index }: MethodCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
    >
      <Link href={`/earn/${method.slug}`} className="block group">
        <div className="relative rounded-2xl bg-white/[0.02] border border-white/[0.07] p-6 h-full transition-all duration-300 hover:border-[#00F0FF]/30 hover:bg-white/[0.04] hover:shadow-[0_0_30px_rgba(0,240,255,0.06)]">
          {/* Method number badge */}
          <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[#06060E] border border-[#00F0FF]/30 flex items-center justify-center">
            <span className="text-[10px] font-mono font-bold text-[#00F0FF]">
              {String(method.number).padStart(2, '0')}
            </span>
          </div>

          {/* Difficulty badge */}
          <div className="flex items-center justify-between mb-4">
            <span
              className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${DIFFICULTY_COLOR[method.difficulty]}`}
            >
              {method.difficulty}
            </span>
            <span className={`text-[10px] font-mono flex items-center gap-1 ${RISK_COLOR[method.riskLevel]}`}>
              <Shield className="w-3 h-3" />
              {method.riskLevel} risk
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-white text-lg leading-snug mb-1 group-hover:text-[#00F0FF] transition-colors">
            {method.title}
          </h3>
          <p className="text-[#8E9BB4] text-sm mb-4 line-clamp-2 leading-relaxed">
            {method.shortDescription}
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#8E9BB4]">
              <Clock className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>{method.timeToFirstDollar}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#8E9BB4]">
              <DollarSign className="w-3.5 h-3.5 text-[#FFD700]" />
              <span>Capital: {method.capital === 'zero' ? '$0' : method.capital}</span>
            </div>
          </div>

          {/* Advantage */}
          <p className="text-[10px] font-mono text-[#00F0FF]/70 mb-4">{method.advantage}</p>

          {/* CTA row */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
            <div className="flex flex-wrap gap-1.5">
              {method.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[9px] font-mono text-[#8E9BB4] bg-white/[0.04] px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            <ArrowRight className="w-4 h-4 text-[#8E9BB4] group-hover:text-[#00F0FF] group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}