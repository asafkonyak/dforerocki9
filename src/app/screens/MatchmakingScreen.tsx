import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { GlassCard } from '../components/GlassCard';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { AvatarDisplay } from '../components/AvatarDisplay';
import { useAudio } from '../../hooks/useAudio';
import { Zap, CheckCircle } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { useGlobalAudio } from '../../contexts/AudioContext';
import { archiveStaleMatches } from '../../lib/matchmaking-utils';

export function MatchmakingScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const gameType = location.state?.gameType || '1_round';
  const referenceMatchId = location.state?.referenceMatchId || null;
  
  const [matchFound, setMatchFound] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(localStorage.getItem('fighter_player_id'));
  const [userData, setUserData] = useState<{ username: string; avatar_url: string; rank: string; preferred_hand?: string } | null>(null);
  const [opponentData, setOpponentData] = useState<{ username: string; avatar_url: string; rank: string; preferred_hand?: string } | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [isPlayer1, setIsPlayer1] = useState<boolean | null>(null);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [timeoutActive, setTimeoutActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);

  const { socket, isConnected, isError: socketError } = useSocket();
  const { playMatch1v1SFX, stopMatch1v1SFX, stopIntroMusic } = useGlobalAudio();
  const { play: playMatchFound } = useAudio({ src: '/sounds/match_found.mp3', volume: 0.8 });
  const subscriptionRef = useRef<any>(null);
  const startMatchRef = useRef<(id: string, opponent: any) => void>(() => {});
  const hasNavigatedRef = useRef(false);

  const startMatch = (id: string, opponent: any) => {
    setMatchId(id);
    setOpponentData({
      username: opponent.username || 'OPPONENT',
      avatar_url: opponent.avatar_url || '👤',
      rank: opponent.rank || 'Bronze',
      preferred_hand: opponent.preferred_hand || 'right'
    });
    setMatchFound(true);
    playMatchFound();
  };

  startMatchRef.current = startMatch;

  // Auto-redirect to 1v1-pregame after match found (with short delay for animation)
  useEffect(() => {
    if (matchFound && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      const timer = setTimeout(() => {
        navigate('/1v1-pregame', {
          state: { 
            matchId, 
            mode: 'ranked', 
            opponent: opponentData, 
            isPlayer1, 
            gameType,
            hand: userData?.preferred_hand || 'right'
          }
        });
      }, 2500); // 2.5s for the success animation
      return () => clearTimeout(timer);
    }
  }, [matchFound, matchId, opponentData, isPlayer1, gameType, navigate, userData]);

  // Initial Data & Match Search with reliability fixes
  useEffect(() => {
    async function initMatchmaking() {
      // Start 1v1 background sound
      stopIntroMusic();
      playMatch1v1SFX();
      
      // 1. Proactive cleanup of STALE records before searching
      await archiveStaleMatches();

      const { data: { user } } = await supabase.auth.getUser();
      let currentId = localStorage.getItem('fighter_player_id');

      // (A) Profile Setup logic
      if (user) {
        const { data: player } = await supabase.from('players').select('id, username, avatar_url, rank, preferred_hand').eq('user_id', user.id).maybeSingle();
        if (player) {
          currentId = player.id;
          setUserData({
            username: player.username || 'PLAYER',
            avatar_url: player.avatar_url || '👤',
            rank: player.rank || 'Bronze',
            preferred_hand: player.preferred_hand || 'right'
          });
        }
      } else if (currentId) {
        const { data: player } = await supabase.from('players').select('username, avatar_url, rank, preferred_hand').eq('id', currentId).maybeSingle();
        if (player) {
          setUserData({
            username: player.username || 'GUEST',
            avatar_url: player.avatar_url || '👤',
            rank: player.rank || 'Bronze',
            preferred_hand: player.preferred_hand || 'right'
          });
        }
      }

      if (!currentId) {
        navigate('/onboarding');
        return;
      }
      setPlayerId(currentId);

      // (B) Searching for PENDING match (Exclude 'archived' or 'done')
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

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

      const { data: pendingMatches, error: searchError } = await pendingMatchQuery.limit(1);

      if (searchError) {
        console.error('[Matchmaking] Search error:', searchError);
        setErrorHeader('SEARCH ERROR');
        return;
      }

      // (C) Join logic or Create logic
      if (pendingMatches && pendingMatches.length > 0) {
        const joinTarget = pendingMatches[0];
        console.log('[Matchmaking] Found pending match to join:', joinTarget.id);
        setIsPlayer1(false);
        
        // Atomic lock attempt using 'player2_id IS NULL' hint in the query
        const { error: updateError, data: updatedMatch } = await supabase
          .from('matches')
          .update({ 
            player2_id: currentId, 
            status: 'matched'
          })
          .eq('id', joinTarget.id)
          .is('player2_id', null)
          .select()
          .maybeSingle();

        if (!updateError && updatedMatch) {
          console.log('[Matchmaking] JOINED SUCCESSFULLY as Player 2:', updatedMatch.id);
          const { data: p1Profile } = await supabase.from('players').select('*').eq('id', joinTarget.player1_id).maybeSingle();
          if (p1Profile) startMatchRef.current(joinTarget.id, p1Profile);
        } else {
          console.warn('[Matchmaking] Join race condition detected or record already matched. Creating new...');
          await createMatchAsP1(currentId);
        }
      } else {
        await createMatchAsP1(currentId);
      }

      async function createMatchAsP1(pid: string) {
        console.log('[Matchmaking] CREATING NEW MATCH as Player 1...');
        setIsPlayer1(true);
        const { data: newMatch, error: insertError } = await supabase
          .from('matches')
          .insert({
            player1_id: pid,
            game_type: gameType,
            status: 'pending',
            reference_match_id: referenceMatchId
          })
          .select()
          .single();

        if (insertError) {
          console.error('[Matchmaking] Failed to create match:', insertError);
          setErrorHeader('INIT FAILED');
          return;
        }

        if (newMatch) {
          console.log('[Matchmaking] P1 Match Created:', newMatch.id);
          setMatchId(newMatch.id);
          const channel = supabase
            .channel(`match-sync-${newMatch.id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${newMatch.id}` }, 
              async (payload: any) => {
                console.log('[Matchmaking] Match status update observed:', payload.new.status);
                if (payload.new.status === 'matched' && payload.new.player2_id && !matchFound) {
                  const { data: oppProfile } = await supabase.from('players').select('*').eq('id', payload.new.player2_id).maybeSingle();
                  if (oppProfile) {
                    console.log('[Matchmaking] OPPONENT JOINED:', oppProfile.username);
                    startMatchRef.current(payload.new.id, oppProfile);
                  }
                }
              }
            )
            .subscribe((status) => {
              console.log('[Matchmaking] Channel status:', status);
            });
          subscriptionRef.current = channel;
        }
      }
    }

    initMatchmaking();

    return () => {
      if (subscriptionRef.current) {
        console.log('[Matchmaking] Cleaning up channel subscription.');
        supabase.removeChannel(subscriptionRef.current);
      }
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

  const handleCancel = async () => {
    stopMatch1v1SFX();
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
            {errorHeader || (timeoutActive ? 'NO PARTNER FOUND' : matchFound ? 'OPPONENT FOUND' : 'SEARCHING FOR OPPONENT')}
          </motion.h2>
        </div>

        <AnimatePresence mode="wait">
          {/* Match Found — Success Animation */}
          {matchFound && (
            <motion.div
              key="found"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 space-y-6"
            >
              {/* Success pulse ring */}
              <div className="relative w-32 h-32">
                <motion.div 
                  className="absolute inset-0 border-4 border-[#00ff88] rounded-full"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.div 
                  className="absolute inset-0 border-4 border-[#00ff88] rounded-full"
                  animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <CheckCircle className="w-16 h-16 text-[#00ff88]" />
                  </motion.div>
                </div>
              </div>

              {/* Opponent Name */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-[#ff006e] text-xl font-black uppercase tracking-widest"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                {opponentData?.username}
              </motion.p>

              {/* Auto-redirecting progress */}
              <div className="w-full max-w-xs">
                <motion.div 
                  className="h-1 bg-[#00ff88] rounded-full shadow-[0_0_10px_rgba(0,255,136,0.5)]"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2.5, ease: "linear" }}
                />
              </div>
            </motion.div>
          )}

          {/* Searching State — Player Profile + Progress */}
          {!matchFound && !timeoutActive && (
            <motion.div 
              key="searching" 
              className="flex flex-col items-center justify-center space-y-8 py-6"
              exit={{ opacity: 0, scale: 0.8 }}
            >
              {/* Player Profile Card */}
              {userData && (
                <GlassCard className="w-full p-6 border-t border-[#00f0ff]/30 bg-black/40">
                  <div className="flex items-center gap-5">
                    <div className="relative w-32 h-32 flex-shrink-0 border-2 border-[#00f0ff] shadow-[0_0_25px_rgba(0,240,255,0.4)] bg-[#050510] rounded-xl overflow-hidden">
                      <AnimatePresence mode="wait">
                        {userData.avatar_url ? (
                          <motion.div
                            key="avatar"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full h-full"
                          >
                            <AvatarDisplay avatar={userData.avatar_url} size="xl" rounded={false} className="object-cover" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="placeholder"
                            className="w-full h-full flex items-center justify-center bg-black/40"
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <Zap className="w-10 h-10 text-[#00f0ff]/40" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {/* Scanning line for placeholder */}
                      <motion.div 
                        className="absolute inset-x-0 h-0.5 bg-[#00f0ff] z-20 shadow-[0_0_10px_#00f0ff]"
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-black text-[#00f0ff] uppercase tracking-widest" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                        {userData.username}
                      </h3>
                      <p className="text-[#00f0ff]/60 text-xs uppercase tracking-[0.2em] mt-2 font-bold">
                        {(userData.preferred_hand || 'RIGHT').toUpperCase()} HAND
                      </p>
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* Radar Animation */}
              <div className="relative w-24 h-24">
                <motion.div className="absolute inset-0 border-2 border-[#00f0ff]/40 rounded-full" animate={{ scale: [1, 1.8], opacity: [0.6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }} />
                <motion.div className="absolute inset-0 border-2 border-[#00f0ff]/30 rounded-full" animate={{ scale: [1, 1.6], opacity: [0.4, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }} />
                <motion.div className="absolute inset-0 border-2 border-[#00f0ff]/20 rounded-full" animate={{ scale: [1, 1.4], opacity: [0.3, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1 }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-[#00f0ff] animate-pulse" />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-xs">
                <div className="relative h-2 bg-white/10 rounded-full overflow-hidden border border-[#00f0ff]/20">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#00f0ff] to-[#ff006e] rounded-full shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                    animate={{ left: ['-30%', '100%'] }}
                    style={{ width: '30%' }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[#00f0ff]/40 text-[8px] uppercase tracking-widest font-bold">Scanning</span>
                  <span className="text-[#00f0ff]/40 text-[8px] uppercase tracking-widest font-bold">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
                </div>
              </div>
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
          ) : !matchFound ? (
            <motion.button 
              key="cancel" 
              onClick={handleCancel} 
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white uppercase text-[10px] font-bold tracking-widest"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              Abort Search
            </motion.button>
          ) : null}
        </AnimatePresence>

        {/* Scan Line Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <motion.div className="absolute left-0 right-0 h-[100px] bg-gradient-to-b from-transparent via-[#00f0ff]/10 to-transparent" animate={{ y: ['-100%', '1000%'] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} />
        </div>
      </motion.div>
    </div>
  );
}