import { useNavigate } from 'react-router';
import { GlassCard } from '../components/GlassCard';
import { Swords, Bot, Zap, Trophy, ChevronRight, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

const DIFFICULTY_ICONS = ['🤖', '🦾', '💀'];
const PROGRESSION_LEVELS = 5;

export function MainMenuScreen() {
  const navigate = useNavigate();
  const [playerData, setPlayerData] = useState<{
    username: string;
    xp: number;
    gauntlet_progress: number;
  } | null>(null);
  const [selectedGameType, setSelectedGameType] = useState<'1_round' | 'bo3' | 'bo5' | null>(null);
  const bossVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function fetchPlayerData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        let playerId = localStorage.getItem('fighter_player_id');
        
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('player_id').eq('id', user.id).maybeSingle();
          if (profile?.player_id) playerId = profile.player_id;
        }

        if (playerId) {
          const { data, error } = await supabase
            .from('players')
            .select('username, xp, gauntlet_progress')
            .eq('id', playerId)
            .maybeSingle();
            
          if (error) throw error;
          if (data) setPlayerData(data);
        }
      } catch (err) {
        console.error("Error fetching player data:", err);
      }
    }

    fetchPlayerData();
  }, []);

  return (
    <div className="h-screen bg-gradient-to-b from-[#0a0515] via-[#1a0a2e] to-[#0a0515] overflow-hidden flex flex-col">
      {/* Enhanced Header with Back Icon, Title, and Hardware Sync Badge */}
      <motion.div
        className="relative z-10 py-6 px-6 flex-shrink-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Back Button */}
          <motion.button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-[#00f0ff]/30 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-[#00f0ff]" />
            <span className="text-white/60 text-sm uppercase tracking-wider">Back</span>
          </motion.button>

          {/* Center: Glowing Title */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
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
              className="text-4xl font-bold text-[#00f0ff]"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              GAME MODES
            </h1>
          </motion.div>

          {/* Right: Hardware Sync Badge */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="px-4 py-2 border-2 border-[#00ff00]/40 bg-gradient-to-r from-[#00ff00]/10 to-[#00ff00]/5 shadow-[0_0_20px_rgba(0,255,0,0.4)]">
              <div className="flex items-center gap-3">
                {/* Pulsing Green Dot */}
                <motion.div
                  className="relative"
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    type: 'tween',
                  }}
                >
                  <div className="w-3 h-3 rounded-full bg-[#00ff00] shadow-[0_0_10px_#00ff00]" />
                  {/* Outer glow ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-[#00ff00]"
                    animate={{
                      scale: [1, 2, 1],
                      opacity: [0.8, 0, 0.8],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      type: 'tween',
                    }}
                  />
                </motion.div>

                {/* Badge Text */}
                <div className="text-sm">
                  <div className="text-[#00ff00] font-bold uppercase tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    ROCKI: CONNECTED
                  </div>
                  <div className="text-white/40 text-xs uppercase tracking-wider">
                    Hardware Synced
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content - Scrollable if needed */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Game Mode Cards - Horizontal Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Global Tournament - Disabled */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <GlassCard className="p-6 relative h-full min-h-[520px]" disabled>
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-[#ffff00]/10 flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-[#ffff00]" />
                  </div>
                  <div>
                    <h3 className="text-xl text-white/50 mb-2">Global Tournament</h3>
                    <p className="text-sm text-white/30">Compete worldwide</p>
                  </div>
                </div>
                {/* Coming Soon Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-[#ffff00]/20 border border-[#ffff00] rounded-full">
                  <span className="text-[#ffff00] text-xs uppercase tracking-wider">Coming Soon</span>
                </div>
              </GlassCard>
            </motion.div>

            {/* Online 1v1 - Active */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <GlassCard 
                className="p-6 relative overflow-hidden h-full flex flex-col min-h-[520px]" 
              >
                {/* Video Background */}
                <div className="absolute inset-0 z-0">
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  >
                    <source src="/assets/1v1.mp4" type="video/mp4" />
                  </video>
                  {/* Dark overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0515]/90 via-[#0a0515]/50 to-[#0a0515]/30" />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center gap-4 flex-1">
                  <div className="w-16 h-16 rounded-xl bg-[#00f0ff]/20 flex items-center justify-center shadow-[0_0_20px_#00f0ff80] backdrop-blur-sm">
                    <Swords className="w-8 h-8 text-[#00f0ff]" />
                  </div>
                  <div>
                    <h3 className="text-xl text-white mb-2 font-bold tracking-tight drop-shadow-lg">Online 1v1</h3>
                    <p className="text-sm text-[#00f0ff] drop-shadow-lg font-bold">Real-time battles</p>
                  </div>
                  
                  <div className="mt-4 text-xs text-white/40 uppercase tracking-widest font-bold">Select Mode to Play</div>

                  {/* Game Type Selection - Box Style triggers navigation */}
                  <div className="flex gap-2 w-full mt-auto pt-6 border-t border-white/10">
                    {[
                      { id: '1_round', label: '1 Round', icon: <Zap className="w-5 h-5" /> },
                      { id: 'bo3', label: 'Best of 3', icon: <Trophy className="w-5 h-5" /> },
                      { id: 'bo5', label: 'Best of 5', icon: <Swords className="w-5 h-5" /> },
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGameType(type.id as any);
                          navigate('/matchmaking', { state: { gameType: type.id } });
                        }}
                        className={`
                          flex-1 h-[100px] flex flex-col items-center justify-center gap-2 px-1 rounded-xl border transition-all group/btn backdrop-blur-sm
                          ${selectedGameType === type.id 
                            ? 'bg-[#00f0ff]/30 border-[#00f0ff] text-[#00f0ff] shadow-[0_0_15px_#00f0ff60]' 
                            : 'bg-white/5 border-white/10 text-white/40 hover:bg-[#00f0ff]/10 hover:border-[#00f0ff]/50 hover:text-[#00f0ff]'
                          }
                        `}
                      >
                        <div className={`transition-transform duration-300 group-hover/btn:scale-110 ${selectedGameType === type.id ? 'scale-110' : ''}`}>
                          {type.icon}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tighter whitespace-nowrap">
                          {type.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <GlassCard 
                className="p-6 h-full flex flex-col relative overflow-hidden min-h-[520px]" 
              >
                {/* Video Background */}
                <div className="absolute inset-0 z-0">
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  >
                    <source src="/assets/training.mp4" type="video/mp4" />
                  </video>
                  {/* Dark overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0515]/90 via-[#0a0515]/50 to-[#0a0515]/30" />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center gap-4 flex-1">
                  <div className="w-16 h-16 rounded-xl bg-[#ff006e]/20 flex items-center justify-center shadow-[0_0_20px_#ff006e80] backdrop-blur-sm">
                    <Bot className="w-8 h-8 text-[#ff006e]" />
                  </div>
                  <div>
                    <h3 className="text-xl text-white mb-2 font-bold tracking-tight drop-shadow-lg">Training Mode</h3>
                    <p className="text-sm text-[#ff006e] drop-shadow-lg font-bold">Vs Computer</p>
                  </div>

                  <div className="mt-4 text-xs text-white/40 uppercase tracking-widest font-bold">Select Difficulty</div>
                  
                  {/* Difficulty Selection - Box Style */}
                  <div className="flex gap-2 w-full mt-auto pt-6 border-t border-white/10">
                    {[
                      { id: 'easy', label: 'ROOKIE', icon: '🥉' },
                      { id: 'medium', label: 'FIGHTER', icon: '🥈' },
                      { id: 'hard', label: 'MASTER', icon: '🥇' },
                    ].map((diff) => (
                      <button
                        key={diff.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/training');
                        }}
                        className={`
                          flex-1 h-[100px] flex flex-col items-center justify-center gap-2 px-1 rounded-xl border transition-all group/btn
                          bg-white/5 border-white/10 text-white/40 hover:bg-[#ff006e]/10 hover:border-[#ff006e]/50 hover:text-[#ff006e] backdrop-blur-sm
                        `}
                      >
                        <div className="text-2xl transition-transform duration-300 group-hover/btn:scale-110 leading-none">
                          {diff.icon}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tighter">
                          {diff.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Defeat the Robot */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <GlassCard 
                className="p-6 h-full relative overflow-hidden min-h-[520px]" 
                onClick={() => navigate('/gauntlet')}
              >
                {/* Video Background */}
                <div className="absolute inset-0 z-0">
                  <video
                    ref={bossVideoRef}
                    src="/assets/robots/bosRobot.mp4"
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {/* Dark overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0515]/90 via-[#0a0515]/50 to-[#0a0515]/30" />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center gap-4 h-full">
                  <div className="w-16 h-16 rounded-xl bg-[#ffff00]/20 flex items-center justify-center backdrop-blur-sm">
                    <Zap className="w-8 h-8 text-[#ffff00]" />
                  </div>
                  <div>
                    <h3 className="text-xl text-white mb-2 drop-shadow-lg">Defeat the Robot</h3>
                    <p className="text-sm text-[#ffff00] drop-shadow-lg">Boss progression</p>
                  </div>
                            {/* Progression Pyramid */}
                  <div className="mt-auto pt-4 border-t border-white/10 w-full">
                    <div className="flex flex-col items-center gap-2">
                      {[...Array(PROGRESSION_LEVELS)].map((_, index) => {
                        const level = PROGRESSION_LEVELS - index;
                        const width = 20 + (level * 15);
                        const progress = playerData?.gauntlet_progress || 1;
                        const isCompleted = level < progress;
                        const isCurrent = level === progress && progress <= 5;
                        
                        return (
                          <div
                            key={index}
                            className={`
                              h-6 rounded flex items-center justify-center text-xs
                              transition-all duration-300
                              ${isCompleted 
                                ? 'bg-[#ffff00]/30 border border-[#ffff00]' 
                                : isCurrent
                                ? 'bg-[#ffff00]/50 border-2 border-[#ffff00] animate-pulse'
                                : 'bg-white/5 border border-white/10'
                              }
                            `}
                            style={{ width: `${width}%` }}
                          >
                            {index === 0 && <span className="text-[#ffff00] drop-shadow-lg">👑 BOSS</span>}
                            {isCurrent && <span className="text-[#ffff00]">⚡</span>}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-center text-xs text-white/60 mt-3 drop-shadow-lg">
                      {playerData?.gauntlet_progress && playerData.gauntlet_progress > 5 
                        ? 'Gauntlet Conquered! 🏆' 
                        : `Level ${playerData?.gauntlet_progress || 1}/5 • ${5 - (playerData?.gauntlet_progress || 1)} to Boss`}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Footer Navigation */}
          <motion.div
            className="pt-4 flex justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <button
              onClick={() => navigate('/')}
              className="text-white/60 hover:text-[#00f0ff] transition-colors text-sm uppercase tracking-wider"
            >
              ← Back to Home
            </button>

            <span className="text-white/30">|</span>
            <button
              onClick={() => navigate('/leaderboard')}
              className="text-white/60 hover:text-[#ffd700] transition-colors text-sm uppercase tracking-wider"
            >
              Leaderboard 🏆
            </button>
          </motion.div>
        </div>
      </div>

      {/* User Profile Card - Docked Bottom Left */}
      <motion.div
        className="absolute bottom-6 left-6 z-20"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <GlassCard className="p-4 border-2 border-[#00f0ff]/40 bg-gradient-to-r from-[#00f0ff]/10 to-[#ff006e]/10 shadow-[0_0_30px_rgba(0,240,255,0.4)] min-w-[280px]">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <motion.div
              className="relative"
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00f0ff] to-[#ff006e] p-0.5 shadow-[0_0_20px_rgba(0,240,255,0.6)]">
                <div className="w-full h-full rounded-xl bg-[#0a0515] flex items-center justify-center text-3xl">
                  🤖
                </div>
              </div>
              {/* Online indicator */}
              <motion.div
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#00ff00] border-2 border-[#0a0515]"
                animate={{
                  scale: [1, 1.2, 1],
                  boxShadow: [
                    '0 0 5px rgba(0, 255, 0, 0.6)',
                    '0 0 15px rgba(0, 255, 0, 1)',
                    '0 0 5px rgba(0, 255, 0, 0.6)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  type: 'tween',
                }}
              />
            </motion.div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 
                  className="text-white font-bold text-lg"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  {playerData?.username || 'CyberRex'}
                </h3>
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]"
                  animate={{
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    type: 'tween',
                  }}
                />
              </div>
              
              {/* XP Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#ffff00] font-bold uppercase tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    XP: {playerData?.xp || 0}
                  </span>
                  <span className="text-white/40">Level {Math.floor((playerData?.xp || 0) / 100) + 1}</span>
                </div>
                
                {/* Progress Bar */}
                <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#00f0ff] via-[#ffff00] to-[#ff006e] shadow-[0_0_10px_rgba(0,240,255,0.8)]"
                    initial={{ width: '0%' }}
                    animate={{ width: `${(playerData?.xp || 0) % 100}%` }}
                    transition={{ delay: 0.8, duration: 1, ease: 'easeOut' }}
                  />
                </div>
                
                <div className="text-xs text-white/40">
                  {(playerData?.xp || 0) % 100} / 100 XP to Level {Math.floor((playerData?.xp || 0) / 100) + 2}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}