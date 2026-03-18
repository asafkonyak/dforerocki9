import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { GlassCard } from '../components/GlassCard';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { AvatarDisplay } from '../components/AvatarDisplay';
import { useAudio } from '../../hooks/useAudio';
import { Swords, Zap, Globe, Wifi } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';

export function MatchmakingScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, isConnected } = useSocket();
  const gameType = location.state?.gameType || '1_round';
  const [matchFound, setMatchFound] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ username: string; avatar_url: string; rank: string } | null>(null);
  const [opponentData, setOpponentData] = useState<{ username: string; avatar_url: string; rank: string } | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(Math.floor(Math.random() * 100) + 40);

  const { play: playMatchFound } = useAudio({ src: '/sounds/match_found.mp3', volume: 0.8 });
  const subscriptionRef = useRef<any>(null);

  // handleMatchFound from Supabase REALTIME (Match already exists)
  const handleMatchFound = async (id: string, selfId: string) => {
    setMatchId(id);

    // Fetch match details to find opponent
    const { data: match } = await supabase
      .from('matches')
      .select('player1_id, player2_id')
      .eq('id', id)
      .single();

    if (match) {
      const oppId = match.player1_id === selfId ? match.player2_id : match.player1_id;
      const { data: opponent } = await supabase
        .from('players')
        .select('username, avatar_url, rank')
        .eq('id', oppId)
        .single();

      if (opponent) {
        setOpponentData({
          username: opponent.username || 'OPPONENT',
          avatar_url: opponent.avatar_url || '👤',
          rank: opponent.rank || 'Bronze'
        });
        setMatchFound(true);
        playMatchFound();

        // Auto-navigate after a short delay
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
      }
    }
  };

  // handleMatchFound from SOCKET (We need to CREATE the match)
  const handleMatchFoundFromSocket = async (oppId: string) => {
    console.log('Matchmaking SOCKET [v7] - Handling match found with opponent:', oppId);
    if (!playerId) {
      console.warn('Matchmaking SOCKET - Cannot create match: playerId is missing');
      return;
    }

    // 1. Fetch Opponent Data
    const { data: opponent } = await supabase
      .from('players')
      .select('username, avatar_url, rank')
      .eq('id', oppId)
      .single();

    if (opponent) {
      setOpponentData({
        username: opponent.username || 'OPPONENT',
        avatar_url: opponent.avatar_url || '👤',
        rank: opponent.rank || 'Bronze'
      });

      // 2. Create Match in DB
      // Based on user feedback: "the id sould be from players table"
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({
          player1_id: playerId,
          player2_id: oppId,
          status: 'in_progress',
          game_type: gameType
        })
        .select()
        .single();

      if (matchError) {
        console.error('Matchmaking [v7] - Error creating match in DB:', matchError);
      }

      if (match) {
        setMatchId(match.id);
        setMatchFound(true);
        playMatchFound();
        
        // Auto-navigate to the fight after a short delay to show the opponent
        console.log('Matchmaking SOCKET [v7] - Auto-navigating to versus in 2s...');
        setTimeout(() => {
          navigate('/versus', {
            state: {
              matchId: match.id,
              mode: 'ranked',
              opponent: {
                username: opponent.username,
                avatar: opponent.avatar_url
              },
              gameType: gameType
            }
          });
        }, 2000);
      }
    }
  };

  // Send INIT command once socket and player are ready
  // Using the playerid from the 'players' table as requested
  useEffect(() => {
    if (socket && isConnected) {
      // Handle incoming messages
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[Matchmaking SOCKET]:', data);

          if (data.player_id && data.player_id !== playerId) {
            handleMatchFoundFromSocket(data.player_id);
          }
        } catch (e) {
          console.log('[Matchmaking SOCKET Raw]:', event.data);
        }
      };

      if (playerId) {
        const initPayload = {
          cmd: {
            "INIT": 1,
            "player_id": playerId
          }
        };
        console.log('Matchmaking SOCKET [v7] - Sending message:', initPayload);
        socket.send(JSON.stringify(initPayload));
      }
    }
    return () => {
      if (socket) socket.onmessage = null;
    };
  }, [socket, isConnected, playerId]);

  useEffect(() => {
    async function initMatchmaking() {
      if (playerId) return; // Avoid re-init if already have playerId

      console.log('Matchmaking [v4] - Initializing...');
      // 1. Get Player ID
      const { data: { user } } = await supabase.auth.getUser();

      let currentId = localStorage.getItem('fighter_player_id');

      if (user) {
        const { data: profile } = await supabase.from('profiles').select('player_id').eq('id', user.id).maybeSingle();
        if (profile?.player_id) currentId = profile.player_id;
      }

      if (!currentId) {
        navigate('/onboarding');
        return;
      }
      setPlayerId(currentId);

      // 2. Fetch User Data for display
      const { data: player } = await supabase.from('players').select('username, avatar_url, rank').eq('id', currentId).single();
      if (player) {
        setUserData({
          username: player.username || 'PLAYER',
          avatar_url: player.avatar_url || '👤',
          rank: player.rank || 'Bronze'
        });
      }

      // 3. Clear existing queue entry (if any) and join queue
      await supabase.from('matchmaking_queue').delete().eq('player_id', currentId);

      const payload = {
        player_id: currentId,
        game_type: gameType
      };
      console.log('Matchmaking [v4] - Attempting insert with payload:', payload);

      const { error: joinError } = await supabase.from('matchmaking_queue').insert(payload);

      if (joinError) {
        console.error("Error joining queue:", joinError);
        return;
      }

      // 4. Subscribe to Realtime changes on matchmaking_queue for our player_id
      const channel = supabase
        .channel(`matchmaking:${currentId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'matchmaking_queue',
            filter: `player_id=eq.${currentId}`,
          },
          async (payload: any) => {
            if (payload.new.match_id) {
              handleMatchFound(payload.new.match_id, currentId as string);
            }
          }
        )
        .subscribe();

      subscriptionRef.current = channel;

      // Also check if we were immediately matched
      const { data: queueEntry } = await supabase
        .from('matchmaking_queue')
        .select('match_id')
        .eq('player_id', currentId)
        .maybeSingle();

      if (queueEntry?.match_id) {
        handleMatchFound(queueEntry.match_id, currentId);
      }
    }

    initMatchmaking();

    return () => {
      // Ensure we leave the queue on unmount
      if (playerId) {
        supabase.from('matchmaking_queue').delete().eq('player_id', playerId).then(() => {
          if (subscriptionRef.current) {
            supabase.removeChannel(subscriptionRef.current);
          }
        });
      }
    };
  }, [navigate, playerId]);


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
  if (playerId) {
    await supabase.from('matchmaking_queue').delete().eq('player_id', playerId);
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