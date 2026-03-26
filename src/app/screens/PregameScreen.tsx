import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '../components/GlassCard';
import Lightning from '../components/Lightning';
import { supabase } from '../../lib/supabase';
import { AvatarDisplay } from '../components/AvatarDisplay';
import { useSocket } from '../../contexts/SocketContext';
import { CameraFeed } from '../components/CameraFeed';

const RULES = [
  "Elbows - Do not lift your elbow.",
  "Hand - Never let go during play.",
  "Posture - Keep your shoulders perfectly square.",
  "The Start - No pulling before \"Ready, Go!\".",
  "Winning - Pin the opponent's hand down."
];

export function PregameScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const stageNumber = location.state?.stageNumber || 1;
  const stageName = location.state?.stageName || 'STAGE 01';
  const playerHand = location.state?.hand || 'RIGHT';

  const { sendMessage } = useSocket();

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
      { name: 'TRAINING DROID', avatar: '/assets/robots/stage1.jpg' },
      { name: 'MECH BRAWLER', avatar: '/assets/robots/stage2.png' },
      { name: 'STEEL ASSASSIN', avatar: '/assets/robots/stage3.jpg' },
      { name: 'CRUSHER X-9000', avatar: '/assets/robots/stage4.jpg' },
      { name: 'ANNIHILATOR PRIME', avatar: '/assets/robots/stage5.png' }
    ];
    return robots[Math.min(stage - 1, 4)] || robots[0];
  };

  const rivalData = getRobotData(stageNumber);

  const handleReady = () => {
    setPhase('action');
    if (rulesVideoRef.current) {
      rulesVideoRef.current.play();
    }

    // Initialize the match (Socket INIT)
    const myPlayerId = localStorage.getItem('fighter_player_id') || 'GUEST';
    
    // Calculate power based on stage
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
      cmd: {
        INIT: initValue,
        HAND: playerHand,
        PLAYER_ID: myPlayerId
      }
    });
    
    // Start rule sequence
    let ruleIdx = 0;
    setRulesShown([RULES[0]]);
    
    const interval = setInterval(() => {
      ruleIdx++;
      if (ruleIdx < RULES.length) {
        setRulesShown(prev => [...prev, RULES[ruleIdx]]);
      } else {
        clearInterval(interval);
        
        // Finalize match start (Socket SINGLE_PLAYER_START)
        sendMessage({
          cmd: {
            SINGLE_PLAYER_START: 0
          }
        });

        setTimeout(() => {
          navigate('/game', {
            state: {
              mode: 'gauntlet',
              stageNumber,
              stageName,
              hand: playerHand
            }
          });
        }, 2000); 
      }
    }, 3500);
  };

  return (
    <div className="h-screen bg-[#0a0515] relative overflow-hidden flex flex-col">
      {/* Background Layer 1: Training Video (Wait Phase) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          ref={videoRef}
          src="/assets/referee_practice.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0a0515]/40" />
      </div>

      {/* Background Layer 2: Rules Video (Action Phase - Fades In) */}
      <div className="absolute inset-0 z-[5] overflow-hidden">
        <video
          ref={rulesVideoRef}
          src="/assets/Referee.mp4"
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover transition-opacity duration-1000"
          style={{ opacity: phase === 'action' ? 1 : 0 }}
        />
        <div className={`absolute inset-0 bg-black/20 transition-opacity duration-1000 ${phase === 'action' ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      {/* Rules List (Action Phase) */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-start pt-32 pointer-events-none">
        <AnimatePresence>
          {phase === 'action' && (
            <div className="flex flex-col gap-6 items-center">
              {rulesShown.map((rule, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black/40 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                >
                  <h3 
                    className="text-white text-3xl font-black italic tracking-tight"
                    style={{ 
                      fontFamily: "'Orbitron', sans-serif",
                      textShadow: '0 0 20px rgba(0,240,255,0.4)'
                    }}
                  >
                    {rule}
                  </h3>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Interface Layer */}
      <div className="flex-1 flex items-end justify-between px-24 pb-16 z-30 relative">
        {/* Player Card (Left) */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-[400px]"
        >
          <GlassCard className="p-4 border-[#00f0ff]/30 bg-black/40 overflow-hidden">
            <div className="space-y-4">
              <div className="h-64 rounded-xl overflow-hidden border-2 border-[#00f0ff]/50 relative group">
                <CameraFeed className="w-full h-full" />
                <div className="absolute top-4 left-4 bg-[#00f0ff] text-black px-3 py-1 rounded-sm text-[10px] font-black tracking-widest uppercase">
                  LIVE FEED
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black italic text-white tracking-widest leading-none" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {profile?.username || 'PLAYER'}
                  </h2>
                  <p className="text-[#00f0ff] text-xs font-bold mt-1 uppercase tracking-[0.2em]">{playerHand} HAND</p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">COMBAT DATA</p>
                  <p className="text-[#00f0ff] font-black italic text-lg">{profile?.xp || 0} XP</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* READY Button (Center) */}
        <div className="flex-1 flex justify-center pb-8">
          <AnimatePresence>
            {phase === 'wait' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-[#00f0ff] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <motion.button
                  onClick={handleReady}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative px-12 py-6 bg-[#00f0ff] text-black font-black text-3xl italic tracking-tighter rounded-xl shadow-[0_0_40px_rgba(0,240,255,0.4)] transition-all"
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
                <img 
                  src={rivalData.avatar} 
                  alt={rivalData.name} 
                  className="w-full h-full object-cover grayscale brightness-125"
                />
                <div className="absolute top-4 right-4 bg-[#ff006e] text-white px-3 py-1 rounded-sm text-[10px] font-black tracking-widest uppercase">
                  RIVAL UNIT
                </div>
              </div>
              
              <div className="flex items-center justify-between flex-row-reverse">
                <div>
                  <h2 className="text-2xl font-black italic text-white tracking-widest leading-none" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {rivalData.name}
                  </h2>
                  <p className="text-[#ff006e] text-xs font-bold mt-1 uppercase tracking-[0.2em]">{stageName}</p>
                </div>
                <div className="text-left">
                  <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">THREAT LEVEL</p>
                  <p className="text-[#ff006e] font-black italic text-lg">CLASS {stageNumber}</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
