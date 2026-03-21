import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { GlassCard } from '../components/GlassCard';
import { Skull, Zap, Clock, TrendingUp, Award, ChevronRight, Sparkles } from 'lucide-react';
import { useGlobalAudio } from '../../contexts/AudioContext';

export function VictoryAnalyticsScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { playWinSound } = useGlobalAudio();
  const [animateMetrics, setAnimateMetrics] = useState(false);
  const [animateCharts, setAnimateCharts] = useState(false);

  // Get data from navigation state or use defaults
  const matchData = location.state || {
    isWin: true,
    peakForce: 68,
    enduranceTime: 45,
    xpEarned: 500,
    stageName: 'CRUSHER X-9000',
    stageNumber: 4,
  };

  const isWin = matchData.isWin ?? true;

  useEffect(() => {
    if (isWin) {
      playWinSound();
    }

    // Trigger animations sequentially
    const metricsTimer = setTimeout(() => setAnimateMetrics(true), 500);
    const chartsTimer = setTimeout(() => setAnimateCharts(true), 1000);

    return () => {
      clearTimeout(metricsTimer);
      clearTimeout(chartsTimer);
    };
  }, []);

  // Simulate force data over time for the chart
  const forceData = [
    { time: 0, force: 0 },
    { time: 5, force: 25 },
    { time: 10, force: 42 },
    { time: 15, force: 38 },
    { time: 20, force: 55 },
    { time: 25, force: 68 }, // Peak
    { time: 30, force: 52 },
    { time: 35, force: 45 },
    { time: 40, force: 48 },
    { time: 45, force: isWin ? 60 : 20 }, // Victory or Defeat moment
  ];

  const maxForce = Math.max(...forceData.map(d => d.force));

  return (
    <div className="h-screen bg-[#0a0515] relative overflow-hidden flex flex-col">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${isWin ? 'from-[#00f0ff]/20 via-[#0a0515] to-[#ffaa00]/20' : 'from-[#ff0033]/20 via-[#0a0515] to-[#770000]/20'}`}
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            type: 'tween',
          }}
        />

        {/* Energy blobs */}
        <motion.div
          className={`absolute w-96 h-96 ${isWin ? 'bg-[#00f0ff]' : 'bg-[#ff0044]'} rounded-full blur-[120px]`}
          animate={{
            x: ['-20%', '20%', '-20%'],
            y: ['0%', '30%', '0%'],
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            type: 'tween',
          }}
          style={{ top: '10%', left: '20%' }}
        />

        <motion.div
          className={`absolute w-96 h-96 ${isWin ? 'bg-[#ffaa00]' : 'bg-[#990000]'} rounded-full blur-[120px]`}
          animate={{
            x: ['20%', '-20%', '20%'],
            y: ['0%', '-30%', '0%'],
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            type: 'tween',
            delay: 1,
          }}
          style={{ bottom: '10%', right: '20%' }}
        />
      </div>

      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(${isWin ? '#00f0ff' : '#ff0033'} 1px, transparent 1px),
            linear-gradient(90deg, ${isWin ? '#00f0ff' : '#ff0033'} 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-1 h-1 ${isWin ? 'bg-[#00f0ff]' : 'bg-[#ff4444]'} rounded-full`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
            type: 'tween',
          }}
        />
      ))}

      {/* Header */}
      <div className="relative z-10 py-4 px-6 flex-shrink-0">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
        >
          {/* Status Icon */}
          <motion.div
            className="flex justify-center mb-6"
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 1, type: 'spring', bounce: 0.6 }}
          >
            <div className="relative">
              {isWin ? (
                <Award className="w-24 h-24 text-[#ffaa00]" strokeWidth={1.5} />
              ) : (
                <Skull className="w-24 h-24 text-[#ff0033]" strokeWidth={1.5} />
              )}
              
              {/* Radiating rings */}
              <motion.div
                className="absolute inset-0"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.8, 0, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  type: 'tween',
                }}
              >
                <div className={`w-full h-full border-4 ${isWin ? 'border-[#ffaa00]' : 'border-[#ff0033]'} rounded-full`} />
              </motion.div>
            </div>
          </motion.div>

          <motion.h1 
            className="text-5xl md:text-6xl font-bold mb-2"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              background: isWin 
                ? 'linear-gradient(to right, #00f0ff, #00ffff)' 
                : 'linear-gradient(to right, #ff0033, #ff4444)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            animate={{
              textShadow: isWin ? [
                '0 0 40px rgba(0, 240, 255, 0.8)',
                '0 0 80px rgba(0, 240, 255, 1)',
                '0 0 40px rgba(0, 240, 255, 0.8)',
              ] : [
                '0 0 40px rgba(255, 0, 51, 0.8)',
                '0 0 80px rgba(255, 0, 51, 1)',
                '0 0 40px rgba(255, 0, 51, 0.8)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              type: 'tween',
            }}
          >
            {isWin ? 'TARGET DEFEATED' : 'MISSION FAILED'}
          </motion.h1>

          <motion.p
            className="text-white/80 text-xl uppercase tracking-widest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Stage {matchData.stageNumber}: {matchData.stageName}
          </motion.p>
        </motion.div>
      </div>

      {/* Center Content - Analytics Card with improved overflow */}
      <div className="relative z-10 flex-1 overflow-y-auto min-h-0 px-4 md:px-12">
        <div className="flex flex-col items-center py-8">
          <motion.div
            className="w-full max-w-6xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
          <GlassCard className="p-6 border-4 border-[#00f0ff] bg-gradient-to-br from-[#00f0ff]/20 to-[#ffaa00]/10 shadow-[0_0_60px_rgba(0,240,255,0.8)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Metrics & Defeated Icon */}
              <div className="space-y-4">
                <div className="flex flex-col items-center">
                  <div className={`w-full aspect-video rounded-2xl overflow-hidden border-4 ${isWin ? 'border-[#00f0ff] shadow-[0_0_30px_#00f0ff]' : 'border-[#ff0033] shadow-[0_0_30px_#ff0033]'} bg-black relative mb-6`}>
                    <video
                      key={matchData.stageNumber}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    >
                      <source 
                        src={
                          matchData.stageNumber === 1 ? '/assets/robots/stage1_postfight.mp4' :
                          matchData.stageNumber === 2 ? `/assets/robots/stage2.mp4` :
                          matchData.stageNumber === 5 ? '/assets/robots/stage5_postfight.mp4' :
                          `/assets/robots/stage${matchData.stageNumber}.mp4`
                        } 
                        type="video/mp4" 
                      />
                    </video>
                    
                    {/* Scanning overlay */}
                    <motion.div
                      className={`absolute inset-x-0 h-1 bg-${isWin ? '[#00f0ff]' : '[#ff0033]'}`}
                      animate={{
                        y: ['0%', '400%'],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  </div>

                  <div className="text-center mb-4">
                    <h3 className={`text-${isWin ? '[#00f0ff]' : '[#ff0033]'}/60 text-sm uppercase tracking-widest mb-2`}>Mission Status</h3>
                    <p className={`text-4xl font-black italic text-${isWin ? '[#00f0ff]' : '[#ff0033]'}`} style={{ fontFamily: "'Orbitron', sans-serif" }}>
                      {isWin ? 'TARGET ELIMINATED' : 'TARGET ESCAPED'}
                    </p>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="space-y-4">
                  {/* Peak Force */}
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={animateMetrics ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.6 }}
                  >
                    <GlassCard className="p-4 border-2 border-[#ffaa00]/40 bg-[#ffaa00]/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Zap className="w-6 h-6 text-[#ffaa00]" />
                          <span className="text-white/60 text-sm uppercase tracking-wider">Peak Force</span>
                        </div>
                        <motion.span 
                          className={`text-3xl font-bold ${isWin ? 'text-[#ffaa00]' : 'text-[#ff4444]'}`}
                          style={{ fontFamily: "'Orbitron', monospace" }}
                          initial={{ scale: 0 }}
                          animate={animateMetrics ? { scale: 1 } : {}}
                          transition={{ delay: 0.8, type: 'spring', bounce: 0.6 }}
                        >
                          {matchData.peakForce} KG
                        </motion.span>
                      </div>
                      {/* Force bar */}
                      <div className="mt-3 h-2 bg-black/50 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full bg-gradient-to-r ${isWin ? 'from-[#ffaa00] to-[#ff6600] shadow-[0_0_10px_#ffaa00]' : 'from-[#ff0033] to-[#ff4444] shadow-[0_0_10px_#ff0033]'}`}
                            initial={{ width: '0%' }}
                            animate={animateMetrics ? { width: `${(matchData.peakForce / 100) * 100}%` } : {}}
                            transition={{ delay: 0.9, duration: 1, ease: 'easeOut' }}
                          />
                      </div>
                    </GlassCard>
                  </motion.div>

                  {/* Endurance Time */}
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={animateMetrics ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.8 }}
                  >
                    <GlassCard className="p-4 border-2 border-[#00f0ff]/40 bg-[#00f0ff]/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="w-6 h-6 text-[#00f0ff]" />
                          <span className="text-white/60 text-sm uppercase tracking-wider">Endurance Time</span>
                        </div>
                        <motion.span 
                          className={`text-3xl font-bold ${isWin ? 'text-[#00f0ff]' : 'text-[#ff4444]'}`}
                          style={{ fontFamily: "'Orbitron', monospace" }}
                          initial={{ scale: 0 }}
                          animate={animateMetrics ? { scale: 1 } : {}}
                          transition={{ delay: 1.0, type: 'spring', bounce: 0.6 }}
                        >
                          {matchData.enduranceTime}s
                        </motion.span>
                      </div>
                      {/* Time bar */}
                      <div className="mt-3 h-2 bg-black/50 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full bg-gradient-to-r ${isWin ? 'from-[#00f0ff] to-[#00ffff] shadow-[0_0_10px_#00f0ff]' : 'from-[#ff0033] to-[#ff4444] shadow-[0_0_10px_#ff4444]'}`}
                            initial={{ width: '0%' }}
                            animate={animateMetrics ? { width: `${(matchData.enduranceTime / 60) * 100}%` } : {}}
                            transition={{ delay: 1.1, duration: 1, ease: 'easeOut' }}
                          />
                      </div>
                    </GlassCard>
                  </motion.div>

                  {/* XP Earned */}
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={animateMetrics ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 1.0 }}
                  >
                    <GlassCard className="p-4 border-2 border-[#00f0ff]/40 bg-gradient-to-r from-[#00f0ff]/10 to-[#ffaa00]/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="w-6 h-6 text-[#ffaa00]" />
                          <span className="text-white/60 text-sm uppercase tracking-wider">XP Earned</span>
                        </div>
                        <motion.div
                          className="flex items-center gap-2"
                          initial={{ scale: 0 }}
                          animate={animateMetrics ? { scale: 1 } : {}}
                          transition={{ delay: 1.2, type: 'spring', bounce: 0.6 }}
                        >
                          <Sparkles className="w-6 h-6 text-[#ffaa00]" />
                            <span 
                              className={`text-3xl font-bold ${isWin ? 'text-[#ffaa00]' : 'text-white/40'}`}
                              style={{ fontFamily: "'Orbitron', monospace" }}
                            >
                              {isWin ? `+${matchData.xpEarned}` : '+0'}
                            </span>
                        </motion.div>
                      </div>
                    </GlassCard>
                  </motion.div>
                </div>
              </div>

              {/* Right Column - Force Over Time Chart */}
              <div>
                <h3 className="text-white text-xl font-bold mb-4 uppercase tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  Force Analysis
                </h3>
                
                <GlassCard className="p-4 border-2 border-[#00f0ff]/30 bg-black/40 h-[220px] md:h-[280px]">
                  <div className="relative h-full">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-white/40 pr-2">
                      <span>{maxForce} KG</span>
                      <span>{Math.round(maxForce * 0.75)} KG</span>
                      <span>{Math.round(maxForce * 0.5)} KG</span>
                      <span>{Math.round(maxForce * 0.25)} KG</span>
                      <span>0 KG</span>
                    </div>

                    {/* Chart area */}
                    <div className="absolute left-12 right-0 top-0 bottom-8">
                      {/* Grid lines */}
                      <div className="absolute inset-0">
                        {[0, 25, 50, 75, 100].map((percent) => (
                          <div
                            key={percent}
                            className="absolute left-0 right-0 border-t border-white/5"
                            style={{ top: `${percent}%` }}
                          />
                        ))}
                      </div>

                      {/* Force line chart */}
                      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="forceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: isWin ? '#00f0ff' : '#ff0033', stopOpacity: 0.8 }} />
                            <stop offset="50%" style={{ stopColor: isWin ? '#ffaa00' : '#ff4444', stopOpacity: 0.6 }} />
                            <stop offset="100%" style={{ stopColor: isWin ? '#00f0ff' : '#ff0033', stopOpacity: 0.4 }} />
                          </linearGradient>

                          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: isWin ? '#00f0ff' : '#ff0033', stopOpacity: 0.3 }} />
                            <stop offset="100%" style={{ stopColor: isWin ? '#00f0ff' : '#ff0033', stopOpacity: 0 }} />
                          </linearGradient>
                        </defs>

                        {/* Area under the curve */}
                        <motion.path
                          d={`
                            M 0,100
                            ${forceData.map((d, i) => {
                              const x = (i / (forceData.length - 1)) * 100;
                              const y = 100 - (d.force / maxForce) * 100;
                              return `L ${x},${y}`;
                            }).join(' ')}
                            L 100,100
                            Z
                          `}
                          fill="url(#areaGradient)"
                          vectorEffect="non-scaling-stroke"
                          initial={{ opacity: 0 }}
                          animate={animateCharts ? { opacity: 1 } : {}}
                          transition={{ delay: 0.5, duration: 0.8 }}
                        />

                        {/* Line */}
                        <motion.polyline
                          points={forceData.map((d, i) => {
                            const x = (i / (forceData.length - 1)) * 100;
                            const y = 100 - (d.force / maxForce) * 100;
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="url(#forceGradient)"
                          strokeWidth="3"
                          vectorEffect="non-scaling-stroke"
                          initial={{ pathLength: 0 }}
                          animate={animateCharts ? { pathLength: 1 } : {}}
                          transition={{ delay: 0.3, duration: 1.5, ease: 'easeInOut' }}
                          style={{ filter: 'drop-shadow(0 0 8px rgba(0, 240, 255, 0.6))' }}
                        />

                        {/* Data points */}
                        {forceData.map((d, i) => {
                          const x = (i / (forceData.length - 1)) * 100;
                          const y = 100 - (d.force / maxForce) * 100;
                          const isPeak = d.force === maxForce;
                          
                          return (
                            <motion.circle
                              key={i}
                              cx={`${x}%`}
                              cy={`${y}%`}
                              r={isPeak ? "5" : "3"}
                              fill={isPeak ? (isWin ? '#ffaa00' : '#ff0033') : (isWin ? '#00f0ff' : '#ff4444')}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={animateCharts ? { scale: 1, opacity: 1 } : {}}
                              transition={{ delay: 0.3 + (i * 0.05), duration: 0.3 }}
                              style={{ filter: isPeak ? `drop-shadow(0 0 6px ${isWin ? '#ffaa00' : '#ff0033'})` : 'none' }}
                            />
                          );
                        })}
                      </svg>
                    </div>

                    {/* X-axis labels */}
                    <div className="absolute left-12 right-0 bottom-0 flex justify-between text-xs text-white/40">
                      <span>0s</span>
                      <span>15s</span>
                      <span>30s</span>
                      <span>45s</span>
                    </div>
                  </div>
                </GlassCard>

                {/* Chart Legend */}
                <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isWin ? 'bg-[#ffaa00] shadow-[0_0_8px_#ffaa00]' : 'bg-[#ff0033] shadow-[0_0_8px_#ff0033]'}`} />
                    <span className="text-white/60">Peak</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isWin ? 'bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]' : 'bg-[#ff4444] shadow-[0_0_8px_#ff4444]'}`} />
                    <span className="text-white/60">Current</span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>

      {/* Bottom CTA - Reduced padding and glow */}
      <div className="relative z-10 p-4 flex-shrink-0">
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
        >
          <motion.button
            className="w-full group relative overflow-hidden"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/gauntlet')}
          >
            <GlassCard className="p-4 border-2 border-[#00f0ff]/50 bg-gradient-to-r from-[#00f0ff]/10 to-transparent shadow-[0_0_30px_rgba(0,240,255,0.4)]">
              {/* Animated background sweep */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00f0ff]/40 to-transparent"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                  type: 'tween',
                }}
              />
              
              <div className="relative flex items-center justify-center gap-4">
                  <span 
                    className={`text-2xl md:text-3xl font-bold ${isWin ? 'text-[#00f0ff]' : 'text-[#ff4444]'}`}
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      textShadow: `0 0 20px ${isWin ? 'rgba(0, 240, 255, 1)' : 'rgba(255, 0, 51, 1)'}`,
                    }}
                  >
                    {isWin ? 'CONTINUE TO MAP' : 'RETURN TO MAP'}
                  </span>
                  <ChevronRight className={`w-8 h-8 ${isWin ? 'text-[#00f0ff]' : 'text-[#ff4444]'}`} />
              </div>
            </GlassCard>

            {/* Pulsing outer rings */}
            <motion.div
              className="absolute inset-0 border-4 border-[#00f0ff] rounded-2xl"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.6, 0, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                type: 'tween',
              }}
            />
            <motion.div
              className="absolute inset-0 border-4 border-[#00f0ff] rounded-2xl"
              animate={{
                scale: [1, 1.08, 1],
                opacity: [0.4, 0, 0.4],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 0.3,
                type: 'tween',
              }}
            />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
