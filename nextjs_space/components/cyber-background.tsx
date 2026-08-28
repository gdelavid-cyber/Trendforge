'use client';

import { motion } from 'framer-motion';
import { Futuristic4DCanvas } from './futuristic-4d-canvas';

export function CyberBackground() {
  return (
    <div className="cyber-space-canvas" aria-hidden="true">
      {/* Interactive 4D Hypercube Tesseract & Particle Neural Mesh */}
      <Futuristic4DCanvas />

      {/* 3D Perspective Ground Grid Floor */}
      <div className="cyber-grid-floor" />

      {/* Deep Space Starfield & Ambient Constellation Matrix */}
      <div className="starfield-matrix" />

      {/* Ambient Cosmic Volumetric Nebula Light Nodes */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.22, 0.1],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-[15%] w-[28rem] h-[28rem] bg-[#00F0FF]/10 rounded-full blur-[100px] pointer-events-none"
      />

      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.07, 0.18, 0.07],
          x: [0, -30, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/3 right-[20%] w-[32rem] h-[32rem] bg-[#9D00FF]/10 rounded-full blur-[120px] pointer-events-none"
      />

      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.05, 0.14, 0.05],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-1/4 left-[30%] w-80 h-80 bg-[#FFD700]/10 rounded-full blur-[90px] pointer-events-none"
      />
    </div>
  );
}
