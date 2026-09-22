"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";

export const ParticleCursor = () => {
  const cursorEffects = useAppStore(state => state.userSettings.cursorEffects);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!cursorEffects) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const setCanvasSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
      color: string;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 0.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.life = 1;
        this.maxLife = Math.random() * 2.5 + 1.5; 
        this.size = Math.random() * 2 + 1;
        
        const colors = ['#2563eb', '#3b82f6', '#60a5fa', '#ffffff'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        
        this.vx *= 0.95;
        this.vy *= 0.95;

        this.life -= 0.0065 / this.maxLife;
      }

      draw(ctx: CanvasRenderingContext2D) {
        if (this.life <= 0) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.fill();
      }
    }

    const particles: Particle[] = [];
    let lastSpawnTime = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastSpawnTime > 16) {
        particles.push(new Particle(e.clientX, e.clientY));
        if (particles.length > 300) {
          particles.shift(); 
        }
        lastSpawnTime = now;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', setCanvasSize);

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'screen';

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);

        for (let j = i - 1; j >= Math.max(0, i - 15); j--) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < 2500) {
            ctx.beginPath();
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = p.life * p2.life * (1 - Math.sqrt(distSq) / 50) * 0.5;
            ctx.lineWidth = 0.8;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', setCanvasSize);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [cursorEffects]);

  if (!cursorEffects) return null;

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50 opacity-90" />;
};
