'use client';

export function Starfield() {
  return (
    <div className="space-canvas-bg" aria-hidden="true">
      {/* Drifting star layers */}
      <div className="starfield" />
      {/* Subtle wireframe grid */}
      <div className="wireframe-grid" />
      {/* Ambient glow pulses */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#00F0FF]/5 rounded-full blur-[160px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[400px] bg-[#FFD700]/3 rounded-full blur-[180px]" />
    </div>
  );
}
