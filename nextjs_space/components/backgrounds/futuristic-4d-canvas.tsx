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
    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const setupCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    setupCanvas();

    const handleResize = () => {
      if (!canvas) return;
      setupCanvas();
    };

    window.addEventListener('resize', handleResize);

    // Mouse coordinates for interactive force field
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      radius: 160,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 1. Particle Constellation Nodes
    const particleCount = Math.min(Math.floor((width * height) / 22000), 55);
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
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 1.8 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        baseAlpha: Math.random() * 0.35 + 0.15,
        alpha: 0.25,
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
        const diff = i ^ j;
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

      // A. Draw Subtle 4D Tesseract in Background Depth (Right-aligned, soft ambiance)
      angle4D += 0.005;
      const tesseractCenter = { x: width * 0.82, y: height * 0.38 };
      const tesseractScale = Math.min(width, height) * 0.14;

      const cosA = Math.cos(angle4D);
      const sinA = Math.sin(angle4D);
      const cosB = Math.cos(angle4D * 0.7);
      const sinB = Math.sin(angle4D * 0.7);

      const projected2D: { x: number; y: number; depth: number }[] = [];

      for (let i = 0; i < 16; i++) {
        let [x, y, z, w] = tesseractVertices[i];

        // 4D Rotations
        const x1 = x * cosA - w * sinA;
        const w1 = x * sinA + w * cosA;

        const y1 = y * cosB - z * sinB;
        const z1 = y * sinB + z * cosB;

        // Perspective 4D -> 3D projection
        const distance4D = 2.6;
        const scale4D = 1 / (distance4D - w1);
        const p3X = x1 * scale4D;
        const p3Y = y1 * scale4D;
        const p3Z = z1 * scale4D;

        // Perspective 3D -> 2D projection
        const distance3D = 3.2;
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
        const edgeAlpha = Math.max(0.03, Math.min(0.18, (avgDepth + 1.5) * 0.06));

        ctx.strokeStyle = `rgba(0, 240, 255, ${edgeAlpha})`;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // Draw Tesseract Vertex Nodes
      for (const p of projected2D) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.35)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // B. Update & Render Interactive Neural Particle Constellation
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distToMouse = Math.sqrt(dx * dx + dy * dy);

        if (distToMouse < mouse.radius) {
          const force = (1 - distToMouse / mouse.radius) * 1.2;
          p.x -= (dx / distToMouse) * force;
          p.y -= (dy / distToMouse) * force;
          p.alpha = Math.min(0.8, p.baseAlpha + force * 0.6);
        } else {
          p.alpha += (p.baseAlpha - p.alpha) * 0.05;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const pdist = Math.hypot(p.x - p2.x, p.y - p2.y);
          const maxDistance = 130;

          if (pdist < maxDistance) {
            const lineAlpha = (1 - pdist / maxDistance) * 0.14;
            ctx.strokeStyle = '#00F0FF';
            ctx.globalAlpha = lineAlpha;
            ctx.lineWidth = 0.65;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1.0;

      // C. Periodic Ambient Laser Scanline
      scanlineY = (scanlineY + 1.0) % height;
      const scanGradient = ctx.createLinearGradient(0, scanlineY - 30, 0, scanlineY + 30);
      scanGradient.addColorStop(0, 'rgba(0, 240, 255, 0)');
      scanGradient.addColorStop(0.5, 'rgba(0, 240, 255, 0.025)');
      scanGradient.addColorStop(1, 'rgba(0, 240, 255, 0)');

      ctx.fillStyle = scanGradient;
      ctx.fillRect(0, scanlineY - 30, width, 60);

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
    />
  );
}
