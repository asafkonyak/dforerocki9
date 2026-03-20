import { useNavigate } from 'react-router';
import { GlassCard } from '../components/GlassCard';
import { Swords, Bot, Zap, Trophy, ChevronRight, ArrowLeft, LogOut, AlertTriangle, Edit2, User, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useSocket } from '../../contexts/SocketContext';
import { AvatarDisplay } from '../components/AvatarDisplay';
import Lightning from '../components/Lightning';

const DIFFICULTY_ICONS = ['🤖', '🦾', '💀'];
const PROGRESSION_LEVELS = 5;

export function MainMenuScreen() {
  const navigate = useNavigate();
  const { isConnected, isError } = useSocket();
  const [playerData, setPlayerData] = useState<{
    id: string;
    username: string;
    xp: number;
    gauntlet_progress: number;
    avatar_url: string;
    win_count: number;
    loss_count: number;
    last_results: string;
  } | null>(null);
  const [selectedGameType, setSelectedGameType] = useState<'1_round' | 'bo3' | 'bo5' | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const bossVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function fetchPlayerData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        let playerId = localStorage.getItem('fighter_player_id');
        
        if (user) {
          const { data: player } = await supabase.from('players').select('id').eq('user_id', user.id).maybeSingle();
          if (player?.id) playerId = player.id;
        }

        if (playerId) {
          const { data, error } = await supabase
            .from('players')
            .select('id, username, xp, gauntlet_progress, avatar_url, win_count, loss_count, last_results')
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

  const handleLogout = async () => {
    // Navigate home which acts as logout/exit
    navigate('/');
  };

  return (
    <div className="h-screen bg-gradient-to-b from-[#0a0515] via-[#1a0a2e] to-[#0a0515] overflow-hidden flex flex-col relative">
      {/* Lightning Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-40 mix-blend-screen">
        {/* Left Lightning (Blue-ish) */}
        <div 
          className="absolute top-1/2 -left-[450px] -translate-y-1/2" 
          style={{ width: '1080px', height: '1080px' }}
        >
          <Lightning
            hue={220}
            xOffset={0.9}
            speed={1.6}
            intensity={1.6}
            size={1.6}
          />
        </div>

        {/* Right Lightning (Red-ish) */}
        <div 
          className="absolute top-1/2 -right-[450px] -translate-y-1/2" 
          style={{ width: '1080px', height: '1080px' }}
        >
          <Lightning
            hue={0}
            xOffset={-1.2}
            speed={1.6}
            intensity={2}
            size={1.6}
          />
        </div>
      </div>

      {/* Enhanced Header with Back Icon, Title, and Hardware Sync Badge */}
      <motion.div
        className="relative z-10 py-6 px-6 flex-shrink-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Player Info Card (Restyled as Stories/HUD) */}
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <GlassCard className="p-4 border-2 border-[#00f0ff]/20 bg-black/60 shadow-[0_0_25px_rgba(0,0,0,0.5)] flex items-center gap-5 min-w-[340px]">
              {/* Avatar with Hub-Style Edit Icon */}
              <div className="relative flex-shrink-0 group">
                <div className="p-0.5 rounded-full bg-gradient-to-br from-[#00f0ff] to-[#ff006e] shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                  <AvatarDisplay 
                    avatar={playerData?.avatar_url || '👤'} 
                    size="lg" 
                    className="w-20 h-20 border-2 border-black" 
                  />
                </div>
                {/* Visible edit trigger - Moved to bottom-left as requested */}
                <button 
                  onClick={() => navigate('/onboarding', { state: { isEditing: true } })}
                  className="absolute bottom-0 left-0 w-8 h-8 bg-[#1a0a2e] border border-[#00f0ff]/50 rounded-full flex items-center justify-center text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black hover:shadow-[0_0_15px_#00f0ff] transition-all z-10"
                  title="Edit Profile"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Player Info & Stats */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <h3 className="text-2xl text-white font-bold truncate tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {playerData?.username || 'PLAYER'}
                  </h3>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-white/30 uppercase tracking-widest leading-none mb-1">XP Points</span>
                    <span className="text-[#ffff00] text-sm font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                      {playerData?.xp || 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 h-12">
                  {/* Win Ratio */}
                  <div className="flex flex-col justify-center h-full">
                    <span className="text-[9px] text-white/40 uppercase tracking-widest mb-1.5">Win Ratio</span>
                    <div className="flex items-center gap-1 leading-none">
                      <span className="text-xl text-[#00ff00] font-bold italic leading-none">
                        {playerData ? Math.round((playerData.win_count / (Math.max(1, playerData.win_count + playerData.loss_count))) * 100) : 0}
                      </span>
                      <span className="text-[10px] text-[#00ff00]/60 font-bold leading-none">%</span>
                    </div>
                  </div>
                  
                  {/* Vertical Divider */}
                  <div className="self-center w-px h-8 bg-white/10" />

                  {/* Recent Match History */}
                  <div className="flex flex-col justify-center h-full">
                    <span className="text-[9px] text-white/40 uppercase tracking-widest mb-1.5">Recent Flow</span>
                    <div className="flex gap-1.5 items-center h-[20px]">
                      {(playerData?.last_results || '').split(',').filter(Boolean).slice(-5).map((res, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className={`w-2.5 h-2.5 rounded-full ${res === 'W' ? 'bg-[#00ff00] shadow-[0_0_8px_#00ff00]' : 'bg-[#ff006e] shadow-[0_0_8px_#ff006e]'}`}
                        />
                      ))}
                      {/* Placeholders */}
                      {Array.from({ length: Math.max(0, 5 - (playerData?.last_results || '').split(',').filter(Boolean).length) }).map((_, i) => (
                        <div key={`p-${i}`} className="w-2.5 h-2.5 rounded-full bg-white/5 border border-white/5" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

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
                  <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentcolor] ${
                    isConnected ? 'bg-[#00ff00] text-[#00ff00]' : 
                    isError ? 'bg-[#ff0000] text-[#ff0000]' : 
                    'bg-[#888888] text-[#888888]'
                  }`} />
                  {/* Outer glow ring */}
                  <motion.div
                    className={`absolute inset-0 rounded-full border-2 ${
                      isConnected ? 'border-[#00ff00]' : 
                      isError ? 'border-[#ff0000]' : 
                      'border-[#888888]'
                    }`}
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
                  <div className={`font-bold uppercase tracking-wider ${
                    isConnected ? 'text-[#00ff00]' : 
                    isError ? 'text-[#ff0000]' : 
                    'text-white/60'
                  }`} style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    ROCKY: {isConnected ? 'CONNECTED' : isError ? 'ERROR' : 'OFFLINE'}
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
              onClick={() => setShowLogoutConfirm(true)}
              className="text-white/40 hover:text-[#ff006e] transition-colors text-sm uppercase tracking-wider flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Exit to Home
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

      {/* Removed Bottom Left Card - Moved to Top Hud */}

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md"
            >
              <GlassCard className="p-8 border-2 border-[#ff006e]/50 bg-gradient-to-b from-[#1a0a2e] to-[#0a0515] overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#ff006e] blur-[60px] opacity-20 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-[#ff006e]/20 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,0,110,0.3)]">
                    <AlertTriangle className="w-8 h-8 text-[#ff006e]" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    ABANDON SESSION?
                  </h2>
                  
                  <p className="text-white/60 text-sm mb-8 leading-relaxed">
                    You are about to log out. Unsaved progress might be lost. Are you prepared to exit the arena?
                  </p>
                  
                  <div className="flex flex-col w-full gap-3">
                    <button
                      onClick={handleLogout}
                      className="w-full py-4 rounded-xl bg-[#ff006e] text-white font-bold uppercase tracking-widest hover:bg-[#ff006e]/80 transition-all shadow-[0_0_20px_rgba(255,0,110,0.4)] flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-5 h-5" /> Confirm Logout
                    </button>
                    
                    <button
                      onClick={() => setShowLogoutConfirm(false)}
                      className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      Stay in Arena
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}