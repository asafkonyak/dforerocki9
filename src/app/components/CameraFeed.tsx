import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { VideoOff, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CameraFeedProps {
  className?: string;
  onStreamStarted?: (stream: MediaStream) => void;
  onError?: (error: Error) => void;
  deviceId?: string;
  transparent?: boolean;
}

export const CameraFeed = forwardRef<HTMLVideoElement, CameraFeedProps>(({ 
  className = '', 
  onStreamStarted, 
  onError, 
  deviceId,
  transparent = false
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Forward the video ref
  useImperativeHandle(ref, () => videoRef.current!);

  useEffect(() => {
    async function setupCamera() {
      try {
        // Stop any existing tracks before starting new ones
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            deviceId: deviceId ? { exact: deviceId } : undefined,
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
  }, [onStreamStarted, onError, deviceId]);

  return (
    <div className={`relative w-full h-full flex items-center justify-center overflow-hidden ${!transparent ? 'bg-[#0a0515]' : ''} ${className}`}>
      {/* Loading/Scanning Placeholder */}
      <AnimatePresence>
        {!isReady && !hasError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 z-20 flex flex-col items-center justify-center ${!transparent ? 'bg-[#0a0515]' : 'bg-transparent'}`}
          >
            {/* Cyber Grid Background */}
            {!transparent && (
              <div className="absolute inset-0 opacity-10 pointer-events-none" 
                   style={{ 
                     backgroundImage: `linear-gradient(#00f0ff 1px, transparent 1px), linear-gradient(90deg, #00f0ff 1px, transparent 1px)`,
                     backgroundSize: '30px 30px'
                   }} 
              />
            )}
            
            <div className="relative flex flex-col items-center gap-4">
              <div className="relative">
                <div className={`w-24 h-24 rounded-full border-2 border-[#00f0ff]/20 flex items-center justify-center ${!transparent ? 'bg-[#00f0ff]/5' : 'bg-black/40 backdrop-blur-sm'}`}>
                  <User className="w-12 h-12 text-[#00f0ff]/40 animate-pulse" />
                </div>
                {/* Spinning circular loader around the user icon */}
                <motion.div 
                  className="absolute inset-0 border-2 border-t-[#00f0ff] border-r-transparent border-b-transparent border-l-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>

              <div className="flex flex-col items-center gap-1">
                <p className="text-[#00f0ff] text-[10px] font-black tracking-[0.3em] uppercase italic animate-pulse">
                  Initializing...
                </p>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-1 h-1 bg-[#00f0ff] rounded-full"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Vertical Scanning Line */}
            <motion.div 
              className="absolute inset-x-0 h-[2px] bg-[#00f0ff]/40 z-30 shadow-[0_0_15px_#00f0ff]"
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {hasError ? (
        <div className={`text-center p-4 z-30 ${transparent ? 'bg-black/60 backdrop-blur-md rounded-xl' : ''}`}>
          <VideoOff className="w-12 h-12 text-white/20 mx-auto mb-2" />
          <p className="text-white/40 text-xs uppercase tracking-wider font-bold">Camera Blocked</p>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedData={() => setIsReady(true)}
          className={`w-full h-full object-cover mirror transition-opacity duration-700 ${isReady ? 'opacity-100' : 'opacity-0'}`}
          style={{ transform: 'scaleX(-1)' }} // Mirror the local feed
        />
      )}
    </div>
  );
});

CameraFeed.displayName = 'CameraFeed';
