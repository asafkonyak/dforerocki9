import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GlassCard } from '../components/GlassCard';
import { Zap, User, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router';

interface StrikeTarget {
  id: number;
  position: number; // 0-100
  active: boolean;
  hit: boolean;
}

export function ExplosiveBattleScreen() {
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [reactionTime, setReactionTime] = useState(0.0);
  const [strikeForce, setStrikeForce] = useState(0);
  const [spikesCompleted, setSpikesCompleted] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [strikeTargets, setStrikeTargets] = useState<StrikeTarget[]>([]);
  const [waveData, setWaveData] = useState<number[]>(Array(50).fill(50));
  const [flashScreen, setFlashScreen] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);

  // Simulate countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            alert(`Training Complete! 🏆 Spikes Completed: ${spikesCompleted}`);
            navigate('/training');
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, spikesCompleted]);

  // Generate random spike events
  useEffect(() => {
    const spikeInterval = setInterval(() => {
      // Random chance to trigger a spike (30% chance every 2-4 seconds)
      if (Math.random() > 0.5) {
        // Show warning
        setShowWarning(true);
        setGlitchActive(true);
        
        setTimeout(() => {
          setShowWarning(false);
          setGlitchActive(false);
          
          // Create strike target
          const newTarget: StrikeTarget = {
            id: Date.now(),
            position: 20 + Math.random() * 60, // Random position between 20-80%
            active: true,
            hit: false
          };
          
          setStrikeTargets(prev => [...prev, newTarget]);
          
          // Auto-hit after random reaction time (simulating user response)
          const reactionDelay = 200 + Math.random() * 600; // 0.2-0.8s
          setTimeout(() => {
            setReactionTime(reactionDelay / 1000);
            const force = 25 + Math.random() * 15; // 25-40 KG
            setStrikeForce(force);
            setFlashScreen(true);
            
            // Mark as hit
            setStrikeTargets(prev => 
              prev.map(t => t.id === newTarget.id ? { ...t, hit: true, active: false } : t)
            );
            
            setSpikesCompleted(prev => prev + 1);
            
            setTimeout(() => setFlashScreen(false), 100);
            
            // Remove target after animation
            setTimeout(() => {
              setStrikeTargets(prev => prev.filter(t => t.id !== newTarget.id));
            }, 1000);
          }, reactionDelay);
        }, 1500); // Warning shows for 1.5s before spike
      }
    }, 3000 + Math.random() * 2000); // Every 3-5 seconds

    return () => clearInterval(spikeInterval);
  }, []);

  // Animate seismic wave
  useEffect(() => {
    const waveInterval = setInterval(() => {
      setWaveData(prev => {
        const newWave = [...prev];
        newWave.shift();
        
        // More erratic when warning is active
        const variation = showWarning ? 30 : 10;
        const baseValue = showWarning ? 50 + (Math.random() - 0.5) * 40 : 50;
        newWave.push(baseValue + (Math.random() - 0.5) * variation);
        
        return newWave;
      });
    }, 100);

    return () => clearInterval(waveInterval);
  }, [showWarning]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-[#0a0515] via-[#1a0a2e] to-[#000000] relative flex flex-col">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full" 
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 0, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 0, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px'
          }}
        />
      </div>

      {/* Glitch Effect Overlay */}
      {glitchActive && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0, 0.2, 0] }}
          transition={{ duration: 0.5, type: 'tween' }}
        >
          <div className="absolute inset-0 bg-[#ffff00] mix-blend-overlay" 
            style={{
              clipPath: `polygon(0 ${Math.random() * 20}%, 100% ${Math.random() * 20}%, 100% ${20 + Math.random() * 20}%, 0 ${20 + Math.random() * 20}%)`
            }}
          />
          <div className="absolute inset-0 bg-[#ffff00] mix-blend-overlay" 
            style={{
              clipPath: `polygon(0 ${60 + Math.random() * 20}%, 100% ${60 + Math.random() * 20}%, 100% ${80 + Math.random() * 20}%, 0 ${80 + Math.random() * 20}%)`
            }}
          />
        </motion.div>
      )}

      {/* Flash Screen Effect */}
      {flashScreen && (
        <motion.div
          className="absolute inset-0 bg-[#ffff00] pointer-events-none z-40"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.2, type: 'tween' }}
        />
      )}

      {/* Jagged Voltage Lines */}
      <svg className="absolute inset-0 pointer-events-none z-10 opacity-20" style={{ width: '100%', height: '100%' }}>
        <motion.path
          d={`M 0,${100 + Math.random() * 50} L 100,${150 + Math.random() * 50} L 200,${80 + Math.random() * 50} L 300,${120 + Math.random() * 50}`}
          stroke="#ffff00"
          strokeWidth="2"
          fill="none"
          animate={{
            d: [
              `M 0,100 L 100,150 L 200,80 L 300,120`,
              `M 0,120 L 100,90 L 200,140 L 300,100`,
              `M 0,140 L 100,110 L 200,70 L 300,130`,
              `M 0,100 L 100,150 L 200,80 L 300,120`
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
            type: 'tween'
          }}
        />
        <motion.path
          d={`M 0,${300 + Math.random() * 50} L 150,${250 + Math.random() * 50} L 300,${280 + Math.random() * 50}`}
          stroke="#ffff00"
          strokeWidth="1"
          fill="none"
          opacity="0.5"
          animate={{
            d: [
              `M 0,300 L 150,250 L 300,280`,
              `M 0,280 L 150,310 L 300,260`,
              `M 0,300 L 150,250 L 300,280`
            ]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
            type: 'tween'
          }}
        />
      </svg>

      {/* Scanline Effect - Faster and more erratic */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          backgroundImage: 'linear-gradient(0deg, transparent 50%, rgba(255, 255, 0, 0.2) 50%)',
          backgroundSize: '100% 3px'
        }}
        animate={{
          backgroundPositionY: ['0px', '3px']
        }}
        transition={{
          duration: 0.05,
          repeat: Infinity,
          ease: 'linear',
          type: 'tween'
        }}
      />

      {/* Top-Left: Opponent (Spark Droid) Live Feed */}
      <motion.div
        className="absolute top-6 left-6 z-20"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <GlassCard className="p-4 w-64 border-[#ffff00]/40 bg-black/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-xs uppercase tracking-wider text-[#ffff00]/70 font-bold">Opponent</div>
            <motion.div 
              className="h-2 w-2 rounded-full bg-[#ffff00]"
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', type: 'tween' }}
            />
            <div className="text-xs text-[#ffff00] font-bold">LIVE</div>
          </div>
          
          {/* Video Feed Simulation */}
          <div className="relative aspect-video bg-black rounded-lg border-2 border-[#ffff00]/30 overflow-hidden mb-3">
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-20 h-20 rounded-full bg-[#ffff00]/30 flex items-center justify-center border-2 border-[#ffff00]"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(255,255,0,0.4)', 
                    '0 0 40px rgba(255,255,0,0.9)', 
                    '0 0 20px rgba(255,255,0,0.4)'
                  ]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  type: 'tween'
                }}
              >
                <Zap className="w-10 h-10 text-[#ffff00]" />
              </motion.div>
            </div>
            
            {/* Electric particles */}
            {showWarning && (
              <>
                <motion.div
                  className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#ffff00] rounded-full"
                  animate={{
                    x: [0, 20, -10, 0],
                    y: [0, -15, 10, 0],
                    opacity: [1, 0.5, 1]
                  }}
                  transition={{ duration: 0.5, repeat: Infinity, type: 'tween' }}
                />
                <motion.div
                  className="absolute top-1/2 right-1/4 w-2 h-2 bg-[#ffff00] rounded-full"
                  animate={{
                    x: [0, -20, 10, 0],
                    y: [0, 15, -10, 0],
                    opacity: [1, 0.5, 1]
                  }}
                  transition={{ duration: 0.5, repeat: Infinity, type: 'tween', delay: 0.2 }}
                />
              </>
            )}
          </div>

          {/* Bot Info */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[#ffff00] font-bold">SPARK</div>
              <div className="text-xs text-white/60">Explosive Protocol</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#ffff00]/60">Energy</div>
              <motion.div 
                className="text-xs text-[#ffff00] font-bold"
                animate={{ opacity: showWarning ? [1, 0.5, 1] : 1 }}
                transition={{ duration: 0.3, repeat: showWarning ? Infinity : 0, type: 'tween' }}
              >
                {showWarning ? 'CHARGING!' : 'Ready'}
              </motion.div>
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
        <GlassCard className="p-4 w-64 border-[#ffff00]/40 bg-black/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-xs uppercase tracking-wider text-[#ffff00]/70 font-bold">You</div>
            <motion.div 
              className="h-2 w-2 rounded-full bg-[#ffff00]"
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', type: 'tween' }}
            />
            <div className="text-xs text-[#ffff00] font-bold">LIVE</div>
          </div>
          
          {/* Video Feed Simulation */}
          <div className="relative aspect-video bg-black rounded-lg border-2 border-[#ffff00]/30 overflow-hidden mb-3">
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-20 h-20 rounded-full bg-[#ffff00]/30 flex items-center justify-center border-2 border-[#ffff00]"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(255,255,0,0.4)', 
                    '0 0 40px rgba(255,255,0,0.9)', 
                    '0 0 20px rgba(255,255,0,0.4)'
                  ]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  type: 'tween',
                  delay: 0.5
                }}
              >
                <User className="w-10 h-10 text-[#ffff00]" />
              </motion.div>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[#ffff00] font-bold">PLAYER-01</div>
              <div className="text-xs text-white/60">Challenger</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#ffff00]/60">Spikes Hit</div>
              <div className="text-xs text-[#ffff00] font-bold">{spikesCompleted}</div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Center Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-12 relative z-10">
        
        {/* WARNING Banner */}
        {showWarning && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0.8, 1.1, 1, 1],
              y: [-20, 0, 0, 0]
            }}
            transition={{ duration: 1.5, type: 'tween' }}
          >
            <div className="relative">
              <motion.div
                className="text-center px-12 py-6 bg-black border-4 border-[#ffff00] rounded-lg"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(255,255,0,0.6)',
                    '0 0 40px rgba(255,255,0,1)',
                    '0 0 20px rgba(255,255,0,0.6)'
                  ]
                }}
                transition={{ duration: 0.5, repeat: Infinity, type: 'tween' }}
              >
                <div className="flex items-center gap-4 justify-center">
                  <AlertTriangle className="w-12 h-12 text-[#ffff00]" />
                  <div className="text-5xl font-bold text-[#ffff00] tracking-wider uppercase"
                    style={{
                      textShadow: '0 0 30px rgba(255,255,0,1), 0 0 60px rgba(255,255,0,0.8)'
                    }}
                  >
                    WARNING: INCOMING SPIKE!
                  </div>
                  <AlertTriangle className="w-12 h-12 text-[#ffff00]" />
                </div>
              </motion.div>
              
              {/* Corner brackets */}
              <div className="absolute -top-2 -left-2 w-12 h-12 border-t-4 border-l-4 border-[#ffff00]" />
              <div className="absolute -top-2 -right-2 w-12 h-12 border-t-4 border-r-4 border-[#ffff00]" />
              <div className="absolute -bottom-2 -left-2 w-12 h-12 border-b-4 border-l-4 border-[#ffff00]" />
              <div className="absolute -bottom-2 -right-2 w-12 h-12 border-b-4 border-r-4 border-[#ffff00]" />
            </div>
          </motion.div>
        )}

        {/* Core Mechanic: Seismic Wave Gauge with Strike Targets */}
        <motion.div
          className="w-full max-w-5xl mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <GlassCard className="p-8 border-[#ffff00]/40 bg-black/70">
            {/* Gauge Label */}
            <div className="text-center mb-6">
              <div className="text-2xl text-[#ffff00] tracking-wider uppercase font-bold"
                style={{
                  textShadow: '0 0 20px rgba(255,255,0,0.8)'
                }}
              >
                Neural Response Monitor
              </div>
            </div>

            {/* Seismic Wave Container */}
            <div className="relative h-40 bg-black rounded-lg border-2 border-[#ffff00]/30 overflow-hidden">
              {/* Grid lines */}
              <div className="absolute inset-0">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i}
                    className="absolute left-0 right-0 border-t border-[#ffff00]/10"
                    style={{ top: `${i * 25}%` }}
                  />
                ))}
              </div>

              {/* Seismic Wave Line */}
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <motion.polyline
                  fill="none"
                  stroke="#ffff00"
                  strokeWidth="3"
                  points={waveData.map((value, index) => 
                    `${(index / waveData.length) * 100},${value}`
                  ).join(' ')}
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(255,255,0,0.8))'
                  }}
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              {/* Strike Targets */}
              {strikeTargets.map(target => (
                <motion.div
                  key={target.id}
                  className="absolute top-0 bottom-0 z-20"
                  style={{ left: `${target.position}%` }}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ 
                    opacity: target.active ? 1 : 0,
                    scaleY: target.active ? 1 : 0
                  }}
                  transition={{ duration: 0.2, type: 'tween' }}
                >
                  {/* Target zone indicator */}
                  <div className="relative h-full w-16 -translate-x-1/2">
                    {/* Background highlight */}
                    <motion.div
                      className="absolute inset-0 bg-[#ffff00]/20 border-x-2 border-[#ffff00]"
                      animate={{
                        boxShadow: target.active
                          ? [
                              '0 0 20px rgba(255,255,0,0.6)',
                              '0 0 40px rgba(255,255,0,1)',
                              '0 0 20px rgba(255,255,0,0.6)'
                            ]
                          : 'none'
                      }}
                      transition={{ duration: 0.5, repeat: Infinity, type: 'tween' }}
                    />
                    
                    {/* Crosshair */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        className="w-12 h-12 border-4 border-[#ffff00] rounded-full flex items-center justify-center"
                        animate={target.hit ? {
                          scale: [1, 1.5, 0],
                          opacity: [1, 0.5, 0]
                        } : {}}
                        transition={{ duration: 0.5, type: 'tween' }}
                      >
                        {!target.hit && (
                          <>
                            <div className="absolute w-full h-0.5 bg-[#ffff00]" />
                            <div className="absolute h-full w-0.5 bg-[#ffff00]" />
                          </>
                        )}
                        {target.hit && (
                          <div className="text-[#ffff00] text-2xl font-bold">✓</div>
                        )}
                      </motion.div>
                    </div>

                    {/* Target label */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[#ffff00] text-xs font-bold uppercase whitespace-nowrap">
                      Strike!
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Dynamic Metrics */}
        <div className="grid grid-cols-3 gap-6 max-w-5xl w-full">
          {/* Timer */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <GlassCard className="p-6 border-[#ffff00]/40 bg-black/70 text-center">
              <div className="text-[#ffff00]/60 text-xs uppercase tracking-wider mb-2">Time</div>
              <motion.div
                className="text-4xl font-mono text-[#ffff00] tabular-nums font-bold"
                style={{
                  textShadow: '0 0 20px rgba(255, 255, 0, 0.8)'
                }}
              >
                {String(Math.floor(timeRemaining / 60)).padStart(2, '0')}:
                {String(timeRemaining % 60).padStart(2, '0')}
              </motion.div>
            </GlassCard>
          </motion.div>

          {/* Reaction Time */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <GlassCard className="p-6 border-[#ffff00]/40 bg-black/70 text-center">
              <div className="text-[#ffff00]/60 text-xs uppercase tracking-wider mb-2">Reaction Time</div>
              <motion.div
                className="text-4xl font-mono text-[#ffff00] tabular-nums font-bold"
                style={{
                  textShadow: '0 0 20px rgba(255, 255, 0, 0.8)'
                }}
                animate={flashScreen ? {
                  scale: [1, 1.2, 1],
                  textShadow: [
                    '0 0 20px rgba(255, 255, 0, 0.8)',
                    '0 0 40px rgba(255, 255, 0, 1)',
                    '0 0 20px rgba(255, 255, 0, 0.8)'
                  ]
                } : {}}
                transition={{ duration: 0.3, type: 'tween' }}
              >
                {reactionTime.toFixed(2)}<span className="text-xl">s</span>
              </motion.div>
            </GlassCard>
          </motion.div>

          {/* Strike Force */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <GlassCard className="p-6 border-[#ffff00]/40 bg-black/70 text-center">
              <div className="text-[#ffff00]/60 text-xs uppercase tracking-wider mb-2">Strike Force</div>
              <motion.div
                className="text-4xl font-mono text-[#ffff00] tabular-nums font-bold"
                style={{
                  textShadow: '0 0 20px rgba(255, 255, 0, 0.8)'
                }}
                animate={flashScreen ? {
                  scale: [1, 1.2, 1],
                  textShadow: [
                    '0 0 20px rgba(255, 255, 0, 0.8)',
                    '0 0 40px rgba(255, 255, 0, 1)',
                    '0 0 20px rgba(255, 255, 0, 0.8)'
                  ]
                } : {}}
                transition={{ duration: 0.3, type: 'tween' }}
              >
                {strikeForce.toFixed(0)}<span className="text-xl">KG</span>
              </motion.div>
            </GlassCard>
          </motion.div>
        </div>
      </div>

      {/* Emergency Exit Button */}
      <motion.button
        className="absolute top-6 right-6 z-30 px-4 py-2 border-2 border-[#ffff00]/40 bg-black/60 rounded-lg text-[#ffff00] hover:bg-[#ffff00]/10 transition-colors text-sm uppercase tracking-wider font-bold"
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
