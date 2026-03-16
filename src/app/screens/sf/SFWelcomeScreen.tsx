import { useNavigate } from 'react-router';
import { SFButton } from '../../components/SFButton';
import { Trophy, QrCode } from 'lucide-react';
import { motion } from 'motion/react';

export function SFWelcomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-600 via-orange-500 to-yellow-400 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Animated comic book style background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full" 
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
            backgroundSize: '100% 4px'
          }}
        />
      </div>

      {/* Speed lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 bg-white/30"
            style={{
              top: `${Math.random() * 100}%`,
              left: '-20%',
              width: `${Math.random() * 200 + 100}px`,
            }}
            animate={{
              x: ['0%', '120vw'],
            }}
            transition={{
              duration: Math.random() * 2 + 1,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "linear",
              type: "tween"
            }}
          />
        ))}
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-8 max-w-md w-full"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        {/* Logo/Title with comic style */}
        <motion.div
          className="text-center relative"
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.5 }}
        >
          <div className="relative inline-block">
            <h1 
              className="text-7xl mb-2 text-white"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                textShadow: `
                  4px 4px 0px #000,
                  8px 8px 0px rgba(0,0,0,0.3),
                  -2px -2px 0px #ff0000,
                  2px 2px 0px #ffff00
                `,
                WebkitTextStroke: '2px black',
              }}
            >
              FIGHT
            </h1>
            {/* Impact burst effect */}
            <motion.div
              className="absolute -top-8 -right-8"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
                type: "tween"
              }}
            >
              <div className="text-5xl">💥</div>
            </motion.div>
          </div>
          
          <h2 
            className="text-5xl mb-4 text-yellow-300"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              textShadow: '3px 3px 0px #000, -1px -1px 0px #ff0000',
              WebkitTextStroke: '2px black',
            }}
          >
            ARENA
          </h2>
          
          <div className="bg-black border-4 border-yellow-400 px-6 py-2 inline-block shadow-[4px_4px_0px_#000]">
            <p className="text-yellow-400 text-sm uppercase tracking-[0.3em] font-bold">
              1 vs 1 Battle Zone
            </p>
          </div>
        </motion.div>

        {/* Decorative divider */}
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 h-1 bg-gradient-to-r from-transparent via-black to-black" />
          <div className="w-8 h-8 bg-yellow-400 border-4 border-black rotate-45" />
          <div className="flex-1 h-1 bg-gradient-to-r from-black via-black to-transparent" />
        </div>

        {/* Buttons */}
        <div className="w-full space-y-4">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <SFButton
              variant="primary"
              onClick={() => alert('QR Scanner would open here')}
              className="w-full flex items-center justify-center gap-3"
              size="lg"
            >
              <QrCode className="w-6 h-6" />
              SCAN TO LOGIN
            </SFButton>
          </motion.div>

          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <SFButton
              variant="secondary"
              onClick={() => navigate('/sf/onboarding')}
              className="w-full"
              size="lg"
            >
              GUEST BATTLE
            </SFButton>
          </motion.div>
        </div>

        {/* Leaderboard button */}
        <motion.div
          className="mt-8"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <button
            onClick={() => alert('Leaderboard coming soon!')}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-16 h-16 bg-yellow-400 border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_#000] group-hover:shadow-[6px_6px_0px_#000] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] transition-all">
              <Trophy className="w-8 h-8 text-black" />
            </div>
            <span 
              className="text-black text-sm uppercase tracking-widest bg-yellow-400 px-4 py-1 border-2 border-black"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              Champions
            </span>
          </button>
        </motion.div>

        {/* Comic style "POW" effect in corner */}
        <motion.div
          className="absolute -top-10 -right-10 w-24 h-24"
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            type: "tween"
          }}
        >
          <div 
            className="w-full h-full bg-yellow-400 border-4 border-black flex items-center justify-center rotate-12"
            style={{
              clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
            }}
          >
            <span className="text-black text-xl font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>POW</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
