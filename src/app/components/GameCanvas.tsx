import React, { useRef, useEffect } from 'react';

interface GameCanvasProps {
  armPosition: number; // 0-100
  resistanceValue: number;
  width?: number;
  height?: number;
}

export function GameCanvas({ armPosition, resistanceValue, width = 400, height = 300 }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const positionRef = useRef(armPosition);
  
  // Keep positionRef in sync without triggering re-renders of the canvas loop logic
  useEffect(() => {
    positionRef.current = armPosition;
  }, [armPosition]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = 0;
    
    // Smooth transition value for the needle
    let displayPosition = armPosition;
    const ghostPositions: number[] = [];

    const draw = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Interpolate displayPosition towards positionRef.current for smoothness
      // We want it to be very snappy but not jittery
      const stiffness = 0.2;
      displayPosition += (positionRef.current - displayPosition) * stiffness;

      // Update ghost positions
      ghostPositions.unshift(displayPosition);
      if (ghostPositions.length > 10) ghostPositions.pop();

      const centerX = width / 2;
      const centerY = height - 50;
      const radius = 150;

      // 1. Draw Arcs
      ctx.lineCap = 'round';
      ctx.lineWidth = 20;

      // Left Arc (Opponent - Pink)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 0, 110, 0.3)';
      ctx.arc(centerX, centerY, radius, Math.PI, Math.PI * 1.5);
      ctx.stroke();

      // Right Arc (User - Cyan)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.arc(centerX, centerY, radius, Math.PI * 1.5, Math.PI * 2);
      ctx.stroke();

      // 2. Draw Center Marker
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.arc(centerX, centerY - radius, 8, 0, Math.PI * 2);
      ctx.fill();

      // 3. Draw Angle Markers
      ctx.lineWidth = 2;
      for (let angle = -60; angle <= 60; angle += 20) {
        if (angle === 0) continue;
        const rad = (angle - 90) * Math.PI / 180;
        const x1 = centerX + Math.cos(rad) * radius;
        const y1 = centerY + Math.sin(rad) * radius;
        const x2 = centerX + Math.cos(rad) * (radius + 15);
        const y2 = centerY + Math.sin(rad) * (radius + 15);

        ctx.beginPath();
        ctx.strokeStyle = angle < 0 ? 'rgba(255, 0, 110, 0.4)' : 'rgba(0, 240, 255, 0.4)';
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // 4. Draw Ghost Trails
      ghostPositions.forEach((pos, i) => {
        if (i === 0) return; // Skip current
        const angle = 70 - (pos * 1.4);
        const rad = (angle - 90) * Math.PI / 180;
        const len = 140;
        const x = centerX + Math.cos(rad) * len;
        const y = centerY + Math.sin(rad) * len;
        
        const opacity = (1 - i / ghostPositions.length) * 0.4;
        ctx.beginPath();
        ctx.strokeStyle = angle >= 0 ? `rgba(0, 240, 255, ${opacity})` : `rgba(255, 0, 110, ${opacity})`;
        ctx.lineWidth = 8 - i * 0.5;
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
      });

      // 5. Draw Main Needle
      const currentAngle = 70 - (displayPosition * 1.4);
      const rad = (currentAngle - 90) * Math.PI / 180;
      const len = 145;
      const x = centerX + Math.cos(rad) * len;
      const y = centerY + Math.sin(rad) * len;
      const color = currentAngle >= 0 ? '#00f0ff' : '#ff006e';

      // Needle Glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 10;
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
      
      // Needle Tip
      ctx.beginPath();
      ctx.fillStyle = color;
      const pulse = Math.sin(time / 200) * 3;
      ctx.arc(x, y, 12 + pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0; // Reset shadow

      // 6. Draw Center Pivot
      ctx.beginPath();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full"
    />
  );
}
