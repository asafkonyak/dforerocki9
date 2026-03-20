import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '../components/GlassCard';
import { Zap, Trophy, Target, Swords, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AvatarDisplay } from '../components/AvatarDisplay';

export function VersusScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(5);
  const [player1, setPlayer1] = useState<any>(null);
  const [player2, setPlayer2] = useState<any>(null);
  const [isVideoFinished, setIsVideoFinished] = useState(false);

  const matchId = location.state?.matchId;
  const opponentData = location.state?.opponent;
  const gameType = location.state?.gameType || '1_round';
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Attempt to force play if autoplay is blocked
    if (!isVideoFinished && videoRef.current) {
      videoRef.current.play().catch(err => {
        console.warn("Video autoplay blocked:", err);
        setIsVideoFinished(true); // Skip video and just do countdown
      });
    }
  }, [isVideoFinished]);

  useEffect(() => {
    async function loadPlayers() {
      try {
        // 1. Get Match record to determine roles
        if (!matchId) {
          // Fallback if no matchId (e.g. Gauntlet)
          const { data: { user } } = await supabase.auth.getUser();
          let currentId = localStorage.getItem('fighter_player_id');
          if (user) {
            const { data: p } = await supabase.from('players').select('id').eq('user_id', user.id).maybeSingle();
            if (p?.id) currentId = p.id;
          }
          
          if (currentId) {
            const { data: p1 } = await supabase.from('players').select('*').eq('id', currentId).single();
            if (p1) setPlayer1(mapPlayerData(p1, 1));
          }
          
          if (opponentData) {
            setPlayer2(mapPlayerData(opponentData, 10)); // Dummy level for opponent
          } else {
            setPlayer2({ name: 'CYBER_QUEEN', avatar: '👑', level: 38, wins: 134, winRate: 72, power: 88, speed: 90 });
          }
          return;
        }

        const { data: match, error: matchError } = await supabase
          .from('matches')
          .select('player1_id, player2_id')
          .eq('id', matchId)
          .single();

        if (matchError || !match) throw matchError || new Error('Match not found');

        // 2. Fetch both profiles
        const { data: p1Data } = await supabase.from('players').select('*').eq('id', match.player1_id).single();
        const { data: p2Data } = await supabase.from('players').select('*').eq('id', match.player2_id).single();

        if (p1Data) setPlayer1(mapPlayerData(p1Data, 1)); // Map using shared logic
        if (p2Data) setPlayer2(mapPlayerData(p2Data, 2));

      } catch (err) {
        console.error('Error loading players:', err);
      }
    }

    // Helper to map DB record to UI state
    function mapPlayerData(p: any, role: number) {
      return {
        name: p.username || (role === 1 ? 'PLAYER_01' : 'PLAYER_02'),
        avatar: p.avatar_url,
        level: Math.floor((p.xp || 0) / 100) + 1,
        wins: p.win_count || 0,
        winRate: p.win_count + (p.loss_count || 0) > 0 
          ? Math.round((p.win_count / (p.win_count + (p.loss_count || 0))) * 100) 
          : 0,
        power: 75 + Math.min(25, (p.xp || 0) / 500),
        speed: 80 + (role === 2 ? 8 : 0), // Slight variation for flavor
      };
    }

    loadPlayers();
  }, [matchId, opponentData]);

  useEffect(() => {
    if (!isVideoFinished) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setTimeout(() => {
        navigate('/game', { 
          state: { 
            matchId, 
            mode: 'ranked', 
            opponent: player2, 
            isPlayer1: location.state?.isPlayer1,
            gameType 
          } 
        });
      }, 500);
    }
  }, [countdown, isVideoFinished, navigate, matchId, player2]);

  if (!player1 || !player2) {
    return (
      <div className="min-h-screen bg-[#0a0515] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0515] relative overflow-hidden">
      {/* Diagonal Split Background */}
      <div className="absolute inset-0">
        {/* Bottom-left Cyan section */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-[#00f0ff]/20 via-transparent to-transparent"
          style={{
            clipPath: 'polygon(0 0, 0 100%, 100% 100%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
        
        {/* Top-right Pink section */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-bl from-[#ff006e]/20 via-transparent to-transparent"
          style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />

        {/* Animated gradient blobs */}
        <motion.div
          className="absolute w-96 h-96 bg-[#00f0ff] rounded-full blur-[120px] opacity-30"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            type: "tween"
          }}
          style={{ bottom: '10%', left: '10%' }}
        />
        
        <motion.div
          className="absolute w-96 h-96 bg-[#ff006e] rounded-full blur-[120px] opacity-30"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            type: "tween"
          }}
          style={{ top: '10%', right: '10%' }}
        />
      </div>

      {/* Massive VS Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="text-[20rem] font-bold text-white/5"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            textShadow: '0 0 80px rgba(0, 240, 255, 0.3), 0 0 120px rgba(255, 0, 110, 0.3)',
          }}
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1, type: "spring", bounce: 0.3 }}
        >
          VS
        </motion.div>
      </div>

      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(#00f0ff 1px, transparent 1px),
            linear-gradient(90deg, #00f0ff 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        {/* Player 1 - Bottom Left */}
        <motion.div
          className="absolute bottom-8 left-8 max-w-xs"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <GlassCard className="p-5 border-2 border-[#00f0ff] shadow-[0_0_30px_rgba(0,240,255,0.5)]">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0a0515] to-[#1a0a2e] border-2 border-[#00f0ff] flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.6)] overflow-hidden">
                  <AvatarDisplay avatar={player1.avatar} size="lg" className="w-full h-full rounded-none" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-[#00f0ff]"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.8, 0, 0.8],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    type: "tween"
                  }}
                />
              </div>
              <div>
                <h3 className="text-2xl text-[#00f0ff] font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  {player1.name}
                </h3>
                <p className="text-white/60 text-sm">Level {player1.level}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Wins</span>
                <span className="text-[#00f0ff] font-bold">{player1.wins}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Win Rate</span>
                <span className="text-[#00f0ff] font-bold">{player1.winRate}%</span>
              </div>
              
              {/* Power bar */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-white/60">Power</span>
                  <span className="text-[#00f0ff]">{player1.power}</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#00f0ff] to-[#00ffff]"
                    initial={{ width: 0 }}
                    animate={{ width: `${player1.power}%` }}
                    transition={{ duration: 1, delay: 0.8 }}
                  />
                </div>
              </div>

              {/* Speed bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-white/60">Speed</span>
                  <span className="text-[#00f0ff]">{player1.speed}</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#00f0ff] to-[#00ffff]"
                    initial={{ width: 0 }}
                    animate={{ width: `${player1.speed}%` }}
                    transition={{ duration: 1, delay: 1 }}
                  />
                </div>
              </div>
            </div>

            {/* Badge */}
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-center gap-2">
              <Trophy className="w-4 h-4 text-[#00f0ff]" />
              <span className="text-[#00f0ff] text-xs uppercase tracking-wider">Player 1</span>
            </div>
          </GlassCard>
        </motion.div>

        {/* Player 2 - Top Right */}
        <motion.div
          className="absolute top-8 right-8 max-w-xs"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <GlassCard className="p-5 border-2 border-[#ff006e] shadow-[0_0_30px_rgba(255,0,110,0.5)]">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0a0515] to-[#1a0a2e] border-2 border-[#ff006e] flex items-center justify-center shadow-[0_0_30px_rgba(255,0,110,0.6)] overflow-hidden">
                  <AvatarDisplay avatar={player2.avatar} size="lg" className="w-full h-full rounded-none" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-[#ff006e]"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.8, 0, 0.8],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: 0.5,
                    type: "tween"
                  }}
                />
              </div>
              <div>
                <h3 className="text-2xl text-[#ff006e] font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  {player2.name}
                </h3>
                <p className="text-white/60 text-sm">Level {player2.level}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Wins</span>
                <span className="text-[#ff006e] font-bold">{player2.wins}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Win Rate</span>
                <span className="text-[#ff006e] font-bold">{player2.winRate}%</span>
              </div>
              
              {/* Power bar */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-white/60">Power</span>
                  <span className="text-[#ff006e]">{player2.power}</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#ff006e] to-[#ff0080]"
                    initial={{ width: 0 }}
                    animate={{ width: `${player2.power}%` }}
                    transition={{ duration: 1, delay: 0.9 }}
                  />
                </div>
              </div>

              {/* Speed bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-white/60">Speed</span>
                  <span className="text-[#ff006e]">{player2.speed}</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#ff006e] to-[#ff0080]"
                    initial={{ width: 0 }}
                    animate={{ width: `${player2.speed}%` }}
                    transition={{ duration: 1, delay: 1.1 }}
                  />
                </div>
              </div>
            </div>

            {/* Badge */}
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-center gap-2">
              <Target className="w-4 h-4 text-[#ff006e]" />
              <span className="text-[#ff006e] text-xs uppercase tracking-wider">Player 2</span>
            </div>
          </GlassCard>
        </motion.div>

        {/* Center - Tutorial & Countdown Card */}
        <motion.div
          className="max-w-lg w-full"
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.6, type: "spring", bounce: 0.4 }}
        >
          <GlassCard className="p-8 border-2 border-white/30 shadow-[0_0_60px_rgba(0,240,255,0.3),0_0_60px_rgba(255,0,110,0.3)] relative overflow-hidden">
            {/* Holographic glow effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-[#00f0ff]/20 via-[#ff006e]/20 to-[#00f0ff]/20"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
                type: "tween"
              }}
            />

            <div className="relative z-10">
              {/* Header */}
              <motion.h2
                className="text-center text-2xl mb-4 bg-gradient-to-r from-[#00f0ff] via-[#ff006e] to-[#ffff00] bg-clip-text text-transparent"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
                animate={{
                  opacity: [1, 0.7, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  type: "tween"
                }}
              >
                PREPARE FOR BATTLE
              </motion.h2>

              {/* Referee Video - fully removed after playback */}
              <AnimatePresence>
                {!isVideoFinished && (
                  <motion.div
                    className="relative mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-[#1a0a2e] to-[#0a0515] border-2 border-white/20 aspect-video"
                    exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <video 
                      ref={videoRef}
                      src="/assets/Referee.mp4" 
                      autoPlay 
                      playsInline
                      onEnded={() => setIsVideoFinished(true)}
                      onError={(e) => {
                        console.error("Video failed to play", e);
                        setIsVideoFinished(true);
                      }}
                      className="w-full h-full object-cover"
                    />
                    {/* Video status indicator */}
                    <div className="absolute top-4 right-4 px-3 py-1 bg-red-600 rounded-full flex items-center gap-2">
                      <motion.div
                        className="w-2 h-2 bg-white rounded-full"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity, type: "tween" }}
                      />
                      <span className="text-white text-xs uppercase font-bold">Referee</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Massive Countdown */}
              <div className="text-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={countdown}
                    initial={{ scale: 2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.3, type: "spring" }}
                    className="relative inline-block"
                  >
                    <div
                      className="text-[10rem] leading-none font-bold bg-gradient-to-b from-[#00f0ff] via-[#ff006e] to-[#ffff00] bg-clip-text text-transparent"
                      style={{
                        fontFamily: "'Orbitron', sans-serif",
                        WebkitTextStroke: '2px rgba(255,255,255,0.3)',
                      }}
                    >
                      {countdown}
                    </div>
                    
                    {/* Glow effect */}
                    <motion.div
                      className="absolute inset-0 blur-2xl opacity-50"
                      style={{
                        background: countdown > 2 
                          ? 'radial-gradient(circle, #00f0ff 0%, transparent 70%)'
                          : countdown > 0
                          ? 'radial-gradient(circle, #ff006e 0%, transparent 70%)'
                          : 'radial-gradient(circle, #ffff00 0%, transparent 70%)'
                      }}
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        type: "tween"
                      }}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Pulsing ready indicator */}
                {countdown <= 2 && (
                  <motion.div
                    className="mt-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Zap className="w-6 h-6 text-[#ffff00]" />
                      <span className="text-[#ffff00] text-xl uppercase tracking-wider font-bold">
                        Get Ready!
                      </span>
                      <Zap className="w-6 h-6 text-[#ffff00]" />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Energy particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: i % 2 === 0 ? '#00f0ff' : '#ff006e',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              type: "tween"
            }}
          />
        ))}
      </div>
    </div>
  );
}