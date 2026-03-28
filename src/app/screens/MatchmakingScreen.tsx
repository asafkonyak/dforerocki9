import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { GlassCard } from '../components/GlassCard';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { AvatarDisplay } from '../components/AvatarDisplay';
import { useAudio } from '../../hooks/useAudio';
import { Swords, Zap } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';

export function MatchmakingScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const gameType = location.state?.gameType || '1_round';
  const referenceMatchId = location.state?.referenceMatchId || null;
  
  const [matchFound, setMatchFound] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(localStorage.getItem('fighter_player_id'));
  const [userData, setUserData] = useState<{ username: string; avatar_url: string; rank: string } | null>(null);
  const [opponentData, setOpponentData] = useState<{ username: string; avatar_url: string; rank: string } | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [isPlayer1, setIsPlayer1] = useState<boolean | null>(null);
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

  // Initial Data & Match Search with reliability fixes
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

      // Stale filter: only consider matches from last 5 minutes
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      // 1. Search for pending match (newest first, recent only)
      let pendingMatchQuery = supabase
        .from('matches')
        .select('*')
        .eq('status', 'pending')
        .eq('game_type', gameType)
        .is('player2_id', null)
        .neq('player1_id', currentId)
        .gte('created_at', fiveMinAgo)
        .order('created_at', { ascending: false });

      if (referenceMatchId) {
        pendingMatchQuery = pendingMatchQuery.eq('reference_match_id', referenceMatchId);
      }

      const { data: pendingMatches } = await pendingMatchQuery.limit(1);

      if (pendingMatches && pendingMatches.length > 0) {
        const joinMatch = pendingMatches[0];
        setIsPlayer1(false);
        
        // Optimistic lock: only update if player2_id is still null
        const { error: updateError, data: updatedMatch } = await supabase
          .from('matches')
          .update({ player2_id: currentId, status: 'matched' })
          .eq('id', joinMatch.id)
          .is('player2_id', null) // Optimistic lock
          .select()
          .maybeSingle();

        if (!updateError && updatedMatch) {
          // Successfully joined
          const { data: p1Profile } = await supabase.from('players').select('*').eq('id', joinMatch.player1_id).maybeSingle();
          if (p1Profile) startMatchRef.current(joinMatch.id, p1Profile);
        } else {
          // Retry: someone else joined first, create as P1 instead
          console.log('[Matchmaking] Join failed (race condition), creating new match as P1');
          await createMatchAsP1(currentId);
        }
      } else {
        // 2. Create new match as P1
        await createMatchAsP1(currentId);
      }

      async function createMatchAsP1(pid: string) {
        setIsPlayer1(true);
        const { data: newMatch } = await supabase
          .from('matches')
          .insert({
            player1_id: pid,
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

    return () => {
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
    navigate('/1v1-pregame', {
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
        {/* Title & Subtitle */}
        <div className="text-center">
          <motion.h2 
            className="text-4xl mb-2 text-[#00f0ff] font-bold tracking-tighter"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
            animate={{ opacity: matchFound ? 1 : [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: matchFound ? 0 : Infinity }}
          >
            {errorHeader || (timeoutActive ? 'NO PARTNER FOUND' : matchFound ? 'TARGET ACQUIRED' : 'SIGNAL SCANNING')}
          </motion.h2>
          <p className="text-white/60 text-sm tracking-widest uppercase" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            {timeoutActive ? 'TRY AGAIN LATER' : matchFound ? 'SYNCHRONIZING BATTLE PROTOCOLS' : 'SEARCHING FOR OPPONENT'}
          </p>
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {!matchFound && !timeoutActive && (
            <motion.div 
              key="searching" 
              className="flex flex-col items-center justify-center space-y-8 py-12"
              exit={{ opacity: 0, scale: 0.8 }}
            >
              {/* Radar Animation */}
              <div className="relative w-32 h-32">
                <motion.div 
                  className="absolute inset-0 border-2 border-[#00f0ff]/40 rounded-full"
                  animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.div 
                  className="absolute inset-0 border-2 border-[#00f0ff]/30 rounded-full"
                  animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                />
                <motion.div 
                  className="absolute inset-0 border-2 border-[#00f0ff]/20 rounded-full"
                  animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1 }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-10 h-10 text-[#00f0ff] animate-pulse" />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-xs">
                <div className="relative h-2 bg-white/10 rounded-full overflow-hidden border border-[#00f0ff]/20">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#00f0ff] to-[#ff006e] rounded-full shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                    animate={{ 
                      left: ['-30%', '100%'],
                    }}
                    style={{ width: '30%' }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      ease: "easeInOut"
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[#00f0ff]/40 text-[8px] uppercase tracking-widest font-bold">Scanning</span>
                  <span className="text-[#00f0ff]/40 text-[8px] uppercase tracking-widest font-bold">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
                </div>
              </div>
            </motion.div>
          )}

          {matchFound && (
            <motion.div 
              key="found" 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="py-8"
            >
              <GlassCard className="p-8 border-t border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="grid grid-cols-3 gap-4 items-center">
                  {/* P1 / ALPHA */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-20 h-20 rounded-full bg-[#00f0ff]/10 border-2 border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center justify-center overflow-hidden">
                      <AvatarDisplay avatar={(isPlayer1 ? userData : opponentData)?.avatar_url || '👤'} size="lg" />
                    </div>
                    <div className="text-center">
                      <p className="text-[#00f0ff] font-bold text-xs uppercase" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                        {(isPlayer1 ? userData : opponentData)?.username || 'ALPHA'}
                      </p>
                    </div>
                  </div>

                  <div className="relative flex flex-col items-center">
                    <motion.div 
                      className="text-4xl font-black italic text-[#ff006e] relative z-20"
                      style={{ fontFamily: "'Orbitron', sans-serif" }}
                      animate={{ scale: [1, 1.2, 1], filter: 'drop-shadow(0 0 10px #ff006e)' }}
                      transition={{ duration: 1 }}
                    >
                      VS
                    </motion.div>
                  </div>

                  {/* P2 / OMEGA */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-20 h-20 rounded-full bg-[#ff006e]/10 border-2 border-[#ff006e] shadow-[0_0_20px_rgba(255,0,110,0.4)] flex items-center justify-center overflow-hidden">
                      <AvatarDisplay avatar={(isPlayer1 ? opponentData : userData)?.avatar_url || '👤'} size="lg" />
                    </div>
                    <div className="text-center">
                      <p className="text-[#ff006e] font-bold text-xs uppercase" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                        {(isPlayer1 ? opponentData : userData)?.username || 'OMEGA'}
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <AnimatePresence mode="wait">
          {timeoutActive ? (
            <motion.button 
              key="back" 
              onClick={() => navigate('/menu')} 
              className="w-full py-4 rounded-xl bg-[#ff006e] text-white font-bold uppercase tracking-widest shadow-lg shadow-[#ff006e]/20"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              Back to Menu
            </motion.button>
          ) : matchFound ? (
            <motion.button 
              key="start" 
              onClick={handleStartMatch} 
              className="w-full py-4 rounded-xl bg-[#00f0ff] text-[#0a0515] font-bold uppercase tracking-widest shadow-lg shadow-[#00f0ff]/20 flex items-center justify-center gap-2"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              <Swords className="w-5 h-5" /> INITIATE BATTLE
            </motion.button>
          ) : (
            <motion.button 
              key="cancel" 
              onClick={handleCancel} 
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white uppercase text-[10px] font-bold tracking-widest"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              Abort Search
            </motion.button>
          )}
        </AnimatePresence>

        {/* Scan Line Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <motion.div 
            className="absolute left-0 right-0 h-[100px] bg-gradient-to-b from-transparent via-[#00f0ff]/10 to-transparent" 
            animate={{ y: ['-100%', '1000%'] }} 
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }} 
          />
        </div>
      </motion.div>
    </div>
  );
}