import React, { useEffect, useRef, useState } from 'react';
import { VideoOff } from 'lucide-react';

interface CameraFeedProps {
  className?: string;
  onStreamStarted?: (stream: MediaStream) => void;
  onError?: (error: Error) => void;
}

export function CameraFeed({ className = '', onStreamStarted, onError }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        });
        
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        if (onStreamStarted) onStreamStarted(stream);
      } catch (err) {
        console.error("Camera access error:", err);
        setHasError(true);
        if (onError) onError(err as Error);
      }
    }

    setupCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [onStreamStarted, onError]);

  return (
    <div className={`relative w-full h-full bg-black flex items-center justify-center ${className}`}>
      {hasError ? (
        <div className="text-center p-4">
          <VideoOff className="w-12 h-12 text-white/20 mx-auto mb-2" />
          <p className="text-white/40 text-xs uppercase tracking-wider font-bold">Camera Blocked</p>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover mirror"
          style={{ transform: 'scaleX(-1)' }} // Mirror the local feed
        />
      )}
    </div>
  );
}
