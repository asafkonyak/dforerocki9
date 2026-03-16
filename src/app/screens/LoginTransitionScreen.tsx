import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';

export function LoginTransitionScreen() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    // Navigate to onboarding after animation completes
    const timer = setTimeout(() => {
      navigate('/onboarding');
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0a0515] relative overflow-hidden flex items-center justify-center">
      {/* Hyper-speed tunnel effect background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated speed lines */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-[2px] bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent"
            style={{
              top: `${Math.random() * 100}%`,
              left: '-100%',
              width: `${50 + Math.random() * 150}%`,
              opacity: 0.3,
            }}
            animate={{
              left: ['0%', '200%'],
            }}
            transition={{
              duration: 0.5 + Math.random() * 0.5,
              repeat: Infinity,
              delay: i * 0.05,
              ease: 'linear',
              type: 'tween',
            }}
          />
        ))}
        
        {/* Digital tunnel grid */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(90deg, transparent 0%, rgba(0, 240, 255, 0.1) 50%, transparent 100%),
              linear-gradient(0deg, transparent 0%, rgba(255, 0, 110, 0.1) 50%, transparent 100%)
            `,
            backgroundSize: '50px 50px',
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
            type: 'tween',
          }}
        />

        {/* Radial burst effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-radial from-[#00f0ff]/20 via-transparent to-transparent"
          animate={{
            scale: [1, 2],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
            type: 'tween',
          }}
        />

        {/* Depth blur circles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`circle-${i}`}
            className="absolute rounded-full border border-[#00f0ff]/30"
            style={{
              left: '50%',
              top: '50%',
              width: `${(i + 1) * 100}px`,
              height: `${(i + 1) * 100}px`,
              marginLeft: `-${(i + 1) * 50}px`,
              marginTop: `-${(i + 1) * 50}px`,
            }}
            animate={{
              scale: [1, 2],
              opacity: [0.5, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeOut',
              type: 'tween',
            }}
          />
        ))}
      </div>

      {/* Dissolving UI panels */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        {/* Top panel */}
        <motion.div
          className="absolute top-20 w-80 h-32 rounded-2xl border border-[#00f0ff]/30"
          style={{
            background: 'rgba(26, 10, 46, 0.4)',
            backdropFilter: 'blur(20px)',
          }}
          animate={{
            opacity: [0.6, 0],
            y: [0, -100],
            filter: ['blur(0px)', 'blur(40px)'],
          }}
          transition={{
            duration: 1.5,
            ease: 'easeIn',
            type: 'tween',
          }}
        />

        {/* Left panel */}
        <motion.div
          className="absolute left-10 w-64 h-40 rounded-2xl border border-[#ff006e]/30"
          style={{
            background: 'rgba(26, 10, 46, 0.4)',
            backdropFilter: 'blur(20px)',
          }}
          animate={{
            opacity: [0.6, 0],
            x: [-0, -150],
            filter: ['blur(0px)', 'blur(40px)'],
          }}
          transition={{
            duration: 1.5,
            delay: 0.2,
            ease: 'easeIn',
            type: 'tween',
          }}
        />

        {/* Right panel */}
        <motion.div
          className="absolute right-10 w-64 h-40 rounded-2xl border border-[#ffff00]/30"
          style={{
            background: 'rgba(26, 10, 46, 0.4)',
            backdropFilter: 'blur(20px)',
          }}
          animate={{
            opacity: [0.6, 0],
            x: [0, 150],
            filter: ['blur(0px)', 'blur(40px)'],
          }}
          transition={{
            duration: 1.5,
            delay: 0.3,
            ease: 'easeIn',
            type: 'tween',
          }}
        />
      </div>

      {/* Main content - Progress bar */}
      <div className="relative z-20 w-full max-w-2xl px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* System status text */}
          <motion.div
            className="text-center mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-[#00f0ff] text-sm uppercase tracking-[0.3em] mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              System Access
            </p>
            <h1 
              className="text-4xl mb-2 text-white"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              AUTHENTICATED
            </h1>
          </motion.div>

          {/* Morphed progress bar */}
          <div className="relative w-full h-20 rounded-2xl overflow-hidden border-2 border-[#00f0ff]"
            style={{
              background: 'rgba(0, 240, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 40px rgba(0, 240, 255, 0.4)',
            }}
          >
            {/* Progress fill */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-[#00f0ff] via-[#ff006e] to-[#ffff00]"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              style={{ opacity: 0.3 }}
            />

            {/* Biometric laser sweep effect */}
            <motion.div
              className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-white to-transparent"
              style={{
                boxShadow: '0 0 30px rgba(255, 255, 255, 0.8)',
              }}
              animate={{
                left: ['-10%', '110%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
                type: 'tween',
              }}
            />

            {/* Scan lines */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={`scan-${i}`}
                className="absolute inset-x-0 h-[1px] bg-[#00f0ff]"
                style={{
                  top: `${(i + 1) * 20}%`,
                  opacity: 0.5,
                }}
                animate={{
                  opacity: [0.3, 0.7],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  delay: i * 0.2,
                  ease: 'easeInOut',
                  type: 'tween',
                }}
              />
            ))}

            {/* Text content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.p
                className="text-white uppercase tracking-[0.2em] text-lg z-10"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
                animate={{
                  opacity: [1, 0.7],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                  type: 'tween',
                }}
              >
                Loading Profile...
              </motion.p>
            </div>

            {/* Glowing edges */}
            <div className="absolute inset-0 border-2 border-[#00f0ff] rounded-2xl pointer-events-none"
              style={{
                boxShadow: 'inset 0 0 20px rgba(0, 240, 255, 0.3)',
              }}
            />
          </div>

          {/* Progress percentage */}
          <motion.div
            className="text-center mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-[#00f0ff] text-2xl tabular-nums" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {Math.round(progress)}%
            </p>
          </motion.div>

          {/* Data stream effect */}
          <div className="mt-8 overflow-hidden h-16 relative">
            <motion.div
              className="absolute inset-0 flex flex-col gap-1"
              animate={{
                y: [0, -200],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
                type: 'tween',
              }}
            >
              {[
                'VALIDATING CREDENTIALS...',
                'ESTABLISHING SECURE CONNECTION...',
                'LOADING USER PROFILE...',
                'INITIALIZING COMBAT SYSTEMS...',
                'SYNCING TOURNAMENT DATA...',
                'PREPARING ARENA ACCESS...',
              ].map((text, i) => (
                <p
                  key={i}
                  className="text-[#00f0ff]/40 text-xs uppercase tracking-wider text-center"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  {text}
                </p>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Corner accents */}
      <motion.div
        className="absolute top-10 left-10 w-20 h-20 border-t-2 border-l-2 border-[#00f0ff]"
        animate={{
          opacity: [0.3, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
          type: 'tween',
        }}
      />
      <motion.div
        className="absolute top-10 right-10 w-20 h-20 border-t-2 border-r-2 border-[#ff006e]"
        animate={{
          opacity: [0.3, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          repeatType: 'reverse',
          delay: 0.5,
          ease: 'easeInOut',
          type: 'tween',
        }}
      />
      <motion.div
        className="absolute bottom-10 left-10 w-20 h-20 border-b-2 border-l-2 border-[#ffff00]"
        animate={{
          opacity: [0.3, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          repeatType: 'reverse',
          delay: 1,
          ease: 'easeInOut',
          type: 'tween',
        }}
      />
      <motion.div
        className="absolute bottom-10 right-10 w-20 h-20 border-b-2 border-r-2 border-[#00f0ff]"
        animate={{
          opacity: [0.3, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          repeatType: 'reverse',
          delay: 1.5,
          ease: 'easeInOut',
          type: 'tween',
        }}
      />
    </div>
  );
}