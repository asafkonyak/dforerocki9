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
  const gameType = location.state?.gameType || '1_round';
  const referenceMatchId = location.state?.referenceMatchId || null;
  const [matchFound, setMatchFound] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ username: string; avatar_url: string; rank: string } | null>(null);
  const [opponentData, setOpponentData] = useState<{ username: string; avatar_url: string; rank: string } | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [isPlayer1, setIsPlayer1] = useState<boolean | null>(null);
  const [onlineCount, setOnlineCount] = useState(Math.floor(Math.random() * 100) + 40);
  const [isValidated, setIsValidated] = useState(false);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [timeoutActive, setTimeoutActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [showRefereeVideo, setShowRefereeVideo] = useState(false);
  const [isBattleInitiated, setIsBattleInitiated] = useState(false);
  const [countdown, setCountdown] = useState<string | number | null>(null);

  const { play: playMatchFound } = useAudio({ src: '/sounds/match_found.mp3', volume: 0.8 });
  const { socket, isConnected, isError } = useSocket();
  const subscriptionRef = useRef<any>(null);

  const startMatchRef = useRef<(id: string, opponent: any) => void>(() => { });
  const opponentDataRef = useRef(opponentData);
  useEffect(() => { opponentDataRef.current = opponentData; }, [opponentData]);

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

  // Keep the ref updated so the realtime callback always calls the latest version
  startMatchRef.current = startMatch;

  useEffect(() => {
    if (playerId && socket && socket.readyState === WebSocket.OPEN) {
      const initMsg = JSON.stringify({ 
        cmd: { 
          INIT: 1, 
          player_id: playerId 
        } 
      });
      console.log('Matchmaking [v15] - SENDING COMMAND TO SOCKET:', initMsg);
      socket.send(initMsg);
    }
  }, [playerId, socket, isConnected]);

  // Timeout logic (Scenario 4)
  useEffect(() => {
    if (!matchId || matchFound || !isPlayer1) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [matchId, matchFound, isPlayer1]);

  const handleTimeout = async () => {
    if (matchId) {
      await supabase.from('matches').update({ status: 'no found' }).eq('id', matchId);
    }
    setTimeoutActive(true);
  };

  // Handle Socket Messages for Matchmaking (Player 1 waits for Player 2)
  useEffect(() => {
    if (!socket || !matchId || matchFound) return;

    const handleMessage = async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const serverData = data.data || data;
        
        // Scenario 1 & 2: Validate the player back in socket
        if (serverData.player_id && serverData.player_id !== playerId) {
          console.log('Matchmaking [v15] - Socket detected Opponent:', serverData.player_id);
          
          // Verify with DB (match record)
          const { data: match } = await supabase.from('matches').select('player1_id, player2_id').eq('id', matchId).single();
          
          const expectedOpponentId = isPlayer1 ? match?.player2_id : match?.player1_id;
          
          if (serverData.player_id === expectedOpponentId) {
            console.log('Matchmaking [v17] - ✅ Validation passed via socket! Rival:', serverData.player_id, 'Status:', data.status || 'OK');
            setIsValidated(true);
            
            // Fetch opponent profile if not already set
            if (!matchFound) {
              const { data: oppProfile } = await supabase.from('players').select('*').eq('id', serverData.player_id).maybeSingle();
              if (oppProfile) {
                startMatchRef.current(matchId!, oppProfile);
              }
            }
          } else {
            console.error('Matchmaking [v17] - ❌ Validation FAILED. Socket player_id does not match DB.');
            setErrorHeader('VALIDATION ERROR: SYNC FAILED');
          }
        }

        // New: Handle Countdown from socket
        if (serverData.type === 'countdown' || data.type === 'countdown') {
          const val = serverData.value || data.value;
          console.log('Matchmaking [v17] - SOCKET COUNTDOWN:', val);
          setCountdown(val);
          
          if (val === 'GO' || val === 'GO!') {
            console.log('Matchmaking [v17] - GO signal received. Finalizing match...');
            // Update status to active and navigate
            if (playerId && matchId) {
              await supabase.from('matches').update({ status: 'active' }).eq('id', matchId);
            }
            setTimeout(() => {
              navigate('/versus', {
                state: {
                  matchId,
                  mode: 'ranked',
                  opponent: opponentDataRef.current,
                  isPlayer1: isPlayer1,
                  gameType: gameType
                }
              });
            }, 1000);
          }
        }
      } catch (e) {
        // Skip non-JSON or other messages
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, isPlayer1, playerId, matchFound, matchId, opponentData]);

  useEffect(() => {
    async function initMatchmaking() {
      if (playerId) return;

      console.log('Matchmaking [v14] - Initializing Pure DB Logic...');
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
      await supabase.from('matches').update({ status: 'abended' }).eq('player1_id', currentId).eq('status', 'pending');

      // 1. Search for a pending match to join (Scenario 1)
      console.log('Matchmaking [v16] - Searching for pending matches. GameType:', gameType, 'ReferenceId:', referenceMatchId, 'Self:', currentId);
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

      const { data: pendingMatches, error: searchError } = await pendingMatchQuery.limit(1);

      if (searchError) {
        console.error('Matchmaking [v16] - ERROR searching for matches:', searchError);
      }

      if (pendingMatches && pendingMatches.length > 0) {
        const joinMatch = pendingMatches[0];
        console.log('Matchmaking [v16] - Found pending match. Joining as Player 2:', joinMatch.id);
        setIsPlayer1(false);

        const { error: updateError } = await supabase
          .from('matches')
          .update({ player2_id: currentId, status: 'matched' })
          .eq('id', joinMatch.id);

        if (updateError) {
          console.error('Matchmaking [v16] - ERROR updating match with player2_id:', updateError);
          navigate('/menu');
          return;
        }

        // Get Player 1 profile to show VS
        const { data: p1Profile } = await supabase.from('players').select('*').eq('id', joinMatch.player1_id).maybeSingle();
        if (p1Profile) {
          console.log('Matchmaking [v16] - ✅ Joined as P2. Waiting for socket validation...');
          startMatchRef.current(joinMatch.id, p1Profile);
          // Socket validation happens in the other useEffect
          return;
        }
      }

      // 2. No match found, create a new pending match (Scenario 2)
      console.log('Matchmaking [v16] - No matches found. Creating pending match as Player 1.');
      setIsPlayer1(true);
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

      setMatchId(newMatch.id);
      console.log('Matchmaking [v16] - Waiting for Player 2 via Realtime...');

      // Subscribe to changes for this match
      const channel = supabase
        .channel(`match-sync-${newMatch.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${newMatch.id}` },
          async (payload: any) => {
            console.log('Matchmaking [v16] - Sync UPDATE:', payload.new.status, payload.new.player2_id);
            
            // When matched (P2 joined)
            if (payload.new.status === 'matched' && payload.new.player2_id && !matchFound) {
              const { data: opp } = await supabase.from('players').select('*').eq('id', 
                currentId === payload.new.player1_id ? payload.new.player2_id : payload.new.player1_id
              ).maybeSingle();
              
              if (opp) {
                console.log('Matchmaking [v16] - Match detected. Waiting for socket validation...');
                startMatchRef.current(payload.new.id, opp);
              }
            }
          }
        )
        .subscribe();

      subscriptionRef.current = channel;
    }

    initMatchmaking();

    return () => {
      // Unmount cleanup
      if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);

      if (matchId && !matchFound && !isBattleInitiated) {
        // Default to abended if closed without completion (Scenario 3)
        supabase.from('matches').update({ status: 'abended' }).eq('id', matchId).then();
      }
    };
  }, [navigate, playerId, gameType, socket, isConnected, referenceMatchId]);

  const handleStartMatch = () => {
    setIsBattleInitiated(true);
    setShowRefereeVideo(true);
  };

  const handleVideoEnd = () => {
    setShowRefereeVideo(false);
    // Send socket INIT only after video ends
    if (playerId && socket && socket.readyState === WebSocket.OPEN) {
      const initMsg = JSON.stringify({ 
        cmd: { 
          INIT: 1, 
          player_id: playerId 
        } 
      });
      console.log('Matchmaking [v17] - POST-VIDEO SOCKET INIT:', initMsg);
      socket.send(initMsg);
    }
  };

  const handleCancel = async () => {
    if (matchId && !matchFound) {
      await supabase.from('matches').update({ status: 'abended' }).eq('id', matchId);
      setMatchId(null);
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
            {errorHeader ? errorHeader : timeoutActive ? 'NO PARTNER FOUND' : matchFound ? 'TARGET ACQUIRED' : 'SIGNAL SCANNING'}
          </motion.h2>
          <p className="text-white/60 text-sm tracking-widest uppercase">
            {timeoutActive ? 'Try again later' : matchFound ? 'Synchronizing battle protocols' : 'searching for active hostiles'}
          </p>
        </div>

        {/* VS Display - Positioned by Player Rank (P1=Alpha, P2=Omega) */}
        {(() => {
          const displayP1 = (matchFound && !isPlayer1) ? opponentData : userData;
          const displayP2 = (matchFound && !isPlayer1) ? userData : opponentData;
          
          return (
            <GlassCard className="p-8 border-t border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="grid grid-cols-3 gap-4 items-center relative">
                {/* Player 1 (Left / ALPHA) */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-[#00f0ff]/20 rounded-2xl blur-md group-hover:blur-lg transition-all" />
                    <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-[#0a0515] to-[#1a0a2e] border-2 border-[#00f0ff] flex items-center justify-center shadow-[0_0_30px_#00f0ff40] overflow-hidden">
                      <AvatarDisplay avatar={displayP1?.avatar_url || '👤'} size="lg" className="w-full h-full rounded-none" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold tracking-wider text-sm mb-1 uppercase leading-none">{displayP1?.username || 'PLAYER_01'}</p>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_5px_#00f0ff]" />
                      <p className="text-[#00f0ff] text-[10px] font-bold uppercase tracking-widest leading-none">ALPHA</p>
                    </div>
                  </div>
                </div>

                {/* VS Divider */}
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
                  </div>
                </div>

                {/* Player 2 (Right / OMEGA) */}
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
                            <AvatarDisplay avatar={displayP2?.avatar_url || '👤'} size="lg" className="w-full h-full rounded-none" />
                          </div>
                          <div className="absolute -bottom-2 -left-2 w-8 h-8 rounded-lg bg-[#ff006e] border-2 border-[#0a0515] flex items-center justify-center">
                            <Swords className="w-4 h-4 text-[#0a0515]" />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-white font-bold tracking-wider text-sm mb-1 uppercase leading-none">{displayP2?.username || 'UNKNOWN'}</p>
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
          );
        })()}

        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-4">
          <GlassCard className="py-3 px-4 flex items-center gap-3 border-white/5 bg-white/5">
            <div className="relative">
              <motion.div
                className="relative"
                animate={{
                  scale: (isConnected || isError) ? [1, 1.2, 1] : 1,
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  type: 'tween',
                }}
              >
                <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentcolor] ${
                  isConnected ? 'bg-[#00f0ff] text-[#00f0ff]' :
                  isError ? 'bg-[#ff0000] text-[#ff0000]' :
                  'bg-[#888888] text-[#888888]'
                }`} />
              </motion.div>
            </div>
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-widest leading-none mb-1">
                ROCKY: {isConnected ? 'SYNCED' : isError ? 'ERROR' : 'OFFLINE'}
              </p>
              <p className={`text-xs uppercase tracking-wider font-bold ${
                isConnected ? 'text-[#00f0ff]' : isError ? 'text-[#ff0000]' : 'text-white/40'
              }`}>
                {isConnected ? 'OPTIMAL' : isError ? 'FAILURE' : 'WAITING'}
              </p>
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
          {timeoutActive ? (
            <motion.button
              key="back"
              onClick={() => navigate('/menu')}
              className="w-full py-5 px-6 rounded-2xl bg-[#ff006e] text-white font-black uppercase tracking-[0.2em] text-lg flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,0,110,0.4)]"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              Back to Menu
            </motion.button>
          ) : matchFound ? (
            <motion.button
              key="start"
              onClick={handleStartMatch}
              disabled={!matchFound}
              className={`w-full relative group overflow-hidden transition-all duration-300 ${!matchFound ? 'opacity-40 grayscale pointer-events-none' : ''}`}
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

      {/* Referee Video Overlay */}
      <AnimatePresence>
        {showRefereeVideo && (
          <motion.div 
            className="fixed inset-0 z-[100] bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <video
              autoPlay
              playsInline
              onEnded={handleVideoEnd}
              className="w-full h-full object-cover"
            >
              <source src="/assets/Referee.mp4" type="video/mp4" />
            </video>
            {/* Skip Option for dev/safety */}
            <button 
              onClick={handleVideoEnd}
              className="absolute top-10 right-10 text-white/40 hover:text-white uppercase text-xs tracking-[.3em]"
            >
              Skip Intro
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Socket-Driven Countdown Overlay */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div 
            className="fixed inset-0 z-[110] flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 2 }}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className={`text-[12rem] font-bold italic tracking-tighter ${
                countdown === 'GO' || countdown === 'GO!' ? 'text-[#00ff00]' : 'text-[#00f0ff]'
              }`}
              style={{ 
                fontFamily: "'Orbitron', sans-serif",
                textShadow: countdown === 'GO' || countdown === 'GO!' ? '0 0 50px #00ff00' : '0 0 50px #00f0ff'
              }}
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}