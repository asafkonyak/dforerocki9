import { useNavigate } from 'react-router';
import { GlassCard } from '../components/GlassCard';
import { Swords, Bot, Zap, Trophy, ChevronRight, ArrowLeft, LogOut, AlertTriangle, Edit2, User, Target, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useSocket } from '../../contexts/SocketContext';
import { AvatarDisplay } from '../components/AvatarDisplay';
import Lightning from '../components/Lightning';
import { useGlobalAudio } from '../../contexts/AudioContext';

const DIFFICULTY_ICONS = ['🤖', '🦾', '💀'];
const PROGRESSION_LEVELS = 5;

export function MainMenuScreen() {
  const navigate = useNavigate();
  const { isConnected, isError } = useSocket();
  const { setDimmed } = useGlobalAudio();
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
  const [selectedGameType, setSelectedGameType] = useState<'1_round' | '3_round' | '5_round' | null>(null);
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
    
    // Dim music while on main menu (referee_menu video)
    setDimmed(true);
    
    return () => {
      setDimmed(false);
    };
  }, [setDimmed]);

  const handleLogout = async () => {
    // Navigate home which acts as logout/exit
    navigate('/cyber');
  };

  return (
    <div className="h-screen bg-gradient-to-b from-[#0a0515] via-[#1a0a2e] to-[#0a0515] overflow-hidden flex flex-col relative">
      {/* Lightning Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-40 mix-blend-screen">
        {/* Left Lightning (Blue-ish) */}
        <div 
          className="absolute top-1/2 -left-[300px] -translate-y-1/2" 
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
          className="absolute top-1/2 -right-[300px] -translate-y-1/2" 
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
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-[#ff006e]/20 hover:border-[#ff006e]/30 transition-all group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut className="w-4 h-4 text-[#ff006e]" />
              <span className="text-white/40 text-[10px] font-black uppercase tracking-widest group-hover:text-white transition-colors">Logout</span>
            </motion.button>
          </div>

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

          {/* Right: Hardware Sync Badge (Hidden for now as requested) */}
          <div className="hidden">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Former hardware sync GlassCard was here */}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content - Vertically Centered */}
      <div className="flex-1 flex items-center justify-center px-6 pb-16 min-h-0">
        <div className="max-w-[1800px] w-full mx-auto">
          {/* Game Mode Cards - Horizontal Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
            {/* Merged Cinema Card (Slots 1 & 2) */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <GlassCard className="p-10 relative overflow-hidden h-full min-h-[880px]">
                {/* Video Background */}
                <div className="absolute inset-0 z-0">
                  <video
                    autoPlay
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  >
                    <source src="/assets/referee_menu.mp4" type="video/mp4" />
                  </video>
                  {/* Styling overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0515]/80 via-transparent to-[#0a0515]/40" />
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
                </div>
                
                <div className="absolute bottom-20 left-20 right-20 z-20">
                  <div className="flex flex-col gap-8">
                    <p className="text-[#ffff00] text-6xl font-black italic tracking-widest uppercase [text-shadow:0_0_40px_#ffff00a0]" style={{ fontFamily: "'Orbitron', sans-serif" }}>READY TO FIGHT?</p>
                    <p className="text-white text-3xl leading-relaxed uppercase tracking-[0.1em] max-w-3xl font-bold [text-shadow:0_2px_20px_rgba(0,0,0,1)]">Train against robots or challenge a real opponent</p>
                  </div>
                </div>

                {/* Gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 pointer-events-none" />
              </GlassCard>
            </motion.div>

            {/* Online 1v1 - Simplified (Slot 3) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <GlassCard 
                className="p-10 relative overflow-hidden h-full flex flex-col min-h-[880px] cursor-pointer group hover:scale-[1.02] transition-transform" 
                onClick={() => navigate('/matchmaking', { state: { gameType: '1_round' } })}
              >
                {/* Video Background */}
                <div className="absolute inset-0 z-0">
                  <video autoPlay muted loop playsInline className="w-full h-full object-cover">
                    <source src="/assets/1v1.mp4" type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0515]/90 via-[#0a0515]/50 to-[#0a0515]/30" />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center gap-8 flex-1">
                  <div>
                    <h3 className="text-4xl text-white mb-6 font-bold tracking-tight drop-shadow-2xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>Online 1v1</h3>
                  </div>
                  
                  <div className="mt-auto w-full pt-10">
                     <div className="px-10 py-8 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-3xl group-hover:bg-[#00f0ff]/20 transition-colors text-center shadow-[0_0_30px_#00f0ff30]">
                        <span className="text-2xl text-[#00f0ff] font-black uppercase tracking-widest" style={{ fontFamily: "'Orbitron', sans-serif" }}>FIND OPPONENT</span>
                     </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Training Mode - Rebranded Boss Progression (Slot 4 - Color Red) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <GlassCard 
                className="p-10 h-full relative overflow-hidden min-h-[880px] cursor-pointer group hover:scale-[1.02] transition-transform" 
                onClick={() => navigate('/practice')}
              >
                {/* Video Background */}
                <div className="absolute inset-0 z-0">
                  <img
                    src="/assets/robots/allStages.png"
                    alt="Training Training"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0515]/90 via-[#0a0515]/50 to-[#0a0515]/30" />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center gap-8 h-full">
                  <div>
                    <h3 className="text-4xl text-white mb-6 font-bold tracking-tight drop-shadow-2xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>Training challenge</h3>
                  </div>
                  
                  {/* START TRAINING Button - Simplified */}
                  <div className="mt-auto w-full pt-8">
                    <div className="px-10 py-8 bg-[#ffff00]/10 border border-[#ffff00]/30 rounded-3xl group-hover:bg-[#ffff00]/20 transition-colors text-center shadow-[0_0_30px_#ffff0030]">
                      <span className="text-2xl text-[#ffff00] font-black uppercase tracking-widest" style={{ fontFamily: "'Orbitron', sans-serif" }}>START TRAINING</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Leaderboard Link Below Cards */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-8 flex justify-center"
          >
            <button
              onClick={() => navigate('/leaderboard')}
              className="group relative flex items-center gap-4 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-[#ffff00]/30 transition-all overflow-hidden"
            >
              {/* Background Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#ffff00]/0 via-[#ffff00]/5 to-[#ffff00]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              <Trophy className="w-6 h-6 text-[#ffff00] drop-shadow-[0_0_10px_rgba(255,255,0,0.5)]" />
              <div className="flex flex-col items-start leading-tight relative z-10">
                <span className="text-[#ffff00] text-sm font-black uppercase tracking-[0.2em] italic" style={{ fontFamily: "'Orbitron', sans-serif" }}>VIEW GLOBAL LEADERBOARD</span>
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">See how you rank against the world's best</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#ffff00]/40 group-hover:translate-x-1 group-hover:text-[#ffff00] transition-all" />

              {/* Glowing line effect */}
              <div className="absolute -bottom-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#ffff00]/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
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