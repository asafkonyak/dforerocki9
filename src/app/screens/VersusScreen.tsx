import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '../components/GlassCard';
import { Zap, Trophy, Target, Swords } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AvatarDisplay } from '../components/AvatarDisplay';
import { useSocket } from '../../contexts/SocketContext';

export function VersusScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sendMessage, lastMessage } = useSocket();
  
  const [countdown, setCountdown] = useState<string | number | null>(null);
  const [player1, setPlayer1] = useState<any>(null);
  const [player2, setPlayer2] = useState<any>(null);
  const [showRefereeVideo, setShowRefereeVideo] = useState(true);

  const matchId = location.state?.matchId;
  const opponentData = location.state?.opponent;
  const isPlayer1 = location.state?.isPlayer1;
  const gameType = location.state?.gameType || '1_round';
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load Player Data
  useEffect(() => {
    if (!matchId) {
      console.error('VersusScreen - No matchId found in state. Redirecting.');
      navigate('/menu');
      return;
    }

    async function loadPlayers() {
      try {
        const { data: match } = await supabase.from('matches').select('player1_id, player2_id').eq('id', matchId).single();
        if (!match) {
          navigate('/menu');
          return;
        }

        const { data: p1Data } = await supabase.from('players').select('*').eq('id', match.player1_id).single();
        const { data: p2Data } = await supabase.from('players').select('*').eq('id', match.player2_id).single();

        if (p1Data) setPlayer1(mapPlayerData(p1Data, 1));
        if (p2Data) setPlayer2(mapPlayerData(p2Data, 2));
      } catch (err) {
        console.error('Error loading players:', err);
        navigate('/menu');
      }
    }

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
        speed: 80 + (role === 2 ? 8 : 0),
        playerId: p.id
      };
    }

    loadPlayers();
  }, [matchId]);

  // Handle Socket Messages (Countdown)
  useEffect(() => {
    if (!lastMessage) return;
    const serverData = lastMessage.data || lastMessage;

    if (serverData.type === 'countdown') {
      const val = serverData.value;
      setCountdown(val);
      
      if (val === 'GO' || val === 'GO!') {
        setTimeout(() => {
          navigate('/game', { 
            state: { matchId, mode: 'ranked', opponent: isPlayer1 ? player2 : player1, isPlayer1, gameType } 
          });
        }, 1000);
      }
    }
  }, [lastMessage, navigate, matchId, isPlayer1, player1, player2, gameType]);

  const handleVideoEnd = () => {
    setShowRefereeVideo(false);
    // Send INIT to trigger server countdown
    const myPlayerId = localStorage.getItem('fighter_player_id');
    if (myPlayerId) {
      sendMessage({ cmd: { INIT: 1, player_id: myPlayerId } });
    }
  };

  if (!player1 || !player2) {
    return (
      <div className="min-h-screen bg-[#0a0515] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0515] relative overflow-hidden">
      {/* Referee Video Overlay - Full Screen */}
      <AnimatePresence>
        {showRefereeVideo && (
          <motion.div 
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <video
              ref={videoRef}
              src="/assets/Referee.mp4"
              autoPlay
              playsInline
              onEnded={handleVideoEnd}
              className="w-full h-full object-cover"
            />
            <button 
              onClick={handleVideoEnd}
              className="absolute top-10 right-10 text-white/40 hover:text-white uppercase text-xs tracking-[.3em] font-bold z-[110]"
            >
              Skip Intro
            </button>
            <div className="absolute top-10 left-10 flex items-center gap-2 px-3 py-1 bg-red-600 rounded-full z-[110]">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white text-xs uppercase font-bold tracking-widest">Live Referee</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Versus UI */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        {/* Massive VS */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <motion.div className="text-[25rem] font-bold text-white/5" style={{ fontFamily: "'Orbitron', sans-serif" }}>VS</motion.div>
        </div>

        {/* Player Cards */}
        <div className="w-full max-w-6xl flex justify-between items-center gap-12 relative">
          {/* P1 Card */}
          <motion.div className="flex-1" initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <GlassCard className="p-8 border-2 border-[#00f0ff] shadow-[0_0_40px_rgba(0,240,255,0.3)]">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-24 h-24 rounded-full border-4 border-[#00f0ff] overflow-hidden shadow-[0_0_20px_#00f0ff]">
                  <AvatarDisplay avatar={player1.avatar} size="lg" />
                </div>
                <div>
                  <h3 className="text-3xl text-[#00f0ff] font-bold tracking-tight">{player1.name}</h3>
                  <p className="text-white/40 uppercase text-xs tracking-widest">Host / Alpha</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase mb-1 text-center">Wins</p>
                  <p className="text-xl font-bold text-center text-white">{player1.wins}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase mb-1 text-center">Win Rate</p>
                  <p className="text-xl font-bold text-center text-white">{player1.winRate}%</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <div className="w-px h-64 bg-gradient-to-b from-transparent via-white/10 to-transparent" />

          {/* P2 Card */}
          <motion.div className="flex-1" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <GlassCard className="p-8 border-2 border-[#ff006e] shadow-[0_0_40px_rgba(255,0,110,0.3)]">
              <div className="flex items-center gap-6 mb-6 justify-end">
                <div className="text-right">
                  <h3 className="text-3xl text-[#ff006e] font-bold tracking-tight">{player2.name}</h3>
                  <p className="text-white/40 uppercase text-xs tracking-widest">Guest / Omega</p>
                </div>
                <div className="w-24 h-24 rounded-full border-4 border-[#ff006e] overflow-hidden shadow-[0_0_20px_#ff006e]">
                  <AvatarDisplay avatar={player2.avatar} size="lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase mb-1 text-center">Wins</p>
                  <p className="text-xl font-bold text-center text-white">{player2.wins}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase mb-1 text-center">Win Rate</p>
                  <p className="text-xl font-bold text-center text-white">{player2.winRate}%</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Socket Countdown Overlay */}
        <AnimatePresence>
          {countdown !== null && (
            <motion.div 
              className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 2 }}
            >
              <motion.div
                key={countdown}
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
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `linear-gradient(#00f0ff 1px, transparent 1px), linear-gradient(90deg, #00f0ff 1px, transparent 1px)`, backgroundSize: '50px 50px' }} />
    </div>
  );
}