import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '../components/GlassCard';
import { Lock, Skull, Zap, AlertTriangle, ChevronRight, Sparkles, ArrowLeft, Trophy, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useGlobalAudio } from '../../contexts/AudioContext';
import { useSocket } from '../../contexts/SocketContext';

export function GauntletScreen() {
  const navigate = useNavigate();
  const { playStageMusic, stopStageMusic, stopWinSound } = useGlobalAudio();
  const { sendMessage, lastMessage } = useSocket();
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);
  const [pathProgress, setPathProgress] = useState(0);
  const [gauntletProgress, setGauntletProgress] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showRefereeVideo, setShowRefereeVideo] = useState(false);
  const [countdown, setCountdown] = useState<string | number | null>(null);
  const [playerHand, setPlayerHand] = useState('RIGHT');

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
          const { data: player } = await supabase.from('players').select('id, preferred_hand').eq('user_id', user.id).maybeSingle();
          if (player?.id) {
            playerId = player.id;
            localStorage.setItem('fighter_player_id', playerId!);
            if (player.preferred_hand) {
              setPlayerHand(player.preferred_hand.toUpperCase());
            }
          } else if (playerId) {
            // LINK REPAIR
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
        } else if (playerId) {
          // GUEST FLOW: No user, but we have a playerId from localStorage
          const { data: player } = await supabase.from('players').select('preferred_hand').eq('id', playerId).maybeSingle();
          if (player?.preferred_hand) {
            setPlayerHand(player.preferred_hand.toUpperCase());
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
      setPathProgress(100);
    }, 500);
    return () => clearTimeout(timer);
  }, [loading]);

  const baseStages = [
    {
      id: 1,
      name: 'STAGE 01',
      robot: '🤖',
      image: '/assets/robots/stage1.jpg',
      difficulty: 'Warm Up',
      description: 'CALIBRATION PROTOCOL',
    },
    {
      id: 2,
      name: 'STAGE 02',
      robot: '🦾',
      image: '/assets/robots/stage2.png',
      difficulty: 'Endurance',
      description: 'LIMIT BREAKER',
    },
    {
      id: 3,
      name: 'FINAL STAGE',
      robot: '💀',
      image: '/assets/robots/stage3.jpg',
      difficulty: 'Mastery',
      description: 'ARENA OVERLORD',
    },
  ];

  const stages = baseStages.map(stage => {
    let status = 'locked';
    if (stage.id < gauntletProgress || gauntletProgress > 5) {
      status = 'cleared';
    } else if (stage.id === gauntletProgress) {
      status = 'unlocking';
    }
    return { ...stage, status, cleared: status === 'cleared' };
  });

  const activeStageIndex = Math.min(gauntletProgress - 1, 2);
  const activeStage = baseStages[activeStageIndex];

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

  const getStagePower = (stage: number) => {
    switch(stage) {
      case 1: return 7;
      case 2: return 10;
      case 3: return 12.5;
      case 4: return 20;
      case 5: return 25;
      default: return 7;
    }
  };

  const handleInitiateBattle = () => {
    navigate('/pregame', {
      state: {
        stageNumber: activeStage.id,
        stageName: activeStage.description,
        hand: playerHand
      }
    });
  };

  const handleVideoEnd = () => {
    setShowRefereeVideo(false);
    sendMessage({
      cmd: {
        SINGLE_PLAYER_START: 0
      }
    });
  };

  useEffect(() => {
    if (!lastMessage) return;
    const serverData = lastMessage.data || lastMessage;

    let val = null;
    if (serverData.type === 'countdown') {
      val = serverData.value;
    } else if (serverData.cmd && serverData.cmd.count_down !== undefined) {
      val = serverData.cmd.count_down;
    }
    
    if (val !== null) {
      setCountdown(val);
      if (val === 1 || val === '1' || val === 0 || val === '0' || val === 'GO' || val === 'GO!') {
        setTimeout(() => {
          navigate('/game', {
            state: {
              mode: 'gauntlet',
              stageNumber: activeStage.id,
              stageName: activeStage.description,
              hand: playerHand
            }
          });
        }, 1000);
      }
    }
  }, [lastMessage, navigate, activeStage, playerHand]);

  return (
    <div className="h-screen bg-[#0a0515] relative overflow-hidden flex flex-col">
      {/* Referee Video Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          src="/assets/referee_practice.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0a0515]/20" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0515]/60 via-transparent to-[#0a0515]/40" />
      </div>

      <AnimatePresence>
        {showRefereeVideo && (
          <motion.div 
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <video
              src="/assets/Referee.mp4"
              autoPlay
              playsInline
              onEnded={handleVideoEnd}
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {countdown !== null && (
          <motion.div 
            className="fixed inset-0 flex flex-col items-center justify-center z-[120] pointer-events-none bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 2 }}
          >
            <motion.div
              key={countdown as React.Key}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className={`text-[15rem] font-bold italic tracking-tighter ${
                countdown === 'GO' || countdown === 'GO!' ? 'text-[#00ff00]' : 'text-[#00f0ff]'
              }`}
              style={{ 
                fontFamily: "'Orbitron', sans-serif",
                textShadow: countdown === 'GO' || countdown === 'GO!' ? '0 0 50px #00ff00' : '0 0 50px #00f0ff'
              }}
            >
              {countdown}
            </motion.div>
            {(countdown === 'GO' || countdown === 'GO!') && (
              <motion.p className="text-[#00ff00] font-black uppercase tracking-[1em] text-2xl" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>FIGHT!</motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
                      This will reset your Practice progress to Stage 1.
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

      <div className="relative z-10 py-8 px-6 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => navigate('/menu')}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-[#00f0ff]/30 transition-all z-20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-[#00f0ff]" />
              <span className="text-white/60 text-sm uppercase tracking-wider">Back to Menu</span>
            </motion.button>

            <motion.button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-[#ff006e]/30 transition-all z-20 group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RotateCcw className="w-5 h-5 text-white/40 group-hover:rotate-180 transition-transform duration-500" />
              <span className="text-white/60 text-sm uppercase tracking-wider font-bold">RESET</span>
            </motion.button>
          </div>

          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
            animate={{
              textShadow: [
                '0 0 20px rgba(0, 240, 255, 0.6)',
                '0 0 40px rgba(0, 240, 255, 0.8)',
                '0 0 20px rgba(0, 240, 255, 0.6)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              type: 'tween',
            }}
          >
            <h1 
              className="text-5xl font-black italic tracking-tight text-[#00f0ff] mb-1"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              PRACTICE MODE
            </h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.4em] text-[10px]">
              ELEVATE YOUR COMBAT DATA
            </p>
          </motion.div>

          <div className="w-32" />
        </div>
      </div>

      <div className="relative z-10 flex-1 flex items-end justify-end pr-24 pb-24 min-h-0">
        <div className="w-full max-w-sm">
          <div className="relative">
            <div className="flex flex-col-reverse items-center justify-between min-h-[500px] relative">
              <div className="absolute left-1/2 -translate-x-1/2 top-10 bottom-10 w-1 bg-white/5 overflow-hidden">
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 bg-[#00f0ff] shadow-[0_0_15px_#00f0ff]"
                  initial={{ height: '0%' }}
                  animate={{ height: `${(gauntletProgress / 3) * 100}%` }}
                />
              </div>

              {stages.map((stage, index) => {
                const isBoss = stage.id === 3;
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
                    {isCleared && (
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.1 }}
                      >
                        <motion.div
                          className="absolute inset-0 rounded-full bg-[#00f0ff]/20 blur-2xl"
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.3, 0.6, 0.3],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                          }}
                        />

                        <div className="w-40 h-40 rounded-full border-4 border-[#00f0ff] bg-gradient-to-br from-[#00f0ff]/20 to-transparent shadow-[0_0_60px_rgba(0,240,255,0.4)] flex items-center justify-center relative overflow-hidden group">
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-t from-[#00f0ff]/30 to-transparent"
                            animate={{ opacity: [0.2, 0.5, 0.2] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />

                          <img
                            src={stage.image}
                            alt={stage.name}
                            className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500"
                          />

                          <div className="absolute top-2 right-2 w-10 h-10 bg-[#00f0ff] rounded-full flex items-center justify-center shadow-[0_0_20px_#00f0ff] z-10 border-2 border-[#0a0515]">
                            <span className="text-black font-black text-sm">✓</span>
                          </div>
                        </div>

                        <div className="text-center mt-3">
                          <p className="text-[#00f0ff] text-base font-bold drop-shadow-[0_0_10px_#00f0ff]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                            {stage.name}
                          </p>
                          <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">SUCCESS</p>
                        </div>
                      </motion.div>
                    )}

                    {isUnlocking && (
                      <div className="relative">
                        <AnimatePresence>
                          {showUnlockAnimation && fragments.map((fragment) => (
                            <motion.div
                              key={fragment.id}
                              className="absolute top-1/2 left-1/2 w-8 h-8 bg-gradient-to-br from-[#ffaa00] to-[#ff006e] rounded-sm"
                              style={{
                                boxShadow: '0 0 20px rgba(255, 170, 0, 0.8)',
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
                            <Lock className="w-24 h-24 text-[#ffaa00]" strokeWidth={2} />
                          </motion.div>
                        )}

                        <motion.div
                          className="w-56 h-56 rounded-full border-4 border-[#ffff00] bg-gradient-to-br from-[#ffff00]/30 to-transparent shadow-[0_0_80px_rgba(255,255,0,0.3)] flex items-center justify-center relative overflow-hidden group cursor-pointer"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1.1, opacity: 1 }}
                          whileHover={{ scale: 1.15 }}
                        >
                          <motion.div
                            className="absolute inset-0 bg-white/10"
                            animate={{ opacity: [0, 0.2, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          <img
                            src={stage.image}
                            alt={stage.name}
                            className="w-full h-full object-cover"
                          />
                        </motion.div>

                        {isUnlocking && !showUnlockAnimation && (
                          <motion.div
                            className="absolute right-[calc(100%+4rem)] top-1/2 -translate-y-1/2 whitespace-nowrap"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1 }}
                          >
                            <motion.button
                              onClick={handleInitiateBattle}
                              className="px-12 py-6 bg-[#ffff00] text-black font-black italic rounded-2xl shadow-[0_0_50px_rgba(255,255,0,0.6)] hover:scale-105 transition-all flex items-center gap-5 relative overflow-hidden group"
                            >
                              <div className="absolute inset-0 bg-white/40 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                              <Zap className="w-8 h-8 fill-current" />
                              <span className="text-3xl tracking-tighter uppercase">Engage Target</span>
                              <ChevronRight className="w-8 h-8" />
                            </motion.button>
                          </motion.div>
                        )}

                        <motion.div
                          className="text-center mt-6"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.2 }}
                        >
                          <p className="text-[#ffff00] text-xl font-bold drop-shadow-[0_0_15px_rgba(255,255,0,0.5)]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                            {stage.name}
                          </p>
                          <p className="text-white text-xs uppercase font-bold tracking-[0.3em] mt-1">{stage.description}</p>
                        </motion.div>
                      </div>
                    )}

                    {isLocked && (
                      <div className="relative">
                        <div className="w-32 h-32 rounded-full border-2 border-white/10 bg-black/40 flex items-center justify-center relative overflow-hidden grayscale opacity-30">
                          <Lock className="w-10 h-10 text-white/20" strokeWidth={1.5} />
                          <img
                            src={stage.image}
                            alt={stage.name}
                            className="w-full h-full object-cover opacity-20"
                          />
                        </div>

                        <div className="text-center mt-3 opacity-20">
                          <p className="text-white text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                            {stage.name}
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}