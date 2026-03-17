import React, { createContext, useContext, useRef, useEffect, useState } from 'react';

interface AudioContextType {
  isPlaying: boolean;
  startIntroMusic: () => void;
  stopIntroMusic: () => void;
  playStageMusic: (stage: number) => void;
  stopStageMusic: () => void;
  playWinSound: () => void;
  stopWinSound: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stageAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Create intro audio element
    const audio = new Audio('/assets/intosound.mp3');
    audio.loop = true;
    audio.volume = 0.6;
    audioRef.current = audio;

    return () => {
      audio.pause();
      if (stageAudioRef.current) {
        stageAudioRef.current.pause();
      }
      if (winAudioRef.current) {
        winAudioRef.current.pause();
      }
      audioRef.current = null;
      stageAudioRef.current = null;
      winAudioRef.current = null;
    };
  }, []);

  const startIntroMusic = () => {
    if (audioRef.current && !isPlaying) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          audioRef.current!.volume = 0.6;
        })
        .catch(err => console.error('Persistent audio playback failed:', err));
    }
  };

  const stopIntroMusic = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const playWinSound = () => {
    // Stop any existing win sound
    if (winAudioRef.current) {
      winAudioRef.current.pause();
    }
    const winAudio = new Audio('/assets/robots/stage_win.mp3');
    winAudio.volume = 0.7;
    winAudioRef.current = winAudio;
    winAudio.play().catch(err => console.error('Failed to play win sound:', err));
  };

  const stopWinSound = () => {
    if (winAudioRef.current) {
      winAudioRef.current.pause();
      winAudioRef.current = null;
    }
  };

  const playStageMusic = (stage: number) => {
    // 1. Fade out intro music if playing
    if (audioRef.current && isPlaying) {
      const introAudio = audioRef.current;
      const fadeOut = setInterval(() => {
        if (introAudio.volume > 0.05) {
          introAudio.volume -= 0.05;
        } else {
          introAudio.pause();
          setIsPlaying(false);
          clearInterval(fadeOut);
        }
      }, 50);
    }

    // 2. Stop current stage music if any
    if (stageAudioRef.current) {
      stageAudioRef.current.pause();
    }

    // 3. Determine file path (Stage 2 is .ogg, Stage 3 is .wav, others are .mp3)
    let ext = 'mp3';
    let targetStage = stage;
    if (stage === 2) ext = 'ogg';
    if (stage === 3) ext = 'wav';
    if (stage > 5) targetStage = 5;

    const audioPath = `/assets/robots/stage${targetStage}.${ext}`;
    
    // 4. Create and play stage music
    const stageAudio = new Audio(audioPath);
    stageAudio.loop = true;
    stageAudio.volume = 0;
    stageAudioRef.current = stageAudio;

    stageAudio.play()
      .then(() => {
        // Fade in
        const fadeIn = setInterval(() => {
          if (stageAudio.volume < 0.5) {
            stageAudio.volume = Math.min(0.5, stageAudio.volume + 0.05);
          } else {
            clearInterval(fadeIn);
          }
        }, 100);
      })
      .catch(err => console.error(`Failed to play stage music: ${audioPath}`, err));
  };

  const stopStageMusic = () => {
    if (stageAudioRef.current) {
      const stageAudioToFade = stageAudioRef.current;
      const fadeOut = setInterval(() => {
        if (stageAudioToFade.volume > 0.05) {
          stageAudioToFade.volume -= 0.05;
        } else {
          stageAudioToFade.pause();
          if (stageAudioRef.current === stageAudioToFade) {
            stageAudioRef.current = null;
          }
          clearInterval(fadeOut);
        }
      }, 50);
    }
  };

  return (
    <AudioContext.Provider value={{ isPlaying, startIntroMusic, stopIntroMusic, playStageMusic, stopStageMusic, playWinSound, stopWinSound }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useGlobalAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useGlobalAudio must be used within an AudioProvider');
  }
  return context;
};
