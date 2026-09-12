import React, { useEffect, useRef } from 'react';

interface StarParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  radius: number;
  angle: number;
  rotationSpeed: number;
  pulsePhase: number;
  pulseSpeed: number;
  color: string;
  glowColor: string;
  seed: number;
  isCurvedDiamond: boolean;
}

export const MilkyWayCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d', { alpha: true });
    } catch {
      return;
    }
    if (!ctx) return;

    let isMounted = true;
    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth || document.documentElement.clientWidth || 360);
    let height = (canvas.height = window.innerHeight || document.documentElement.clientHeight || 640);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth || document.documentElement.clientWidth || 360;
      height = canvas.height = window.innerHeight || document.documentElement.clientHeight || 640;
    };

    window.addEventListener('resize', handleResize);

    // Rose-Gold, Blush Pink & Radiant Diamond Palette
    const diamondColors = ['#FFFFFF', '#FFE4E6', '#FDA4AF', '#F43F5E', '#FFF1F2'];
    const glowColors = [
      'rgba(255, 228, 230, 0.95)',
      'rgba(244, 63, 94, 0.85)',
      'rgba(255, 255, 255, 0.95)',
      'rgba(251, 113, 133, 0.8)',
    ];

    // Elegant, uncluttered count: 32 Curved Diamond Stars + 10 Stardust Specks
    const particleCount = 42;
    const particles: StarParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const isCurvedDiamond = i < 34;
      const baseRadius = isCurvedDiamond ? Math.random() * 6 + 6 : Math.random() * 2 + 1.5;

      // Dynamic flowing velocity
      const angleDir = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.2 + 1.6;

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angleDir) * speed,
        vy: Math.sin(angleDir) * speed - 0.4, // Gentle upward celestial drift
        baseRadius,
        radius: baseRadius,
        angle: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.06, // Lively spin
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.06 + 0.035, // Vivid shimmer
        color: diamondColors[i % diamondColors.length],
        glowColor: glowColors[i % glowColors.length],
        seed: Math.random() * 100,
        isCurvedDiamond,
      });
    }

    // Helper: Draw 4-Pointed Concave Curved Diamond Star
    const drawCurvedDiamond = (
      p: StarParticle,
      currentRadius: number,
      alpha: number
    ) => {
      if (!ctx) return;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = Math.max(0.15, Math.min(1, alpha));

      const r = currentRadius;
      const k = r * 0.16; // Deep concave curved arcs

      // Outer Glowing Bloom Halo
      ctx.shadowColor = p.glowColor;
      ctx.shadowBlur = r * 2.5;

      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(k, -k, r, 0);
      ctx.quadraticCurveTo(k, k, 0, r);
      ctx.quadraticCurveTo(-k, k, -r, 0);
      ctx.quadraticCurveTo(-k, -k, 0, -r);
      ctx.closePath();

      ctx.fillStyle = p.color;
      ctx.fill();

      // Gleaming Diamond Bright Core
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.24, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = r * 1.8;
      ctx.fill();

      ctx.restore();
    };

    // Helper: Draw Cosmic Stardust
    const drawStardust = (p: StarParticle, currentRadius: number, alpha: number) => {
      if (!ctx) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0.15, Math.min(0.9, alpha));
      ctx.shadowColor = p.glowColor;
      ctx.shadowBlur = currentRadius * 3.5;

      ctx.beginPath();
      ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    };

    let time = 0;

    // Render loop at 60fps
    const render = () => {
      if (!isMounted || !ctx) return;

      try {
        time++;
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // Organic motion with sinusoidal wave variance
          const driftX = Math.sin(time * 0.02 + p.seed) * 0.8;
          const driftY = Math.cos(time * 0.02 + p.seed) * 0.6;

          p.x += p.vx + driftX;
          p.y += p.vy + driftY;
          p.angle += p.rotationSpeed;
          p.pulsePhase += p.pulseSpeed;

          // Smooth edge wrapping with margin buffer
          const margin = 50;
          if (p.x < -margin) p.x = width + margin;
          if (p.x > width + margin) p.x = -margin;
          if (p.y < -margin) p.y = height + margin;
          if (p.y > height + margin) p.y = -margin;

          // Shimmering twinkle pulse
          const pulse = 0.5 + 0.5 * Math.sin(p.pulsePhase);
          const currentRadius = p.baseRadius * (0.8 + 0.5 * pulse);
          const alpha = 0.35 + 0.65 * pulse;

          // Render
          if (p.isCurvedDiamond) {
            drawCurvedDiamond(p, currentRadius, alpha);
          } else {
            drawStardust(p, currentRadius, alpha);
          }
        }
      } catch (e) {
        // Fallback for canvas lifecycle
      }

      if (isMounted) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};
