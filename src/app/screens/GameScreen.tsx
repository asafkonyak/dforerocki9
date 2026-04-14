import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '../components/GlassCard';
import { Zap, Trophy, Flame, Volume2, Video } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';
import { CanvasRenderer } from '../../components/CanvasRenderer';
import { supabase } from '../../lib/supabase';
import { AvatarDisplay } from '../components/AvatarDisplay';
import { CameraFeed } from '../components/CameraFeed';
import { useSocket } from '../../contexts/SocketContext';
import { GameCanvas } from '../components/GameCanvas';

export function GameScreen() {
  // 1. Initial configuration
  const navigate = useNavigate();
  const location = useLocation();

  // Stats Tracking Refs
  const maxForceRef = useRef<number>(0);
  const forceHistoryRef = useRef<{time: number, force: number}[]>([]);
  const lastForceCaptureTimeRef = useRef<number>(0);

  // Get game mode from location state
  const gameMode = location.state?.mode || 'normal';
  const stageNumber = location.state?.stageNumber;
  const stageName = location.state?.stageName;

  const [armPosition, setArmPosition] = useState(50);
  const [player1Power, setPlayer1Power] = useState(100);
  const [player2Power, setPlayer2Power] = useState(100);
  const [isGameActive, setIsGameActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | string | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [isBlurred, setIsBlurred] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [angleValue, setAngleValue] = useState(0);
  const [resistanceValue, setResistanceValue] = useState(60); // Default KG
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [profile, setProfile] = useState<{ id?: string; username: string; avatar_url: string; xp: number; rank: string; preferred_hand?: string } | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const { socket, isConnected } = useSocket();

  // Round-based states
  const gameType = location.state?.gameType || '1_round';
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
        // Fallback for new users/guests
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
        console.log('[GameScreen] Found video devices:', vDevices);
        setVideoDevices(vDevices);
      } catch (err) {
        console.error("Error enumerating devices:", err);
      }
    }
    
    // Request permission first to ensure we can see labels/IDs
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop());
        getDevices();
      })
      .catch(() => getDevices());
  }, []);

  // Audio Hooks - Placeholders for actual sound files
  // REMOVED: playTap, playWin, playLose, playCombo, playStart (Missing files)

  // Stage-specific robot intro sound
  const getStageAudioSrc = () => {
    if (!stageNumber) return '/assets/robots/stage1.mp3';
    const num = Number(stageNumber);
    if (num === 2) return '/assets/robots/stage2.ogg';
    if (num === 3) return '/assets/robots/stage3.mp3';
    return `/assets/robots/stage${num}.mp3`;
  };

  const stageAudioSrc = getStageAudioSrc();

  const { play: playRobotIntro } = useAudio({
    src: stageAudioSrc,
    volume: 0.7,
    autoplay: true
  });

  // Check if both players are ready
  useEffect(() => {
    if (gameMode !== 'ranked') {
      setIsReady(true);
      return;
    }
    
    // For ranked, ensure we have opponent info
    if (location.state?.opponent) {
      setIsReady(true);
    }
  }, [gameMode, location.state]);

  // Fight Countdown Logic
  useEffect(() => {
    if (isReady && !isGameActive) {
      setShowCountdown(true);
      if (gameMode === 'gauntlet') {
        setIsBlurred(true);
        setCountdown('READY');
      } else if (gameMode !== 'ranked') {
        setCountdown('READY');
      }
    }
  }, [isReady, gameMode, isGameActive]);


  // Refs to capture latest values for the navigate timeout
  const comboRef = useRef(combo);
  comboRef.current = combo;

  // Resolve Opponent Data for Gauntlet
  const getRobotData = (stage: number) => {
    const robots = [
      { name: 'TRAINING DROID', avatar: '/assets/robots/stage1.png' },
      { name: 'MECH BRAWLER', avatar: '/assets/robots/stage2.png' },
      { name: 'STEEL ASSASSIN', avatar: '/assets/robots/stage3.png' },
      { name: 'CRUSHER X-9000', avatar: '/assets/robots/stage4.jpg' },
      { name: 'ANNIHILATOR PRIME', avatar: '/assets/robots/stage5.png' }
    ];
    return robots[Math.min(stage - 1, 4)] || robots[0];
  };

  const isRanked = gameMode === 'ranked' && location.state?.matchId && location.state?.opponent;
  const matchId = location.state?.matchId;
  const rankedOpponent = location.state?.opponent;
  const isPlayer1 = location.state?.isPlayer1 ?? true;

  // Player data mapping based on roles
  const localPlayer = {
    name: profile?.username || 'YOU',
    avatar: profile?.avatar_url || '👤',
    rank: profile?.rank || 'Novice',
    xp: profile?.xp || 0
  };

  const opponentInfo = isRanked
    ? { name: rankedOpponent.username, avatar: rankedOpponent.avatar, rank: 'RIVAL' }
    : gameMode === 'gauntlet'
      ? { ...getRobotData(stageNumber || 1), rank: 'GAUNTLET' }
      : { name: 'CYBER_QUEEN', avatar: '🤖', rank: 'AI' };

  // UI Positions: player1 (Left) is always Host/P1, player2 (Right) is always Guest/P2
  const player1 = isRanked 
    ? (isPlayer1 ? localPlayer : opponentInfo) 
    : localPlayer;

  const player2 = isRanked 
    ? (isPlayer1 ? opponentInfo : localPlayer) 
    : opponentInfo;

  // REMOVED: AI opponent tapping simulation
  // This is now driven by the socket/hardware

  // Check win condition
  // REMOVED: Win/Loss condition check
  // The user requested to remove win/loss logic for now.
  // The game will remain active until manually exited.
  useEffect(() => {
    // This effect is now empty to ensure no win/loss navigation occurs automatically on armPosition.
    console.log('[Game v22] - Win/Loss checks via armPosition are disabled.');
  }, [armPosition, isGameActive]);

  // Handle Intermission Timer
  useEffect(() => {
    if (intermissionTime !== null && intermissionTime > 0 && !winner) {
      const timer = setInterval(() => {
        setIntermissionTime(prev => prev! - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (intermissionTime === 0 && !winner) {
      // Intermission ended
      console.log('[Game v22] Intermission ended. Sending INIT: 0');
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

  const resetRound = () => {
    setArmPosition(50);
    setPlayer1Power(100);
    setPlayer2Power(100);
    setIsGameActive(true);
    setRoundWinner(null);
    setCurrentRound(prev => prev + 1);
  };

  const saveMatchResult = async (finalWinner: 'player1' | 'player2') => {
    // 1. Resolve Player ID
    const { data: { user } } = await supabase.auth.getUser();
    let playerId = localStorage.getItem('fighter_player_id');

    if (user) {
      const { data: player } = await supabase.from('players').select('id').eq('user_id', user.id).maybeSingle();
      if (player?.id) playerId = player.id;
    }

    if (!playerId) return;

    // 2. Calculate duration
    const endTime = Date.now();
    const durationSeconds = startTime ? (endTime - startTime) / 1000 : 0;

    // Calculate forces
    let finalMaxForce = Math.round(maxForceRef.current * 10) / 10;
    if (forceHistoryRef.current.length === 0) forceHistoryRef.current.push({ time: 0, force: 0 });
    
    let avgForce = Math.round(
      forceHistoryRef.current.reduce((acc, curr) => acc + curr.force, 0) / forceHistoryRef.current.length * 10
    ) / 10;

    // Adjust for left handed
    let forceHistory = [...forceHistoryRef.current];
    const handUsed = location.state?.hand || profile?.preferred_hand || 'right';
    const isLeft = handUsed.toLowerCase() === 'left';
    if (isLeft) {
      finalMaxForce = -finalMaxForce;
      avgForce = -avgForce;
      forceHistory = forceHistory.map(f => ({ time: f.time, force: -f.force }));
    }

    // 3. Record the match
    const scoreObj = {
      p1_rounds: finalWinner === 'player1' ? roundsWonPlayer + 1 : roundsWonPlayer,
      p2_rounds: finalWinner === 'player2' ? roundsWonOpponent + 1 : roundsWonOpponent,
      peakForce: finalMaxForce,
      avgForce: avgForce,
      hand: isLeft ? 'left' : 'right'
    };

    const isMeWinner = finalWinner === (isPlayer1 ? 'player1' : 'player2');
    const opponentId = isRanked ? location.state?.opponent?.id : null;
    const winnerId = isMeWinner ? playerId : opponentId;

    if (matchId) {
      await supabase.from('matches').update({
        winner_id: winnerId,
        status: 'done',
        duration: durationSeconds,
        score: scoreObj
      }).eq('id', matchId);
    } else {
      await supabase.from('matches').insert({
        player1_id: playerId,
        player2_id: opponentId,
        winner_id: winnerId,
        status: 'done',
        duration: durationSeconds,
        score: scoreObj
      });
    }

    // 4. Update Player Statistics (Scenario Post-Game)
    const updatePlayerStats = async (pId: string, isWin: boolean) => {
      const { data: pData } = await supabase.from('players').select('win_count, loss_count, last_results').eq('id', pId).single();
      if (pData) {
        const results = pData.last_results ? pData.last_results.split(',').filter(Boolean) : [];
        results.push(isWin ? 'W' : 'L');
        const newResults = results.slice(-10).join(','); // Keep last 10

        await supabase.from('players').update({
          win_count: isWin ? (pData.win_count || 0) + 1 : (pData.win_count || 0),
          loss_count: !isWin ? (pData.loss_count || 0) + 1 : (pData.loss_count || 0),
          last_results: newResults,
          last_game_time: new Date().toISOString()
        }).eq('id', pId);
      }
    };

    if (isRanked) {
      await updatePlayerStats(playerId, isMeWinner);
      if (opponentId) {
        await updatePlayerStats(opponentId, !isMeWinner);
      }
    }

    // 5. Add XP and Update Progress
    const isWin = isMeWinner;
    const baseXp = (gameMode === 'gauntlet' && isWin) ? 500 : 0;
    const bonusXp = (gameMode === 'gauntlet' && isWin) ? Math.round(finalMaxForce * 10) : 0;
    const totalEarnedXp = baseXp + bonusXp;

    if (isWin && totalEarnedXp > 0) {
      await supabase.rpc('increment_xp', { p_id: playerId, xp_amount: totalEarnedXp });
      if (gameMode === 'gauntlet' && stageNumber) {
        // Fetch current progress to avoid demotion
        const { data: playerData } = await supabase.from('players').select('gauntlet_progress').eq('id', playerId).maybeSingle();
        const currentProgress = playerData?.gauntlet_progress || 1;
        const nextStage = stageNumber + 1;

        if (nextStage > currentProgress) {
          await supabase.from('players').update({ gauntlet_progress: nextStage }).eq('id', playerId);
          localStorage.setItem('fighter_gauntlet_progress', nextStage.toString());
        }
      }
    }

    // 6. Navigate
    setTimeout(() => {
      // Note: Force calculations are already done above and captured in closure
      if (gameMode === 'gauntlet') {
        navigate('/victory', {
          state: {
            isWin,
            peakForce: finalMaxForce,
            avgForce: avgForce,
            enduranceTime: durationSeconds,
            xpEarned: totalEarnedXp,
            baseXp,
            bonusXp,
            stageName: stageName || 'CRUSHER X-9000',
            stageNumber: stageNumber || 1,
            hand: isLeft ? 'left' : 'right',
            forceHistory: forceHistory,
          }
        });
      } else {
        navigate('/leaderboard', {
          state: {
            result: isWin ? 'win' : 'loss',
            scoreChange: isWin ? 300 : -100,
            rankChange: isWin ? 2 : -1,
            combo: comboRef.current,
            matchId: location.state?.matchId,
            gameMode: gameMode,
            gameType: gameType
          }
        });
      }
    }, 3000);
  };

  // REMOVED: Power drain over time
  // This is now handled by physical resistance or hardware logic

  // Handle Socket Messages for Real-time Game Data
  useEffect(() => {
    if (!socket || winner) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const serverData = data.data || data;

        // Diagnostic Log - FULL DATA
        console.log('[Game v17] - FULL SOCKET DATA:', serverData);

        // Map server position to angle and result to resistance
        if (serverData.position !== undefined) {
          // Mapping according to user: current angle = position
          setAngleValue(Number(serverData.position));
          
          // ArmPosition (0-100) derived for visual elements (Needle, Arms)
          // assuming -70 to 70 range for angle
          const derivedArmPos = 50 + (Number(serverData.position) / 1.4);
          setArmPosition(Math.max(0, Math.min(100, derivedArmPos)));
        }

        // Mapping according to user: resistance = result
        if (serverData.result !== undefined) {
          const resultVal = Number(serverData.result);
          setResistanceValue(resultVal);

          // Track game statistics during active game
          if (isGameActive && startTime) {
            maxForceRef.current = Math.max(maxForceRef.current, resultVal);
            
            const now = Date.now();
            if (now - lastForceCaptureTimeRef.current >= 100) {
              const elapsedSeconds = (now - startTime) / 1000;
              forceHistoryRef.current.push({ time: elapsedSeconds, force: resultVal });
              lastForceCaptureTimeRef.current = now;
            }
          }
        }

        // --- NEW: Socket Driven Countdown Logic ---
        let cdVal = null;
        if (serverData.type === 'countdown') {
          cdVal = serverData.value;
        } else if (serverData.cmd && serverData.cmd.count_down !== undefined) {
          cdVal = serverData.cmd.count_down;
        } else if (serverData.count_down !== undefined) {
          cdVal = serverData.count_down;
        } else if (serverData.countdown !== undefined) {
          cdVal = serverData.countdown;
        }

        if (cdVal !== null) {
          setCountdown(cdVal);
          setShowCountdown(true);
          // Remove blur when countdown reaches 3
          if (Number(cdVal) === 3) {
            setIsBlurred(false);
          }
        }

        // Check for game start strictly via acs_state: 'ACS_GAME'
        if (serverData.acs_state === 'ACS_GAME' && !isGameActive) {
          console.log('[Game v21] - Game Start condition detected (ACS_GAME). Starting game...');
          setShowCountdown(true);
          setCountdown('GO!');
          setIsGameActive(true);
          setStartTime(Date.now());
          setIsBlurred(false); // Ensure blur is gone
          
          // reset tracking refs
          maxForceRef.current = 0;
          forceHistoryRef.current = [];
          lastForceCaptureTimeRef.current = Date.now();
          
          // Wait 800ms then fade out for snappy response
          setTimeout(() => {
            setShowCountdown(false);
          }, 800);
        }

        const isMultiWin = serverData.multiplayer_state === 'MAIN_SM_GAMEOVER_WIN' || serverData.multiplayer_state === 'MULTIPLAYER_SM_GAMEOVER_WIN';
        const isMultiLose = serverData.multiplayer_state === 'MAIN_SM_GAMEOVER_LOSE' || serverData.multiplayer_state === 'MULTIPLAYER_SM_GAMEOVER_LOSE';
        const isSingleWin = serverData.single_player_state === 'SINGLE_PLAYER_GAMEOVER_WIN' || serverData.single_player_state === 'SINGLE_PLAYER_WIN';
        const isSingleLose = serverData.single_player_state === 'SINGLE_PLAYER_GAMEOVER_LOSE' || serverData.single_player_state === 'SINGLE_PLAYER_LOSE';

        if (isMultiWin || isMultiLose || isSingleWin || isSingleLose) {
          const stateStr = isMultiWin || isMultiLose ? serverData.multiplayer_state : serverData.single_player_state;
          console.log(`[Game v24] - Match result detected via state: ${stateStr}`);
          setIsGameActive(false);
          
          const isMeWin = isMultiWin || isSingleWin;
          const roundWinnerSlot = isPlayer1 
            ? (isMeWin ? 'player1' : 'player2')
            : (isMeWin ? 'player2' : 'player1');
            
          setRoundWinner(roundWinnerSlot);
          
          let p1Wins = roundsWonPlayer;
          let p2Wins = roundsWonOpponent;

          if (roundWinnerSlot === 'player1') {
            p1Wins++;
            setRoundsWonPlayer(p1Wins);
          } else {
            p2Wins++;
            setRoundsWonOpponent(p2Wins);
          }

          if (p1Wins >= requiredWins) {
            setWinner('player1');
            saveMatchResult('player1');
          } else if (p2Wins >= requiredWins) {
            setWinner('player2');
            saveMatchResult('player2');
          } else {
            // Initiate Intermission
            setIntermissionTime(90);
          }
        }

        // Optionally map force/power if available in this message
        if (serverData.force_p1 !== undefined) setPlayer1Power(serverData.force_p1);
        if (serverData.force_p2 !== undefined) setPlayer2Power(serverData.force_p2);

      } catch (e) {
        // Skip non-JSON
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, isGameActive, winner, roundsWonPlayer, roundsWonOpponent, requiredWins, isPlayer1, profile]);


  return (
    <div className="min-h-screen bg-[#0a0515] relative overflow-hidden">
      {/* Dynamic Canvas Background Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 mix-blend-screen opacity-50">
        <CanvasRenderer
          width={typeof window !== 'undefined' ? window.innerWidth : 1000}
          height={typeof window !== 'undefined' ? window.innerHeight : 1000}
          draw={(ctx: CanvasRenderingContext2D, frame: number) => {
            const width = ctx.canvas.width;
            const height = ctx.canvas.height;
            const cx = width / 2;
            const cy = height / 2;

            // Draw floating tech particles
            const time = frame * 0.02;
            ctx.fillStyle = `rgba(0, 240, 255, ${Math.abs(Math.sin(time)) * 0.3})`;
            ctx.beginPath();
            ctx.arc(
              cx + Math.cos(time * 1.5) * (width * 0.3),
              cy + Math.sin(time) * (height * 0.3),
              2 + Math.abs(Math.sin(time * 3)) * 4,
              0, Math.PI * 2
            );
            ctx.fill();

            ctx.fillStyle = `rgba(255, 0, 110, ${Math.abs(Math.cos(time * 1.2)) * 0.3})`;
            ctx.beginPath();
            ctx.arc(
              cx + Math.sin(time * 0.8) * (width * 0.35),
              cy + Math.cos(time * 1.3) * (height * 0.35),
              2 + Math.abs(Math.cos(time * 2)) * 4,
              0, Math.PI * 2
            );
            ctx.fill();
          }}
        />
      </div>

      {/* Dynamic Video Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          key={stageNumber}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover scale-105"
          style={{ filter: 'brightness(0.4) contrast(1.2)' }}
        >
          <source
            src={`/assets/robots/back_stage${stageNumber}.mp4`}
            type="video/mp4"
            onError={(e) => {
              // Emergency fallback if stage-specific video fails
              const target = e.target as HTMLSourceElement;
              target.src = '/assets/training.mp4';
            }}
          />
        </video>

        {/* Color Overlay - Animated based on arm position */}
        <div className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-all duration-700 ${isBlurred ? 'backdrop-blur-[20px] bg-black/60' : ''}`} />

        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-[#00f0ff]/20 via-transparent to-transparent"
          animate={{
            opacity: armPosition < 50 ? 0.6 : 0.2,
          }}
        />

        <motion.div
          className="absolute inset-0 bg-gradient-to-bl from-[#ff006e]/20 via-transparent to-transparent"
          animate={{
            opacity: armPosition > 50 ? 0.6 : 0.2,
          }}
        />

        {/* Preload Next Stage Video */}
        {stageNumber && stageNumber < 5 && (
          <video
            key={`preload-${stageNumber + 1}`}
            preload="auto"
            muted
            className="hidden"
          >
            <source src={`/assets/robots/back_stage${stageNumber + 1}.mp4`} type="video/mp4" />
          </video>
        )}
      </div>

      {/* Animated VS Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="text-[15rem] font-bold text-white/5"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            textShadow: '0 0 80px rgba(0, 240, 255, 0.3), 0 0 120px rgba(255, 0, 110, 0.3)',
          }}
          animate={{
            rotate: [0, 5, 0, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            type: 'tween',
          }}
        >
          VS
        </motion.div>
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(#00f0ff 1px, transparent 1px),
            linear-gradient(90deg, #00f0ff 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 h-screen flex flex-col overflow-hidden">
        {/* Top HUD */}
        <div className="p-4 flex-shrink-0">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <motion.div
              className="flex items-center gap-2"
              animate={{
                scale: combo > 0 && combo % 10 === 0 ? [1, 1.1, 1] : 1,
              }}
              transition={{ type: 'tween' }}
            >
              <Flame className="w-5 h-5 text-[#ffff00]" />
              <span className="text-[#ffff00] text-sm uppercase tracking-wider font-bold">
                Combo: {combo}
              </span>
            </motion.div>

            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-white/60" />
            </div>
          </div>
        </div>

        {/* Player Cards - Top Section (Absolute and Massive) */}
        <div className="absolute inset-0 pt-24 px-4 flex justify-between pointer-events-none z-0">
          {/* Player 1 - Left */}
          <motion.div
            className="w-[48vw] max-w-[800px] pointer-events-auto"
            animate={{
              scale: armPosition < 40 ? 1.05 : 1,
            }}
          >
            <GlassCard className="p-3 border-2 border-[#00f0ff] shadow-[0_0_50px_rgba(0,240,255,0.4)] flex flex-col gap-3 backdrop-blur-md bg-black/60">
              {/* Camera Feed Box */}
              <div className={`w-full h-[450px] md:h-[600px] rounded-lg overflow-hidden border border-[#00f0ff]/30 relative bg-black shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-all duration-700 ${isBlurred ? 'blur-xl' : ''}`}>
                {/* 1V1 Dual Camera Support: Show first camera if available in Ranked; otherwise follow standard local feed logic */}
                {isRanked && videoDevices.length >= 2 ? (
                  <CameraFeed deviceId={videoDevices[0].deviceId} />
                ) : isPlayer1 ? (
                  <CameraFeed deviceId={videoDevices[0]?.deviceId} />
                ) : (
                  gameMode === 'gauntlet' ? (
                    <video src={`/assets/robots/stage${stageNumber}.mp4`} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#00f0ff]/50">
                      <Video className="w-8 h-8 mb-1" />
                      <span className="text-[10px] tracking-widest font-bold">AWAITING FEED</span>
                    </div>
                  )
                )}
                {/* Visual Overlays for Feed */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                <div className="absolute bottom-2 left-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-white text-[8px] font-bold tracking-widest uppercase">REC</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <AvatarDisplay
                    avatar={player1.avatar}
                    className="border-2 border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.6)]"
                    size="md"
                  />
                  {armPosition < 30 && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-[#00f0ff]"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.8, 0, 0.8],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        type: 'tween',
                      }}
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-lg text-[#00f0ff] font-bold uppercase leading-none" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {player1.name} {isPlayer1 && '(YOU)'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[#00f0ff]/60 text-[10px] font-bold uppercase tracking-widest">{player1.rank}</p>
                    <div className="px-1.5 py-0.5 rounded bg-[#00f0ff]/10 border border-[#00f0ff]/30">
                      <p className="text-[#00f0ff] text-[8px] font-black uppercase tracking-widest leading-none">ALPHA</p>
                    </div>
                  </div>
                </div>
              </div>


              {/* Stats */}
              <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-white/40 uppercase tracking-tighter">Round Wins</p>
                  <div className="flex gap-1 mt-1">
                    {[...Array(requiredWins)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded-full ${i < roundsWonPlayer ? 'bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]' : 'bg-white/5'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Player 2 - Right */}
          <motion.div
            className="w-[48vw] max-w-[800px] pointer-events-auto"
            animate={{
              scale: armPosition > 60 ? 1.05 : 1,
            }}
          >
            <GlassCard className="p-3 border-2 border-[#ff006e] shadow-[0_0_50px_rgba(255,0,110,0.4)] flex flex-col gap-3 backdrop-blur-md bg-black/60">
              {/* Rival Video/Camera Feed Box */}
              <div className={`w-full h-[450px] md:h-[600px] rounded-lg overflow-hidden border border-[#ff006e]/30 relative bg-black shadow-[0_0_30px_rgba(255,0,110,0.3)] transition-all duration-700 ${isBlurred ? 'blur-xl' : ''}`}>
                {/* Prioritize Gauntlet robot video; otherwise show second camera if available in Ranked */}
                {gameMode === 'gauntlet' ? (
                  <video src={stageNumber === 5 ? '/assets/robots/stage5_prefight.mp4' : `/assets/robots/stage${stageNumber}.mp4`} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                ) : isRanked && videoDevices.length >= 2 ? (
                  <CameraFeed deviceId={videoDevices[1].deviceId} />
                ) : !isPlayer1 ? (
                  <CameraFeed deviceId={videoDevices[0]?.deviceId} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#ff006e]/50">
                    <Video className="w-8 h-8 mb-1" />
                    <span className="text-[10px] tracking-widest font-bold">AWAITING FEED</span>
                  </div>
                )}
                {/* Visual Overlays for Feed */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                <div className="absolute bottom-2 left-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#ff006e] animate-pulse" />
                  <span className="text-white text-[8px] font-bold tracking-widest uppercase">LIVE</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 text-right">
                <div>
                  <h3 className="text-lg text-[#ff006e] font-bold uppercase leading-none" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {!isPlayer1 && '(YOU) '} {player2.name} 
                  </h3>
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <div className="px-1.5 py-0.5 rounded bg-[#ff006e]/10 border border-[#ff006e]/30">
                      <p className="text-[#ff006e] text-[8px] font-black uppercase tracking-widest leading-none">OMEGA</p>
                    </div>
                    <p className="text-[#ff006e]/60 text-[10px] font-bold uppercase tracking-widest">{player2.rank}</p>
                  </div>
                </div>
                <div className="relative">
                  <AvatarDisplay
                    avatar={player2.avatar}
                    className="border-2 border-[#ff006e] shadow-[0_0_20px_rgba(255,0,110,0.6)]"
                    size="md"
                  />
                  {armPosition > 70 && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-[#ff006e]"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.8, 0, 0.8],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        type: 'tween',
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-white/40 uppercase tracking-tighter text-right">AI Level</p>
                  <p className="text-[#ff006e] font-bold text-right">Hard</p>
                </div>
                <div>
                  <p className="text-white/40 uppercase tracking-tighter">Round Wins</p>
                  <div className="flex gap-1 mt-1 justify-end">
                    {[...Array(requiredWins)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded-full ${i < roundsWonOpponent ? 'bg-[#ff006e] shadow-[0_0_8px_#ff006e]' : 'bg-white/5'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Center - Round Info (Injected here) */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="px-6 py-2 bg-black/40 border border-white/10 backdrop-blur-md rounded-full flex flex-col items-center shadow-2xl"
          >
            <span className="text-[10px] text-[#00f0ff] font-bold tracking-[0.3em] uppercase mb-0.5">Round {currentRound}</span>
            <div className="flex items-center gap-4">
              <span className={`text-2xl font-bold ${roundsWonPlayer > roundsWonOpponent ? 'text-[#00f0ff]' : 'text-white/40'}`} style={{ fontFamily: "'Orbitron', sans-serif" }}>
                {roundsWonPlayer}
              </span>
              <div className="w-px h-8 bg-white/10" />
              <span className={`text-2xl font-bold ${roundsWonOpponent > roundsWonPlayer ? 'text-[#ff006e]' : 'text-white/40'}`} style={{ fontFamily: "'Orbitron', sans-serif" }}>
                {roundsWonOpponent}
              </span>
            </div>
            <div className="text-[8px] text-white/40 uppercase mt-1 tracking-widest">{gameType.replace('_', ' ')}</div>
          </motion.div>
        </div>

        {/* Round Finished Overlay */}
        <AnimatePresence>
          {roundWinner && !winner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
            >
              <div className="bg-black/80 backdrop-blur-xl border-y border-[#00f0ff]/30 w-full py-20 flex flex-col items-center shadow-[0_0_50px_rgba(0,240,255,0.2)]">
                <motion.div
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  className={`text-7xl font-black italic tracking-tighter mb-8 glow-text ${roundWinner === 'player1' ? 'text-[#00f0ff]' : 'text-[#ff006e]'}`}
                  style={{ fontFamily: "'Orbitron', sans-serif", textShadow: `0 0 20px ${roundWinner === 'player1' ? '#00f0ff' : '#ff006e'}` }}
                >
                  {roundWinner === 'player1' ? 'ROUND WON' : 'ROUND LOST'}
                </motion.div>
                
                {intermissionTime !== null && (
                  <GlassCard className="px-12 py-6 border-2 border-[#00f0ff] shadow-[0_0_30px_rgba(0,240,255,0.4)] flex flex-col items-center bg-black/60 relative overflow-hidden pointer-events-auto">
                     <div className="absolute inset-0 bg-gradient-to-t from-[#00f0ff]/10 to-transparent pointer-events-none" />
                     
                     {/* Progress border indicator */}
                     <motion.div
                       className="absolute bottom-0 left-0 h-1 bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]"
                       initial={{ width: '100%' }}
                       animate={{ width: `${(intermissionTime / 90) * 100}%` }}
                       transition={{ duration: 1, ease: 'linear' }}
                     />

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

        {/* Center - Arm Wrestling Battle Area */}
        <div className="flex-1 flex items-end justify-center px-6 pb-32 min-h-0 relative z-10 pointer-events-none mt-40 md:mt-0">
          <div className="w-full max-w-4xl pointer-events-auto">
            {/* HIGH-PERFORMANCE CANVAS GAUGE */}
            <motion.div
              className="relative w-full max-w-[500px] h-[350px] mx-auto overflow-visible"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <GameCanvas 
                armPosition={armPosition} 
                resistanceValue={resistanceValue} 
                player1Power={player1Power}
                player2Power={player2Power}
                width={500} 
                height={350} 
              />

              {/* DATA UI - Digital counters (Keeping these as DOM for crisp text) */}
              <div className="absolute -bottom-[80px] left-1/2 -translate-x-1/2 w-full flex justify-center gap-8 z-30">
                {/* Current Angle Display */}
                <motion.div
                  className="relative"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    type: 'tween'
                  }}
                >
                  <GlassCard className="px-6 py-4 border-2 border-[#00f0ff]/40 bg-black/60">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-[#00f0ff]/20 to-transparent rounded-xl"
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                        type: 'tween'
                      }}
                    />

                    <div className="relative">
                      <div className="text-[#00f0ff]/60 text-xs uppercase tracking-widest mb-1">
                        Current Angle
                      </div>
                      <div
                        className="text-3xl font-bold text-[#00f0ff]"
                        style={{
                          fontFamily: "'Orbitron', monospace",
                          textShadow: '0 0 10px rgba(0, 240, 255, 0.8)',
                        }}
                      >
                          {Math.abs(angleValue).toFixed(2)}°
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>

                {/* Resistance Display */}
                <motion.div
                  className="relative"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.5,
                    type: 'tween'
                  }}
                >
                  <GlassCard className="px-6 py-4 border-2 border-[#ff006e]/40 bg-black/60">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-[#ff006e]/20 to-transparent rounded-xl"
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                        delay: 1,
                        type: 'tween'
                      }}
                    />

                    <div className="relative">
                      <div className="text-[#ff006e]/60 text-xs uppercase tracking-widest mb-1">
                        Resistance
                      </div>
                      <div
                        className="text-3xl font-bold text-[#ff006e]"
                        style={{
                          fontFamily: "'Orbitron', monospace",
                          textShadow: '0 0 10px rgba(255, 0, 110, 0.8)',
                        }}
                      >
                          {resistanceValue.toFixed(2)} <span className="text-xs not-italic">KG</span>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                </div>


            </motion.div>


          </div>
        </div>



        {/* Combo Popup */}
        <AnimatePresence>
          {showCombo && (
            <motion.div
              className="absolute top-1/3 left-1/2 -translate-x-1/2 z-50"
              initial={{ scale: 0, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: -50 }}
            >
              <div className="text-center">
                <h3
                  className="text-7xl font-bold bg-gradient-to-r from-[#ffff00] via-[#ff006e] to-[#00f0ff] bg-clip-text text-transparent"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    textShadow: '0 0 40px rgba(255, 255, 0, 0.8)',
                  }}
                >
                  {combo} COMBO!
                </h3>
                <p className="text-[#ffff00] text-xl uppercase tracking-wider mt-2">
                  ⚡ ON FIRE! ⚡
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Winner Announcement */}
        <AnimatePresence>
          {winner && (
            <motion.div
              className={`fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none bg-black/60 backdrop-blur-sm`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0.5, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="relative w-full py-12 flex flex-col items-center justify-center overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${winner === (isPlayer1 ? 'player1' : 'player2') ? 'from-transparent via-[#00f0ff]/40 to-transparent' : 'from-transparent via-[#ff006e]/40 to-transparent'}`} />
                <div className={`absolute inset-0 border-y-2 ${winner === (isPlayer1 ? 'player1' : 'player2') ? 'border-[#00f0ff]' : 'border-[#ff006e]'}`} />
                
                <h2 className={`relative z-10 text-8xl font-black italic tracking-tighter ${winner === (isPlayer1 ? 'player1' : 'player2') ? 'text-[#00f0ff]' : 'text-[#ff006e]'}`} style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  {winner === (isPlayer1 ? 'player1' : 'player2') ? 'YOU WIN!' : 'YOU LOSE!'}
                </h2>
                <p className={`relative z-10 mt-4 tracking-[0.5em] uppercase font-bold text-lg ${winner === (isPlayer1 ? 'player1' : 'player2') ? 'text-[#00f0ff]/80' : 'text-[#ff006e]/80'}`}>
                  {gameMode === 'gauntlet' ? 'CONCLUDING MISSION...' : 'HEADING TO LEADERBOARD...'}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start Countdown Overlay */}
        <AnimatePresence>
          {showCountdown && (
            <motion.div
              className="absolute inset-0 z-[200] flex items-center justify-center bg-black/20 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                key={countdown}
                initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                animate={{ scale: 1.5, opacity: 1, rotate: 0 }}
                exit={{ scale: 3, opacity: 0, rotate: 20 }}
                transition={{ duration: 0.5, type: 'spring', damping: 12 }}
                className="relative"
              >
                <h2
                  className={`text-[12rem] font-black italic ${countdown === 'GO!' ? 'text-[#ffff00]' : 'text-white'}`}
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    textShadow: countdown === 'GO!'
                      ? '0 0 80px rgba(255, 255, 0, 0.8), 0 0 120px rgba(255, 255, 0, 0.4)'
                      : '0 0 40px rgba(255, 255, 255, 0.5)',
                  }}
                >
                  {countdown}
                </h2>

                {countdown === 'GO!' && (
                  <motion.div
                    className="absolute inset-x-0 -bottom-10 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className="text-[#ffff00] text-2xl font-bold uppercase tracking-[0.5em] glow-text">
                      ENGAGE!
                    </p>
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