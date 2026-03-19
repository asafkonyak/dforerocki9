import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { GlassCard } from '../components/GlassCard';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { AvatarDisplay } from '../components/AvatarDisplay';
import { useAudio } from '../../hooks/useAudio';
import { Swords, Zap, Globe, Wifi } from 'lucide-react';

export function MatchmakingScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const gameType = location.state?.gameType || '1_round';
  const referenceMatchId = location.state?.referenceMatchId || null;
  const [matchFound, setMatchFound] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ username: string; avatar_url: string; rank: string } | null>(null);
  const [opponentData, setOpponentData] = useState<{ username: string; avatar_url: string; rank: string } | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [pendingMatchId, setPendingMatchId] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(Math.floor(Math.random() * 100) + 40);

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

    setTimeout(() => {
      navigate('/versus', {
        state: {
          matchId: id,
          mode: 'ranked',
          opponent: {
            username: opponent.username,
            avatar: opponent.avatar_url
          },
          gameType: gameType
        }
      });
    }, 2000);
  };

  // Keep the ref updated so the realtime callback always calls the latest version
  startMatchRef.current = startMatch;

  useEffect(() => {
    async function initMatchmaking() {
      if (playerId) return;

      console.log('Matchmaking [v9] - Initializing Pure DB Logic...');
      const { data: { user } } = await supabase.auth.getUser();
      let currentId = localStorage.getItem('fighter_player_id');

      if (user) {
        const { data: player } = await supabase.from('players').select('id').eq('user_id', user.id).maybeSingle();
        if (player?.id) currentId = player.id;
      }

      if (!currentId) {
        navigate('/onboarding');
        return;
      }
      setPlayerId(currentId);

      const { data: player } = await supabase.from('players').select('username, avatar_url, rank').eq('id', currentId).single();
      if (player) {
        setUserData({
          username: player.username || 'PLAYER',
          avatar_url: player.avatar_url || '👤',
          rank: player.rank || 'Bronze'
        });
      }

      // Cleanup dangling matches from this device
      await supabase.from('matches').update({ status: 'canceled' }).eq('player1_id', currentId).eq('status', 'pending');

      // 1. Search for a pending match to join
      let pendingMatchQuery = supabase
        .from('matches')
        .select('*')
        .eq('status', 'pending')
        .eq('game_type', gameType)
        .neq('player1_id', currentId);

      // If this is a rematch, ensure we only join the exact rematch created by the opponent
      if (referenceMatchId) {
        pendingMatchQuery = pendingMatchQuery.eq('reference_match_id', referenceMatchId);
      }

      const { data: pendingMatches, error: searchError } = await pendingMatchQuery.limit(1);

      if (pendingMatches && pendingMatches.length > 0) {
        const joinMatch = pendingMatches[0];
        console.log('Matchmaking [v11] - Found pending match. Joining as Player 2:', joinMatch.id);
        
        // Player 2 subscribes with a UNIQUE channel name (different from Player 1's channel)
        const p2Channel = supabase
          .channel(`p2-match-${joinMatch.id}`)
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${joinMatch.id}` },
            async (payload: any) => {
              console.log('Matchmaking [v11] - Player 2 realtime UPDATE received:', payload);
            }
          )
          .subscribe((status: string) => {
            console.log('Matchmaking [v11] - Player 2 subscription status:', status);
          });

        subscriptionRef.current = p2Channel;

        // Update the match — DO NOT use .select().single() as it crashes when RLS blocks
        const { error: updateError } = await supabase
          .from('matches')
          .update({ player2_id: currentId, status: 'in_progress' })
          .eq('id', joinMatch.id);

        if (updateError) {
          console.error('Matchmaking [v11] - ERROR updating match with player2_id:', updateError);
          supabase.removeChannel(p2Channel);
          subscriptionRef.current = null;
          // Fall through to create a new pending match instead
        } else {
          // Verify the update actually took effect by re-reading the row
          const { data: verifyMatch } = await supabase
            .from('matches')
            .select('id, player1_id, player2_id, status')
            .eq('id', joinMatch.id)
            .single();
          
          console.log('Matchmaking [v11] - Verification read:', verifyMatch);

          if (verifyMatch?.player2_id === currentId) {
            console.log('Matchmaking [v11] - ✅ player2_id confirmed in DB. Getting Player 1 profile...');
            const { data: opp } = await supabase.from('players').select('*').eq('id', joinMatch.player1_id).single();
            if (opp) startMatchRef.current(joinMatch.id, opp);
            return;
          } else {
            console.warn('Matchmaking [v11] - ⚠️ player2_id NOT written! RLS may be blocking. Verify matches table RLS policies.');
            console.warn('Matchmaking [v11] - Expected player2_id:', currentId, 'Got:', verifyMatch?.player2_id);
            supabase.removeChannel(p2Channel);
            subscriptionRef.current = null;
            // Fall through to create a new pending match
          }
        }
      }

      // 2. No match found, create a new pending match
      console.log('Matchmaking [v9] - No matches found. Creating pending match.');
      const { data: newMatch, error: insertError } = await supabase
        .from('matches')
        .insert({
          player1_id: currentId,
          game_type: gameType,
          status: 'pending',
          reference_match_id: referenceMatchId
        })
        .select()
        .single();

      if (insertError || !newMatch) {
         console.error('Error creating pending match:', insertError);
         navigate('/menu');
         return;
      }

      setPendingMatchId(newMatch.id);

      // 3. Subscribe to changes for this match waiting for player 2
      console.log('Matchmaking [v9] - Subscribing to realtime for match:', newMatch.id);
      const channel = supabase
        .channel(`match-updates-${newMatch.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${newMatch.id}` },
          async (payload: any) => {
            console.log('Matchmaking [v9] - Realtime UPDATE received:', payload);
            if (payload.new.status === 'in_progress' && payload.new.player2_id) {
              const { data: opp } = await supabase.from('players').select('*').eq('id', payload.new.player2_id).single();
              if (opp) {
                console.log('Matchmaking [v9] - Player 2 joined! Opponent:', opp.username);
                startMatchRef.current(payload.new.id, opp);
              }
            }
          }
        )
        .subscribe((status: string) => {
          console.log('Matchmaking [v9] - Subscription status:', status);
        });

      subscriptionRef.current = channel;
    }

    initMatchmaking();

    return () => {
      // Unmount cleanup
      if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);
      
      setPendingMatchId(prev => {
        if (prev) {
          // Fire-and-forget update to cancel
          supabase.from('matches').update({ status: 'canceled' }).eq('id', prev);
        }
        return null;
      });
    };
  }, [navigate, playerId, gameType]);

const handleStartMatch = () => {
  navigate('/versus', {
    state: {
      matchId,
      mode: 'ranked',
      opponent: opponentData,
      gameType: gameType
    }
  });
};

const handleCancel = async () => {
  if (pendingMatchId) {
    await supabase.from('matches').update({ status: 'canceled' }).eq('id', pendingMatchId);
    setPendingMatchId(null);
  }
  navigate('/menu');
};

return (
  <div className="min-h-screen bg-gradient-to-b from-[#0a0515] via-[#1a0a2e] to-[#0a0515] flex flex-col items-center justify-center p-6 relative overflow-hidden">
    {/* Background Glows */}
    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#00f0ff]/10 rounded-full blur-[120px] animate-pulse" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ff006e]/10 rounded-full blur-[120px] animate-pulse" />

    <motion.div
      className="max-w-md w-full space-y-8 z-10"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="text-center relative">
        <motion.div
          className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-[#00f0ff]/5 rounded-full blur-xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.h2
          className="text-4xl mb-2 text-[#00f0ff] font-bold tracking-tighter"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
          animate={{
            opacity: matchFound ? 1 : [1, 0.5, 1],
            textShadow: matchFound ? "0 0 20px #00f0ff" : "0 0 10px #00f0ff55"
          }}
          transition={{
            duration: 1.5,
            repeat: matchFound ? 0 : Infinity,
            type: "tween"
          }}
        >
          {matchFound ? 'TARGET ACQUIRED' : 'SIGNAL SCANNING'}
        </motion.h2>
        <p className="text-white/60 text-sm tracking-widest uppercase">
          {matchFound ? 'Synchronizing battle protocols' : 'searching for active hostiles'}
        </p>
      </div>

      {/* VS Display */}
      <GlassCard className="p-8 border-t border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-3 gap-4 items-center relative">
          {/* Player */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-[#00f0ff]/20 rounded-2xl blur-md group-hover:blur-lg transition-all" />
              <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-[#0a0515] to-[#1a0a2e] border-2 border-[#00f0ff] flex items-center justify-center shadow-[0_0_30px_#00f0ff40] overflow-hidden">
                <AvatarDisplay avatar={userData?.avatar_url || '👤'} size="lg" className="w-full h-full rounded-none" />
              </div>

            </div>
            <div className="text-center">
              <p className="text-white font-bold tracking-wider text-sm mb-1 uppercase leading-none">{userData?.username || 'PLAYER_01'}</p>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_5px_#00f0ff]" />
                <p className="text-[#00f0ff] text-[10px] font-bold uppercase tracking-widest leading-none">ALPHA</p>
              </div>
            </div>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative">
              <motion.div
                className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#ff006e] to-[#ff006e]/50 italic px-4 py-2"
                animate={{
                  scale: matchFound ? [1, 1.4, 1] : [1, 1.1, 1],
                  rotate: matchFound ? [0, 10, -10, 0] : [0, 2, -2, 0],
                }}
                transition={{
                  duration: matchFound ? 0.5 : 2,
                  repeat: matchFound ? 0 : Infinity,
                  ease: "easeInOut"
                }}
              >
                VS
              </motion.div>
              <motion.div
                className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[#ff006e] to-transparent"
                animate={{ opacity: [0, 1, 0], scaleX: [0, 1.5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </div>

          {/* Opponent - Skeleton or Real */}
          <div className="flex flex-col items-center gap-4">
            <AnimatePresence mode="wait">
              {!matchFound ? (
                <motion.div
                  key="searching"
                  className="flex flex-col items-center gap-4"
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <div className="relative">
                    <motion.div
                      className="w-24 h-24 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 border-2 border-white/10 flex items-center justify-center"
                      animate={{
                        borderColor: ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"],
                        boxShadow: ["0 0 0px transparent", "0 0 20px rgba(0,240,255,0.2)", "0 0 0px transparent"]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Zap className="w-8 h-8 text-white/10 animate-pulse" />
                    </motion.div>
                    <motion.div
                      className="absolute inset-0 border-t-2 border-[#00f0ff]/40 rounded-2xl"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <div className="h-3 w-20 bg-white/5 rounded-full relative overflow-hidden">
                      <motion.div
                        className="absolute inset-0 bg-[#00f0ff]/20"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    <div className="h-2 w-16 bg-white/5 rounded-full mx-auto" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="opponent"
                  className="flex flex-col items-center gap-4"
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 15 }}
                >
                  <div className="relative group">
                    <div className="absolute inset-0 bg-[#ff006e]/30 rounded-2xl blur-md group-hover:blur-lg transition-all" />
                    <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-[#0a0515] to-[#1a0a2e] border-2 border-[#ff006e] flex items-center justify-center shadow-[0_0_30px_#ff006e50] overflow-hidden">
                      <AvatarDisplay avatar={opponentData?.avatar_url || '👤'} size="lg" className="w-full h-full rounded-none" />
                    </div>
                    <div className="absolute -bottom-2 -left-2 w-8 h-8 rounded-lg bg-[#ff006e] border-2 border-[#0a0515] flex items-center justify-center">
                      <Swords className="w-4 h-4 text-[#0a0515]" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold tracking-wider text-sm mb-1 uppercase leading-none">{opponentData?.username || 'UNKNOWN'}</p>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#ff006e]/10 border border-[#ff006e]/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff006e] shadow-[0_0_5px_#ff006e]" />
                      <p className="text-[#ff006e] text-[10px] font-bold uppercase tracking-widest leading-none">OMEGA</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </GlassCard>

      {/* Status Indicators */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="py-3 px-4 flex items-center gap-3 border-white/5 bg-white/5">
          <div className="relative">
            <Wifi className="w-4 h-4 text-[#00f0ff]" />
            <motion.div
              className="absolute inset-0 bg-[#00f0ff] opacity-20 rounded-full"
              animate={{ scale: [1, 2], opacity: [0.2, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest leading-none mb-1">Status</p>
            <p className="text-xs text-white uppercase tracking-wider font-bold">Optimal</p>
          </div>
        </GlassCard>
        <GlassCard className="py-3 px-4 flex items-center gap-3 border-white/5 bg-white/5">
          <div className="relative">
            <Globe className="w-4 h-4 text-[#ffff00]" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest leading-none mb-1">Global</p>
            <p className="text-xs text-white uppercase tracking-wider font-bold">
              {matchFound ? 'MATCH READY' : `${onlineCount} OPERATIVE`}
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Action Buttons */}
      <AnimatePresence mode="wait">
        {matchFound ? (
          <motion.button
            key="start"
            onClick={handleStartMatch}
            className="w-full relative group overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="absolute inset-0 bg-[#00f0ff] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative py-5 px-6 rounded-2xl bg-[#00f0ff] text-[#0a0515] font-black uppercase tracking-[0.2em] text-lg flex items-center justify-center gap-3">
              <Swords className="w-6 h-6" />
              Initiate Battle
            </div>
          </motion.button>
        ) : (
          <motion.button
            key="cancel"
            onClick={handleCancel}
            className="w-full py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 hover:border-[#ff006e]/50 transition-all uppercase tracking-[0.2em] text-xs font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Abort Search
          </motion.button>
        )}
      </AnimatePresence>

      {/* Scan Lines Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,128,0.06))] bg-[length:100%_2px,3px_100%]" />
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