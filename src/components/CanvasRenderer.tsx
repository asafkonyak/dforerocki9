import React, { useEffect, useRef } from 'react';

interface CanvasRendererProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  draw: (context: CanvasRenderingContext2D, frameCount: number) => void;
  width?: number;
  height?: number;
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({ draw, width = 800, height = 600, ...rest }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    let frameCount = 0;
    let animationFrameId: number;
    
    const render = () => {
      frameCount++;
      // Clear the canvas each frame automatically (optional, depends on use case)
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Execute the custom draw function passed as prop
      draw(context, frameCount);
      
      // Request next frame
      animationFrameId = window.requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [draw]);

  return <canvas ref={canvasRef} width={width} height={height} {...rest} />;
};
