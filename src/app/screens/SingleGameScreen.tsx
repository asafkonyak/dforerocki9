import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '../components/GlassCard';
import { Zap, Trophy, Flame, Volume2, Video } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';
import { CanvasRenderer } from '../../components/CanvasRenderer';
import { supabase } from '../../lib/supabase';
import { AvatarDisplay } from '../components/AvatarDisplay';
import { CameraFeed } from '../components/CameraFeed';
import { useCamera } from '../../contexts/CameraContext';
import { useSocket } from '../../contexts/SocketContext';
import { GameCanvas } from '../components/GameCanvas';

export function SingleGameScreen() {
  // 1. Initial configuration
  const navigate = useNavigate();
  const location = useLocation();

  // Stats Tracking Refs
  const maxForceRef = useRef<number>(0);
  const forceHistoryRef = useRef<{time: number, force: number}[]>([]);
  const lastForceCaptureTimeRef = useRef<number>(0);

  // Get game mode from location state
  const gameMode = location.state?.mode || 'normal';
  const stageNumber = location.state?.stageNumber || 1;
  const stageName = location.state?.stageName || 'STAGE 01';
  const hand = location.state?.hand || 'RIGHT';
  const { sendMessage, lastMessage } = useSocket();
  const { mainCameraId } = useCamera();
  const [armPosition, setArmPosition] = useState(50);
  const [player1Power, setPlayer1Power] = useState(100);
  const [player2Power, setPlayer2Power] = useState(100);
  const [isGameActive, setIsGameActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | string | null>(null);
  const opponentVideoRef = useRef<HTMLVideoElement>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(true);
  const [commandsSent, setCommandsSent] = useState(false);
  const [angleValue, setAngleValue] = useState(0);
  const [resistanceValue, setResistanceValue] = useState(0); // Default KG, now initialized to 0
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [profile, setProfile] = useState<{ id?: string; username: string; avatar_url: string; xp: number; rank: string; preferred_hand?: string; max?: number } | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const { socket, isConnected } = useSocket();
  
  // Video Recording State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoUrlRef = useRef<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

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
            preferred_hand: data.preferred_hand || 'right',
            max: parseFloat(localStorage.getItem('profile.max') || '0')
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

  // Camera management now handled by useCamera hook and CameraProvider

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
  // 1. Initialize match and send START command once component is ready and connected
  // The match is now triggered by the READY button in PregameScreen.
  // No automatic start command is needed here.

  // Fight Countdown UI State
  useEffect(() => {
    if (isReady && !isGameActive && !winner) {
      setShowCountdown(true);
      if (countdown === null) setCountdown('READY');
    }
  }, [isReady, isGameActive, winner]);


  // Refs to capture latest values for the navigate timeout
  const comboRef = useRef(combo);
  comboRef.current = combo;

  // Resolve Opponent Data for Gauntlet
  const getRobotData = (stage: number) => {
    const robots = [
      { name: 'MARCO', avatar: '/assets/robots/stage1.png' },
      { name: 'KAMILA', avatar: '/assets/robots/stage2.png' },
      { name: 'JACK', avatar: '/assets/robots/stage3.png' },
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

  // Video Recording Logic
  useEffect(() => {
    if (isGameActive && stream && stream.active && !mediaRecorderRef.current) {
      console.log('[Recording] Starting Match Recording... (Stream Active)');
      recordedChunksRef.current = [];
      try {
        // Try with supported types
        const options = { mimeType: 'video/webm;codecs=vp8' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.warn('[Recording] VP8 not supported, falling back to default webm');
          delete (options as any).mimeType;
        }

        const recorder = new MediaRecorder(stream, options);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        recorder.onstop = () => {
          if (recordedChunksRef.current.length > 0) {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            console.log('[Recording] Video ready:', url);
            videoUrlRef.current = url;
            setVideoUrl(url);
          } else {
            console.warn('[Recording] No chunks recorded!');
          }
        };
        recorder.start(1000); // Capture in 1s slices for better stability
        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.error('[Recording] Failed to start recorder:', err);
      }
    } else if (!isGameActive && mediaRecorderRef.current) {
      console.log('[Recording] Stopping Match Recording...');
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
  }, [isGameActive, stream]);

  // Handle opponent video sync
  useEffect(() => {
    if (countdown === 'GO' || countdown === 'GO!' || isGameActive) {
      if (opponentVideoRef.current) opponentVideoRef.current.play().catch(e => console.warn(e));
    } else {
      if (opponentVideoRef.current) opponentVideoRef.current.pause();
    }
  }, [countdown, isGameActive]);

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
        const finalHand = (hand || 'right').toLowerCase();

        console.log(`[Hand Flow] Single Game Reset - Hand: ${finalHand.toUpperCase()}`);

        socket.send(JSON.stringify({
          set_game: {
            mode: 'single_player',
            hand: finalHand,
            player_id: myPlayerId,
            args: {
              force: 0,
              count_down: 0
            }
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
    const finalMaxForce = maxForceRef.current;
    if (forceHistoryRef.current.length === 0) forceHistoryRef.current.push({ time: 0, force: 0 });
    
    const avgForce = forceHistoryRef.current.reduce((acc, curr) => acc + curr.force, 0) / forceHistoryRef.current.length;
    const forceHistory = [...forceHistoryRef.current];
    const handUsed = location.state?.hand || profile?.preferred_hand || 'right';
    const isLeft = handUsed.toLowerCase() === 'left';

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
    
    // Determine Base XP from configuration
    let baseXp = (gameMode === 'gauntlet' && isWin) ? 500 : 0;
    if (gameMode === 'gauntlet' && isWin && stageNumber) {
      const saved = localStorage.getItem('fighter_level_configs');
      if (saved) {
        const configs = JSON.parse(saved);
        if (configs[stageNumber]) {
          baseXp = configs[stageNumber].xp;
        }
      } else {
        // Hardcoded defaults if no config exists yet (Level 1: 500, Level 2: 750, Level 3: 1000)
        if (stageNumber === 1) baseXp = 500;
        else if (stageNumber === 2) baseXp = 750;
        else if (stageNumber === 3) baseXp = 1000;
        else if (stageNumber === 4) baseXp = 1250;
        else if (stageNumber === 5) baseXp = 1500;
      }
    }
    
    // Force Bonus
    const forceBonusXp = (gameMode === 'gauntlet' && isWin) ? Math.round(finalMaxForce * 10) : 0;
    
    // Duration Bonus: 1000 - (duration rounded to 2 decimals * 10) rounded up
    const durationRounded = Math.round(durationSeconds * 100) / 100;
    const timeBonusXp = (gameMode === 'gauntlet' && isWin) ? Math.max(0, Math.ceil(1000 - (durationRounded * 10))) : 0;
    
    const bonusXp = forceBonusXp + timeBonusXp;
    const totalEarnedXp = baseXp + bonusXp;

    // Update Max Peak Impact
    try {
      const peakMagnitude = Math.abs(finalMaxForce);
      const { data: pData } = await supabase.from('players').select('max').eq('id', playerId).maybeSingle();
      const currentMax = pData?.max || 0;
      
      if (peakMagnitude > currentMax) {
        await supabase.from('players').update({ max: peakMagnitude }).eq('id', playerId);
        // Also strictly save it to local storage exactly as profile.max just in case that's exactly what was requested 
        localStorage.setItem('profile.max', peakMagnitude.toString());
      }
    } catch (e) {
      console.error("Failed to update max peak impact", e);
    }

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
      navigate('/victory', {
        state: {
          isWin,
          peakForce: finalMaxForce,
          avgForce: avgForce,
          enduranceTime: durationSeconds,
          xpEarned: totalEarnedXp,
          baseXp,
          bonusXp, // Total bonus
          forceBonusXp,
          timeBonusXp,
          stageName: stageName || 'OPPONENT',
          stageNumber: stageNumber || 1,
          hand: isLeft ? 'left' : 'right',
          forceHistory: forceHistory,
          username: profile?.username || 'Player',
          mode: gameMode,
          opponent: opponentInfo,
          videoUrl: videoUrlRef.current // Use the ref for the most current URL
        }
      });
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

          // Track game statistics during active game (using absolute magnitude for both hands)
          if (isGameActive && startTime) {
            const magnitude = Math.abs(resultVal);
            maxForceRef.current = Math.max(maxForceRef.current, magnitude);
            
            const now = Date.now();
            if (now - lastForceCaptureTimeRef.current >= 100) { // Higher resolution 100ms
              const elapsedSeconds = (now - startTime) / 1000;
              forceHistoryRef.current.push({ time: elapsedSeconds, force: magnitude });
              lastForceCaptureTimeRef.current = now;
            }
          }
        }

        // --- Socket Driven Countdown Logic ---
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
          const numVal = Number(cdVal);
          if (!isNaN(numVal) && numVal <= 10) {
            // Only update on even numbers to create a 5, 4, 3, 2, 1 sequence
            if (numVal % 2 === 0 && numVal > 0) {
              const mappedVal = numVal / 2;
              console.log(`[SingleGame] Mapping countdown: ${numVal} -> ${mappedVal}`);
              setCountdown(mappedVal);
              setShowCountdown(true);
            }
          } else {
            // Non-numeric or > 10 (e.g., "READY")
            setCountdown(cdVal);
            setShowCountdown(true);
          }
        }

        // Check for game start strictly via acs_state: 'ACS_GAME'
        if (serverData.acs_state === 'ACS_GAME' && !isGameActive) {
          console.log('[SingleGame] Game Start (ACS_GAME).');
          setShowCountdown(true);
          setCountdown('GO!');
          setIsGameActive(true);
          setStartTime(Date.now());
          
          // reset tracking refs
          maxForceRef.current = 0;
          forceHistoryRef.current = [];
          lastForceCaptureTimeRef.current = Date.now();
          
          setTimeout(() => {
            setShowCountdown(false);
          }, 1000);
        }

        const isMultiWin = serverData.multiplayer_state === 'MAIN_SM_GAMEOVER_WIN' || serverData.multiplayer_state === 'MULTIPLAYER_SM_GAMEOVER_WIN';
        const isMultiLose = serverData.multiplayer_state === 'MAIN_SM_GAMEOVER_LOSE' || serverData.multiplayer_state === 'MULTIPLAYER_SM_GAMEOVER_LOSE';
        const isSingleWin = serverData.single_player_state === 'SINGLE_PLAYER_GAMEOVER_WIN' || serverData.single_player_state === 'SINGLE_PLAYER_WIN';
        const isSingleLose = serverData.single_player_state === 'SINGLE_PLAYER_GAMEOVER_LOSE' || serverData.single_player_state === 'SINGLE_PLAYER_LOSE';

        if (isMultiWin || isMultiLose || isSingleWin || isSingleLose) {
          const stateStr = isMultiWin || isMultiLose ? serverData.multiplayer_state : serverData.single_player_state;
          console.log(`[Game v24] - Match result detected via state: ${stateStr}`);
          setIsGameActive(false);
          setShowCountdown(false); // Clear countdown when game ends
          setCountdown(null); // Clear countdown when game ends
          
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


  // Memoize stream callback to prevent CameraFeed from restarting
  const handleStreamStarted = useCallback((s: MediaStream) => {
    setStream(s);
  }, []);

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
        <div className={`absolute inset-0 bg-black/40 transition-all duration-300 ${isBlurred ? 'bg-black/60' : ''}`} />

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
        <div className="p-4 flex-shrink-0">
          <div className="max-w-7xl mx-auto flex items-center justify-end">
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-white/60" />
            </div>
          </div>
        </div>

        {/* Player Cards - Main Section */}
        <div className="absolute top-0 inset-x-0 h-[70vh] flex gap-4 p-4 pointer-events-none z-0">
          {/* Player 1 - Left */}
          <motion.div
            className="flex-1 h-full pointer-events-auto"
            initial={{ x: -100, opacity: 0 }}
            animate={{ 
              x: 0, 
              opacity: 1,
              scale: armPosition < 40 ? 1.02 : 1 
            }}
          >
            <GlassCard className="h-full p-2 border-2 border-[#00f0ff]/50 flex flex-col bg-black/60 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,240,255,0.3)]">
              {/* Camera Feed Box */}
              <div className="w-full flex-1 rounded-t-xl overflow-hidden border-b-2 border-[#00f0ff]/30 relative bg-[#0a0515] transition-all duration-300">
                {profile?.avatar_url && (
                  <div className="absolute inset-0 z-0">
                   <img 
                     src={profile.avatar_url} 
                     alt="Profile" 
                     className="w-full h-full object-cover opacity-60 grayscale brightness-50" 
                   />
                  </div>
                )}
                <div className="w-full h-full relative z-10">
                   <CameraFeed deviceId={mainCameraId || undefined} transparent={true} onStreamStarted={handleStreamStarted} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-20" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2 z-30">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-white text-[10px] font-black tracking-widest uppercase">REC</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-black/80 rounded-b-xl mt-1">
                <div className="relative">
                  <AvatarDisplay
                    avatar={player1.avatar}
                    className="border border-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                    size="sm"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-black italic text-[#00f0ff] tracking-widest leading-none uppercase" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {player1.name} {isPlayer1 && '(YOU)'}
                  </h3>
                  <p className="text-[#00f0ff]/70 text-[10px] font-bold mt-0.5 uppercase tracking-[0.2em]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {hand || 'RIGHT'} HAND
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Player 2 - Right */}
          <motion.div
            className="flex-1 h-full pointer-events-auto"
            initial={{ x: 100, opacity: 0 }}
            animate={{ 
              x: 0, 
              opacity: 1,
              scale: armPosition > 60 ? 1.02 : 1 
            }}
          >
            <GlassCard className="h-full p-2 border-2 border-[#ff006e]/50 flex flex-col bg-black/60 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(255,0,110,0.3)]">
              {/* Rival Video Feed Box */}
              <div className="w-full flex-1 rounded-t-xl overflow-hidden border-b-2 border-[#ff006e]/30 relative bg-black transition-none">
                {gameMode === 'gauntlet' ? (
                  <video ref={opponentVideoRef} src={stageNumber === 5 ? '/assets/robots/stage5_prefight.mp4' : `/assets/robots/stage${stageNumber}.mp4`} muted loop playsInline className="w-full h-full object-cover transition-none" />
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                <div className="absolute bottom-2 left-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#ff006e] animate-pulse" />
                  <span className="text-white text-[8px] font-bold tracking-widest uppercase">LIVE</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-3 bg-black/80 w-full rounded-b-xl mt-1">
                <div className="flex flex-col items-end text-right">
                  <h3 className="text-xl font-black italic text-[#ff006e] tracking-widest leading-none uppercase" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {!isPlayer1 && '(YOU) '} {player2.name} 
                  </h3>
                  <p className="text-[#ff006e]/70 text-[10px] font-bold mt-0.5 uppercase tracking-[0.2em]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    LEVEL {stageNumber}
                  </p>
                </div>
                <div className="relative">
                  <AvatarDisplay
                    avatar={player2.avatar}
                    className="border border-[#ff006e] shadow-[0_0_10px_rgba(255,0,110,0.4)]"
                    size="sm"
                  />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Top - Round Info (HIDDEN) */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 opacity-0 pointer-events-none" />

        {/* Round Finished Overlay */}
        <AnimatePresence>
          {roundWinner && !winner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
            >
              <div className="bg-black/80 border-y border-[#00f0ff]/30 w-full py-20 flex flex-col items-center shadow-[0_0_50px_rgba(0,240,255,0.2)]">
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
        <div className="flex-1 flex items-end justify-center px-4 pb-20 min-h-0 relative z-20 pointer-events-none mt-[10vh]">
          <div className="w-full max-w-4xl pointer-events-auto">
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

              {/* DATA UI - Digital counters */}
              <div className="absolute -bottom-[40px] left-1/2 -translate-x-1/2 w-full flex justify-center gap-8 z-30">
                <motion.div
                  className="relative"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <GlassCard className="px-6 py-4 border-2 border-[#00f0ff]/40 bg-black/60">
                    <div className="relative">
                      <div className="text-[#00f0ff]/60 text-xs uppercase tracking-widest mb-1">
                        Current Angle
                      </div>
                      <div className="text-3xl font-bold text-[#00f0ff]" style={{ fontFamily: "'Orbitron', monospace", textShadow: '0 0 10px rgba(0, 240, 255, 0.8)' }}>
                        {Math.abs(angleValue).toFixed(2)}°
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>

                <motion.div
                  className="relative"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                >
                  <GlassCard className="px-6 py-4 border-2 border-[#ff006e]/40 bg-black/60">
                    <div className="relative">
                      <div className="text-[#ff006e]/60 text-xs uppercase tracking-widest mb-1">
                        Resistance
                      </div>
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
            <motion.div
              className={`fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none bg-black/60`}
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
                  HEADING TO VICTORY SCREEN...
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start Countdown Overlay */}
        <AnimatePresence>
          {showCountdown && (
            <motion.div
              className="absolute inset-0 z-[200] flex items-center justify-center bg-black/20"
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