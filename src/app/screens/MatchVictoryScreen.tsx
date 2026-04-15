import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { GlassCard } from '../components/GlassCard';
import { Skull, Zap, Clock, Award, ChevronRight } from 'lucide-react';
import { useGlobalAudio } from '../../contexts/AudioContext';

export function MatchVictoryScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { playWinSound, stopWinSound, startIntroMusic, stopMatch1v1SFX } = useGlobalAudio();
  const [animateCharts, setAnimateCharts] = useState(false);

  // Get data from navigation state or use defaults
  const matchData = location.state || {
    isWin: true,
    peakForce: 68,
    avgForce: 45,
    enduranceTime: 45,
    xpEarned: 500,
    stageName: 'MATCH RESULT',
    forceHistory: null,
  };

  const isWin = matchData.isWin ?? true;

  const formatTime = (totalSeconds: number) => {
    if (!totalSeconds || isNaN(totalSeconds)) return "00.00";
    return totalSeconds.toFixed(2);
  };

  useEffect(() => {
    // Stop the match-specific audio and play success fanfare
    stopMatch1v1SFX();
    if (isWin) {
      playWinSound();
    }

    // Memory management for video URL
    return () => {
      if (matchData.videoUrl && matchData.videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(matchData.videoUrl);
      }
      if (matchData.rivalVideoUrl && matchData.rivalVideoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(matchData.rivalVideoUrl);
      }
    };
  }, []);

  useEffect(() => {
    const chartsTimer = setTimeout(() => setAnimateCharts(true), 1000);
    return () => clearTimeout(chartsTimer);
  }, []);

  const forceData = matchData.forceHistory && matchData.forceHistory.length > 0 
    ? matchData.forceHistory 
    : [
      { time: 0, force: 0 },
      { time: 5, force: 25 },
      { time: 10, force: 42 },
      { time: 15, force: 38 },
      { time: 20, force: 55 },
      { time: 25, force: matchData.peakForce || 68 },
      { time: 30, force: 52 },
      { time: 35, force: 45 },
      { time: 40, force: 48 },
      { time: 45, force: isWin ? 60 : 20 },
    ];

  const maxForceRaw = Math.max(...forceData.map((d: any) => d.force));
  const minForceRaw = Math.min(...forceData.map((d: any) => d.force));
  const maxForce = Math.max(1, maxForceRaw);
  const minForce = Math.min(0, minForceRaw);
  const forceRange = (maxForce - minForce) || 1;

  return (
    <div className="h-screen bg-[#0a0515] relative overflow-hidden flex flex-col">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${isWin ? 'from-[#00f0ff]/20 via-[#0a0515] to-[#ffaa00]/20' : 'from-[#ff0033]/20 via-[#0a0515] to-[#770000]/20'}`}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, type: 'tween' }}
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

      {/* Header */}
      <div className="relative z-10 py-6 px-6 flex-shrink-0">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
        >
          <motion.div className="flex justify-center mb-4">
            <div className="relative">
              {isWin ? (
                <Award className="w-20 h-20 text-[#ffaa00]" strokeWidth={1.5} />
              ) : (
                <Skull className="w-20 h-20 text-[#ff0033]" strokeWidth={1.5} />
              )}
            </div>
          </motion.div>

          <motion.h1 
            className="text-5xl md:text-6xl font-black italic mb-2 tracking-tighter"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              background: isWin 
                ? 'linear-gradient(to right, #00f0ff, #00ffff)' 
                : 'linear-gradient(to right, #ff0033, #ff4444)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {isWin ? 'VICTORY SECURED' : 'TRY AGAIN'}
          </motion.h1>

          <p className="text-white/40 font-black uppercase tracking-[0.5em] text-sm">MATCH ANALYSIS COMPLETE</p>
        </motion.div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 overflow-hidden min-h-0 px-12 flex flex-col justify-center pb-12">
        <motion.div
          className="w-full max-w-[90vw] 2xl:max-w-[1600px] mx-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <GlassCard className={`p-8 border-4 ${isWin ? 'border-[#00f0ff]/40 shadow-[0_0_50px_rgba(0,240,255,0.2)]' : 'border-[#ff0033]/40 shadow-[0_0_50px_rgba(255,0,51,0.2)]'} bg-black/60`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              
              {/* Left Side: Video Replay */}
              <div className="flex flex-col gap-6">
                <div className={`w-full aspect-video rounded-3xl overflow-hidden border-4 ${isWin ? 'border-[#00f0ff]' : 'border-[#ff0033]'} bg-black relative shadow-2xl`}>
                  <div className="absolute inset-0 grid grid-cols-2">
                    {/* Player Camera */}
                    <div className="relative border-r-2 border-white/20 h-full w-full">
                      {matchData.videoUrl ? (
                        <video
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="w-full h-full object-cover"
                          src={matchData.videoUrl}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/10 uppercase font-black tracking-widest italic bg-black/50">
                          No Feed
                        </div>
                      )}
                      <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-lg border border-white/10">
                        <span className="text-[10px] text-white font-black tracking-[0.2em] uppercase">YOU</span>
                      </div>
                    </div>
                    
                    {/* Rival Camera */}
                    <div className="relative h-full w-full">
                      {matchData.rivalVideoUrl ? (
                        <video
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="w-full h-full object-cover"
                          src={matchData.rivalVideoUrl}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/10 uppercase font-black tracking-widest italic bg-black/50">
                          No Feed
                        </div>
                      )}
                      <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded-lg border border-white/10">
                        <span className="text-[10px] text-white font-black tracking-[0.2em] uppercase">RIVAL</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Replay Overlay */}
                  <div className="absolute top-4 left-4 bg-black/80 px-4 py-2 rounded-xl border border-white/20 flex items-center gap-3 shadow-lg z-30">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] text-white font-black tracking-[0.3em] uppercase">BATTLE REPLAY</span>
                  </div>

                  {/* Scanning Line */}
                  <motion.div
                    className={`absolute inset-x-0 h-1 bg-${isWin ? '[#00f0ff]' : '[#ff0033]'} z-20 shadow-[0_0_15px_#00f0ff] pointer-events-none`}
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              </div>

              {/* Right Side: Chart & Metrics */}
              <div className="flex flex-col gap-8 justify-center">
                <div className="flex flex-col gap-2">
                   <h3 className="text-white/60 text-xs font-black tracking-[0.4em] uppercase italic">Force Trajectory</h3>
                   <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        className={`h-full bg-gradient-to-r ${isWin ? 'from-[#00f0ff] to-[#00ffff]' : 'from-[#ff0033] to-[#ff4444]'}`}
                        initial={{ width: 0 }}
                        animate={animateCharts ? { width: '100%' } : {}}
                        transition={{ duration: 2 }}
                      />
                   </div>
                </div>

                <GlassCard className="p-6 border border-white/5 bg-black/40 h-[240px] xl:h-[320px] relative">
                  <div className="relative h-full pt-4">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="matchLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor={isWin ? "#00f0ff" : "#ff0033"} />
                          <stop offset="100%" stopColor={isWin ? "#ffaa00" : "#ff4444"} />
                        </linearGradient>
                        <linearGradient id="matchAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={isWin ? "#00f0ff" : "#ff0033"} stopOpacity="0.4" />
                          <stop offset="100%" stopColor={isWin ? "#00f0ff" : "#ff0033"} stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <motion.path
                        d={`M 0,100 ${forceData.map((d: any, i: number) => `L ${(i / (forceData.length - 1)) * 100},${100 - ((d.force - minForce) / forceRange) * 100}`).join(' ')} L 100,100 Z`}
                        fill="url(#matchAreaGrad)"
                        initial={{ opacity: 0 }}
                        animate={animateCharts ? { opacity: 1 } : {}}
                        transition={{ duration: 1.5 }}
                      />
                      <motion.polyline
                        points={forceData.map((d: any, i: number) => `${(i / (forceData.length - 1)) * 100},${100 - ((d.force - minForce) / forceRange) * 100}`).join(' ')}
                        fill="none"
                        stroke="url(#matchLineGrad)"
                        strokeWidth="3"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                        initial={{ pathLength: 0 }}
                        animate={animateCharts ? { pathLength: 1 } : {}}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                      />
                    </svg>
                    
                    <div className="absolute inset-x-0 bottom-0 flex justify-between text-[10px] text-white/20 font-black uppercase tracking-[.3em] pt-4">
                      <span>Start</span>
                      <span>Phase Shift</span>
                      <span>Resolved ({Math.round(matchData.enduranceTime)}s)</span>
                    </div>
                  </div>
                </GlassCard>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                    <p className="text-white/30 text-[9px] font-black tracking-widest uppercase mb-1">Peak Impact</p>
                    <p className="text-4xl font-black italic text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                      {Number(matchData.peakForce).toFixed(2)} <span className="text-sm font-normal text-white/20 uppercase not-italic tracking-widest">KG</span>
                    </p>
                    <Zap className={`absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 ${isWin ? 'text-[#00f0ff]' : 'text-[#ff0033]'} opacity-10 group-hover:opacity-20 transition-opacity`} />
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                    <p className="text-white/30 text-[9px] font-black tracking-widest uppercase mb-1">Duration</p>
                    <p className="text-4xl font-black italic text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                      {formatTime(matchData.enduranceTime)}
                    </p>
                    <Clock className={`absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 ${isWin ? 'text-[#00f0ff]' : 'text-[#ff0033]'} opacity-10 group-hover:opacity-20 transition-opacity`} />
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Navigation Footer */}
      <div className="relative z-10 p-12 flex-shrink-0">
        <motion.div
           className="max-w-3xl mx-auto"
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 1 }}
        >
          <motion.button
            onClick={() => {
              stopWinSound();
              startIntroMusic();
              navigate('/menu');
            }}
            className={`w-full py-6 rounded-2xl border-2 ${isWin ? 'border-[#00f0ff] bg-[#00f0ff]/10 shadow-[0_0_30px_rgba(0,240,255,0.3)]' : 'border-[#ff0033] bg-[#ff0033]/10 shadow-[0_0_30px_rgba(255,0,51,0.3)]'} 
                       text-white text-2xl font-black italic tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-4 group`}
            style={{ fontFamily: "'Orbitron', sans-serif" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Return to menu
            <ChevronRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
