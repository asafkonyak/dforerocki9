import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '../components/GlassCard';
// Removed Lightning import
import { supabase } from '../../lib/supabase';
import { AvatarDisplay } from '../components/AvatarDisplay';
import { useSocket } from '../../contexts/SocketContext';
import { CameraFeed } from '../components/CameraFeed';
import { useCamera } from '../../contexts/CameraContext';
import { Video, FastForward } from 'lucide-react';

const RULES = [
  "Elbows - Do not lift your elbow.",
  "Hand - Never let go during play.",
  "Posture - Keep your shoulders perfectly square.",
];

export function OneVsOnePregameScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const matchId = location.state?.matchId;
  const isPlayer1 = location.state?.isPlayer1;
  const opponent = location.state?.opponent;
  const gameType = location.state?.gameType || '1_round';
  const playerHand = location.state?.hand || 'RIGHT';

   const { sendMessage, isConnected } = useSocket();
   const { mainCameraId, player2CameraId } = useCamera();

  const [phase, setPhase] = useState<'wait' | 'action'>('wait');
  const [profile, setProfile] = useState<{ username: string; avatar_url: string; xp: number } | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rulesVideoRef = useRef<HTMLVideoElement>(null);

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

    // Request permission first
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop());
        getDevices();
      })
      .catch(() => getDevices());
  }, []);

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

  // Socket initialization on mount
  useEffect(() => {
    if (isConnected) {
      const myPlayerId = localStorage.getItem('fighter_player_id') || 'GUEST';

      sendMessage({
        set_game: {
          mode: "multiplayer",
          hand: (playerHand || 'RIGHT').toLowerCase(),
          player_id: myPlayerId,
          args: {
            force: 0, // Multiplayer uses hardware resistance or 0
            count_down: 11
          }
        }
      });
    }
  }, [isConnected, playerHand, sendMessage]);

  const handleReady = () => {
    // Send ready_game command on Ready click
    sendMessage({
      ready_game: 0
    });

    // Start rule sequence or navigate immediately? 
    // Navigation usually happens after both players are ready in 1v1, 
    // but for now we follow the user flow.
    setTimeout(() => {
      navigate('/1v1-game', {
        state: {
          matchId,
          mode: 'ranked',
          isPlayer1,
          opponent,
          gameType,
          hand: playerHand
        }
      });
    }, 500);
  };

  const handleSkip = () => {
    setShowReady(true);
  };

  const [showReady, setShowReady] = useState(false);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.currentTime >= 30 && !showReady) {
      setShowReady(true);
    }
  };

  return (
    <div className="h-screen bg-[#0a0515] relative overflow-hidden flex flex-col">
      {/* Background Layer 1: Dynamic Looping Background (Wait Phase) */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        {/* Referee Rules as primary background */}
        <video
          ref={videoRef}
          autoPlay
          loop
          playsInline
          onTimeUpdate={handleTimeUpdate}
          className="absolute inset-0 w-full h-full object-cover"
          src="/assets/referee_rules.mp4"
        />

        {/* Ambient overlays removed per user request */}
      </div>

      {/* Skip Button (Top Right) */}
      <AnimatePresence>
        {!showReady && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-10 right-10 z-50"
          >
            <motion.button
              onClick={handleSkip}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 px-8 py-4 bg-black/40 border border-[#ffff00]/30 rounded-2xl hover:bg-[#ffff00]/10 hover:border-[#ffff00] transition-all group backdrop-blur-xl shadow-[0_0_30px_rgba(255,255,0,0.1)]"
            >
              <span className="text-[#ffff00]/60 text-sm font-black uppercase tracking-[0.3em] group-hover:text-[#ffff00] transition-colors" style={{ fontFamily: "'Orbitron', sans-serif" }}>Skip Rules</span>
              <FastForward className="w-5 h-5 text-[#ffff00]/40 group-hover:text-[#ffff00] transition-colors" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Layer 2: Removed as it's now integrated in Layer 1 */}

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
                {profile?.avatar_url && (
                  <div className="absolute inset-0 z-0">
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover opacity-60 grayscale brightness-50"
                    />
                  </div>
                )}
                <CameraFeed
                  className="w-full h-full relative z-10"
                  transparent={true}
                  deviceId={mainCameraId || undefined}
                />
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

          <AnimatePresence mode="wait">
            {showReady && (
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

        {/* Opponent Card (Right) */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-[400px]"
        >
          <GlassCard className="p-4 border-[#ff006e]/30 bg-black/40 overflow-hidden">
            <div className="space-y-4 text-right">
              <div className="h-64 rounded-xl overflow-hidden border-2 border-[#ff006e]/50 relative bg-black/40">
                {/* Opponent camera feed fallback or second local camera for testing */}
                {videoDevices.length >= 2 ? (
                  <CameraFeed
                    className="w-full h-full relative z-10"
                    transparent={true}
                    deviceId={player2CameraId || undefined}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#ff006e]/50 bg-black">
                    <Video className="w-12 h-12 mb-3 animate-pulse opacity-20" />
                    <span className="text-[10px] tracking-[0.4em] font-black uppercase text-center px-4">
                      Awaiting Rival<br /><span className="text-[8px] opacity-40">Connecting Node...</span>
                    </span>
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-[#ff006e] text-white px-3 py-1 rounded-sm text-[10px] font-black tracking-widest uppercase z-20">
                  LIVE
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 w-full">
                <div className="flex flex-col items-end text-right">
                  <h2 className="text-2xl font-black italic text-[#ff006e] tracking-widest leading-none" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {opponent?.username || 'OPPONENT'}
                  </h2>
                  <p className="text-[#ff006e] text-xs font-bold mt-1 uppercase tracking-[0.2em]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {(opponent?.preferred_hand || 'RIGHT').toUpperCase()} HAND
                  </p>
                </div>
                {opponent?.avatar_url && (
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#ff006e] shadow-[0_0_15px_rgba(255,0,110,0.3)]">
                    <img
                      src={opponent.avatar_url}
                      alt="Opponent"
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
