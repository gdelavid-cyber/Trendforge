'use client';

import { useEffect, useRef } from 'react';

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4';

export function CyberBackground() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback handling
      });
    }
  }, []);

  return (
    <div
      className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-[#040408]"
      aria-hidden="true"
    >
      {/* Full-screen Autoplaying, Looping, Muted Video Background */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>

      {/* Subtle overlay to preserve high UI contrast and readability */}
      <div className="absolute inset-0 bg-[#040408]/30 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#040408] via-transparent to-[#040408]/50 pointer-events-none" />
    </div>
  );
}
