import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '../components/GlassCard';
import Lightning from '../components/Lightning';
import { supabase } from '../../lib/supabase';
import { AvatarDisplay } from '../components/AvatarDisplay';
import { useSocket } from '../../contexts/SocketContext';
import { CameraFeed } from '../components/CameraFeed';

const RULES = [
  "Elbows - Do not lift your elbow.",
  "Hand - Never let go during play.",
  "Posture - Keep your shoulders perfectly square.",
];

export function OneVsOnePregameScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const matchId = location.state?.matchId;
  const isPlayer1 = location.state?.isPlayer1;
  const opponent = location.state?.opponent;
  const gameType = location.state?.gameType || '1_round';
  const playerHand = location.state?.hand || 'RIGHT';

  const { sendMessage, isConnected } = useSocket();

  const [phase, setPhase] = useState<'wait' | 'action'>('wait');
  const [profile, setProfile] = useState<{ username: string; avatar_url: string; xp: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rulesVideoRef = useRef<HTMLVideoElement>(null);

  // Fetch player profile
  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      let playerId = localStorage.getItem('fighter_player_id');

      if (user) {
        const { data: player } = await supabase.from('players').select('id').eq('user_id', user.id).maybeSingle();
        if (player?.id) playerId = player.id;
      }

      if (playerId) {
        const { data } = await supabase.from('players').select('username, avatar_url, xp').eq('id', playerId).maybeSingle();
        if (data) setProfile(data);
      }
    }
    fetchProfile();
  }, []);

  const handleReady = () => {
    setPhase('action');
    if (rulesVideoRef.current) {
      rulesVideoRef.current.play();
    }
  };

  const handleVideoEnd = () => {
    // Send INIT command after referee rules video ends
    const myPlayerId = localStorage.getItem('fighter_player_id') || 'GUEST';
    const handUpper = (playerHand || 'RIGHT').toUpperCase();

    // For 1v1, use a default power value
    let initValue = 10;
    if (handUpper === 'LEFT') {
      initValue = -initValue;
    }

    console.log('[1v1Pregame] Sending INIT after referee video ended.');
    sendMessage({
      cmd: {
        INIT: initValue,
        HAND: handUpper,
        PLAYER_ID: myPlayerId
      }
    });

    // Navigate to 1v1 game
    navigate('/1v1-game', {
      state: {
        matchId,
        mode: 'ranked',
        isPlayer1,
        opponent,
        gameType,
        hand: playerHand
      }
    });
  };

  return (
    <div className="h-screen bg-[#0a0515] relative overflow-hidden flex flex-col">
      {/* Background Layer 1: Dynamic Looping Background (Wait Phase) */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          src="/assets/robots/back_stage1.mp4"
        />
        
        {/* Dynamic Lightning Background */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-20 mix-blend-screen">
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" 
            style={{ width: '1200px', height: '1200px' }}
          >
            <Lightning
              hue={220}
              xOffset={0.5}
              speed={1.0}
              intensity={1.2}
              size={1.8}
            />
          </div>
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" 
            style={{ width: '1200px', height: '1200px' }}
          >
            <Lightning
              hue={0}
              xOffset={-0.5}
              speed={1.2}
              intensity={1.5}
              size={1.8}
            />
          </div>
        </div>
        
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* Background Layer 2: Referee Video (Action Phase) */}
      <div className="absolute inset-0 z-[5] overflow-hidden">
        <video
          ref={rulesVideoRef}
          src="/assets/referee_rules.mp4"
          playsInline
          preload="auto"
          onEnded={handleVideoEnd}
          className="w-full h-full object-cover transition-opacity duration-700"
          style={{ 
            opacity: phase === 'action' ? 1 : 0,
            visibility: phase === 'action' ? 'visible' : 'hidden'
          }}
        />
        <div className={`absolute inset-0 bg-black/20 transition-opacity duration-1000 ${phase === 'action' ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      {/* Bottom Interface Layer */}
      <div className="flex-1 flex items-end justify-between px-24 pb-16 z-30 relative">
        {/* Player Card (Left) */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-[400px]"
        >
          <GlassCard className="p-3 border-2 border-[#00f0ff] shadow-[0_0_50px_rgba(0,240,255,0.4)] flex flex-col gap-3 bg-black/60">
            <div className="space-y-4">
              <div className="h-64 rounded-xl overflow-hidden border-2 border-[#00f0ff]/50 relative group bg-[#0a0515]">
                {profile?.avatar_url && (
                  <div className="absolute inset-0 z-0">
                    <img 
                      src={profile.avatar_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover opacity-60 grayscale brightness-50" 
                    />
                  </div>
                )}
                <CameraFeed className="w-full h-full relative z-10" transparent={true} />
                <div className="absolute top-4 left-4 bg-[#00f0ff] text-black px-3 py-1 rounded-sm text-[10px] font-black tracking-widest uppercase z-20">
                  LIVE
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {profile?.avatar_url && (
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                    <img 
                      src={profile.avatar_url} 
                      alt="Profile Circle"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-black italic text-[#00f0ff] tracking-widest leading-none" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {profile?.username || 'PLAYER'}
                  </h2>
                  <p className="text-[#00f0ff] text-xs font-bold mt-1 uppercase tracking-[0.2em]" style={{ fontFamily: "'Orbitron', sans-serif" }}>{playerHand} HAND</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Center: Rules + Ready */}
        <div className="flex flex-col items-center justify-center gap-8 w-full max-w-md h-[450px] relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 items-center w-full"
          >
            <p className="text-[#00f0ff]/40 text-[10px] uppercase font-bold tracking-[0.4em] mb-1 font-sans">RULES</p>
            {RULES.slice(0, 3).map((rule, idx) => {
              const parts = rule.split(' - ');
              const firstWord = parts[0];
              const rest = parts[1] || '';
              
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-black/40 border border-[#00f0ff]/20 px-6 py-2 rounded-lg w-full backdrop-blur-sm"
                >
                  <h3 
                    className="text-white text-sm font-bold tracking-tight text-center uppercase"
                    style={{ 
                      fontFamily: "'Orbitron', sans-serif"
                    }}
                  >
                    <span className="text-yellow-400">{firstWord}</span> {rest}
                  </h3>
                </motion.div>
              );
            })}
          </motion.div>

          <AnimatePresence mode="wait">
            {phase === 'wait' && (
              <motion.div
                key="ready-btn"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                className="relative group h-24 flex items-center"
              >
                <div className="absolute inset-0 bg-[#00f0ff] opacity-20 group-hover:opacity-40 transition-opacity rounded-xl blur-xl" />
                <motion.button
                  onClick={handleReady}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative px-12 py-5 bg-[#00f0ff] text-black font-black text-2xl italic tracking-tighter rounded-xl shadow-[0_0_40px_rgba(0,240,255,0.4)] transition-all"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  READY
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Opponent Card (Right) */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-[400px]"
        >
          <GlassCard className="p-4 border-[#ff006e]/30 bg-black/40 overflow-hidden">
            <div className="space-y-4 text-right">
              <div className="h-64 rounded-xl overflow-hidden border-2 border-[#ff006e]/50 relative bg-black/40">
                {/* Opponent camera feed placeholder */}
                <div className="w-full h-full flex flex-col items-center justify-center text-[#ff006e]/50 bg-black">
                  <span className="text-[10px] tracking-widest font-bold uppercase animate-pulse">OPPONENT CAM</span>
                </div>
                <div className="absolute top-4 right-4 bg-[#ff006e] text-white px-3 py-1 rounded-sm text-[10px] font-black tracking-widest uppercase">
                  LIVE
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-4 w-full">
                <div className="flex flex-col items-end text-right">
                  <h2 className="text-2xl font-black italic text-[#ff006e] tracking-widest leading-none" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {opponent?.username || 'OPPONENT'}
                  </h2>
                </div>
                {opponent?.avatar_url && (
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#ff006e] shadow-[0_0_15px_rgba(255,0,110,0.3)]">
                    <img 
                      src={opponent.avatar_url} 
                      alt="Opponent"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
