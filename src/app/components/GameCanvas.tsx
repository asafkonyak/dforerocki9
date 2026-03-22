import React, { useRef, useEffect } from 'react';

interface GameCanvasProps {
  armPosition: number; // 0-100
  resistanceValue: number;
  player1Power: number; // 0-100
  player2Power: number; // 0-100
  width?: number;
  height?: number;
}

export function GameCanvas({ 
  armPosition, 
  resistanceValue, 
  player1Power, 
  player2Power, 
  width = 500, 
  height = 350 
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const positionRef = useRef(armPosition);
  const p1PowerRef = useRef(player1Power);
  const p2PowerRef = useRef(player2Power);
  
  // Keep refs in sync without triggering re-renders of the canvas loop logic
  useEffect(() => {
    positionRef.current = armPosition;
  }, [armPosition]);

  useEffect(() => {
    p1PowerRef.current = player1Power;
  }, [player1Power]);

  useEffect(() => {
    p2PowerRef.current = player2Power;
  }, [player2Power]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = 0;
    
    // Smooth transition values
    let displayPosition = armPosition;
    let displayP1Power = player1Power;
    let displayP2Power = player2Power;
    const ghostPositions: number[] = [];

    const draw = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Interpolate values for smoothness
      const stiffness = 0.2;
      displayPosition += (positionRef.current - displayPosition) * stiffness;
      displayP1Power += (p1PowerRef.current - displayP1Power) * 0.1;
      displayP2Power += (p2PowerRef.current - displayP2Power) * 0.1;

      // Update ghost positions
      ghostPositions.unshift(displayPosition);
      if (ghostPositions.length > 10) ghostPositions.pop();

      const centerX = width / 2;
      const centerY = height - 100; // Shifted up to make room for bars
      const radius = 120;

      // 1. Draw Arcs (Gauge Background)
      ctx.lineCap = 'round';
      ctx.lineWidth = 15;

      // Left Arc (Opponent - Pink)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 0, 110, 0.2)';
      ctx.arc(centerX, centerY, radius, Math.PI, Math.PI * 1.5);
      ctx.stroke();

      // Right Arc (User - Cyan)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.arc(centerX, centerY, radius, Math.PI * 1.5, Math.PI * 2);
      ctx.stroke();

      // 2. Draw Stamina Bars (High Performance)
      const barWidth = 180;
      const barHeight = 8;
      const barY = height - 40;
      
      // Player 1 (Left)
      const p1X = centerX - barWidth - 40;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00f0ff';
      ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
      ctx.fillRect(p1X, barY, barWidth, barHeight);
      
      const p1FillWidth = (displayP1Power / 100) * barWidth;
      const p1Grad = ctx.createLinearGradient(p1X, 0, p1X + barWidth, 0);
      p1Grad.addColorStop(0, '#00f0ff');
      p1Grad.addColorStop(1, '#00ffff');
      ctx.fillStyle = p1Grad;
      ctx.fillRect(p1X, barY, p1FillWidth, barHeight);

      // Player 2 (Right)
      const p2X = centerX + 40;
      ctx.shadowColor = '#ff006e';
      ctx.fillStyle = 'rgba(255, 0, 110, 0.1)';
      ctx.fillRect(p2X, barY, barWidth, barHeight);
      
      const p2FillWidth = (displayP2Power / 100) * barWidth;
      const p2Grad = ctx.createLinearGradient(p2X, 0, p2X + barWidth, 0);
      p2Grad.addColorStop(0, '#ff006e');
      p2Grad.addColorStop(1, '#ff0080');
      ctx.fillStyle = p2Grad;
      ctx.fillRect(p2X, barY, p2FillWidth, barHeight);
      
      ctx.shadowBlur = 0;

      // 3. Draw Labels
      ctx.font = 'bold 10px Orbitron, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.textAlign = 'left';
      ctx.fillText('STAMINA', p1X, barY - 10);
      ctx.textAlign = 'right';
      ctx.fillText('STAMINA', p2X + barWidth, barY - 10);
      
      ctx.fillStyle = '#00f0ff';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(displayP1Power)}%`, p1X + barWidth, barY - 10);
      ctx.fillStyle = '#ff006e';
      ctx.textAlign = 'left';
      ctx.fillText(`${Math.round(displayP2Power)}%`, p2X, barY - 10);

      // 4. Draw Center Marker
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.arc(centerX, centerY - radius, 5, 0, Math.PI * 2);
      ctx.fill();

      // 5. Draw Ghost Trails
      ghostPositions.forEach((pos, i) => {
        if (i === 0) return;
        const angle = 70 - (pos * 1.4);
        const rad = (angle - 90) * Math.PI / 180;
        const len = radius - 10;
        const midX = centerX + Math.cos(rad) * len;
        const midY = centerY + Math.sin(rad) * len;
        
        const opacity = (1 - i / ghostPositions.length) * 0.3;
        ctx.beginPath();
        ctx.strokeStyle = angle >= 0 ? `rgba(0, 240, 255, ${opacity})` : `rgba(255, 0, 110, ${opacity})`;
        ctx.lineWidth = 6 - i * 0.5;
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(midX, midY);
        ctx.stroke();
      });

      // 6. Draw Main Needle
      const currentAngle = 70 - (displayPosition * 1.4);
      const rad = (currentAngle - 90) * Math.PI / 180;
      const len = radius + 5;
      const x = centerX + Math.cos(rad) * len;
      const y = centerY + Math.sin(rad) * len;
      const color = currentAngle >= 0 ? '#00f0ff' : '#ff006e';

      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 8;
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.fillStyle = color;
      const pulse = Math.sin(time / 200) * 2;
      ctx.arc(x, y, 10 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 7. Draw Center Pivot
      ctx.beginPath();
      ctx.fillStyle = '#0a0515';
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
      ctx.fill();
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
