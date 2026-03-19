import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '../components/GlassCard';
import { Lock, Skull, Zap, AlertTriangle, ChevronRight, Sparkles, ArrowLeft, Trophy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useGlobalAudio } from '../../contexts/AudioContext';

export function GauntletScreen() {
  const navigate = useNavigate();
  const { playStageMusic, stopStageMusic, stopWinSound } = useGlobalAudio();
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);
  const [pathProgress, setPathProgress] = useState(0);
  const [gauntletProgress, setGauntletProgress] = useState(1);
  const [loading, setLoading] = useState(true);

  // Handle stage music and win sound
  useEffect(() => {
    stopWinSound();
    if (!loading) {
      playStageMusic(gauntletProgress);
    }
    return () => stopStageMusic();
  }, [loading, gauntletProgress, playStageMusic, stopStageMusic, stopWinSound]);

  // Fetch progress on mount
  useEffect(() => {
    async function fetchProgress() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        let playerId: string | null = localStorage.getItem('fighter_player_id');

        if (user) {
          const { data: player } = await supabase.from('players').select('id').eq('user_id', user.id).maybeSingle();
          if (player?.id) {
            playerId = player.id;
            localStorage.setItem('fighter_player_id', playerId!);
          } else if (playerId) {
            // LINK REPAIR: We have a user and a local playerId, but no user_id link in players table.
            // Attempt to link them now to fix the sync for future sessions.
            try {
              console.log('Gauntlet Progress Sync - Repairing broken user_id link for player:', playerId);
              await supabase.from('players').update({ 
                user_id: user.id,
                updated_at: new Date().toISOString()
              }).eq('id', playerId);
            } catch (linkErr) {
              console.warn("Gauntlet Progress Sync - User link repair failed:", linkErr);
            }
          }
        }

        let progress = 1;
        const localProgress = localStorage.getItem('fighter_gauntlet_progress');
        const currentLocal = localProgress ? parseInt(localProgress) : 1;
        
        console.log('Gauntlet Progress Sync Start - Local:', currentLocal);
        
        if (playerId) {
          // If we have a playerId (either from DB or preserved from Local), fetch from players table
          const { data } = await supabase.from('players').select('gauntlet_progress').eq('id', playerId).maybeSingle();
          const dbProgress = data?.gauntlet_progress || 1;
          
          console.log('Gauntlet Progress Sync - DB:', dbProgress);
          
          // Sync logic: Use the MOST ADVANCED progress known to handle win-to-map redirects
          progress = Math.max(dbProgress, currentLocal);
          
          // If local is ahead (just won a match), sync it to the DB immediately
          if (currentLocal > dbProgress && user) {
            console.log('Gauntlet Progress Sync - Proactively updating DB with local win progress:', currentLocal);
            await supabase.from('players').update({ gauntlet_progress: currentLocal }).eq('id', playerId);
          }
        } else {
          // Pure guest with no playerId and no user - highly unlikely but possible for fresh start
          progress = currentLocal;
        }
        
        console.log('Gauntlet Progress Sync - Resolved:', progress);
        localStorage.setItem('fighter_gauntlet_progress', progress.toString());

        setGauntletProgress(Math.min(progress, 6));
        setLoading(false);

        if (progress > 1 && progress <= 5) {
          setShowUnlockAnimation(true);
        }
      } catch (err) {
        console.error("Error fetching progress:", err);
        setLoading(false);
      }
    }
    fetchProgress();
  }, []);

  // Animate the path to current unlocked node
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      // If stage is 3, progress is between node 2 and 3. Max stages 5.
      // So path lengths: 1-2, 2-3, 3-4, 4-5. 
      // We fill path lines based on progress.
      setPathProgress(100);
    }, 500);
    return () => clearTimeout(timer);
  }, [loading]);

  // Raw Stages data
  const baseStages = [
    {
      id: 1,
      name: 'STAGE 01',
      robot: '🤖',
      image: '/assets/robots/stage1.jpg',
      difficulty: 'Easy',
      description: 'TRAINING DROID',
    },
    {
      id: 2,
      name: 'STAGE 02',
      robot: '🦾',
      image: '/assets/robots/stage2.png',
      difficulty: 'Medium',
      description: 'MECH BRAWLER',
    },
    {
      id: 3,
      name: 'STAGE 03',
      robot: '⚙️',
      image: '/assets/robots/stage3.png',
      difficulty: 'Hard',
      description: 'STEEL ASSASSIN',
    },
    {
      id: 4,
      name: 'STAGE 04',
      robot: '🔥',
      image: '/assets/robots/stage4.png',
      difficulty: 'Extreme',
      description: 'CRUSHER X-9000',
    },
    {
      id: 5,
      name: 'FINAL BOSS',
      robot: '💀',
      image: '/assets/robots/stage5.png',
      difficulty: 'LETHAL',
      description: 'ANNIHILATOR PRIME',
    },
  ];

  // Map status dynamically based on DB progress
  const stages = baseStages.map(stage => {
    let status = 'locked';
    // If progress is 6, all 5 are cleared
    if (stage.id < gauntletProgress || gauntletProgress > 5) {
      status = 'cleared';
    } else if (stage.id === gauntletProgress) {
      status = 'unlocking';
    }
    return { ...stage, status, cleared: status === 'cleared' };
  });

  // Find current active stage for the bottom panel
  const activeStageIndex = Math.min(gauntletProgress - 1, 4);
  const activeStage = baseStages[activeStageIndex];

  // Generate glass fragments for shatter effect
  const generateFragments = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200,
      rotation: Math.random() * 360,
      scale: 0.3 + Math.random() * 0.7,
      delay: Math.random() * 0.2,
    }));
  };

  const fragments = generateFragments(12);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Handle progress reset
  const handleResetProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let playerId = localStorage.getItem('fighter_player_id');

      if (user) {
        const { data: player } = await supabase.from('players').select('id').eq('user_id', user.id).maybeSingle();
        if (player?.id) playerId = player.id;
      }

      if (playerId) {
        const { error } = await supabase
          .from('players')
          .update({ gauntlet_progress: 1 })
          .eq('id', playerId);

        if (error) throw error;
        setGauntletProgress(1);
        setShowUnlockAnimation(false);
        setShowResetConfirm(false);
      }
    } catch (err) {
      console.error("Error resetting progress:", err);
      alert('Failed to reset progress. Please try again.');
    }
  };

  return (
    <div className="h-screen bg-[#0a0515] relative overflow-hidden flex flex-col">
      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirm(false)}
            />
            <motion.div
              className="relative w-full max-w-lg"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <GlassCard className="p-8 border-2 border-[#ff006e]/50 bg-gradient-to-br from-[#ff006e]/20 to-[#0a0515] shadow-[0_0_50px_rgba(255,0,110,0.4)]">
                <div className="flex flex-col items-center text-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-[#ff006e]/20 flex items-center justify-center border-2 border-[#ff006e] shadow-[0_0_20px_#ff006e]">
                    <AlertTriangle className="w-10 h-10 text-[#ff006e]" />
                  </div>

                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                      RESET PROGRESS?
                    </h2>
                    <p className="text-white/60">
                      This will reset your Gauntlet progress to Stage 1.
                      <br />
                      <span className="text-[#ff006e] font-bold">This action cannot be undone.</span>
                    </p>
                  </div>

                  <div className="flex w-full gap-4 mt-4">
                    <motion.button
                      className="flex-1 px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors uppercase tracking-widest text-sm"
                      onClick={() => setShowResetConfirm(false)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      className="flex-1 px-6 py-4 rounded-xl bg-[#ff006e] text-white font-bold shadow-[0_0_20px_rgba(255,0,110,0.5)] hover:shadow-[0_0_30px_rgba(255,0,110,0.8)] transition-all uppercase tracking-widest text-sm"
                      onClick={handleResetProgress}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Reset Now
                    </motion.button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Animated Background Gradient */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-[#00f0ff]/10 via-[#0a0515] to-[#ff006e]/10"
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            type: 'tween',
          }}
        />

        {/* Dynamic energy blobs */}
        <motion.div
          className="absolute w-96 h-96 bg-[#00f0ff] rounded-full blur-[120px]"
          animate={{
            x: ['-10%', '10%', '-10%'],
            y: ['0%', '20%', '0%'],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            type: 'tween',
          }}
          style={{ top: '20%', left: '10%' }}
        />

        <motion.div
          className="absolute w-96 h-96 bg-[#ff006e] rounded-full blur-[120px]"
          animate={{
            x: ['10%', '-10%', '10%'],
            y: ['0%', '-20%', '0%'],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            type: 'tween',
            delay: 1,
          }}
          style={{ bottom: '20%', right: '10%' }}
        />

        <motion.div
          className="absolute w-96 h-96 bg-[#ffaa00] rounded-full blur-[120px]"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            type: 'tween',
          }}
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
          linear-gradient(#00f0ff 1px, transparent 1px),
          linear-gradient(90deg, #00f0ff 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Header */}
      <div className="relative z-10 py-8 px-6 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Redo Button */}
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => navigate('/menu')}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-[#00f0ff]/30 transition-all z-20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-[#00f0ff]" />
              <span className="text-white/60 text-sm uppercase tracking-wider">Back</span>
            </motion.button>

            <motion.button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#ff006e]/10 border border-[#ff006e]/30 rounded-lg hover:bg-[#ff006e]/20 hover:border-[#ff006e]/50 transition-all z-20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap className="w-5 h-5 text-[#ff006e]" />
              <span className="text-[#ff006e]/80 text-sm uppercase tracking-wider font-bold">Redo</span>
            </motion.button>
          </div>

          {/* Center: Glowing Title */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h1
              className="text-4xl font-bold"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                background: 'linear-gradient(to right, #00f0ff, #ffaa00, #ff006e)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 20px rgba(0, 240, 255, 0.4)',
              }}
              animate={{
                textShadow: [
                  '0 0 20px rgba(0, 240, 255, 0.4)',
                  '0 0 40px rgba(255, 170, 0, 0.6)',
                  '0 0 20px rgba(0, 240, 255, 0.4)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                type: 'tween',
              }}
            >
              THE GAUNTLET: SURVIVE 5 STAGES
            </motion.h1>
            <p className="text-white/40 uppercase tracking-widest text-[10px] mt-1">
              Defeat All Robots to Claim Victory
            </p>
          </motion.div>

          {/* Spacer for right side symmetry */}
          <div className="w-32" />
        </div>
      </div>

      {/* Main Content - Progression Path */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-12 min-h-0">
        <div className="w-full max-w-7xl">
          <div className="relative">
            {/* Connection Lines Container */}
            <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 flex items-center justify-between px-24">
              {[1, 2, 3, 4].map((lineIndex) => {
                const isCleared = lineIndex < gauntletProgress;
                const isAnimating = lineIndex === gauntletProgress - 1 && gauntletProgress <= 5;

                if (isCleared) {
                  return (
                    <div key={lineIndex} className="flex-1 h-1 bg-gradient-to-r from-[#00f0ff] to-[#00f0ff] shadow-[0_0_10px_#00f0ff] mx-4" />
                  );
                }

                if (isAnimating) {
                  return (
                    <div key={lineIndex} className="flex-1 relative mx-4 h-1 bg-white/10">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#00f0ff] to-[#ffaa00] shadow-[0_0_20px_#ffaa00]"
                        initial={{ width: '0%' }}
                        animate={{ width: `${pathProgress}%` }}
                        transition={{ duration: 1.5, ease: 'easeInOut' }}
                      />
                      {pathProgress < 100 && (
                        <motion.div
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#ffaa00] shadow-[0_0_15px_#ffaa00]"
                          style={{ left: `${pathProgress}%` }}
                          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.6, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity, type: 'tween' }}
                        />
                      )}
                    </div>
                  );
                }

                // Locked Line
                return <div key={lineIndex} className="flex-1 h-1 bg-white/10 mx-4" />
              })}
            </div>

            {/* Nodes */}
            <div className="flex items-center justify-between relative">
              {stages.map((stage, index) => {
                const isBoss = stage.id === 5;
                const isUnlocking = stage.status === 'unlocking';
                const isCleared = stage.status === 'cleared';
                const isLocked = stage.status === 'locked';

                return (
                  <motion.div
                    key={stage.id}
                    className="flex flex-col items-center relative"
                    style={{ zIndex: isUnlocking ? 50 : isBoss ? 40 : 10 }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.2, duration: 0.5 }}
                  >
                    {/* Cleared Nodes */}
                    {isCleared && (
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.1 }}
                      >
                        {/* Lit Glow Effect for Cleared Stages */}
                        <motion.div
                          className="absolute inset-0 rounded-xl bg-[#00f0ff]/20 blur-xl"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.8, 0.5],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                          }}
                        />

                        <GlassCard className="w-32 h-32 border-2 border-[#00f0ff] bg-gradient-to-br from-[#00f0ff]/30 to-[#00f0ff]/10 shadow-[0_0_40px_rgba(0,240,255,0.8)] flex items-center justify-center relative overflow-hidden">
                          {/* Inner light pulse */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-t from-[#00f0ff]/20 to-transparent"
                            animate={{
                              opacity: [0.3, 0.6, 0.3],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                            }}
                          />

                          {/* Robot Image (Lit) */}
                          <img
                            src={stage.image}
                            alt={stage.name}
                            className="w-full h-full object-cover opacity-80 drop-shadow-[0_0_10px_#00f0ff]"
                          />

                          {/* Checkmark badge */}
                          <div className="absolute top-2 right-2 w-6 h-6 bg-[#00f0ff] rounded-full flex items-center justify-center shadow-[0_0_15px_#00f0ff]">
                            <span className="text-black font-bold text-xs">✓</span>
                          </div>
                        </GlassCard>

                        {/* Label */}
                        <div className="text-center mt-3">
                          <p className="text-[#00f0ff] text-sm font-bold drop-shadow-[0_0_5px_#00f0ff]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                            {stage.name}
                          </p>
                          <p className="text-white/60 text-[10px] uppercase font-bold tracking-tighter">SUCCESS</p>
                        </div>
                      </motion.div>
                    )}

                    {/* Unlocking Node (Current Stage) */}
                    {isUnlocking && (
                      <div className="relative">
                        {/* Glass Fragments Shatter Animation */}
                        <AnimatePresence>
                          {showUnlockAnimation && fragments.map((fragment) => (
                            <motion.div
                              key={fragment.id}
                              className="absolute top-1/2 left-1/2 w-6 h-6 bg-gradient-to-br from-[#ffaa00] to-[#ff006e] rounded-sm"
                              style={{
                                boxShadow: '0 0 15px rgba(255, 170, 0, 0.8)',
                              }}
                              initial={{
                                x: 0,
                                y: 0,
                                opacity: 1,
                                rotate: 0,
                                scale: 1,
                              }}
                              animate={{
                                x: fragment.x,
                                y: fragment.y,
                                opacity: 0,
                                rotate: fragment.rotation,
                                scale: fragment.scale,
                              }}
                              exit={{ opacity: 0 }}
                              transition={{
                                duration: 1.2,
                                delay: fragment.delay,
                                ease: 'easeOut',
                              }}
                            />
                          ))}
                        </AnimatePresence>

                        {/* Shattering Padlock (fades out) */}
                        {showUnlockAnimation && (
                          <motion.div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
                            initial={{ opacity: 1, scale: 1 }}
                            animate={{
                              opacity: 0,
                              scale: 1.5,
                              rotate: [0, -10, 10, -10, 0],
                            }}
                            transition={{ duration: 1 }}
                            onAnimationComplete={() => setShowUnlockAnimation(false)}
                          >
                            <Lock className="w-20 h-20 text-[#ffaa00]" strokeWidth={2} />
                          </motion.div>
                        )}

                        {/* Unlocking Card - Scales up and pops forward */}
                        <motion.div
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{
                            scale: 1.1,
                            opacity: 1,
                          }}
                          transition={{
                            delay: 0.8,
                            duration: 0.6,
                            type: 'spring',
                            stiffness: 200,
                          }}
                          whileHover={{ scale: 1.15 }}
                        >
                          <GlassCard className="w-40 h-40 border-4 border-[#ffaa00] bg-gradient-to-br from-[#ffaa00]/30 to-[#ff006e]/20 shadow-[0_0_60px_rgba(255,170,0,1)] flex items-center justify-center relative overflow-hidden cursor-pointer">
                            {/* Bright flash effect */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-br from-[#ffaa00] to-transparent"
                              initial={{ opacity: 0 }}
                              animate={{
                                opacity: [0, 1, 0],
                              }}
                              transition={{
                                duration: 0.8,
                                delay: 0.8,
                                type: 'tween',
                              }}
                            />

                            {/* Radiating rings */}
                            <motion.div
                              className="absolute inset-0 border-4 border-[#ffaa00] rounded-xl"
                              animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.8, 0, 0.8],
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                type: 'tween',
                              }}
                            />

                            {/* Robot Image */}
                            <div className="relative z-10 w-full h-full">
                              <motion.img
                                src={stage.image}
                                alt={stage.name}
                                className="w-full h-full object-cover"
                                animate={{
                                  scale: [1, 1.05, 1],
                                }}
                                transition={{
                                  duration: 3,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              />
                            </div>

                            {/* "ACTIVE" badge */}
                            <motion.div
                              className="absolute top-2 right-2 px-3 py-1 bg-[#ffaa00] rounded-full shadow-[0_0_10px_#ffaa00]"
                              animate={{
                                scale: [1, 1.1, 1],
                              }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                type: 'tween',
                              }}
                            >
                              <span className="text-black text-[10px] font-bold uppercase tracking-tighter">Current</span>
                            </motion.div>
                          </GlassCard>
                        </motion.div>

                        {/* Label */}
                        <motion.div
                          className="text-center mt-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.2 }}
                        >
                          <p className="text-[#ffaa00] text-base font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                            {stage.name}
                          </p>
                          <p className="text-white text-sm font-bold mt-1">{stage.description}</p>
                          <motion.p
                            className="text-[#ffaa00] text-xs uppercase mt-1 font-bold"
                            animate={{
                              opacity: [0.6, 1, 0.6],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              type: 'tween',
                            }}
                          >
                            SELECT MISSION
                          </motion.p>
                        </motion.div>
                      </div>
                    )}

                    {/* Locked Node */}
                    {isLocked && (
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.05 }}
                      >
                        <GlassCard className={`w-32 h-32 border-2 border-white/5 bg-black/40 shadow-none flex items-center justify-center relative overflow-hidden grayscale opacity-40`}>
                          {/* Locked overlay */}
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                            <Lock className="w-12 h-12 text-white/40" strokeWidth={1.5} />
                          </div>

                          {/* Robot Image (dimmed) */}
                          <img
                            src={stage.image}
                            alt={stage.name}
                            className="w-full h-full object-cover"
                          />
                        </GlassCard>

                        {/* Label */}
                        <div className="text-center mt-4 opacity-30">
                          <p className="text-white text-xs font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                            {stage.name}
                          </p>
                          <p className="text-white/40 text-[10px] uppercase mt-1 flex items-center justify-center gap-1 font-bold">
                            ENCRYPTED
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Panel */}
      <div className="relative z-10 p-6 flex-shrink-0">
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
        >
          {gauntletProgress > 5 ? (
            <GlassCard className="p-8 border-4 border-[#ffaa00] bg-gradient-to-br from-[#ffaa00]/20 to-[#0a0515] shadow-[0_0_60px_rgba(255,170,0,0.6)] text-center relative overflow-hidden">
              {/* Animated scanning lines */}
              <motion.div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #ffaa00 2px, #ffaa00 4px)',
                  backgroundSize: '100% 4px'
                }}
                animate={{
                  backgroundPositionY: ['0px', '40px']
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />

              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: [0.9, 1, 0.9] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-[#ffaa00] rounded-full shadow-[0_0_30px_#ffaa00]">
                    <Trophy className="w-12 h-12 text-black" />
                  </div>
                </div>
                <h3 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  GAUNTLET CONQUERED
                </h3>
                <p className="text-[#ffaa00] uppercase tracking-[0.3em] font-bold text-lg mb-4">
                  Ultimate Victor Confirmed
                </p>
                <div className="h-px w-full bg-gradient-to-r from-transparent via-[#ffaa00] to-transparent mb-6" />
                <p className="text-white/80 text-xl font-bold italic">
                  "NEW CHALLENGE ON THE WAY..."
                </p>
              </motion.div>
            </GlassCard>
          ) : (
            <GlassCard className="p-6 border-2 border-[#00f0ff] bg-gradient-to-r from-[#00f0ff]/10 to-[#ffaa00]/10 shadow-[0_0_40px_rgba(0,240,255,0.6)]">
              <div className="flex items-center justify-between gap-6">
                {/* Stage Info */}
                <div className="flex items-center gap-6">
                  <div className={`w-32 h-32 rounded-xl flex items-center justify-center overflow-hidden
                    ${activeStage.id === 5
                      ? 'bg-gradient-to-br from-[#ff006e] to-black shadow-[0_0_30px_rgba(255,0,110,0.8)] border-2 border-[#ff006e]'
                      : 'bg-gradient-to-br from-[#ffaa00] to-[#ff006e] shadow-[0_0_20px_rgba(255,170,0,0.8)] border-2 border-[#ffaa00]'}`}
                  >
                    <video
                      key={activeStage.id}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover scale-110"
                    >
                      <source
                        src={
                          activeStage.id === 1 ? '/assets/robots/stage1_prefight.mp4' :
                            activeStage.id === 2 ? '/assets/robots/stage2_prefight.mp4' :
                              activeStage.id === 3 ? '/assets/robots/stage3.mp4' :
                                activeStage.id === 4 ? '/assets/robots/stage4.mp4' :
                                  activeStage.id === 5 ? '/assets/robots/bosRobot.mp4' :
                                    '/assets/training.mp4'
                        }
                        type="video/mp4"
                      />
                    </video>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="text-[#ffaa00] text-sm font-bold tracking-[0.2em] uppercase" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                      {activeStage.name}
                    </p>
                    <h3 className="text-3xl font-black text-white italic tracking-tighter" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                      {activeStage.name}: {activeStage.description}
                    </h3>

                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white/40 text-xs uppercase tracking-widest font-bold">Difficulty:</span>
                        <span className={`${activeStage.id === 5 ? 'text-[#ff006e]' : 'text-[#ffaa00]'} font-bold uppercase text-sm tracking-wider`}>
                          {activeStage.difficulty}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/40 text-xs uppercase tracking-widest font-bold">Reward:</span>
                        <span className="text-[#00f0ff] font-bold text-sm">+{activeStage.id * 200} XP</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <motion.button
                  className="group relative overflow-hidden shrink-0 transform-gpu"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/game', {
                    state: {
                      mode: 'gauntlet',
                      stageNumber: activeStage.id,
                      stageName: activeStage.description
                    }
                  })}
                >
                  <GlassCard className="px-12 py-8 border-4 border-[#00f0ff] bg-gradient-to-r from-[#00f0ff]/30 to-[#00f0ff]/10 shadow-[0_0_40px_rgba(0,240,255,0.8)]">
                    {/* Animated background sweep */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00f0ff]/40 to-transparent"
                      animate={{
                        x: ['-100%', '200%'],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'linear',
                        type: 'tween',
                      }}
                    />

                    <div className="relative flex flex-col items-center gap-1">
                      <span
                        className="text-3xl font-black text-white italic"
                        style={{
                          fontFamily: "'Orbitron', sans-serif",
                          textShadow: '0 0 20px rgba(0, 240, 255, 1)',
                        }}
                      >
                        ENGAGE TARGET
                      </span>
                      <div className="flex items-center gap-2 text-[#00f0ff]">
                        <span className="text-[10px] font-bold tracking-[0.5em] uppercase">Initialize Battle</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </GlassCard>

                  {/* Pulsing outer ring */}
                  <motion.div
                    className="absolute inset-0 border-4 border-[#00f0ff] rounded-2xl"
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      type: 'tween',
                    }}
                  />
                </motion.button>
              </div>
            </GlassCard>
          )}
        </motion.div>
      </div>
    </div>
  );
}