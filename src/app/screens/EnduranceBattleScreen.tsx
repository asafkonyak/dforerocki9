import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GlassCard } from '../components/GlassCard';
import { Activity, User, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router';

export function EnduranceBattleScreen() {
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [currentHold, setCurrentHold] = useState(15);
  const [userPosition, setUserPosition] = useState(50); // Position of user's energy node (0-100)
  const [isInTargetZone, setIsInTargetZone] = useState(true);
  
  // Target zone boundaries (40-60 is the sweet spot)
  const targetZoneStart = 40;
  const targetZoneEnd = 60;

  // Simulate countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            alert('Training Complete! 🏆');
            navigate('/training');
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  // Simulate user position fluctuation (in real game, this would be from sensor data)
  useEffect(() => {
    const fluctuation = setInterval(() => {
      setUserPosition(prev => {
        const randomChange = (Math.random() - 0.5) * 8; // -4 to +4 change
        const newPos = Math.max(20, Math.min(80, prev + randomChange));
        
        // Check if in target zone
        const inZone = newPos >= targetZoneStart && newPos <= targetZoneEnd;
        setIsInTargetZone(inZone);
        
        // Adjust hold based on position
        if (inZone) {
          setCurrentHold(15 + Math.random() * 2); // 15-17 KG
        } else {
          setCurrentHold(10 + Math.random() * 8); // 10-18 KG (more variation)
        }
        
        return newPos;
      });
    }, 200);

    return () => clearInterval(fluctuation);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-[#0a0515] via-[#1a0a2e] to-[#0a0515] relative flex flex-col">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full" 
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 240, 255, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 240, 255, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Scanline Effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'linear-gradient(0deg, transparent 50%, rgba(0, 240, 255, 0.1) 50%)',
          backgroundSize: '100% 4px'
        }}
        animate={{
          backgroundPositionY: ['0px', '4px']
        }}
        transition={{
          duration: 0.1,
          repeat: Infinity,
          ease: 'linear',
          type: 'tween'
        }}
      />

      {/* Top-Left: Opponent (Aero-Bot) Live Feed */}
      <motion.div
        className="absolute top-6 left-6 z-20"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <GlassCard className="p-4 w-64 border-[#00f0ff]/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-xs uppercase tracking-wider text-[#00f0ff]/60">Opponent</div>
            <div className="h-2 w-2 rounded-full bg-[#00f0ff]">
              <motion.div
                className="h-2 w-2 rounded-full bg-[#00f0ff]"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', type: 'tween' }}
              />
            </div>
            <div className="text-xs text-[#00f0ff]">LIVE</div>
          </div>
          
          {/* Video Feed Simulation */}
          <div className="relative aspect-video bg-black/40 rounded-lg border border-[#00f0ff]/20 overflow-hidden mb-3">
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-20 h-20 rounded-full bg-[#00f0ff]/20 flex items-center justify-center border-2 border-[#00f0ff]/40"
                animate={{
                  boxShadow: ['0 0 20px rgba(0,240,255,0.3)', '0 0 30px rgba(0,240,255,0.6)', '0 0 20px rgba(0,240,255,0.3)']
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  type: 'tween'
                }}
              >
                <Activity className="w-10 h-10 text-[#00f0ff]" />
              </motion.div>
            </div>
            
            {/* Noise/Static Effect */}
            <motion.div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
              }}
            />
          </div>

          {/* Bot Info */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[#00f0ff] font-bold">AERO-BOT</div>
              <div className="text-xs text-white/60">Endurance Protocol</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#00f0ff]/60">Status</div>
              <div className="text-xs text-[#00f0ff]">Active</div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Bottom-Right: User Live Feed */}
      <motion.div
        className="absolute bottom-6 right-6 z-20"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <GlassCard className="p-4 w-64 border-[#00f0ff]/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-xs uppercase tracking-wider text-[#00f0ff]/60">You</div>
            <div className="h-2 w-2 rounded-full bg-[#00f0ff]">
              <motion.div
                className="h-2 w-2 rounded-full bg-[#00f0ff]"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', type: 'tween' }}
              />
            </div>
            <div className="text-xs text-[#00f0ff]">LIVE</div>
          </div>
          
          {/* Video Feed Simulation */}
          <div className="relative aspect-video bg-black/40 rounded-lg border border-[#00f0ff]/20 overflow-hidden mb-3">
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-20 h-20 rounded-full bg-[#00f0ff]/20 flex items-center justify-center border-2 border-[#00f0ff]/40"
                animate={{
                  boxShadow: ['0 0 20px rgba(0,240,255,0.3)', '0 0 30px rgba(0,240,255,0.6)', '0 0 20px rgba(0,240,255,0.3)']
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  type: 'tween',
                  delay: 0.5
                }}
              >
                <User className="w-10 h-10 text-[#00f0ff]" />
              </motion.div>
            </div>
            
            {/* Noise/Static Effect */}
            <motion.div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
              }}
            />
          </div>

          {/* User Info */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[#00f0ff] font-bold">PLAYER-01</div>
              <div className="text-xs text-white/60">Challenger</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#00f0ff]/60">Performance</div>
              <div className="text-xs text-[#00f0ff]">
                {isInTargetZone ? 'Optimal ✓' : 'Adjust'}
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Center Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-12 relative z-10">
        
        {/* Countdown Timer - Above Gauge */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="text-center">
            <div className="text-[#00f0ff]/60 text-sm uppercase tracking-[0.3em] mb-2">
              Time Remaining
            </div>
            <motion.div
              className="text-7xl font-mono text-[#00f0ff] tabular-nums"
              style={{
                textShadow: '0 0 30px rgba(0, 240, 255, 0.8), 0 0 60px rgba(0, 240, 255, 0.4)'
              }}
              animate={{
                textShadow: [
                  '0 0 30px rgba(0, 240, 255, 0.8), 0 0 60px rgba(0, 240, 255, 0.4)',
                  '0 0 40px rgba(0, 240, 255, 1), 0 0 80px rgba(0, 240, 255, 0.6)',
                  '0 0 30px rgba(0, 240, 255, 0.8), 0 0 60px rgba(0, 240, 255, 0.4)'
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
                type: 'tween'
              }}
            >
              {String(Math.floor(timeRemaining / 60)).padStart(2, '0')}:
              {String(timeRemaining % 60).padStart(2, '0')}
            </motion.div>
          </div>
        </motion.div>

        {/* Core Mechanic: Tolerance Gauge with Target Zone */}
        <motion.div
          className="w-full max-w-4xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <GlassCard className="p-8 border-[#00f0ff]/30">
            {/* Gauge Label */}
            <div className="text-center mb-6">
              <div className="text-xl text-[#00f0ff] tracking-wider uppercase">
                Stability Control
              </div>
              <div className="text-xs text-white/60 mt-1">
                Keep your energy node within the target zone
              </div>
            </div>

            {/* Horizontal Gauge Container */}
            <div className="relative h-24 mb-6">
              {/* Background Track */}
              <div className="absolute inset-0 bg-black/50 rounded-full border border-white/10 overflow-hidden">
                {/* Gradient fill */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#ff006e]/20 via-[#00f0ff]/20 to-[#ff006e]/20" />
              </div>

              {/* Target Zone (Sweet Spot) */}
              <motion.div
                className="absolute top-0 bottom-0 rounded-full border-2 border-[#00f0ff] bg-[#00f0ff]/20 overflow-hidden"
                style={{
                  left: `${targetZoneStart}%`,
                  width: `${targetZoneEnd - targetZoneStart}%`
                }}
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(0, 240, 255, 0.4)',
                    '0 0 30px rgba(0, 240, 255, 0.7)',
                    '0 0 20px rgba(0, 240, 255, 0.4)'
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  type: 'tween'
                }}
              >
                {/* Pulsing inner glow */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00f0ff]/30 to-transparent"
                  animate={{
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    type: 'tween'
                  }}
                />
                
                {/* Target Zone Label */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs text-[#00f0ff] uppercase tracking-wider font-bold">
                    Target Zone
                  </span>
                </div>
              </motion.div>

              {/* User's Energy Node */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 z-10"
                style={{
                  left: `${userPosition}%`
                }}
                animate={{
                  x: [0, -2, 2, 0],
                  y: [0, 1, -1, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  type: 'tween'
                }}
              >
                <div className="relative -translate-x-1/2">
                  {/* Main node */}
                  <motion.div
                    className="w-16 h-16 rounded-full border-4 flex items-center justify-center"
                    style={{
                      borderColor: isInTargetZone ? '#00f0ff' : '#ff006e',
                      backgroundColor: isInTargetZone ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255, 0, 110, 0.3)'
                    }}
                    animate={{
                      boxShadow: isInTargetZone
                        ? [
                            '0 0 20px rgba(0, 240, 255, 0.6)',
                            '0 0 30px rgba(0, 240, 255, 0.9)',
                            '0 0 20px rgba(0, 240, 255, 0.6)'
                          ]
                        : [
                            '0 0 20px rgba(255, 0, 110, 0.6)',
                            '0 0 30px rgba(255, 0, 110, 0.9)',
                            '0 0 20px rgba(255, 0, 110, 0.6)'
                          ]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      type: 'tween'
                    }}
                  >
                    <div 
                      className="w-6 h-6 rounded-full"
                      style={{
                        backgroundColor: isInTargetZone ? '#00f0ff' : '#ff006e'
                      }}
                    />
                  </motion.div>

                  {/* Pulse rings */}
                  <motion.div
                    className="absolute inset-0 border-2 rounded-full"
                    style={{
                      borderColor: isInTargetZone ? '#00f0ff' : '#ff006e'
                    }}
                    animate={{
                      scale: [1, 1.5, 2],
                      opacity: [0.6, 0.3, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeOut',
                      type: 'tween'
                    }}
                  />
                </div>
              </motion.div>

              {/* Percentage markers */}
              <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-white/40">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Warning indicator when out of zone */}
            {!isInTargetZone && (
              <motion.div
                className="flex items-center justify-center gap-2 mt-8 text-[#ff006e]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm uppercase tracking-wider">
                  Adjust force to re-enter target zone
                </span>
              </motion.div>
            )}
          </GlassCard>
        </motion.div>

        {/* Stability Meter - Below Gauge */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <GlassCard className="px-12 py-6 border-[#00f0ff]/30">
            <div className="text-center">
              <div className="text-[#00f0ff]/60 text-xs uppercase tracking-[0.3em] mb-2">
                Current Hold
              </div>
              <motion.div
                className="text-5xl font-mono text-[#00f0ff] tabular-nums"
                style={{
                  textShadow: '0 0 20px rgba(0, 240, 255, 0.6)'
                }}
                animate={{
                  scale: [1, 1.02, 1]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  type: 'tween'
                }}
              >
                {currentHold.toFixed(1)} <span className="text-2xl text-[#00f0ff]/60">KG</span>
              </motion.div>
              
              {/* Heartbeat-style pulse indicator */}
              <div className="flex items-center justify-center gap-1 mt-3">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-[#00f0ff] rounded-full"
                    style={{
                      height: isInTargetZone 
                        ? `${12 + Math.sin(i * 0.5) * 8}px`
                        : `${8 + Math.random() * 12}px`
                    }}
                    animate={{
                      opacity: [0.3, 1, 0.3]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      type: 'tween',
                      delay: i * 0.1
                    }}
                  />
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Emergency Exit Button */}
      <motion.button
        className="absolute top-6 right-6 z-30 text-white/60 hover:text-[#ff006e] transition-colors text-sm uppercase tracking-wider"
        onClick={() => navigate('/training')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        ⏹ End Session
      </motion.button>
    </div>
  );
}
