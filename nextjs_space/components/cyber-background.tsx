'use client';

import { motion } from 'framer-motion';

export function CyberBackground() {
  return (
    <div className="cyber-space-canvas">
      {/* 3D Perspective Ground Grid */}
      <div className="cyber-grid-floor" />

      {/* Starfield & Ambient Constellation Matrix */}
      <div className="starfield-matrix" />

      {/* Floating Luminous Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.15, 0.3, 0.15],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/5 w-96 h-96 bg-[#00F0FF]/10 rounded-full blur-3xl pointer-events-none"
      />

      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.25, 0.1],
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/3 right-1/4 w-[30rem] h-[30rem] bg-[#9D00FF]/10 rounded-full blur-[100px] pointer-events-none"
      />

      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.08, 0.2, 0.08],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none"
      />
    </div>
  );
}
