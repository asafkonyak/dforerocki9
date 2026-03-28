import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { GlassCard } from '../components/GlassCard';
import { Skull, Zap, Clock, TrendingUp, Award, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { useGlobalAudio } from '../../contexts/AudioContext';
import QRCode from 'react-qr-code';

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
    avgForce: 45,
    enduranceTime: 45,
    xpEarned: 500,
    stageName: 'CRUSHER X-9000',
    stageNumber: 4,
    forceHistory: null,
  };

  const isWin = matchData.isWin ?? true;

  const formatTime = (totalSeconds: number) => {
    if (!totalSeconds || isNaN(totalSeconds)) return "00.000";
    const secs = Math.floor(totalSeconds);
    const ms = Math.floor((totalSeconds % 1) * 1000);
    return `${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  useEffect(() => {
    if (isWin) {
      playWinSound();
    }

    // Memory management for video URL
    return () => {
      if (matchData.videoUrl && matchData.videoUrl.startsWith('blob:')) {
        console.log('[Victory] Revoking video URL:', matchData.videoUrl);
        URL.revokeObjectURL(matchData.videoUrl);
      }
    };
  }, []);

  useEffect(() => {
    // Trigger animations sequentially
    const chartsTimer = setTimeout(() => setAnimateCharts(true), 1000);

    return () => {
      clearTimeout(chartsTimer);
    };
  }, []);

  // Determine force data for chart
  const forceData = matchData.forceHistory && matchData.forceHistory.length > 0 
    ? matchData.forceHistory 
    : [
      { time: 0, force: 0 },
      { time: 5, force: 25 },
      { time: 10, force: 42 },
      { time: 15, force: 38 },
      { time: 20, force: 55 },
      { time: 25, force: matchData.peakForce || 68 }, // Peak fallback
      { time: 30, force: 52 },
      { time: 35, force: 45 },
      { time: 40, force: 48 },
      { time: 45, force: isWin ? 60 : 20 },
    ];

  const maxForceRaw = Math.max(...forceData.map((d: { time: number, force: number }) => d.force));
  const maxForce = Math.ceil(maxForceRaw < 1 ? 1 : maxForceRaw);

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
            className="flex justify-center mb-4"
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 1, type: 'spring', bounce: 0.6 }}
          >
            <div className="relative">
              {isWin ? (
                <Award className="w-20 h-20 text-[#ffaa00]" strokeWidth={1.5} />
              ) : (
                <Skull className="w-20 h-20 text-[#ff0033]" strokeWidth={1.5} />
              )}
              <motion.div
                className="absolute inset-0"
                animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, type: 'tween' }}
              >
                <div className={`w-full h-full border-4 ${isWin ? 'border-[#ffaa00]' : 'border-[#ff0033]'} rounded-full`} />
              </motion.div>
            </div>
          </motion.div>

          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-2"
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
                '0 0 30px rgba(0, 240, 255, 0.6)',
                '0 0 60px rgba(0, 240, 255, 0.9)',
                '0 0 30px rgba(0, 240, 255, 0.6)',
              ] : [
                '0 0 30px rgba(255, 0, 51, 0.6)',
                '0 0 60px rgba(255, 0, 51, 0.9)',
                '0 0 30px rgba(255, 0, 51, 0.6)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, type: 'tween' }}
          >
            {isWin ? 'TARGET DEFEATED - YOU WON!' : 'STAY HUNGRY!'}
          </motion.h1>

          <div className="flex justify-center">
            <div className="h-1 w-32 bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent opacity-50" />
          </div>
        </motion.div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 overflow-hidden min-h-0 px-4 md:px-12 flex flex-col justify-center">
        <motion.div
          className="w-full max-w-6xl mx-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <GlassCard className="p-6 border-4 border-[#00f0ff]/40 bg-black/60 shadow-[0_0_50px_rgba(0,240,255,0.3)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Left Side: Video Replay */}
              <div className="flex flex-col gap-4">
                <div className={`w-full aspect-video rounded-2xl overflow-hidden border-4 ${isWin ? 'border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.4)]' : 'border-[#ff0033] shadow-[0_0_20px_rgba(255,0,51,0.4)]'} bg-black relative`}>
                  {matchData.videoUrl ? (
                    <div className="relative w-full h-full">
                      <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                        src={matchData.videoUrl}
                        onLoadedData={() => {
                          console.log('[Victory] Video Loaded Successfully');
                          setAnimateMetrics(true);
                        }}
                        onError={(e) => {
                          console.error('[Victory] Video Playback Error:', e);
                          // Still show metrics even if video fails
                          setAnimateMetrics(true);
                        }}
                      />
                      
                      {/* Replay Overlay */}
                      <div className="absolute top-4 left-4 bg-black/60 px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-xs text-white font-black tracking-widest">REPLAY</span>
                      </div>

                      {/* Loader overlay */}
                      {!animateMetrics && (
                        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center gap-4 z-30">
                          <Loader2 className="w-12 h-12 text-[#00f0ff] animate-spin" />
                          <span className="text-[#00f0ff] text-xs font-black tracking-[0.3em] uppercase italic animate-pulse">Processing Replay...</span>
                        </div>
                      )}
                    </div>
                  ) : (
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
                  )}
                  
                  {/* Cyber Scanning Line */}
                  <motion.div
                    className={`absolute inset-x-0 h-1 bg-${isWin ? '[#00f0ff]' : '[#ff0033]'} z-20 shadow-[0_0_15px_#00f0ff]`}
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  />
                </div>

                <div className="text-center mt-2">
                  <span className={`text-sm uppercase tracking-[0.4em] font-bold ${isWin ? 'text-[#00f0ff]/60' : 'text-[#ff0033]/60'}`}>
                    Performance Analytics
                  </span>
                  <p className={`text-3xl font-black italic mt-1 ${isWin ? 'text-[#00f0ff]' : 'text-[#ff0033]'}`} style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {isWin ? 'ELITE PERFORMANCE' : 'RELOAD & GO AGAIN'}
                  </p>
                </div>
              </div>

              {/* Right Side: Chart & Metrics */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-white text-xl font-black italic tracking-widest uppercase" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    Force Dynamics
                  </h3>
                  <div className="flex items-center gap-2 bg-[#00f0ff]/10 px-3 py-1 rounded-lg border border-[#00f0ff]/20">
                    <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Avg Pulse</span>
                    <span className={`font-bold text-lg ${isWin ? 'text-[#00f0ff]' : 'text-[#ff0033]'}`} style={{ fontFamily: "'Orbitron', monospace" }}>
                      {Number(matchData.avgForce || 0).toFixed(1)} <span className="text-xs">KG</span>
                    </span>
                  </div>
                </div>

                <GlassCard className="p-4 border border-white/10 bg-black/40 h-[240px]">
                  <div className="relative h-full">
                    {/* Y-axis */}
                    <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-white/30 font-bold">
                      <span>{maxForce}</span>
                      <span>{Math.round(maxForce * 0.5)}</span>
                      <span>0</span>
                    </div>

                    {/* Chart Container */}
                    <div className="absolute left-8 right-0 top-0 bottom-6">
                      <svg className="w-full h-full" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#00f0ff" />
                            <stop offset="100%" stopColor="#ffaa00" />
                          </linearGradient>
                          <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        
                        <motion.path
                          d={`M 0,100 ${forceData.map((d: any, i: number) => `L ${(i / (forceData.length - 1)) * 100},${100 - (d.force / maxForce) * 100}`).join(' ')} L 100,100 Z`}
                          fill="url(#areaGrad)"
                          initial={{ opacity: 0 }}
                          animate={animateCharts ? { opacity: 1 } : {}}
                        />
                        <motion.polyline
                          points={forceData.map((d: any, i: number) => `${(i / (forceData.length - 1)) * 100},${100 - (d.force / maxForce) * 100}`).join(' ')}
                          fill="none"
                          stroke="url(#lineGrad)"
                          strokeWidth="3"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={animateCharts ? { pathLength: 1 } : {}}
                          transition={{ duration: 2, ease: "easeInOut" }}
                        />
                      </svg>
                    </div>

                    {/* X-axis */}
                    <div className="absolute left-8 right-0 bottom-0 flex justify-between text-[10px] text-white/30 font-bold uppercase tracking-widest pt-2 border-t border-white/10">
                      <span>Start</span>
                      <span>{Math.round(matchData.enduranceTime / 2)}s</span>
                      <span>End ({Math.round(matchData.enduranceTime)}s)</span>
                    </div>
                  </div>
                </GlassCard>

                {/* Sub-Chart Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <GlassCard className="p-4 border border-[#ffaa00]/30 bg-[#ffaa00]/5 flex items-center justify-between">
                    <div>
                      <p className="text-[#ffaa00]/60 text-[10px] font-black tracking-widest uppercase">Peak Force</p>
                      <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                        {matchData.peakForce} <span className="text-xs text-white/40">KG</span>
                      </p>
                    </div>
                    <Zap className="w-6 h-6 text-[#ffaa00]/60" />
                  </GlassCard>

                  <GlassCard className="p-4 border border-[#00f0ff]/30 bg-[#00f0ff]/5 flex items-center justify-between">
                    <div>
                      <p className="text-[#00f0ff]/60 text-[10px] font-black tracking-widest uppercase">Endurance Time</p>
                      <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                        {formatTime(matchData.enduranceTime)}
                      </p>
                    </div>
                    <Clock className="w-6 h-6 text-[#00f0ff]/60" />
                  </GlassCard>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Footer Navigation */}
      <div className="relative z-10 p-8 flex-shrink-0">
        <motion.div
          className="max-w-xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <motion.button
            className="w-full group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (matchData.mode === 'ranked') navigate('/menu');
              else navigate('/practice');
            }}
          >
            <GlassCard className={`p-5 border-2 ${isWin ? 'border-[#00f0ff]' : 'border-[#ff0033]'} bg-black/60 shadow-[0_0_40px_rgba(0,240,255,0.2)] flex items-center justify-between overflow-hidden relative`}>
              {/* Pulse effect */}
              <motion.div 
                className={`absolute inset-0 bg-gradient-to-r ${isWin ? 'from-[#00f0ff]/10' : 'from-[#ff0033]/10'} to-transparent`}
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              
              <div className="relative flex items-center gap-4">
                <div className={`p-2 rounded-lg ${isWin ? 'bg-[#00f0ff]/20' : 'bg-[#ff0033]/20'}`}>
                  <Award className={`w-6 h-6 ${isWin ? 'text-[#00f0ff]' : 'text-[#ff0033]'}`} />
                </div>
                <span className={`text-2xl font-black italic tracking-widest uppercase ${isWin ? 'text-[#00f0ff]' : 'text-[#ff0033]'}`} style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  {matchData.mode === 'ranked' ? 'Back to Menu' : (isWin ? 'Continue to Map' : 'Return to Map')}
                </span>
              </div>
              <ChevronRight className={`w-8 h-8 ${isWin ? 'text-[#00f0ff]' : 'text-[#ff0033]'} relative z-10`} />
            </GlassCard>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
