'use client';

import { useEffect, useRef } from 'react';

export function Futuristic4DCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Mouse coordinates for interactive force field
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      radius: 180,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 1. Particle Constellation Nodes
    const particleCount = Math.min(Math.floor((width * height) / 18000), 75);
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      baseAlpha: number;
      alpha: number;
    }> = [];

    const colors = ['#00F0FF', '#00C2FF', '#FFD700', '#9D00FF'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        baseAlpha: Math.random() * 0.4 + 0.2,
        alpha: 0.3,
      });
    }

    // 2. 4D Hypercube (Tesseract) Geometry Math
    // 16 vertices of a 4D hypercube in 4D space (±1, ±1, ±1, ±1)
    const tesseractVertices: number[][] = [];
    for (let i = 0; i < 16; i++) {
      tesseractVertices.push([
        i & 1 ? 1 : -1,
        i & 2 ? 1 : -1,
        i & 4 ? 1 : -1,
        i & 8 ? 1 : -1,
      ]);
    }

    // 32 edges of a 4D hypercube
    const tesseractEdges: [number, number][] = [];
    for (let i = 0; i < 16; i++) {
      for (let j = i + 1; j < 16; j++) {
        // Connected if they differ in exactly one coordinate (Hamming distance 1)
        const diff = (i ^ j);
        if (diff === 1 || diff === 2 || diff === 4 || diff === 8) {
          tesseractEdges.push([i, j]);
        }
      }
    }

    let angle4D = 0;
    let scanlineY = 0;

    // Render loop
    const render = () => {
      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // A. Draw Subtle 4D Tesseract in Background Depth
      angle4D += 0.006;
      const tesseractCenter = { x: width * 0.8, y: height * 0.35 };
      const tesseractScale = Math.min(width, height) * 0.16;

      // 4D Rotation matrix (XY and ZW plane rotations)
      const cosA = Math.cos(angle4D);
      const sinA = Math.sin(angle4D);
      const cosB = Math.cos(angle4D * 0.7);
      const sinB = Math.sin(angle4D * 0.7);

      // Project 4D to 3D, then 3D to 2D
      const projected2D: { x: number; y: number; depth: number }[] = [];

      for (let i = 0; i < 16; i++) {
        let [x, y, z, w] = tesseractVertices[i];

        // 4D Rotations
        // Rotate in XW
        const x1 = x * cosA - w * sinA;
        const w1 = x * sinA + w * cosA;

        // Rotate in YZ
        const y1 = y * cosB - z * sinB;
        const z1 = y * sinB + z * cosB;

        // Perspective 4D -> 3D projection
        const distance4D = 2.5;
        const scale4D = 1 / (distance4D - w1);
        const p3X = x1 * scale4D;
        const p3Y = y1 * scale4D;
        const p3Z = z1 * scale4D;

        // Perspective 3D -> 2D projection
        const distance3D = 3.0;
        const scale3D = 1 / (distance3D - p3Z);
        const p2X = p3X * scale3D * tesseractScale + tesseractCenter.x;
        const p2Y = p3Y * scale3D * tesseractScale + tesseractCenter.y;

        projected2D.push({ x: p2X, y: p2Y, depth: w1 });
      }

      // Draw Tesseract Wireframe Edges
      ctx.lineWidth = 1;
      for (const [v1, v2] of tesseractEdges) {
        const p1 = projected2D[v1];
        const p2 = projected2D[v2];

        const avgDepth = (p1.depth + p2.depth) / 2;
        const edgeAlpha = Math.max(0.04, Math.min(0.22, (avgDepth + 1.5) * 0.08));

        ctx.strokeStyle = `rgba(0, 240, 255, ${edgeAlpha})`;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // Draw Tesseract Vertex Nodes
      for (const p of projected2D) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // B. Update & Render Interactive Neural Particle Constellation
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Motion
        p.x += p.vx;
        p.y += p.vy;

        // Bounce on borders
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Mouse interaction (gentle proximity push and glow)
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distToMouse = Math.sqrt(dx * dx + dy * dy);

        if (distToMouse < mouse.radius) {
          const force = (1 - distToMouse / mouse.radius) * 1.5;
          p.x -= (dx / distToMouse) * force;
          p.y -= (dy / distToMouse) * force;
          p.alpha = Math.min(1, p.baseAlpha + force * 0.8);
        } else {
          p.alpha += (p.baseAlpha - p.alpha) * 0.05;
        }

        // Draw Particle Node
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby particles with laser filaments
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const pdist = Math.hypot(p.x - p2.x, p.y - p2.y);
          const maxDistance = 140;

          if (pdist < maxDistance) {
            const lineAlpha = (1 - pdist / maxDistance) * 0.18;
            ctx.strokeStyle = '#00F0FF';
            ctx.globalAlpha = lineAlpha;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1.0;

      // C. Periodic Ambient Laser Scanline
      scanlineY = (scanlineY + 1.2) % height;
      const scanGradient = ctx.createLinearGradient(0, scanlineY - 40, 0, scanlineY + 40);
      scanGradient.addColorStop(0, 'rgba(0, 240, 255, 0)');
      scanGradient.addColorStop(0.5, 'rgba(0, 240, 255, 0.04)');
      scanGradient.addColorStop(1, 'rgba(0, 240, 255, 0)');

      ctx.fillStyle = scanGradient;
      ctx.fillRect(0, scanlineY - 40, width, 80);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
      style={{ filter: 'drop-shadow(0 0 8px rgba(0, 240, 255, 0.15))' }}
    />
  );
}
