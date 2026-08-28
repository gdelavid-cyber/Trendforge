'use client';

import { motion } from 'framer-motion';

export function CyberBackground() {
  return (
    <div className="cyber-space-canvas" aria-hidden="true">
      {/* Smooth Deep Ambient Cosmic Glows */}
      <motion.div
        animate={{
          scale: [1, 1.12, 1],
          opacity: [0.1, 0.18, 0.1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[48rem] h-[24rem] bg-gradient-to-b from-[#00F0FF]/15 to-transparent rounded-full blur-[110px] pointer-events-none"
      />

      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.06, 0.14, 0.06],
          x: [0, 25, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 right-[12%] w-[32rem] h-[32rem] bg-[#9D00FF]/10 rounded-full blur-[130px] pointer-events-none"
      />

      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.05, 0.12, 0.05],
          x: [0, -25, 0],
          y: [0, 25, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-[10%] w-[30rem] h-[30rem] bg-[#00F0FF]/8 rounded-full blur-[120px] pointer-events-none"
      />

      {/* Smooth bottom blend */}
      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-[#040408] to-transparent pointer-events-none" />
    </div>
  );
}
