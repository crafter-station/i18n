"use client";

import { useEffect, useRef } from "react";

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

export function LanguageNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 400;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const maxRadius = size / 2 - 20;

    // Generate points in a spherical distribution
    const points: Point[] = [];
    const numPoints = 200;

    for (let i = 0; i < numPoints; i++) {
      // Fibonacci sphere distribution for even spacing
      const phi = Math.acos(1 - (2 * (i + 0.5)) / numPoints);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;

      // Project 3D sphere to 2D with depth
      const x3d = Math.sin(phi) * Math.cos(theta);
      const y3d = Math.sin(phi) * Math.sin(theta);
      const z3d = Math.cos(phi);

      // Perspective projection
      const perspective = 1 / (2 - z3d * 0.5);
      const x = centerX + x3d * maxRadius * perspective;
      const y = centerY + y3d * maxRadius * perspective;

      // Points closer to viewer (higher z) are larger and more opaque
      const depthFactor = (z3d + 1) / 2;
      const radius = 1 + depthFactor * 2;
      const opacity = 0.2 + depthFactor * 0.6;

      points.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        radius,
        opacity,
      });
    }

    // Find connections (nearby points)
    const connections: [number, number][] = [];
    const connectionDistance = 50;

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < connectionDistance) {
          connections.push([i, j]);
        }
      }
    }

    let animationId: number;
    let rotation = 0;

    function draw() {
      if (!ctx) return;

      ctx.clearRect(0, 0, size, size);

      // Slowly rotate the sphere effect
      rotation += 0.002;

      // Update point positions with subtle movement
      for (const point of points) {
        point.x += point.vx;
        point.y += point.vy;

        // Soft boundary bounce
        const distFromCenter = Math.sqrt(
          (point.x - centerX) ** 2 + (point.y - centerY) ** 2
        );
        if (distFromCenter > maxRadius) {
          const angle = Math.atan2(point.y - centerY, point.x - centerX);
          point.vx = -Math.cos(angle) * 0.1;
          point.vy = -Math.sin(angle) * 0.1;
        }

        // Random movement
        point.vx += (Math.random() - 0.5) * 0.02;
        point.vy += (Math.random() - 0.5) * 0.02;
        point.vx *= 0.99;
        point.vy *= 0.99;
      }

      // Draw connections
      ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
      ctx.lineWidth = 0.5;

      for (const [i, j] of connections) {
        const p1 = points[i];
        const p2 = points[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDistance) {
          const opacity = (1 - dist / connectionDistance) * 0.15;
          ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }

      // Draw points
      for (const point of points) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 0, 0, ${point.opacity})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-[400px] h-[400px]"
      aria-label="Language network visualization showing interconnected translation nodes"
    />
  );
}
