import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GlassCard } from '../components/GlassCard';
import { Shield, User, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router';

interface Ember {
  id: number;
  x: number;
  y: number;
  delay: number;
}

export function StrengthBattleScreen() {
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [currentLoad, setCurrentLoad] = useState(45);
  const [goalLoad] = useState(65);
  const [pressProgress, setPressProgress] = useState(30); // 0-100 percentage
  const [embers, setEmbers] = useState<Ember[]>([]);
  const [strainIntensity, setStrainIntensity] = useState(0.3);

  // Simulate countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            alert(`Training Complete! 🏆 Max Load: ${currentLoad.toFixed(0)} KG`);
            navigate('/training');
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, currentLoad]);

  // Simulate gradual load increase (slow grind)
  useEffect(() => {
    const loadInterval = setInterval(() => {
      setCurrentLoad(prev => {
        const increment = 0.2 + Math.random() * 0.3; // Slow 0.2-0.5 KG increase
        const newLoad = Math.min(goalLoad + 5, prev + increment);
        
        // Update press progress based on load
        const progress = Math.min(100, (newLoad / goalLoad) * 100);
        setPressProgress(progress);
        
        // Increase strain intensity as we approach goal
        const intensity = Math.min(1, newLoad / goalLoad);
        setStrainIntensity(intensity);
        
        return newLoad;
      });
    }, 800); // Update every 800ms for slow, heavy feel

    return () => clearInterval(loadInterval);
  }, [goalLoad]);

  // Generate ember particles
  useEffect(() => {
    const emberInterval = setInterval(() => {
      const newEmber: Ember = {
        id: Date.now() + Math.random(),
        x: 50 + (Math.random() - 0.5) * 20, // Around the center
        y: 50,
        delay: Math.random() * 0.3
      };
      
      setEmbers(prev => {
        const updated = [...prev, newEmber];
        // Keep only last 8 embers
        return updated.slice(-8);
      });
    }, 300 + Math.random() * 400); // Random ember generation

    return () => clearInterval(emberInterval);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-[#0a0000] via-[#1a0a0e] to-[#000000] relative flex flex-col">
      {/* Dark Red Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(139, 0, 0, ${0.3 + strainIntensity * 0.4}) 100%)`
        }}
      />

      {/* Heavy Grid Pattern */}
      <div className="absolute inset-0 opacity-8">
        <div 
          className="w-full h-full" 
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 0, 110, 0.2) 2px, transparent 2px),
              linear-gradient(90deg, rgba(255, 0, 110, 0.2) 2px, transparent 2px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Digital Distortion Lines */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-20 opacity-20"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%']
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
          type: 'tween'
        }}
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 2px,
            rgba(255, 0, 110, 0.1) 2px,
            rgba(255, 0, 110, 0.1) 4px
          )`,
          backgroundSize: '200% 200%'
        }}
      />

      {/* Heavy Scanlines */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'linear-gradient(0deg, transparent 50%, rgba(255, 0, 110, 0.3) 50%)',
          backgroundSize: '100% 6px'
        }}
        animate={{
          backgroundPositionY: ['0px', '6px']
        }}
        transition={{
          duration: 0.2,
          repeat: Infinity,
          ease: 'linear',
          type: 'tween'
        }}
      />

      {/* Embers/Sparks */}
      {embers.map(ember => (
        <motion.div
          key={ember.id}
          className="absolute w-2 h-2 rounded-full bg-[#ff006e] pointer-events-none z-15"
          style={{
            left: `${ember.x}%`,
            top: `${ember.y}%`,
            boxShadow: '0 0 8px rgba(255, 0, 110, 0.8)'
          }}
          initial={{ opacity: 1, scale: 1, y: 0, x: 0 }}
          animate={{
            opacity: [1, 0.8, 0],
            scale: [1, 0.5, 0.2],
            y: [0, -60 - Math.random() * 40, -100 - Math.random() * 60],
            x: [(Math.random() - 0.5) * 30, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 100]
          }}
          transition={{
            duration: 2 + Math.random(),
            delay: ember.delay,
            ease: 'easeOut',
            type: 'tween'
          }}
          onAnimationComplete={() => {
            setEmbers(prev => prev.filter(e => e.id !== ember.id));
          }}
        />
      ))}

      {/* Top-Left: Opponent (Titan Juggernaut) Live Feed */}
      <motion.div
        className="absolute top-6 left-6 z-20"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <GlassCard className="p-4 w-64 border-[#ff006e]/50 bg-black/80">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-xs uppercase tracking-wider text-[#ff006e]/70 font-bold">Opponent</div>
            <motion.div 
              className="h-2 w-2 rounded-full bg-[#ff006e]"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', type: 'tween' }}
            />
            <div className="text-xs text-[#ff006e] font-bold">LIVE</div>
          </div>
          
          {/* Video Feed Simulation */}
          <div className="relative aspect-video bg-black rounded-lg border-2 border-[#ff006e]/40 overflow-hidden mb-3">
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-24 h-24 rounded-full bg-[#ff006e]/30 flex items-center justify-center border-4 border-[#ff006e]"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(255,0,110,0.5)', 
                    '0 0 40px rgba(255,0,110,0.9)', 
                    '0 0 20px rgba(255,0,110,0.5)'
                  ]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  type: 'tween'
                }}
              >
                <Shield className="w-12 h-12 text-[#ff006e]" />
              </motion.div>
            </div>
            
            {/* Heavy armor plate effect */}
            <motion.div
              className="absolute inset-0 border-4 border-[#ff006e]/20"
              style={{ borderStyle: 'double' }}
            />
          </div>

          {/* Bot Info */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[#ff006e] font-bold text-lg">TITAN</div>
              <div className="text-xs text-white/60">Max Strength</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#ff006e]/60">Status</div>
              <div className="text-xs text-[#ff006e] font-bold">Resisting</div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Bottom-Right: User Live Feed */}
      <motion.div
        className="absolute bottom-6 right-6 z-20"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <GlassCard className="p-4 w-64 border-[#ff006e]/50 bg-black/80">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-xs uppercase tracking-wider text-[#ff006e]/70 font-bold">You</div>
            <motion.div 
              className="h-2 w-2 rounded-full bg-[#ff006e]"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', type: 'tween' }}
            />
            <div className="text-xs text-[#ff006e] font-bold">LIVE</div>
          </div>
          
          {/* Video Feed Simulation */}
          <div className="relative aspect-video bg-black rounded-lg border-2 border-[#ff006e]/40 overflow-hidden mb-3">
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-24 h-24 rounded-full bg-[#ff006e]/30 flex items-center justify-center border-4 border-[#ff006e]"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(255,0,110,0.5)', 
                    '0 0 40px rgba(255,0,110,0.9)', 
                    '0 0 20px rgba(255,0,110,0.5)'
                  ],
                  scale: [1, 1.02, 1]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  type: 'tween',
                  delay: 0.5
                }}
              >
                <User className="w-12 h-12 text-[#ff006e]" />
              </motion.div>
            </div>
            
            {/* Strain indicator */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-1 bg-[#ff006e]"
              style={{
                width: `${strainIntensity * 100}%`
              }}
              animate={{
                opacity: [0.6, 1, 0.6]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                type: 'tween'
              }}
            />
          </div>

          {/* User Info */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[#ff006e] font-bold text-lg">PLAYER-01</div>
              <div className="text-xs text-white/60">Challenger</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#ff006e]/60">Effort</div>
              <div className="text-xs text-[#ff006e] font-bold">
                {Math.round(strainIntensity * 100)}%
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Center Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-12 relative z-10">
        
        {/* Massive Weight Display */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <motion.div
            className="text-xs uppercase tracking-[0.4em] text-[#ff006e]/60 mb-4"
            animate={{
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              type: 'tween'
            }}
          >
            Current Load
          </motion.div>
          
          <motion.div
            className="text-[120px] md:text-[160px] font-mono font-black text-[#ff006e] tabular-nums leading-none"
            style={{
              textShadow: '0 0 40px rgba(255, 0, 110, 0.9), 0 0 80px rgba(255, 0, 110, 0.6), 0 0 120px rgba(255, 0, 110, 0.3)'
            }}
            animate={{
              textShadow: [
                '0 0 40px rgba(255, 0, 110, 0.9), 0 0 80px rgba(255, 0, 110, 0.6), 0 0 120px rgba(255, 0, 110, 0.3)',
                '0 0 50px rgba(255, 0, 110, 1), 0 0 100px rgba(255, 0, 110, 0.8), 0 0 150px rgba(255, 0, 110, 0.5)',
                '0 0 40px rgba(255, 0, 110, 0.9), 0 0 80px rgba(255, 0, 110, 0.6), 0 0 120px rgba(255, 0, 110, 0.3)'
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
              type: 'tween'
            }}
          >
            {currentLoad.toFixed(0)}
            <span className="text-6xl text-[#ff006e]/80 ml-4">KG</span>
          </motion.div>

          {/* Goal Marker */}
          <motion.div
            className="mt-6 text-2xl text-[#ff006e]/70 tracking-wider"
            animate={{
              opacity: currentLoad >= goalLoad ? [1, 0.5, 1] : 0.7
            }}
            transition={{
              duration: 0.5,
              repeat: currentLoad >= goalLoad ? Infinity : 0,
              type: 'tween'
            }}
          >
            GOAL: <span className="font-bold text-[#ff006e]">{goalLoad} KG</span>
            {currentLoad >= goalLoad && <span className="ml-3 text-3xl">✓</span>}
          </motion.div>
        </motion.div>

        {/* Core Mechanic: Hydraulic Press */}
        <motion.div
          className="w-full max-w-5xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <GlassCard className="p-8 border-[#ff006e]/50 bg-black/80 relative overflow-hidden">
            {/* Heavy pressure indicator */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ff006e] to-transparent opacity-60" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ff006e] to-transparent opacity-60" />

            <div className="text-center mb-8">
              <div className="text-2xl text-[#ff006e] tracking-wider uppercase font-bold"
                style={{
                  textShadow: '0 0 20px rgba(255,0,110,0.8)'
                }}
              >
                Hydraulic Force Meter
              </div>
            </div>

            {/* Hydraulic Press Container */}
            <div className="relative h-32 bg-black/60 rounded-2xl border-4 border-[#ff006e]/40 overflow-hidden">
              {/* Heavy metallic background texture */}
              <div className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    #ff006e 0px,
                    #ff006e 2px,
                    transparent 2px,
                    transparent 10px
                  )`
                }}
              />

              {/* Motion lines indicating grind */}
              <div className="absolute inset-0">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute left-0 h-0.5 bg-gradient-to-r from-[#ff006e]/40 to-transparent"
                    style={{
                      top: `${10 + i * 7}%`,
                      width: '60%'
                    }}
                    animate={{
                      x: [0, 20, 0],
                      opacity: [0.2, 0.6, 0.2]
                    }}
                    transition={{
                      duration: 2 + (i * 0.1),
                      repeat: Infinity,
                      ease: 'easeInOut',
                      type: 'tween',
                      delay: i * 0.1
                    }}
                  />
                ))}
              </div>

              {/* Hydraulic Press Piston - The main visual */}
              <motion.div
                className="absolute left-0 top-0 bottom-0 z-10 overflow-hidden"
                style={{
                  width: `${pressProgress}%`
                }}
                animate={{
                  boxShadow: [
                    '0 0 30px rgba(255, 0, 110, 0.6)',
                    '0 0 50px rgba(255, 0, 110, 1)',
                    '0 0 30px rgba(255, 0, 110, 0.6)'
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  type: 'tween'
                }}
              >
                {/* Piston fill */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#ff006e]/80 via-[#ff006e] to-[#ff006e]/80" />
                
                {/* Mechanical segments */}
                <div className="absolute inset-0"
                  style={{
                    backgroundImage: `repeating-linear-gradient(
                      90deg,
                      transparent 0px,
                      transparent 18px,
                      rgba(0, 0, 0, 0.3) 18px,
                      rgba(0, 0, 0, 0.3) 20px
                    )`
                  }}
                />

                {/* Glowing edge effect */}
                <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-r from-transparent to-white opacity-80" />
              </motion.div>

              {/* Piston Head - Leading edge */}
              <motion.div
                className="absolute top-0 bottom-0 w-12 z-20 border-r-4 border-[#ff006e]"
                style={{
                  left: `calc(${pressProgress}% - 24px)`,
                  background: 'linear-gradient(90deg, rgba(255,0,110,0.5), rgba(255,0,110,0.9), rgba(255,255,255,0.8))',
                  boxShadow: '0 0 40px rgba(255, 0, 110, 1), 0 0 80px rgba(255, 0, 110, 0.6)'
                }}
              >
                {/* Rivets */}
                <div className="absolute top-4 left-2 w-2 h-2 rounded-full bg-black/60 border border-[#ff006e]" />
                <div className="absolute top-1/2 left-2 -translate-y-1/2 w-2 h-2 rounded-full bg-black/60 border border-[#ff006e]" />
                <div className="absolute bottom-4 left-2 w-2 h-2 rounded-full bg-black/60 border border-[#ff006e]" />
                
                {/* Pressure indicator lines */}
                <div className="absolute top-1/4 right-0 w-8 h-0.5 bg-white/80" />
                <div className="absolute top-1/2 right-0 w-8 h-0.5 bg-white/80" />
                <div className="absolute top-3/4 right-0 w-8 h-0.5 bg-white/80" />
              </motion.div>

              {/* Percentage markers */}
              <div className="absolute -bottom-8 left-0 right-0 flex justify-between text-xs text-[#ff006e]/60 font-mono">
                <span>0 KG</span>
                <span className="opacity-50">25%</span>
                <span className="opacity-50">50%</span>
                <span className="opacity-50">75%</span>
                <span>{goalLoad} KG</span>
              </div>

              {/* Goal line marker */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white/40 z-5"
                style={{
                  left: '100%',
                  boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
                }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-white text-xs font-bold whitespace-nowrap">
                  TARGET
                </div>
              </div>
            </div>

            {/* Pressure Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-[#ff006e]/60 text-xs uppercase tracking-wider mb-1">Progress</div>
                <div className="text-3xl text-[#ff006e] font-bold font-mono">
                  {pressProgress.toFixed(0)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-[#ff006e]/60 text-xs uppercase tracking-wider mb-1">Time</div>
                <div className="text-3xl text-[#ff006e] font-bold font-mono">
                  {String(Math.floor(timeRemaining / 60)).padStart(2, '0')}:
                  {String(timeRemaining % 60).padStart(2, '0')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[#ff006e]/60 text-xs uppercase tracking-wider mb-1">To Goal</div>
                <div className="text-3xl text-[#ff006e] font-bold font-mono">
                  {Math.max(0, goalLoad - currentLoad).toFixed(0)} KG
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Strain Warning */}
        {strainIntensity > 0.8 && (
          <motion.div
            className="mt-8 flex items-center gap-3 px-6 py-3 bg-[#ff006e]/20 border-2 border-[#ff006e] rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: [0.7, 1, 0.7],
              y: 0
            }}
            transition={{ 
              opacity: { duration: 1, repeat: Infinity, type: 'tween' },
              y: { duration: 0.3, type: 'tween' }
            }}
          >
            <TrendingUp className="w-6 h-6 text-[#ff006e]" />
            <span className="text-[#ff006e] font-bold uppercase tracking-wider">
              Approaching Maximum Load
            </span>
          </motion.div>
        )}
      </div>

      {/* Emergency Exit Button */}
      <motion.button
        className="absolute top-6 right-6 z-30 px-4 py-2 border-2 border-[#ff006e]/40 bg-black/80 rounded-lg text-[#ff006e] hover:bg-[#ff006e]/10 transition-colors text-sm uppercase tracking-wider font-bold"
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
