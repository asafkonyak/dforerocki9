import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useGlobalAudio } from '../../contexts/AudioContext';
import { NeonButton } from '../components/NeonButton';
import { useEffect } from 'react';

export function ThemeSelector() {
  const navigate = useNavigate();
  const { startIntroMusic } = useGlobalAudio();

  useEffect(() => {
    // Attempt to start music on mount (may be blocked by autoplay)
    startIntroMusic();
  }, [startIntroMusic]);

  const handleStart = () => {
    startIntroMusic();
    navigate('/cyber');
  };

  return (
    <div className="min-h-screen bg-[#0a0515] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Video Background (Base Layer) */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/assets/intro.mp4" type="video/mp4" />
      </video>

      {/* Dark Overlay (Darkening the video) */}
      <div className="absolute inset-0 bg-black/60 z-[5] pointer-events-none" />

      {/* Animated Cyberpunk Blobs (Overlaying Video and Dark Layer) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        <motion.div
          className="absolute w-[500px] h-[500px] bg-[#00f0ff] rounded-full blur-[140px] opacity-30"
          animate={{
            x: [-100, 100, -100],
            y: [-50, 50, -50],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-[600px] h-[600px] bg-[#ff006e] rounded-full blur-[140px] opacity-30"
          animate={{
            x: [100, -100, 100],
            y: [50, -50, 50],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ bottom: '10%', right: '10%' }}
        />
      </div>

      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none z-20"
        style={{
          backgroundImage: `
          linear-gradient(#00f0ff 1px, transparent 1px),
          linear-gradient(90deg, #00f0ff 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      <motion.div
        className="relative z-30 flex flex-col items-center gap-12 w-full max-w-4xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Text-based Logo Layout */}
        <div className="text-center">
          <motion.h1 
            className="text-8xl md:text-9xl font-black italic text-white tracking-tighter"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            D-FORCE
          </motion.h1>
          <motion.div
            className="h-1 bg-gradient-to-r from-transparent via-[#ff006e] to-transparent w-full mt-4"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          />
          <motion.p 
            className="text-white/60 text-sm uppercase tracking-[0.4em] font-medium mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            POWER BEYOND BORDERS
          </motion.p>
        </div>

        {/* CTA Section */}
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <NeonButton
            variant="outline"
            color="pink"
            onClick={handleStart}
            size="lg"
            className="px-16 py-6 text-2xl"
          >
            ENTER ARENA
          </NeonButton>
        </motion.div>
      </motion.div>
    </div>
  );
}