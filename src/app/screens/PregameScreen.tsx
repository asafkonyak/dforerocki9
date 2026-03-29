import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '../components/GlassCard';
// Removed Lightning import
import { supabase } from '../../lib/supabase';
import { AvatarDisplay } from '../components/AvatarDisplay';
import { useSocket } from '../../contexts/SocketContext';
import { CameraFeed } from '../components/CameraFeed';

const RULES = [
  "Elbows - Do not lift your elbow.",
  "Hand - Never let go during play.",
  "Posture - Keep your shoulders perfectly square.",
];

export function PregameScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const stageNumber = location.state?.stageNumber || 1;
  const stageName = location.state?.stageName || 'STAGE 01';
  const playerHand = location.state?.hand || 'RIGHT';

  const { sendMessage, isConnected, lastMessage } = useSocket();

  const [phase, setPhase] = useState<'wait' | 'action'>('wait');
  const [rulesShown, setRulesShown] = useState<string[]>([]);
  const [profile, setProfile] = useState<{ username: string; avatar_url: string; xp: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rulesVideoRef = useRef<HTMLVideoElement>(null);

  // Fetch player profile
  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      let playerId = localStorage.getItem('fighter_player_id');

      if (user) {
        const { data: player } = await supabase.from('players').select('id').eq('user_id', user.id).maybeSingle();
        if (player?.id) playerId = player.id;
      }

      if (playerId) {
        const { data } = await supabase.from('players').select('username, avatar_url, xp').eq('id', playerId).maybeSingle();
        if (data) setProfile(data);
      }
    }
    fetchProfile();
  }, []);

  const getRobotData = (stage: number) => {
    const robots = [
      { name: 'MARCO', avatar: '/assets/robots/stage1.jpg', prefight: '/assets/robots/stage1_prefight.mp4' },
      { name: 'KAMILA', avatar: '/assets/robots/stage2.png', prefight: '/assets/robots/stage2_prefight.mp4' },
      { name: 'JACK', avatar: '/assets/robots/stage3.jpg', prefight: '/assets/robots/stage1_prefight.mp4' },
      { name: 'CRUSHER X-9000', avatar: '/assets/robots/stage4.jpg', prefight: '/assets/robots/stage1_prefight.mp4' },
      { name: 'ANNIHILATOR PRIME', avatar: '/assets/robots/stage5.png', prefight: '/assets/robots/stage5_prefight.mp4' }
    ];
    return robots[Math.min(stage - 1, 4)] || robots[0];
  };

  const rivalData = getRobotData(stageNumber);

  // Socket initialization on mount
  useEffect(() => {
    if (isConnected) {
      const myPlayerId = localStorage.getItem('fighter_player_id') || 'GUEST';
      
      const getStagePower = (stage: number) => {
        switch(stage) {
          case 1: return 7;
          case 2: return 10;
          case 3: return 12.5;
          case 4: return 20;
          case 5: return 25;
          default: return 7;
        }
      };

      let initValue = getStagePower(stageNumber);
      if (playerHand && playerHand.toLowerCase() === 'left') {
        initValue = -initValue;
      }

      sendMessage({
        set_game: {
          mode: "single_player",
          hand: (playerHand || 'RIGHT').toLowerCase(),
          player_id: myPlayerId,
          args: {
            force: initValue,
            count_down: 11
          }
        }
      });
    }
  }, [isConnected, stageNumber, playerHand, sendMessage]);

  const handleReady = () => {
    // Send SINGLE_PLAYER_START command on Ready click
    sendMessage({
      start_game: 0
    });

    // Start rule sequence or navigate immediately? 
    // The video has already played, so we can transition to the game.
    setTimeout(() => {
      navigate('/single-game', {
        state: {
          mode: 'gauntlet',
          stageNumber,
          stageName,
          hand: playerHand
        }
      });
    }, 500);
  };

  const [videoFinished, setVideoFinished] = useState(false);

  const handleVideoEnd = () => {
    setVideoFinished(true);
    if (videoRef.current) {
      videoRef.current.loop = true;
      videoRef.current.play();
    }
  };

  return (
    <div className="h-screen bg-[#0a0515] relative overflow-hidden flex flex-col">
      {/* Background Layer 1: Dynamic Looping Background (Wait Phase) */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        {/* Full-screen Looping Video Background */}
        {/* Referee Rules as primary background */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          className="absolute inset-0 w-full h-full object-cover"
          src="/assets/referee_rules.mp4"
        />
        
        {/* Ambient overlays removed per user request */}
      </div>

      {/* Background Layer 2: Removed as it's now integrated in Layer 1 */}

      {/* Rules List (Action Phase) - MOVED TO BOTTOM */}

      {/* Bottom Interface Layer */}
      <div className="flex-1 flex items-end justify-between px-24 pb-16 z-30 relative">
        {/* Player Card (Left) */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-[400px]"
        >
          <GlassCard className="p-3 border-2 border-[#00f0ff] shadow-[0_0_50px_rgba(0,240,255,0.4)] flex flex-col gap-3 bg-black/60">
            <div className="space-y-4">
              <div className="h-64 rounded-xl overflow-hidden border-2 border-[#00f0ff]/50 relative group bg-[#0a0515]">
                {/* Profile Photo as Background */}
                {profile?.avatar_url && (
                  <div className="absolute inset-0 z-0">
                    <img 
                      src={profile.avatar_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover opacity-60 grayscale brightness-50" 
                    />
                  </div>
                )}
                <CameraFeed className="w-full h-full relative z-10" transparent={true} />
                <div className="absolute top-4 left-4 bg-[#00f0ff] text-black px-3 py-1 rounded-sm text-[10px] font-black tracking-widest uppercase z-20">
                  LIVE
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {profile?.avatar_url && (
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                    <img 
                      src={profile.avatar_url} 
                      alt="Profile Circle"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-black italic text-[#00f0ff] tracking-widest leading-none" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {profile?.username || 'PLAYER'}
                  </h2>
                  <p className="text-[#00f0ff] text-xs font-bold mt-1 uppercase tracking-[0.2em]" style={{ fontFamily: "'Orbitron', sans-serif" }}>{playerHand} HAND</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

          <div className="flex flex-col items-center justify-center gap-8 w-full max-w-md h-[450px] relative">
            {/* Rules always visible at the bottom center */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3 items-center w-full"
            >
              <p className="text-[#00f0ff]/40 text-[10px] uppercase font-bold tracking-[0.4em] mb-1 font-sans">RULES</p>
              {RULES.slice(0, 3).map((rule, idx) => {
                const parts = rule.split(' - ');
                const firstWord = parts[0];
                const rest = parts[1] || '';
                
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-black/40 border border-[#00f0ff]/20 px-6 py-2 rounded-lg w-full backdrop-blur-sm"
                  >
                    <h3 
                      className="text-white text-sm font-bold tracking-tight text-center uppercase"
                      style={{ 
                        fontFamily: "'Orbitron', sans-serif"
                      }}
                    >
                      <span className="text-yellow-400">{firstWord}</span> {rest}
                    </h3>
                  </motion.div>
                );
              })}
            </motion.div>

            <AnimatePresence mode="wait">
              {videoFinished && (
                <motion.div
                  key="ready-btn"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  className="relative group h-24 flex items-center"
                >
                  <div className="absolute inset-0 bg-[#ffff00] opacity-20 group-hover:opacity-40 transition-opacity rounded-xl blur-xl" />
                  <motion.button
                    onClick={handleReady}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative px-12 py-5 bg-[#ffff00] text-black font-black text-2xl italic tracking-tighter rounded-xl shadow-[0_0_40px_rgba(255,255,0,0.4)] transition-all"
                    style={{ fontFamily: "'Orbitron', sans-serif" }}
                  >
                    READY
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        {/* Rival Card (Right) */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-[400px]"
        >
          <GlassCard className="p-4 border-[#ff006e]/30 bg-black/40 overflow-hidden">
            <div className="space-y-4 text-right">
              <div className="h-64 rounded-xl overflow-hidden border-2 border-[#ff006e]/50 relative bg-black/40">
                <video 
                  src={rivalData.prefight} 
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-[#ff006e] text-white px-3 py-1 rounded-sm text-[10px] font-black tracking-widest uppercase">
                  LIVE
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-4 w-full">
                <div className="flex flex-col items-end text-right">
                  <h2 className="text-2xl font-black italic text-[#ff006e] tracking-widest leading-none" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {rivalData.name}
                  </h2>
                  <p className="text-[#ff006e] text-xs font-bold mt-1 uppercase tracking-[0.2em]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    LEVEL {stageNumber}
                  </p>
                </div>
                {rivalData.avatar && (
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#ff006e] shadow-[0_0_15px_rgba(255,0,110,0.3)]">
                    <img 
                      src={rivalData.avatar} 
                      alt="Rival Circle"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
