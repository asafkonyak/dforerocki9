import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '../components/GlassCard';
import { Volume2, Video } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';
import { CanvasRenderer } from '../../components/CanvasRenderer';
import { supabase } from '../../lib/supabase';
import { AvatarDisplay } from '../components/AvatarDisplay';
import { CameraFeed } from '../components/CameraFeed';
import { useSocket } from '../../contexts/SocketContext';
import { GameCanvas } from '../components/GameCanvas';

export function OneVsOneGameScreen() {
  const navigate = useNavigate();
  const location = useLocation();

  // Stats Tracking Refs
  const maxForceRef = useRef<number>(0);
  const forceHistoryRef = useRef<{time: number, force: number}[]>([]);
  const lastForceCaptureTimeRef = useRef<number>(0);

  // Get game state from navigation
  const matchId = location.state?.matchId;
  const isPlayer1 = location.state?.isPlayer1 ?? true;
  const opponent = location.state?.opponent;
  const gameType = location.state?.gameType || '1_round';
  const hand = location.state?.hand || 'RIGHT';

  const { sendMessage, lastMessage } = useSocket();
  const [armPosition, setArmPosition] = useState(50);
  const [player1Power, setPlayer1Power] = useState(100);
  const [player2Power, setPlayer2Power] = useState(100);
  const [isGameActive, setIsGameActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | string | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(true);
  const [commandsSent, setCommandsSent] = useState(false);
  const [angleValue, setAngleValue] = useState(0);
  const [resistanceValue, setResistanceValue] = useState(0);
  const [profile, setProfile] = useState<{ id?: string; username: string; avatar_url: string; xp: number; rank: string; preferred_hand?: string } | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const { socket, isConnected } = useSocket();

  // Round-based states
  const [roundsWonPlayer, setRoundsWonPlayer] = useState(0);
  const [roundsWonOpponent, setRoundsWonOpponent] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundWinner, setRoundWinner] = useState<string | null>(null);
  const [intermissionTime, setIntermissionTime] = useState<number | null>(null);

  const getRequiredWins = () => {
    if (gameType === 'bo3') return 2;
    if (gameType === 'bo5') return 3;
    return 1;
  };

  const requiredWins = getRequiredWins();

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      let playerId = localStorage.getItem('fighter_player_id');

      if (user && user.id) {
        const { data: player } = await supabase.from('players').select('id').eq('user_id', user.id).maybeSingle();
        if (player?.id) {
          playerId = player.id;
          if (playerId) localStorage.setItem('fighter_player_id', playerId);
        }
      }

      if (playerId) {
        const { data, error } = await supabase
          .from('players')
          .select('username, avatar_url, xp, rank, preferred_hand')
          .eq('id', playerId)
          .maybeSingle();

        if (data && !error) {
          setProfile({
            id: playerId || undefined,
            username: data.username || 'YOU',
            avatar_url: data.avatar_url || '👤',
            xp: data.xp || 0,
            rank: data.rank || 'Bronze',
            preferred_hand: data.preferred_hand || 'right'
          });
        }
      } else {
        setProfile({
          username: 'GUEST_PLAYER',
          avatar_url: '👤',
          xp: 0,
          rank: 'Guest'
        });
      }
    }
    fetchProfile();
  }, []);

  // Enumerate cameras on mount
  useEffect(() => {
    async function getDevices() {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const vDevices = allDevices.filter(d => d.kind === 'videoinput');
        setVideoDevices(vDevices);
      } catch (err) {
        console.error("Error enumerating devices:", err);
      }
    }
    
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop());
        getDevices();
      })
      .catch(() => getDevices());
  }, []);

  // No SINGLE_PLAYER_START needed — INIT is sent from the 1v1 pregame screen
  useEffect(() => {
    if (isConnected && isReady && !commandsSent) {
      console.log('[1v1Game] Socket connected. Ready for game data.');
      setCommandsSent(true);
    }
  }, [isConnected, isReady, commandsSent]);

  // Fight Countdown UI State
  useEffect(() => {
    if (isReady && !isGameActive && !winner) {
      setShowCountdown(true);
      if (countdown === null) setCountdown('READY');
    }
  }, [isReady, isGameActive, winner]);

  const comboRef = useRef(0);

  // Player data: Local player is always Blue (Player 1), Opponent is always Red (Player 2)
  const localPlayer = {
    name: profile?.username || 'YOU',
    avatar: profile?.avatar_url || '👤',
    rank: profile?.rank || 'Novice'
  };

  const opponentInfo = {
    name: opponent?.username || 'OPPONENT',
    avatar: opponent?.avatar_url || '👤',
    rank: 'RIVAL'
  };

  // Player 1 (Left/Blue) = Local, Player 2 (Right/Red) = Opponent
  const player1 = localPlayer;
  const player2 = opponentInfo;

  // Win/Loss checks disabled
  useEffect(() => {
    console.log('[1v1Game] Win/Loss checks via armPosition are disabled.');
  }, [armPosition, isGameActive]);

  // Handle Intermission Timer
  useEffect(() => {
    if (intermissionTime !== null && intermissionTime > 0 && !winner) {
      const timer = setInterval(() => {
        setIntermissionTime(prev => prev! - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (intermissionTime === 0 && !winner) {
      setIntermissionTime(null);
      setRoundWinner(null);
      setCurrentRound(prev => prev + 1);
      setArmPosition(50);
      setPlayer1Power(100);
      setPlayer2Power(100);
      setAngleValue(0); 
      
      if (socket && socket.readyState === WebSocket.OPEN) {
        const myPlayerId = profile?.id || localStorage.getItem('fighter_player_id') || 'GUEST';
        const playerHand = (profile?.preferred_hand || 'right').toUpperCase();
        socket.send(JSON.stringify({
          cmd: {
            INIT: 0,
            PLAYER_ID: myPlayerId,
            HAND: playerHand
          }
        }));
      }
    }
  }, [intermissionTime, winner, socket, profile]);

  const saveMatchResult = async (finalWinner: 'player1' | 'player2') => {
    const { data: { user } } = await supabase.auth.getUser();
    let playerId = localStorage.getItem('fighter_player_id');

    if (user) {
      const { data: player } = await supabase.from('players').select('id').eq('user_id', user.id).maybeSingle();
      if (player?.id) playerId = player.id;
    }

    if (!playerId) return;

    const endTime = Date.now();
    const durationSeconds = startTime ? (endTime - startTime) / 1000 : 0;

    let finalMaxForce = Math.round(maxForceRef.current * 10) / 10;
    if (forceHistoryRef.current.length === 0) forceHistoryRef.current.push({ time: 0, force: 0 });
    
    let avgForce = Math.round(
      forceHistoryRef.current.reduce((acc, curr) => acc + curr.force, 0) / forceHistoryRef.current.length * 10
    ) / 10;

    let forceHistory = [...forceHistoryRef.current];
    const handUsed = hand || profile?.preferred_hand || 'right';
    const isLeft = handUsed.toLowerCase() === 'left';
    if (isLeft) {
      finalMaxForce = -finalMaxForce;
      avgForce = -avgForce;
      forceHistory = forceHistory.map(f => ({ time: f.time, force: -f.force }));
    }

    const scoreObj = {
      p1_rounds: finalWinner === 'player1' ? roundsWonPlayer + 1 : roundsWonPlayer,
      p2_rounds: finalWinner === 'player2' ? roundsWonOpponent + 1 : roundsWonOpponent,
      peakForce: finalMaxForce,
      avgForce: avgForce,
      hand: isLeft ? 'left' : 'right'
    };

    const isMeWinner = finalWinner === 'player1'; // Local player is always player1
    const opponentId = opponent?.id || null;
    const winnerId = isMeWinner ? playerId : opponentId;

    if (matchId) {
      await supabase.from('matches').update({
        winner_id: winnerId,
        status: 'done',
        duration: durationSeconds,
        score: scoreObj
      }).eq('id', matchId);
    }

    // Update Player Statistics
    const updatePlayerStats = async (pId: string, isWin: boolean) => {
      const { data: pData } = await supabase.from('players').select('win_count, loss_count, last_results').eq('id', pId).single();
      if (pData) {
        const results = pData.last_results ? pData.last_results.split(',').filter(Boolean) : [];
        results.push(isWin ? 'W' : 'L');
        const newResults = results.slice(-10).join(',');
        await supabase.from('players').update({
          win_count: isWin ? (pData.win_count || 0) + 1 : (pData.win_count || 0),
          loss_count: !isWin ? (pData.loss_count || 0) + 1 : (pData.loss_count || 0),
          last_results: newResults,
          last_game_time: new Date().toISOString()
        }).eq('id', pId);
      }
    };

    await updatePlayerStats(playerId, isMeWinner);
    if (opponentId) {
      await updatePlayerStats(opponentId, !isMeWinner);
    }

    const earnedXp = 300;
    if (isMeWinner) {
      await supabase.rpc('increment_xp', { p_id: playerId, xp_amount: earnedXp });
    }

    setTimeout(() => {
      navigate('/leaderboard', {
        state: {
          result: isMeWinner ? 'win' : 'loss',
          scoreChange: isMeWinner ? 300 : -100,
          rankChange: isMeWinner ? 2 : -1,
          combo: comboRef.current,
          matchId,
          gameMode: 'ranked',
          gameType
        }
      });
    }, 3000);
  };

  // Handle Socket Messages
  useEffect(() => {
    if (!socket || winner) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const serverData = data.data || data;

        if (serverData.position !== undefined) {
          setAngleValue(Number(serverData.position));
          const derivedArmPos = 50 + (Number(serverData.position) / 1.4);
          setArmPosition(Math.max(0, Math.min(100, derivedArmPos)));
        }

        if (serverData.result !== undefined) {
          const resultVal = Number(serverData.result);
          setResistanceValue(resultVal);

          if (isGameActive && startTime) {
            maxForceRef.current = Math.max(maxForceRef.current, resultVal);
            const now = Date.now();
            if (now - lastForceCaptureTimeRef.current >= 1000) {
              const elapsedSeconds = Math.floor((now - startTime) / 1000);
              forceHistoryRef.current.push({ time: elapsedSeconds, force: resultVal });
              lastForceCaptureTimeRef.current = now;
            }
          }
        }

        let cdVal = null;
        if (serverData.type === 'countdown') cdVal = serverData.value;
        else if (serverData.cmd?.count_down !== undefined) cdVal = serverData.cmd.count_down;
        else if (serverData.count_down !== undefined) cdVal = serverData.count_down;
        else if (serverData.countdown !== undefined) cdVal = serverData.countdown;

        if (cdVal !== null) {
          setCountdown(cdVal);
          setShowCountdown(true);
        }

        if (serverData.acs_state === 'ACS_GAME' && !isGameActive) {
          setShowCountdown(true);
          setCountdown('GO!');
          setIsGameActive(true);
          setStartTime(Date.now());
          maxForceRef.current = 0;
          forceHistoryRef.current = [];
          lastForceCaptureTimeRef.current = Date.now();
          setTimeout(() => setShowCountdown(false), 1000);
        }

        const isMultiWin = serverData.multiplayer_state === 'MAIN_SM_GAMEOVER_WIN' || serverData.multiplayer_state === 'MULTIPLAYER_SM_GAMEOVER_WIN';
        const isMultiLose = serverData.multiplayer_state === 'MAIN_SM_GAMEOVER_LOSE' || serverData.multiplayer_state === 'MULTIPLAYER_SM_GAMEOVER_LOSE';
        const isSingleWin = serverData.single_player_state === 'SINGLE_PLAYER_GAMEOVER_WIN' || serverData.single_player_state === 'SINGLE_PLAYER_WIN';
        const isSingleLose = serverData.single_player_state === 'SINGLE_PLAYER_GAMEOVER_LOSE' || serverData.single_player_state === 'SINGLE_PLAYER_LOSE';

        if (isMultiWin || isMultiLose || isSingleWin || isSingleLose) {
          setIsGameActive(false);
          setShowCountdown(false);
          setCountdown(null);
          
          const isMeWin = isMultiWin || isSingleWin;
          // Local player is always player1 (Blue)
          const roundWinnerSlot = isMeWin ? 'player1' : 'player2';
            
          setRoundWinner(roundWinnerSlot);
          
          let p1Wins = roundsWonPlayer;
          let p2Wins = roundsWonOpponent;

          if (roundWinnerSlot === 'player1') { p1Wins++; setRoundsWonPlayer(p1Wins); }
          else { p2Wins++; setRoundsWonOpponent(p2Wins); }

          if (p1Wins >= requiredWins) { setWinner('player1'); saveMatchResult('player1'); }
          else if (p2Wins >= requiredWins) { setWinner('player2'); saveMatchResult('player2'); }
          else { setIntermissionTime(90); }
        }

        if (serverData.force_p1 !== undefined) setPlayer1Power(serverData.force_p1);
        if (serverData.force_p2 !== undefined) setPlayer2Power(serverData.force_p2);

      } catch (e) {
        // Skip non-JSON
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, isGameActive, winner, roundsWonPlayer, roundsWonOpponent, requiredWins, profile]);


  return (
    <div className="min-h-screen bg-[#0a0515] relative overflow-hidden">
      {/* Dynamic Canvas Background */}
      <div className="absolute inset-0 pointer-events-none z-0 mix-blend-screen opacity-50">
        <CanvasRenderer
          width={typeof window !== 'undefined' ? window.innerWidth : 1000}
          height={typeof window !== 'undefined' ? window.innerHeight : 1000}
          draw={(ctx: CanvasRenderingContext2D, frame: number) => {
            const width = ctx.canvas.width;
            const height = ctx.canvas.height;
            const cx = width / 2;
            const cy = height / 2;
            const time = frame * 0.02;
            ctx.fillStyle = `rgba(0, 240, 255, ${Math.abs(Math.sin(time)) * 0.3})`;
            ctx.beginPath();
            ctx.arc(cx + Math.cos(time * 1.5) * (width * 0.3), cy + Math.sin(time) * (height * 0.3), 2 + Math.abs(Math.sin(time * 3)) * 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(255, 0, 110, ${Math.abs(Math.cos(time * 1.2)) * 0.3})`;
            ctx.beginPath();
            ctx.arc(cx + Math.sin(time * 0.8) * (width * 0.35), cy + Math.cos(time * 1.3) * (height * 0.35), 2 + Math.abs(Math.cos(time * 2)) * 4, 0, Math.PI * 2);
            ctx.fill();
          }}
        />
      </div>

      {/* Dynamic Video Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover scale-105" style={{ filter: 'brightness(0.4) contrast(1.2)' }}>
          <source src="/assets/robots/back_stage1.mp4" type="video/mp4" />
        </video>
        <div className={`absolute inset-0 bg-black/40 transition-all duration-300`} />
        <motion.div className="absolute inset-0 bg-gradient-to-tr from-[#00f0ff]/20 via-transparent to-transparent" animate={{ opacity: armPosition < 50 ? 0.6 : 0.2 }} />
        <motion.div className="absolute inset-0 bg-gradient-to-bl from-[#ff006e]/20 via-transparent to-transparent" animate={{ opacity: armPosition > 50 ? 0.6 : 0.2 }} />
      </div>

      {/* VS Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div className="text-[15rem] font-bold text-white/5" style={{ fontFamily: "'Orbitron', sans-serif", textShadow: '0 0 80px rgba(0, 240, 255, 0.3), 0 0 120px rgba(255, 0, 110, 0.3)' }} animate={{ rotate: [0, 5, 0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, type: 'tween' }}>
          VS
        </motion.div>
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `linear-gradient(#00f0ff 1px, transparent 1px), linear-gradient(90deg, #00f0ff 1px, transparent 1px)`, backgroundSize: '50px 50px' }} />

      {/* Main Content */}
      <div className="relative z-10 h-screen flex flex-col overflow-hidden">
        <div className="p-4 flex-shrink-0">
          <div className="max-w-7xl mx-auto flex items-center justify-end">
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-white/60" />
            </div>
          </div>
        </div>

        {/* Player Cards */}
        <div className="absolute inset-0 pt-24 px-4 flex justify-between pointer-events-none z-0">
          {/* Player 1 - Left (Blue / Local) */}
          <motion.div className="w-[48vw] max-w-[800px] pointer-events-auto" animate={{ scale: armPosition < 40 ? 1.05 : 1 }}>
            <GlassCard className="p-3 border-2 border-[#00f0ff] shadow-[0_0_50px_rgba(0,240,255,0.4)] flex flex-col gap-3 bg-black/60">
              <div className={`w-full h-[450px] md:h-[600px] rounded-lg overflow-hidden border border-[#00f0ff]/30 relative bg-[#0a0515] shadow-[0_0_30px_rgba(0,240,255,0.3)]`}>
                {profile?.avatar_url && (
                  <div className="absolute inset-0 z-0">
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover opacity-60 grayscale brightness-50" />
                  </div>
                )}
                <div className="w-full h-full relative z-10">
                  <CameraFeed deviceId={videoDevices[0]?.deviceId} transparent={true} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-20" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2 z-30">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-white text-[10px] font-black tracking-widest uppercase">REC</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <AvatarDisplay avatar={player1.avatar} className="border-2 border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.6)]" size="md" />
                </div>
                <div>
                  <h3 className="text-2xl font-black italic text-[#00f0ff] tracking-widest leading-none" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {player1.name} (YOU)
                  </h3>
                  <p className="text-[#00f0ff] text-xs font-bold mt-1 uppercase tracking-[0.2em]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {hand || 'RIGHT'} HAND
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Player 2 - Right (Red / Opponent) */}
          <motion.div className="w-[48vw] max-w-[800px] pointer-events-auto" animate={{ scale: armPosition > 60 ? 1.05 : 1 }}>
            <GlassCard className="p-3 border-2 border-[#ff006e] shadow-[0_0_50px_rgba(255,0,110,0.4)] flex flex-col gap-3 bg-black/60">
              <div className={`w-full h-[450px] md:h-[600px] rounded-lg overflow-hidden border border-[#ff006e]/30 relative bg-black shadow-[0_0_30px_rgba(255,0,110,0.3)]`}>
                {/* Opponent camera placeholder */}
                <div className="w-full h-full flex flex-col items-center justify-center text-[#ff006e]/50">
                  <Video className="w-8 h-8 mb-1" />
                  <span className="text-[10px] tracking-widest font-bold">OPPONENT CAM</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                <div className="absolute bottom-2 left-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#ff006e] animate-pulse" />
                  <span className="text-white text-[8px] font-bold tracking-widest uppercase">LIVE</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 w-full">
                <div className="flex flex-col items-end text-right">
                  <h3 className="text-2xl font-black italic text-[#ff006e] tracking-widest leading-none" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {player2.name}
                  </h3>
                  <p className="text-[#ff006e] text-xs font-bold mt-1 uppercase tracking-[0.2em]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    RIVAL
                  </p>
                </div>
                <div className="relative">
                  <AvatarDisplay avatar={player2.avatar} className="border-2 border-[#ff006e] shadow-[0_0_20px_rgba(255,0,110,0.6)]" size="md" />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Round Finished Overlay */}
        <AnimatePresence>
          {roundWinner && !winner && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }} className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
              <div className="bg-black/80 border-y border-[#00f0ff]/30 w-full py-20 flex flex-col items-center shadow-[0_0_50px_rgba(0,240,255,0.2)]">
                <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className={`text-7xl font-black italic tracking-tighter mb-8 ${roundWinner === 'player1' ? 'text-[#00f0ff]' : 'text-[#ff006e]'}`} style={{ fontFamily: "'Orbitron', sans-serif", textShadow: `0 0 20px ${roundWinner === 'player1' ? '#00f0ff' : '#ff006e'}` }}>
                  {roundWinner === 'player1' ? 'ROUND WON' : 'ROUND LOST'}
                </motion.div>
                
                {intermissionTime !== null && (
                  <GlassCard className="px-12 py-6 border-2 border-[#00f0ff] shadow-[0_0_30px_rgba(0,240,255,0.4)] flex flex-col items-center bg-black/60 relative overflow-hidden pointer-events-auto">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#00f0ff]/10 to-transparent pointer-events-none" />
                    <motion.div className="absolute bottom-0 left-0 h-1 bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]" initial={{ width: '100%' }} animate={{ width: `${(intermissionTime / 90) * 100}%` }} transition={{ duration: 1, ease: 'linear' }} />
                    <p className="text-white/60 text-xs uppercase tracking-[0.3em] font-bold mb-2 z-10">Next Round In</p>
                    <div className="text-6xl font-black text-[#00f0ff] tracking-widest z-10" style={{ fontFamily: "'Orbitron', monospace", textShadow: '0 0 20px rgba(0,240,255,0.6)' }}>
                      {intermissionTime}s
                    </div>
                  </GlassCard>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center - Battle Area */}
        <div className="flex-1 flex items-end justify-center px-6 pb-32 min-h-0 relative z-10 pointer-events-none mt-40 md:mt-0">
          <div className="w-full max-w-4xl pointer-events-auto">
            <motion.div className="relative w-full max-w-[500px] h-[350px] mx-auto overflow-visible" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
              <GameCanvas armPosition={armPosition} resistanceValue={resistanceValue} player1Power={player1Power} player2Power={player2Power} width={500} height={350} />

              <div className="absolute -bottom-[80px] left-1/2 -translate-x-1/2 w-full flex justify-center gap-8 z-30">
                <motion.div className="relative" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                  <GlassCard className="px-6 py-4 border-2 border-[#00f0ff]/40 bg-black/60">
                    <div className="relative">
                      <div className="text-[#00f0ff]/60 text-xs uppercase tracking-widest mb-1">Current Angle</div>
                      <div className="text-3xl font-bold text-[#00f0ff]" style={{ fontFamily: "'Orbitron', monospace", textShadow: '0 0 10px rgba(0, 240, 255, 0.8)' }}>
                        {Math.abs(angleValue).toFixed(2)}°
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>

                <motion.div className="relative" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}>
                  <GlassCard className="px-6 py-4 border-2 border-[#ff006e]/40 bg-black/60">
                    <div className="relative">
                      <div className="text-[#ff006e]/60 text-xs uppercase tracking-widest mb-1">Resistance</div>
                      <div className="text-3xl font-bold text-[#ff006e]" style={{ fontFamily: "'Orbitron', monospace", textShadow: '0 0 10px rgba(255, 0, 110, 0.8)' }}>
                        {resistanceValue.toFixed(2)} <span className="text-xs not-italic">KG</span>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Winner Announcement */}
        <AnimatePresence>
          {winner && (
            <motion.div className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div initial={{ scale: 0.5, y: 50 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} className="relative w-full py-12 flex flex-col items-center justify-center overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-r ${winner === 'player1' ? 'from-transparent via-[#00f0ff]/40 to-transparent' : 'from-transparent via-[#ff006e]/40 to-transparent'}`} />
                <div className={`absolute inset-0 border-y-2 ${winner === 'player1' ? 'border-[#00f0ff]' : 'border-[#ff006e]'}`} />
                <h2 className={`relative z-10 text-8xl font-black italic tracking-tighter ${winner === 'player1' ? 'text-[#00f0ff]' : 'text-[#ff006e]'}`} style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  {winner === 'player1' ? 'YOU WIN!' : 'YOU LOSE!'}
                </h2>
                <p className={`relative z-10 mt-4 tracking-[0.5em] uppercase font-bold text-lg ${winner === 'player1' ? 'text-[#00f0ff]/80' : 'text-[#ff006e]/80'}`}>
                  HEADING TO LEADERBOARD...
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Countdown Overlay */}
        <AnimatePresence>
          {showCountdown && (
            <motion.div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div key={countdown} initial={{ scale: 0.5, opacity: 0, rotate: -20 }} animate={{ scale: 1.5, opacity: 1, rotate: 0 }} exit={{ scale: 3, opacity: 0, rotate: 20 }} transition={{ duration: 0.5, type: 'spring', damping: 12 }} className="relative">
                <h2 className={`text-[12rem] font-black italic ${countdown === 'GO!' ? 'text-[#ffff00]' : 'text-white'}`} style={{ fontFamily: "'Orbitron', sans-serif", textShadow: countdown === 'GO!' ? '0 0 80px rgba(255, 255, 0, 0.8), 0 0 120px rgba(255, 255, 0, 0.4)' : '0 0 40px rgba(255, 255, 255, 0.5)' }}>
                  {countdown}
                </h2>
                {countdown === 'GO!' && (
                  <motion.div className="absolute inset-x-0 -bottom-10 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="text-[#ffff00] text-2xl font-bold uppercase tracking-[0.5em]">ENGAGE!</p>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
