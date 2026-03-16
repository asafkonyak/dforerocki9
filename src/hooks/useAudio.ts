import { useCallback, useEffect, useRef, useState } from 'react';
// import { Howl } from 'howler'; // Uncomment when howler is installed

interface AudioOptions {
  src: string;
  volume?: number;
  loop?: boolean;
  autoplay?: boolean;
}

export const useAudio = ({ src, volume = 1.0, loop = false, autoplay = false }: AudioOptions) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const audio = new Audio(src);
    audio.volume = volume;
    audio.loop = loop;
    
    // Add event listeners for state management
    const handleCanPlayThrough = () => setIsLoaded(true);
    const handleEnded = () => setIsPlaying(false);
    
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('ended', handleEnded);
    
    audioRef.current = audio;
    
    if (autoplay) {
      audio.play().then(() => setIsPlaying(true)).catch(e => console.error("Autoplay prevented", e));
    }
    
    return () => {
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      audioRef.current = null;
    };
  }, [src, loop, autoplay]);
  
  // Need to update volume separately if it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error('Audio playback failed', err));
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);
  
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  return { play, pause, stop, isPlaying, isLoaded };
};
