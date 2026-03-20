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

export function GameScreen() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get game mode from location state
  const gameMode = location.state?.mode || 'normal';
  const stageNumber = location.state?.stageNumber;
  const stageName = location.state?.stageName;

  const [armPosition, setArmPosition] = useState(50);
  const [player1Power, setPlayer1Power] = useState(100);
  const [player2Power, setPlayer2Power] = useState(100);
  const [tapCount, setTapCount] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | string>(3);
  const [showCountdown, setShowCountdown] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [angleValue, setAngleValue] = useState(0);
  const [resistanceValue, setResistanceValue] = useState(60); // Default KG
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [profile, setProfile] = useState<{ id?: string; username: string; avatar_url: string; xp: number; rank: string } | null>(null);
  const { socket, isConnected } = useSocket();

  // Round-based states
  const gameType = location.state?.gameType || '1_round';
  const [roundsWonPlayer, setRoundsWonPlayer] = useState(0);
  const [roundsWonOpponent, setRoundsWonOpponent] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundWinner, setRoundWinner] = useState<string | null>(null);

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
          .select('username, avatar_url, xp, rank')
          .eq('id', playerId)
          .maybeSingle();

        if (data && !error) {
          setProfile({
            id: playerId || undefined,
            username: data.username || 'YOU',
            avatar_url: data.avatar_url || '👤',
            xp: data.xp || 0,
            rank: data.rank || 'Bronze'
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

  // Audio Hooks - Placeholders for actual sound files
  const { play: playTap } = useAudio({ src: '/sounds/tap.mp3', volume: 0.5 });
  const { play: playWin } = useAudio({ src: '/sounds/win.mp3', volume: 0.8 });
  const { play: playLose } = useAudio({ src: '/sounds/lose.mp3', volume: 0.8 });
  const { play: playCombo } = useAudio({ src: '/sounds/combo.mp3', volume: 0.7 });
  const { play: playStart } = useAudio({ src: '/sounds/ready_go.mp3', volume: 0.8 });

  // Stage-specific robot intro sound
  const getStageAudioSrc = () => {
    if (!stageNumber) return '/assets/robots/stage1.mp3';
    const num = Number(stageNumber);
    if (num === 2) return '/assets/robots/stage2.ogg';
    if (num === 3) return '/assets/robots/stage3.wav';
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
    if (!isReady) return;
    let timer: NodeJS.Timeout;
    let count = 3;

    setShowCountdown(true);

    const runCountdown = () => {
      if (count > 0) {
        setCountdown(count);
        count--;
        timer = setTimeout(runCountdown, 1000);
      } else if (count === 0) {
        setCountdown('GO!');
        playStart();
        setIsGameActive(true);
        setStartTime(Date.now());
        count--;
        timer = setTimeout(() => {
          setShowCountdown(false);
        }, 1000);
      }
    };

    timer = setTimeout(runCountdown, 500); // Small initial delay

    return () => clearTimeout(timer);
  }, []);


  // Refs to capture latest values for the navigate timeout
  const comboRef = useRef(combo);
  const tapCountRef = useRef(tapCount);
  comboRef.current = combo;
  tapCountRef.current = tapCount;

  // Player data
  const player1 = {
    name: profile?.username || 'NEON_KNIGHT',
    avatar: profile?.avatar_url || '⚡',
    rank: profile?.rank || 'Novice',
    xp: profile?.xp || 0
  };

  // Resolve Opponent Data
  const getRobotData = (stage: number) => {
    const robots = [
      { name: 'TRAINING DROID', avatar: '/assets/robots/stage1.jpg' },
      { name: 'MECH BRAWLER', avatar: '/assets/robots/stage2.png' },
      { name: 'STEEL ASSASSIN', avatar: '/assets/robots/stage3.png' },
      { name: 'CRUSHER X-9000', avatar: '/assets/robots/stage4.png' },
      { name: 'ANNIHILATOR PRIME', avatar: '/assets/robots/stage5.png' }
    ];
    return robots[Math.min(stage - 1, 4)] || robots[0];
  };

  const isRanked = gameMode === 'ranked' && location.state?.matchId && location.state?.opponent;
  const matchId = location.state?.matchId;
  const rankedOpponent = location.state?.opponent;

  const opponentInfo = isRanked
    ? { name: rankedOpponent.username, avatar: rankedOpponent.avatar }
    : gameMode === 'gauntlet'
      ? getRobotData(stageNumber || 1)
      : { name: 'CYBER_QUEEN', avatar: '🤖' };

  const player2 = {
    name: opponentInfo.name,
    avatar: opponentInfo.avatar,
  };

  // REMOVED: AI opponent tapping simulation
  // This is now driven by the socket/hardware

  // Check win condition
  // REMOVED: Win/Loss condition check
  // The user requested to remove win/loss logic for now.
  // The game will remain active until manually exited.
  useEffect(() => {
    // This effect is now empty to ensure no win/loss navigation occurs.
    console.log('[Game v16] - Win/Loss checks are disabled.');
  }, [armPosition, isGameActive]);

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
    const durationSeconds = startTime ? Math.floor((endTime - startTime) / 1000) : 0;

    // 3. Record the match
    const scoreObj = {
      p1_rounds: finalWinner === 'player1' ? roundsWonPlayer + 1 : roundsWonPlayer,
      p2_rounds: finalWinner === 'player2' ? roundsWonOpponent + 1 : roundsWonOpponent
    };

    const opponentId = isRanked ? location.state?.opponent?.id : null;
    const winnerId = finalWinner === 'player1' ? playerId : opponentId;

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

    await updatePlayerStats(playerId, finalWinner === 'player1');
    if (opponentId) {
      await updatePlayerStats(opponentId, finalWinner === 'player2');
    }

    // 5. Add XP and Update Progress
    const earnedXp = gameMode === 'gauntlet' ? 500 : isRanked ? 300 : 150;
    const isWin = finalWinner === 'player1';

    if (isWin) {
      await supabase.rpc('increment_xp', { p_id: playerId, xp_amount: earnedXp });
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
      if (gameMode === 'gauntlet') {
        navigate('/victory', {
          state: {
            isWin,
            peakForce: isWin ? 68 : 42,
            enduranceTime: isWin ? 45 : 28,
            xpEarned: isWin ? 500 : 0,
            stageName: stageName || 'CRUSHER X-9000',
            stageNumber: stageNumber || 1,
          }
        });
      } else {
        navigate('/leaderboard', {
          state: {
            result: isWin ? 'win' : 'loss',
            scoreChange: isWin ? 300 : -100,
            rankChange: isWin ? 2 : -1,
            combo: comboRef.current,
            taps: tapCountRef.current,
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
          const derivedArmPos = 50 - (Number(serverData.position) / 1.4);
          setArmPosition(Math.max(0, Math.min(100, derivedArmPos)));
        }

        if (serverData.result !== undefined) {
          // Mapping according to user: resistance = result
          setResistanceValue(Number(serverData.result));
        }

        // Handle Win/Loss by computer_state
        if (serverData.computer_state === 'MAIN_SM_GAMEOVER_WIN') {
          console.log('[Game v18] - WIN condition detected via computer_state');
          setIsGameActive(false);
          setWinner('player1');
          playWin();
          saveMatchResult('player1');
        } else if (serverData.computer_state === 'MAIN_SM_GAMEOVER_LOSE') {
          console.log('[Game v18] - LOSS condition detected via computer_state');
          setIsGameActive(false);
          setWinner('player2');
          playLose();
          saveMatchResult('player2');
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
  }, [socket, isGameActive, winner]);

  // Handle player tap
  const handleTap = () => {
    if (!isGameActive || winner) return;

    // SEND COMMAND TO SOCKET instead of local state update
    if (socket && socket.readyState === WebSocket.OPEN) {
      const tapMsg = JSON.stringify({ cmd: { TAP: 1, player_id: profile?.id || 'GUEST' } });
      socket.send(tapMsg);
      console.log('[Game v15] - Tap Command Sent:', tapMsg);
    }

    // Still play feedback locally
    playTap();
    setTapCount(prev => prev + 1);

    // Combo system (Visual only)
    setCombo(prev => {
      const newCombo = prev + 1;
      if (newCombo % 10 === 0) {
        setShowCombo(true);
        playCombo();
        setTimeout(() => setShowCombo(false), 1000);
      }
      return newCombo;
    });
  };

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
            src={
              Number(stageNumber) === 1 ? '/assets/robots/back_stage1.mp4' :
                Number(stageNumber) === 2 ? '/assets/robots/stage2.mp4' :
                  Number(stageNumber) === 5 ? '/assets/robots/bosRobot.mp4' :
                    `/assets/robots/stage${stageNumber}.mp4`
            }
            type="video/mp4"
            onError={(e) => {
              // Emergency fallback if stage-specific video fails
              const target = e.target as HTMLSourceElement;
              target.src = '/assets/training.mp4';
            }}
          />
        </video>

        {/* Color Overlay - Animated based on arm position */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

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

        {/* Player Cards - Top Section */}
        <div className="flex items-start justify-between px-6 pb-4 flex-shrink-0">
          {/* Player 1 - Left */}
          <motion.div
            className="w-64"
            animate={{
              scale: armPosition < 40 ? 1.05 : 1,
            }}
          >
            <GlassCard className="p-4 border-2 border-[#00f0ff] shadow-[0_0_30px_rgba(0,240,255,0.5)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <AvatarDisplay
                    avatar={player1.avatar}
                    className="border-2 border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.6)]"
                    size="lg"
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
                  <h3 className="text-lg text-[#00f0ff] font-bold uppercase" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {player1.name}
                  </h3>
                  <p className="text-[#00f0ff]/60 text-xs font-bold uppercase">{player1.rank}</p>
                </div>
              </div>

              {/* Power Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">STAMINA</span>
                  <span className="text-[#00f0ff] font-bold">{Math.round(player1Power)}%</span>
                </div>
                <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-[#00f0ff]/30">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#00f0ff] to-[#00ffff] shadow-[0_0_10px_#00f0ff]"
                    initial={{ width: '100%' }}
                    animate={{
                      width: `${player1Power}%`,
                    }}
                    transition={{ duration: 0.3 }}
                  />
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
                <div>
                  <p className="text-white/40 uppercase tracking-tighter text-right">Taps</p>
                  <p className="text-[#00f0ff] font-bold text-right">{tapCount}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Player 2 - Right */}
          <motion.div
            className="w-64"
            animate={{
              scale: armPosition > 60 ? 1.05 : 1,
            }}
          >
            <GlassCard className="p-4 border-2 border-[#ff006e] shadow-[0_0_30px_rgba(255,0,110,0.5)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <AvatarDisplay
                    avatar={player2.avatar}
                    className="border-2 border-[#ff006e] shadow-[0_0_20px_rgba(255,0,110,0.6)]"
                    size="lg"
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
                <div>
                  <h3 className="text-lg text-[#ff006e] font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {player2.name}
                  </h3>
                  <p className="text-white/60 text-xs">OPPONENT</p>
                </div>
              </div>

              {/* Power Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">STAMINA</span>
                  <span className="text-[#ff006e] font-bold">{Math.round(player2Power)}%</span>
                </div>
                <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-[#ff006e]/30">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#ff006e] to-[#ff0080] shadow-[0_0_10px_#ff006e]"
                    initial={{ width: '100%' }}
                    animate={{
                      width: `${player2Power}%`,
                    }}
                    transition={{ duration: 0.3 }}
                  />
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
                        className={`h-2 flex-1 rounded-full ${i < roundsWonOpponent ? 'bg-[#ff006e] shadow-[0_0_8px_#ff006e]' : 'bg-white/5'}`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-white/40 uppercase tracking-tighter text-right">AI Level</p>
                  <p className="text-[#ff006e] font-bold text-right">Hard</p>
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
              <div className="bg-black/80 backdrop-blur-xl border-y border-white/10 w-full py-20 flex flex-col items-center">
                <motion.div
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  className={`text-6xl font-black italic tracking-tighter mb-4 ${roundWinner === 'player1' ? 'text-[#00f0ff]' : 'text-[#ff006e]'}`}
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  {roundWinner === 'player1' ? 'ROUND WON' : 'ROUND LOST'}
                </motion.div>
                <div className="text-white/40 tracking-[0.5em] uppercase text-xl">Preparing Next Round...</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center - Arm Wrestling Battle Area */}
        <div className="flex-1 flex items-center justify-center px-6 min-h-0">
          <div className="w-full max-w-4xl">
            {/* RADIAL ARC GAUGE - Replaces linear progress bar */}
            <motion.div
              className="mb-8 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative w-full max-w-2xl aspect-square">
                <svg
                  viewBox="0 0 400 300"
                  className="w-full h-full"
                  style={{ filter: 'drop-shadow(0 0 20px rgba(0, 240, 255, 0.3))' }}
                >
                  {/* Background Arc - Full range */}
                  <defs>
                    {/* Gradient for left side (Opponent - Pink) */}
                    <linearGradient id="leftGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: '#ff006e', stopOpacity: 0.3 }} />
                      <stop offset="100%" style={{ stopColor: '#ff006e', stopOpacity: 0.6 }} />
                    </linearGradient>

                    {/* Gradient for right side (User - Cyan) */}
                    <linearGradient id="rightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: '#00f0ff', stopOpacity: 0.6 }} />
                      <stop offset="100%" style={{ stopColor: '#00f0ff', stopOpacity: 0.3 }} />
                    </linearGradient>

                    {/* Glow filter for the needle */}
                    <filter id="neonGlow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>

                    {/* Electric spark filter */}
                    <filter id="electricSpark">
                      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="turbulence" />
                      <feDisplacementMap in2="turbulence" in="SourceGraphic" scale="5" xChannelSelector="R" yChannelSelector="G" />
                      <feGaussianBlur stdDeviation="1" />
                    </filter>
                  </defs>

                  {/* Left Arc (Opponent Zone - Pink) -70° to 0° */}
                  <path
                    d="M 80 250 A 150 150 0 0 1 200 100"
                    fill="none"
                    stroke="url(#leftGradient)"
                    strokeWidth="20"
                    strokeLinecap="round"
                    opacity="0.5"
                  />

                  {/* Right Arc (User Zone - Cyan) 0° to 70° */}
                  <path
                    d="M 200 100 A 150 150 0 0 1 320 250"
                    fill="none"
                    stroke="url(#rightGradient)"
                    strokeWidth="20"
                    strokeLinecap="round"
                    opacity="0.5"
                  />

                  {/* Center neutral marker */}
                  <circle
                    cx="200"
                    cy="100"
                    r="8"
                    fill="white"
                    opacity="0.6"
                    filter="url(#neonGlow)"
                  />

                  {/* Angle markers every 20° */}
                  {[-60, -40, -20, 20, 40, 60].map((angle) => {
                    const radians = ((angle - 90) * Math.PI) / 180;
                    const x = 200 + 150 * Math.cos(radians);
                    const y = 250 + 150 * Math.sin(radians);
                    const x2 = 200 + 165 * Math.cos(radians);
                    const y2 = 250 + 165 * Math.sin(radians);

                    return (
                      <line
                        key={angle}
                        x1={x}
                        y1={y}
                        x2={x2}
                        y2={y2}
                        stroke={angle < 0 ? '#ff006e' : '#00f0ff'}
                        strokeWidth="2"
                        opacity="0.4"
                      />
                    );
                  })}

                  {/* GHOST TRAIL - Multiple fading needles behind the current position */}
                  {[...Array(8)].map((_, i) => {
                    // Calculate the angle: current position (based on armPosition mapped to -70 to +70)
                    // armPosition: 0 = user winning (70°), 50 = neutral (0°), 100 = opponent winning (-70°)
                    const currentAngle = 70 - (armPosition * 1.4); // Maps 0-100 to 70 to -70

                    // Ghost trail angles - spread backwards towards 0
                    const trailOffset = i * 3; // degrees behind
                    const ghostAngle = currentAngle > 0
                      ? Math.max(0, currentAngle - trailOffset)
                      : Math.min(0, currentAngle + trailOffset);

                    const angleInRadians = ((ghostAngle - 90) * Math.PI) / 180;
                    const needleLength = 140;
                    const needleX = 200 + needleLength * Math.cos(angleInRadians);
                    const needleY = 250 + needleLength * Math.sin(angleInRadians);

                    const opacity = 0.6 - (i * 0.08); // Fade out
                    const color = currentAngle >= 0 ? '#00f0ff' : '#ff006e';

                    return (
                      <motion.line
                        key={`ghost-${i}`}
                        x1="200"
                        y1="250"
                        x2={needleX}
                        y2={needleY}
                        stroke={color}
                        strokeWidth={8 - i * 0.5}
                        strokeLinecap="round"
                        opacity={opacity}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: opacity }}
                      />
                    );
                  })}

                  {/* MAIN ENERGY NEEDLE - Bright pulsing pointer */}
                  <motion.g
                    animate={{
                      filter: [
                        'drop-shadow(0 0 10px rgba(0, 240, 255, 0.8))',
                        'drop-shadow(0 0 20px rgba(0, 240, 255, 1))',
                        'drop-shadow(0 0 10px rgba(0, 240, 255, 0.8))',
                      ]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      type: 'tween'
                    }}
                  >
                    {(() => {
                      // Calculate angle: 0-100 maps to 70° to -70°
                      const currentAngle = 70 - (armPosition * 1.4);
                      const angleInRadians = ((currentAngle - 90) * Math.PI) / 180;
                      const needleLength = 145;
                      const needleX = 200 + needleLength * Math.cos(angleInRadians);
                      const needleY = 250 + needleLength * Math.sin(angleInRadians);
                      const needleColor = currentAngle >= 0 ? '#00f0ff' : '#ff006e';

                      return (
                        <>
                          {/* Main needle line */}
                          <motion.line
                            x1="200"
                            y1="250"
                            x2={needleX}
                            y2={needleY}
                            stroke={needleColor}
                            strokeWidth="10"
                            strokeLinecap="round"
                            filter="url(#neonGlow)"
                            animate={{
                              x2: needleX,
                              y2: needleY,
                            }}
                            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                          />

                          {/* Needle tip glow */}
                          <motion.circle
                            cx={needleX}
                            cy={needleY}
                            r="12"
                            fill={needleColor}
                            filter="url(#neonGlow)"
                            animate={{
                              cx: needleX,
                              cy: needleY,
                              r: [12, 15, 12],
                            }}
                            transition={{
                              r: { duration: 1, repeat: Infinity, ease: 'easeInOut', type: 'tween' },
                              cx: { type: 'spring', stiffness: 100, damping: 15 },
                              cy: { type: 'spring', stiffness: 100, damping: 15 }
                            }}
                          />

                          {/* Electric sparks around needle tip */}
                          {[...Array(6)].map((_, i) => {
                            const sparkAngle = (i * 60) * Math.PI / 180;
                            const sparkDist = 20 + Math.random() * 10;
                            const sparkX = needleX + sparkDist * Math.cos(sparkAngle);
                            const sparkY = needleY + sparkDist * Math.sin(sparkAngle);

                            return (
                              <motion.circle
                                key={`spark-${i}`}
                                cx={sparkX}
                                cy={sparkY}
                                r="2"
                                fill={needleColor}
                                animate={{
                                  opacity: [0, 1, 0],
                                  r: [1, 3, 1],
                                  cx: sparkX,
                                  cy: sparkY,
                                }}
                                transition={{
                                  opacity: { duration: 0.5, repeat: Infinity, delay: i * 0.1, type: 'tween' },
                                  r: { duration: 0.5, repeat: Infinity, delay: i * 0.1, type: 'tween' },
                                  cx: { type: 'spring', stiffness: 100, damping: 15 },
                                  cy: { type: 'spring', stiffness: 100, damping: 15 },
                                }}
                              />
                            );
                          })}
                        </>
                      );
                    })()}
                  </motion.g>

                  {/* Center pivot point */}
                  <circle
                    cx="200"
                    cy="250"
                    r="15"
                    fill="rgba(0, 0, 0, 0.8)"
                    stroke="white"
                    strokeWidth="3"
                    filter="url(#neonGlow)"
                  />
                </svg>

                {/* DATA UI - Digital counters */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full flex justify-center gap-8">
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
                      {/* Digital distortion effect */}
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
                          {Math.round(angleValue)}°
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
                      {/* Digital distortion effect */}
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
                          {Math.round(resistanceValue)} KG
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                </div>

                {/* Zone Labels */}
                <div className="absolute top-4 left-0 text-[#ff006e] text-sm uppercase tracking-wider font-bold opacity-60">
                  ← Opponent
                </div>
                <div className="absolute top-4 right-0 text-[#00f0ff] text-sm uppercase tracking-wider font-bold opacity-60">
                  You →
                </div>
              </div>
            </motion.div>

            {/* Arm Visualization - Keep but make smaller */}
            <motion.div
              className="relative h-32 mb-8"
              animate={{
                rotate: (armPosition - 50) * 0.5,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-7xl filter drop-shadow-[0_0_20px_rgba(0,240,255,0.5)]">
                  💪
                </div>

                {/* Power burst effects */}
                {armPosition < 30 && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{
                      scale: [1, 2],
                      opacity: [0.8, 0],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      type: 'tween',
                    }}
                  >
                    <Zap className="w-16 h-16 text-[#00f0ff]" />
                  </motion.div>
                )}

                {armPosition > 70 && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{
                      scale: [1, 2],
                      opacity: [0.8, 0],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      type: 'tween',
                    }}
                  >
                    <Zap className="w-16 h-16 text-[#ff006e]" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Section - Large Camera Feeds & Tap Button */}
        {isGameActive && !winner && (
          <div className="p-6 flex-shrink-0">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                {/* User Camera Feed (Cyan) - Large, Left */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-center md:justify-start"
                >
                  <GlassCard className="w-full aspect-[3/4] max-w-[280px] border-4 border-[#00f0ff] shadow-[0_0_30px_rgba(0,240,255,0.6)] overflow-hidden relative">
                    {/* Camera Grid Overlay */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-10">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="border border-[#00f0ff]/50" />
                      ))}
                    </div>

                    {/* Live indicator */}
                    <div className="absolute top-3 left-3 z-10">
                      <div className="flex items-center gap-2 px-3 py-2 bg-[#00f0ff]/90 backdrop-blur-sm rounded-full">
                        <motion.div
                          className="w-2 h-2 rounded-full bg-white"
                          animate={{
                            opacity: [1, 0.3, 1],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            type: 'tween',
                          }}
                        />
                        <span className="text-white text-sm font-bold uppercase tracking-wider">Live</span>
                      </div>
                    </div>

                    {/* Camera Feed */}
                    <div className="absolute inset-0">
                      <CameraFeed />
                    </div>

                    {/* Scanning effect */}
                    <motion.div
                      className="absolute inset-x-0 h-2 bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent"
                      animate={{
                        y: ['0%', '100%', '0%'],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                        type: 'tween',
                      }}
                    />

                    {/* Player label */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                      <p className="text-[#00f0ff] text-base font-bold uppercase tracking-wider text-center">
                        {player1.name}
                      </p>
                      <p className="text-white/60 text-xs text-center mt-1">YOU</p>
                    </div>
                  </GlassCard>
                </motion.div>

                {/* Tap Button - Center */}
                <motion.button
                  className="md:col-span-1 relative"
                  onPointerDown={handleTap}
                  whileTap={{ scale: 0.95 }}
                >
                  <GlassCard className="p-6 md:p-8 border-4 border-[#00f0ff] bg-gradient-to-b from-[#00f0ff]/20 to-[#00f0ff]/5 shadow-[0_0_40px_rgba(0,240,255,0.6)] active:shadow-[0_0_60px_rgba(0,240,255,0.8)]">
                    <motion.div
                      className="text-center"
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        type: 'tween',
                      }}
                    >
                      <h2
                        className="text-4xl md:text-5xl font-bold text-[#00f0ff] mb-2"
                        style={{
                          fontFamily: "'Orbitron', sans-serif",
                          textShadow: '0 0 20px rgba(0, 240, 255, 0.8)',
                        }}
                      >
                        TAP!
                      </h2>
                      <p className="text-white/60 text-xs md:text-sm uppercase tracking-wider">
                        Tap rapidly to push!
                      </p>
                    </motion.div>

                    {/* Pulsing ring */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-4 border-[#00f0ff]"
                      animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.5, 0.2, 0.5],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        type: 'tween',
                      }}
                    />
                  </GlassCard>
                </motion.button>

                {/* Opponent Camera Feed (Pink) - Large, Right */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-center md:justify-end"
                >
                  <GlassCard className="w-full aspect-[3/4] max-w-[280px] border-4 border-[#ff006e] shadow-[0_0_30px_rgba(255,0,110,0.6)] overflow-hidden relative">
                    {/* Camera Grid Overlay */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-10">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="border border-[#ff006e]/50" />
                      ))}
                    </div>

                    {/* Live indicator */}
                    <div className="absolute top-3 left-3 z-10">
                      <div className="flex items-center gap-2 px-3 py-2 bg-[#ff006e]/90 backdrop-blur-sm rounded-full">
                        <motion.div
                          className="w-2 h-2 rounded-full bg-white"
                          animate={{
                            opacity: [1, 0.3, 1],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            type: 'tween',
                          }}
                        />
                        <span className="text-white text-sm font-bold uppercase tracking-wider">Live</span>
                      </div>
                    </div>

                    {/* Opponent Live Feed */}
                    <div className="absolute inset-0 bg-black">
                      <video
                        key={stageNumber}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                      >
                        <source
                          src={
                            stageNumber === 1 ? '/assets/robots/stage1.mp4' :
                              stageNumber === 2 ? '/assets/robots/stage2.mp4' :
                                stageNumber === 5 ? '/assets/robots/bosRobot.mp4' :
                                  `/assets/robots/stage${stageNumber}.mp4`
                          }
                          type="video/mp4"
                        />
                      </video>
                    </div>

                    {/* Scanning effect */}
                    <motion.div
                      className="absolute inset-x-0 h-2 bg-gradient-to-r from-transparent via-[#ff006e] to-transparent"
                      animate={{
                        y: ['0%', '100%', '0%'],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                        type: 'tween',
                      }}
                    />

                    {/* Player label */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                      <p className="text-[#ff006e] text-base font-bold uppercase tracking-wider text-center">
                        {player2.name}
                      </p>
                      <p className="text-white/60 text-xs text-center mt-1">OPPONENT</p>
                    </div>
                  </GlassCard>
                </motion.div>
              </div>
            </div>
          </div>
        )}

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
              className="absolute inset-0 bg-black/80 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-center"
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.5 }}
              >
                <GlassCard className="p-12 border-4 border-[#ffff00] shadow-[0_0_80px_rgba(255,255,0,0.8)]">
                  <Trophy className="w-24 h-24 text-[#ffff00] mx-auto mb-6" />

                  <h2
                    className="text-6xl font-bold mb-4"
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      background: 'linear-gradient(to right, #ffff00, #ff006e, #00f0ff)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 0 40px rgba(255, 255, 0, 0.8)',
                    }}
                  >
                    {winner === 'player1' ? 'VICTORY!' : 'DEFEAT!'}
                  </h2>

                  <p className="text-white text-xl mb-2">
                    {winner === 'player1' ? player1.name : player2.name} WINS!
                  </p>

                  <p className="text-white/60 text-sm uppercase tracking-wider">
                    Heading to leaderboard...
                  </p>
                </GlassCard>
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