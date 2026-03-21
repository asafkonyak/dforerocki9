import { useNavigate } from 'react-router';
import { NeonButton } from '../components/NeonButton';
import { Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { useGlobalAudio } from '../../contexts/AudioContext';
import { useEffect } from 'react';

export function WelcomeScreen() {
  const navigate = useNavigate();
  const { startIntroMusic } = useGlobalAudio();

  useEffect(() => {
    // Ensure intro music is playing when we arrive here
    startIntroMusic();
  }, [startIntroMusic]);

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

      {/* Animated background elements (Overlaying Video and Dark Layer) */}
      <div className="absolute inset-0 overflow-hidden z-10">
        <motion.div
          className="absolute w-96 h-96 bg-[#00f0ff] rounded-full blur-[120px] opacity-30"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            type: "tween"
          }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-[#ff006e] rounded-full blur-[120px] opacity-30"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            type: "tween"
          }}
          style={{ bottom: '10%', right: '10%' }}
        />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-20 flex flex-col items-center gap-8 max-w-4xl w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Text-based Logo Layout (Matches Home Page) */}
        <div className="text-center">
          <motion.h1 
            className="text-6xl md:text-8xl font-black italic text-white tracking-tighter"
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
            className="text-white/60 text-xs uppercase tracking-[0.4em] font-medium mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            POWER BEYOND BORDERS
          </motion.p>
        </div>

        {/* Buttons */}
        <div className="w-full space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <NeonButton
              variant="primary"
              color="cyan"
              onClick={() => navigate('/login')}
              className="w-full"
              size="lg"
            >
              Login to Player
            </NeonButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <NeonButton
              variant="outline"
              color="pink"
              onClick={() => {
                const playerId = crypto.randomUUID();
                localStorage.setItem('fighter_player_id', playerId);
                navigate('/onboarding');
              }}
              className="w-full"
              size="lg"
            >
              Play as Guest
            </NeonButton>
          </motion.div>
        </div>

        {/* Leaderboard button */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <button
            onClick={() => navigate('/leaderboard')}
            className="flex flex-col items-center gap-2 text-[#ffff00] hover:text-[#ffff00]/80 transition-colors group"
          >
            <div className="relative">
              <Trophy className="w-10 h-10" />
              <div className="absolute inset-0 bg-[#ffff00] blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
            </div>
            <span className="text-xs uppercase tracking-widest font-bold">Leaderboard</span>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}