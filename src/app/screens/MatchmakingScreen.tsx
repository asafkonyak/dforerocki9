import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { GlassCard } from '../components/GlassCard';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { AvatarDisplay } from '../components/AvatarDisplay';
import { useAudio } from '../../hooks/useAudio';
import { Swords, Zap, Globe } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';

const RadarScan = () => (
  <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black/20">
    <motion.div 
      className="absolute inset-0 border border-[#ff006e]/50 rounded-full"
      initial={{ scale: 0.2, opacity: 0 }}
      animate={{ scale: 2, opacity: [0, 0.8, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    />
    <motion.div 
      className="absolute inset-0 border border-[#ff006e]/30 rounded-full"
      initial={{ scale: 0.2, opacity: 0 }}
      animate={{ scale: 1.5, opacity: [0, 0.5, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.6 }}
    />
    <motion.div 
      className="absolute inset-0 border border-[#ff006e]/20 rounded-full"
      initial={{ scale: 0.2, opacity: 0 }}
      animate={{ scale: 1, opacity: [0, 0.3, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1.2 }}
    />
    <div className="z-10 flex flex-col items-center">
      <Zap className="w-8 h-8 text-[#ff006e] animate-pulse mb-1" />
      <motion.div 
        className="h-[1px] w-12 bg-[#ff006e]/50"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{ originX: 0 }}
      />
    </div>
  </div>
);

export function MatchmakingScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const gameType = location.state?.gameType || '1_round';
  const referenceMatchId = location.state?.referenceMatchId || null;
  
  const [matchFound, setMatchFound] = useState(false);
  const [searchingDelay, setSearchingDelay] = useState(true);
  const [playerId, setPlayerId] = useState<string | null>(localStorage.getItem('fighter_player_id'));
  const [userData, setUserData] = useState<{ username: string; avatar_url: string; rank: string } | null>(null);
  const [opponentData, setOpponentData] = useState<{ username: string; avatar_url: string; rank: string } | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [isPlayer1, setIsPlayer1] = useState<boolean | null>(null);
  const [onlineCount] = useState(Math.floor(Math.random() * 100) + 40);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [timeoutActive, setTimeoutActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [isBattleInitiated, setIsBattleInitiated] = useState(false);

  const { socket, isConnected, isError: socketError } = useSocket();
  const { play: playMatchFound } = useAudio({ src: '/sounds/match_found.mp3', volume: 0.8 });
  const subscriptionRef = useRef<any>(null);
  const startMatchRef = useRef<(id: string, opponent: any) => void>(() => {});

  const startMatch = (id: string, opponent: any) => {
    setMatchId(id);
    setOpponentData({
      username: opponent.username || 'OPPONENT',
      avatar_url: opponent.avatar_url || '👤',
      rank: opponent.rank || 'Bronze'
    });
    setMatchFound(true);
    playMatchFound();
  };

  startMatchRef.current = startMatch;

  // Initial Data & Match Search
  useEffect(() => {
    async function initMatchmaking() {
      const { data: { user } } = await supabase.auth.getUser();
      let currentId = localStorage.getItem('fighter_player_id');

      if (user) {
        const { data: player } = await supabase.from('players').select('id, username, avatar_url, rank').eq('user_id', user.id).maybeSingle();
        if (player) {
          currentId = player.id;
          setUserData({
            username: player.username || 'PLAYER',
            avatar_url: player.avatar_url || '👤',
            rank: player.rank || 'Bronze'
          });
        }
      } else if (currentId) {
        const { data: player } = await supabase.from('players').select('username, avatar_url, rank').eq('id', currentId).maybeSingle();
        if (player) {
          setUserData({
            username: player.username || 'GUEST',
            avatar_url: player.avatar_url || '👤',
            rank: player.rank || 'Bronze'
          });
        }
      }

      if (!currentId) {
        navigate('/onboarding');
        return;
      }
      setPlayerId(currentId);

      // 1. Search for pending match
      let pendingMatchQuery = supabase
        .from('matches')
        .select('*')
        .eq('status', 'pending')
        .eq('game_type', gameType)
        .is('player2_id', null)
        .neq('player1_id', currentId);

      if (referenceMatchId) {
        pendingMatchQuery = pendingMatchQuery.eq('reference_match_id', referenceMatchId);
      }

      const { data: pendingMatches } = await pendingMatchQuery.limit(1);

      if (pendingMatches && pendingMatches.length > 0) {
        const joinMatch = pendingMatches[0];
        setIsPlayer1(false);
        const { error: updateError } = await supabase
          .from('matches')
          .update({ player2_id: currentId, status: 'matched' })
          .eq('id', joinMatch.id);

        if (!updateError) {
          const { data: p1Profile } = await supabase.from('players').select('*').eq('id', joinMatch.player1_id).maybeSingle();
          if (p1Profile) startMatchRef.current(joinMatch.id, p1Profile);
        }
      } else {
        // 2. Create new match as P1
        setIsPlayer1(true);
        const { data: newMatch } = await supabase
          .from('matches')
          .insert({
            player1_id: currentId,
            game_type: gameType,
            status: 'pending',
            reference_match_id: referenceMatchId
          })
          .select()
          .single();

        if (newMatch) {
          setMatchId(newMatch.id);
          const channel = supabase
            .channel(`match-sync-${newMatch.id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${newMatch.id}` }, 
              async (payload: any) => {
                if (payload.new.status === 'matched' && payload.new.player2_id && !matchFound) {
                  const { data: oppProfile } = await supabase.from('players').select('*').eq('id', payload.new.player2_id).maybeSingle();
                  if (oppProfile) startMatchRef.current(payload.new.id, oppProfile);
                }
              }
            )
            .subscribe();
          subscriptionRef.current = channel;
        }
      }
    }

    initMatchmaking();
    const delayTimer = setTimeout(() => setSearchingDelay(false), 1500);

    return () => {
      clearTimeout(delayTimer);
      if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);
    };
  }, [gameType, referenceMatchId, navigate]);

  // Timeout logic
  useEffect(() => {
    if (!matchId || matchFound || !isPlayer1) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          supabase.from('matches').update({ status: 'no found' }).eq('id', matchId).then();
          setTimeoutActive(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [matchId, matchFound, isPlayer1]);

  const handleStartMatch = () => {
    setIsBattleInitiated(true);
    navigate('/versus', {
      state: { matchId, mode: 'ranked', opponent: opponentData, isPlayer1, gameType }
    });
  };

  const handleCancel = async () => {
    if (matchId && !matchFound) {
      await supabase.from('matches').update({ status: 'abended' }).eq('id', matchId);
    }
    navigate('/menu');
  };

  return (
    <div className="min-h-screen bg-[#0a0515] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#00f0ff]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ff006e]/10 rounded-full blur-[120px]" />

      <motion.div className="max-w-md w-full space-y-8 z-10" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="text-center">
          <motion.h2 
            className="text-4xl mb-2 text-[#00f0ff] font-bold tracking-tighter"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
            animate={{ opacity: matchFound ? 1 : [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: matchFound ? 0 : Infinity }}
          >
            {errorHeader || (timeoutActive ? 'NO PARTNER FOUND' : matchFound ? 'TARGET ACQUIRED' : 'SIGNAL SCANNING')}
          </motion.h2>
          <p className="text-white/60 text-sm tracking-widest uppercase">
            {timeoutActive ? 'Try again later' : matchFound ? 'Synchronizing battle protocols' : 'searching for active hostiles'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {searchingDelay ? (
            <motion.div key="scanning" className="h-[400px] flex flex-col items-center justify-center space-y-6" exit={{ opacity: 0, scale: 0.8 }}>
              <div className="relative w-24 h-24">
                <motion.div className="absolute inset-0 border-4 border-[#00f0ff] rounded-full border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                <motion.div className="absolute inset-2 border-4 border-[#ff006e] rounded-full border-b-transparent" animate={{ rotate: -360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} />
              </div>
              <p className="text-[#00f0ff] font-bold tracking-[0.3em] text-xs uppercase animate-pulse">Frequency Locked</p>
            </motion.div>
          ) : (
            <motion.div key="vs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard className="p-8 border-t border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="grid grid-cols-3 gap-4 items-center">
                  {/* P1 / ALPHA */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-20 h-20 rounded-2xl bg-[#00f0ff]/10 border-2 border-[#00f0ff] flex items-center justify-center overflow-hidden">
                      <AvatarDisplay avatar={(isPlayer1 ? userData : opponentData)?.avatar_url || '👤'} size="lg" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold text-xs uppercase">{(isPlayer1 ? userData : opponentData)?.username || 'ALPHA'}</p>
                      <p className="text-[#00f0ff] text-[8px] font-bold uppercase tracking-widest">ALPHA</p>
                    </div>
                  </div>

                  <div className="relative flex flex-col items-center">
                    <motion.div 
                      className="text-4xl font-black italic text-[#ff006e] relative z-20"
                      animate={matchFound ? { scale: [1, 1.2, 1], filter: 'drop-shadow(0 0 10px #ff006e)' } : { scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: matchFound ? 0 : Infinity }}
                    >
                      VS
                    </motion.div>
                    {!matchFound && (
                      <motion.div 
                        className="absolute inset-0 bg-[#ff006e]/30 blur-2xl rounded-full z-10"
                        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </div>

                  {/* P2 / OMEGA / SEARCHING */}
                  <div className="flex flex-col items-center gap-4">
                    <motion.div 
                      className={`relative w-24 h-24 rounded-2xl bg-[#ff006e]/10 border-2 flex items-center justify-center overflow-hidden transition-colors duration-500 ${
                        matchFound ? 'border-[#ff006e] shadow-[0_0_20px_#ff006e40]' : 'border-[#ff006e]/30'
                      }`}
                      animate={matchFound ? {} : { borderColor: ['rgba(255,0,110,0.3)', 'rgba(255,0,110,0.8)', 'rgba(255,0,110,0.3)'] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {matchFound ? (
                        <AvatarDisplay avatar={(isPlayer1 ? opponentData : userData)?.avatar_url || '👤'} size="lg" />
                      ) : (
                        <RadarScan />
                      )}
                      
                      {!matchFound && (
                        <div className="absolute inset-0 pointer-events-none">
                          <motion.div 
                            className="absolute top-0 left-0 w-full h-[2px] bg-[#ff006e]/50"
                            animate={{ top: ['0%', '100%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          />
                        </div>
                      )}
                    </motion.div>
                    <div className="text-center">
                      <p className={`font-bold text-xs uppercase tracking-wider ${matchFound ? 'text-white' : 'text-[#ff006e] animate-pulse'}`}>
                        {matchFound ? (isPlayer1 ? opponentData : userData)?.username || 'OMEGA' : 'SEARCHING...'}
                      </p>
                      <p className="text-[#ff006e] text-[8px] font-bold uppercase tracking-widest mt-0.5">OMEGA SLOT</p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-4 text-center">
          <GlassCard className="py-3 bg-white/5 border-white/5">
            <p className="text-[8px] text-white/40 uppercase tracking-widest mb-1">ROCKY</p>
            <p className={`text-xs font-bold uppercase ${isConnected ? 'text-[#00f0ff]' : 'text-red-500'}`}>
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </p>
          </GlassCard>
          <GlassCard className="py-3 bg-white/5 border-white/5">
            <p className="text-[8px] text-white/40 uppercase tracking-widest mb-1">Status</p>
            <p className="text-xs font-bold text-white uppercase">{matchFound ? 'READY' : 'SEARCHING'}</p>
          </GlassCard>
        </div>

        <AnimatePresence mode="wait">
          {timeoutActive ? (
            <motion.button key="back" onClick={() => navigate('/menu')} className="w-full py-4 rounded-xl bg-[#ff006e] text-white font-bold uppercase tracking-widest shadow-lg shadow-[#ff006e]/20">Back to Menu</motion.button>
          ) : matchFound ? (
            <motion.button key="start" onClick={handleStartMatch} className="w-full py-4 rounded-xl bg-[#00f0ff] text-[#0a0515] font-bold uppercase tracking-widest shadow-lg shadow-[#00f0ff]/20 flex items-center justify-center gap-2">
              <Swords className="w-5 h-5" /> Initiate Battle
            </motion.button>
          ) : (
            <motion.button key="cancel" onClick={handleCancel} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white uppercase text-[10px] font-bold tracking-widest">Abort Search</motion.button>
          )}
        </AnimatePresence>

        <div className="absolute inset-0 pointer-events-none opacity-20">
          <motion.div className="absolute left-0 right-0 h-[100px] bg-gradient-to-b from-transparent via-[#00f0ff]/10 to-transparent" animate={{ y: ['-100%', '1000%'] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} />
        </div>
      </motion.div>
    </div>
  );
}