'use client';

import { motion } from 'framer-motion';

export function CyberBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#02040A]" aria-hidden="true">
      {/* Full-screen looping video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen scale-105"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4"
      />

      {/* Blue-ish Earth Atmospheric Lighting & Cosmic Radial Tint */}
      <div className="absolute inset-0 bg-radial-[at_50%_40%] from-blue-600/20 via-[#0055FF]/10 to-[#02040A]/90 mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#02040A] via-transparent to-[#02040A]/70" />

      {/* Glowing Blue Earth Orbital Nodes */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.28, 0.15],
          x: [0, 20, 0],
          y: [0, -15, 0],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-[20%] w-[36rem] h-[36rem] bg-[#0088FF]/15 rounded-full blur-[120px] pointer-events-none"
      />

      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.22, 0.1],
          x: [0, -25, 0],
          y: [0, 20, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-1/4 right-[15%] w-[40rem] h-[40rem] bg-[#00F0FF]/12 rounded-full blur-[140px] pointer-events-none"
      />
    </div>
  );
}
