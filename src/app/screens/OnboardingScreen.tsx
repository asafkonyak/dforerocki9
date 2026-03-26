import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { GlassCard } from '../components/GlassCard';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RotateCcw, Zap, User, Video as VideoIcon, ArrowLeft, Mic, ChevronLeft, ChevronRight, Edit3, Focus } from 'lucide-react';
import { NeonButton } from '../components/NeonButton';
import { supabase } from '../../lib/supabase';

import { useSocket } from '../../contexts/SocketContext';
import { SUGGESTED_NAMES } from '../data/suggestedNames';

const CHARACTER_AVATARS = Array.from({ length: 24 }, (_, i) => `/assets/avatars/cyber_${i + 1}.png`);

interface AvatarOption {
  id: number;
  url: string;
}

export function OnboardingScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = location.state?.isEditing;
  const { isConnected, isError } = useSocket();
  const [playerName, setPlayerName] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [weight, setWeight] = useState('');
  const [preferredHand, setPreferredHand] = useState<'left' | 'right'>('right');
  const [avatarOptions, setAvatarOptions] = useState<AvatarOption[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null); // null = none, 0 = camera, 1-4 = emoji
  const [cameraCountdown, setCameraCountdown] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const avatarScrollRef = useRef<HTMLDivElement>(null);
  const [avatarPage, setAvatarPage] = useState(0);
  const AVATARS_PER_PAGE = 6;

  const [randomNames] = useState(() =>
    [...SUGGESTED_NAMES].sort(() => Math.random() - 0.5).slice(0, 3)
  );

  // Auto-start camera on mount
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied or unavailable", err);
      }
    };
    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Camera countdown effect
  const startCameraCountdown = () => {
    setCameraCountdown(3);
  };

  useEffect(() => {
    if (cameraCountdown !== null && cameraCountdown > 0) {
      const timer = setTimeout(() => {
        setCameraCountdown(cameraCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (cameraCountdown === 0) {
      // Capture the photo from the video stream
      if (videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          setPhotoDataUrl(dataUrl);
        }
      }

      setCameraCountdown(null);
      setSelectedAvatar(0); // Mark that camera photo is used
    }
  }, [cameraCountdown]);

  // Auto-sync weight animation
  const handleAutoSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      // Simulate weight fetch from health app
      const randomWeight = Math.floor(Math.random() * 50) + 60; // 60-110 kg
      setWeight(randomWeight.toString());
      setIsSyncing(false);
    }, 2500);
  };

  useEffect(() => {
    // Pick the 8 split characters for avatars
    const pickedAvatars = CHARACTER_AVATARS.map((url, index) => ({
      id: index + 1,
      url
    }));
    setAvatarOptions(pickedAvatars);

    // Pick 5 random suggestions from the pool
    const shuffledNames = [...SUGGESTED_NAMES].sort(() => 0.5 - Math.random());
    setSuggestions(shuffledNames.slice(0, 5));

    // Handle Edit Mode Pre-population OR New Random Identity
    const prefillData = async () => {
      if (isEditing) {
        console.log("Onboarding [v2] - EDIT MODE ACTIVE");
        const playerId = localStorage.getItem('fighter_player_id');
        if (playerId) {
          const { data: player } = await supabase.from('players').select('*').eq('id', playerId).maybeSingle();
          if (player) {
            setPlayerName(player.username || '');
            setWeight(player.weight?.toString() || '');
            setPreferredHand(player.preferred_hand || 'right');

            // Try to match avatar URL
            const matchedAvatar = pickedAvatars.find(a => a.url === player.avatar_url);
            if (matchedAvatar) {
              setSelectedAvatar(matchedAvatar.id);
            } else if (player.avatar_url && player.avatar_url.includes('avatars')) {
              // It's a custom photo
              setPhotoDataUrl(player.avatar_url);
              setSelectedAvatar(0);
            }
          }
        }
      } else {
        // NEW USER: Random Identity
        const PREFIXES = ['Cyber', 'Neo', 'Alpha', 'Mega', 'Hyper', 'Ultra', 'Giga', 'Bit', 'Byte', 'Core'];
        let baseName = SUGGESTED_NAMES[Math.floor(Math.random() * SUGGESTED_NAMES.length)];
        
        try {
          // Check for uniqueness
          const { data: existing } = await supabase.from('players').select('id').eq('username', baseName).maybeSingle();
          
          let finalName = baseName;
          if (existing) {
            const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
            finalName = `${prefix}_${baseName}`;
            
            // Final check for prefixed name
            const { data: existingPrefixed } = await supabase.from('players').select('id').eq('username', finalName).maybeSingle();
            if (existingPrefixed) {
              finalName = `${finalName}${Math.floor(Math.random() * 99)}`;
            }
          }
          
          setPlayerName(finalName);
          
          // Random Avatar (1-24)
          const randomAvatarId = Math.floor(Math.random() * 24) + 1;
          setSelectedAvatar(randomAvatarId);
        } catch (err) {
          console.error("Error generating random identity:", err);
          setPlayerName(baseName);
        }
      }
    };
    prefillData();
  }, [isEditing]);

  // Auto-scroll to selected avatar
  useEffect(() => {
    if (selectedAvatar && selectedAvatar > 0 && avatarScrollRef.current) {
      const container = avatarScrollRef.current;
      const selectedElement = container.querySelector(`[data-avatar-id="${selectedAvatar}"]`) as HTMLElement;
      if (selectedElement) {
        // Use a small timeout to ensure DOM is rendered (especially after random assignment)
        setTimeout(() => {
          selectedElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });
        }, 100);
      }
    }
  }, [selectedAvatar]);

  // Real-time username validation
  useEffect(() => {
    if (!playerName || playerName.length < 3) {
      setNameError(playerName ? 'Name too short' : null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsValidating(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: existing, error } = await supabase
          .from('players')
          .select('id, user_id')
          .eq('username', playerName)
          .maybeSingle();

        if (error) throw error;

        if (existing) {
          // Check if it's the current user re-entering the name
          let currentId = localStorage.getItem('fighter_player_id');
          if (user) {
            const { data: p } = await supabase.from('players').select('id').eq('user_id', user.id).maybeSingle();
            if (p) currentId = p.id;
          }

          if (existing.id !== currentId) {
            setNameError('Username already taken');
          } else {
            setNameError(null);
          }
        } else {
          setNameError(null);
        }
      } catch (err) {
        console.error('Validation error:', err);
      } finally {
        setIsValidating(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [playerName]);

  const handleComplete = async () => {
    setIsSyncing(true); // Reusing state for loading

    // Check if real user or guest
    const { data: { user } } = await supabase.auth.getUser();

    // Handle Avatar Upload if a real photo was taken
    let finalAvatarUrl = '👤';

    if (selectedAvatar === 0 && photoDataUrl) {
      // If it's already a URL (e.g. from a previous upload while editing), just use it
      if (photoDataUrl.startsWith('http')) {
        finalAvatarUrl = photoDataUrl;
      } else {
        try {
          const fetchResponse = await fetch(photoDataUrl);
          const blob = await fetchResponse.blob();
          const fileName = `avatar_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
          finalAvatarUrl = publicUrl;
        } catch (err) {
          console.error("Avatar upload failed:", err);
          alert("Failed to upload avatar, falling back to default.");
        }
      }
    } else if (selectedAvatar) {
      finalAvatarUrl = avatarOptions.find(a => a.id === selectedAvatar)?.url || '👤';
    }

    // Unified Player Handling
    let playerId = localStorage.getItem('fighter_player_id');

    if (user) {
      const { data: existingUserPlayer } = await supabase.from('players').select('id').eq('user_id', user.id).maybeSingle();
      if (existingUserPlayer?.id) {
        playerId = existingUserPlayer.id;
      }
    }

    if (!playerId) {
      playerId = crypto.randomUUID();
    }
    localStorage.setItem('fighter_player_id', playerId);

    try {
      // 1. Upsert to players table
      const { error: playerError } = await supabase.from('players').upsert({
        id: playerId,
        user_id: user?.id || null, // Guest will be null, Email will be populated
        username: playerName,
        avatar_url: finalAvatarUrl,
        weight: parseInt(weight) || null,
        preferred_hand: preferredHand,
        gauntlet_progress: 1,
        updated_at: new Date().toISOString()
      });

      if (playerError) throw playerError;

      // Ensure playerId is in localStorage for fallback
      localStorage.setItem('fighter_player_id', playerId);
      // Reset Gauntlet progress ONLY if not editing
      if (!isEditing) {
        localStorage.setItem('fighter_gauntlet_progress', '1');
      }

      setIsSyncing(false);
      navigate('/menu');
    } catch (err) {
      console.error("Setup failed:", err);
      alert("Failed to complete setup. Please try again.");
      setIsSyncing(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-b from-[#0a0515] via-[#1a0a2e] to-[#0a0515] overflow-hidden flex flex-col relative">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/assets/registration.mp4" type="video/mp4" />
        </video>
        {/* Dark Overlay for Readability */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      {/* Enhanced Header with Back Icon, Title, and Hardware Sync Badge */}
      <motion.div
        className="relative z-10 py-6 px-6 flex-shrink-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between">
          {/* Left: Back Button */}
          <motion.button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-[#00f0ff]/30 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-[#00f0ff]" />
            <span className="text-white/60 text-sm uppercase tracking-wider">Back</span>
          </motion.button>

          {/* Center: Glowing Title */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            animate={{
              textShadow: [
                '0 0 20px rgba(0, 240, 255, 0.6)',
                '0 0 40px rgba(0, 240, 255, 0.8)',
                '0 0 20px rgba(0, 240, 255, 0.6)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              type: 'tween',
            }}
          >
            <h1
              className="text-4xl font-bold text-[#00f0ff]"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              {isEditing ? 'RE-SYNC CHAMPION' : 'STEP INTO THE RING'}
            </h1>
          </motion.div>

          {/* Right: Spacer for layout balance */}
          <div className="w-48" />
        </div>
      </motion.div>

      {/* Main Content - Scrollable if needed */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0 relative z-10">
        <div className="w-full max-w-[1600px] mx-auto space-y-6">
          {/* Refined Layout Swapped: Video Protocol (Left) + Identity (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Video Tutorial Card - LEFT (Col Span 2) - Fills card, no title */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <GlassCard className="h-full overflow-hidden p-0 border-2 border-[#ffff00]/20 relative group">
                {/* Scan Overlay */}
                <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-[0.05] pointer-events-none z-10">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div key={i} className="border border-white" />
                  ))}
                </div>
                
                <video
                  src="/assets/reffer_onboarding.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
                
                <div className="absolute bottom-12 left-12 right-12 z-20">
                  <div className="flex flex-col gap-4">
                    <p className="text-[#ffff00] text-3xl font-black italic tracking-widest uppercase [text-shadow:0_0_20px_#ffff0060]" style={{ fontFamily: "'Orbitron', sans-serif" }}>SET UP YOUR PROFILE</p>
                    <p className="text-white text-lg leading-relaxed uppercase tracking-[0.1em] max-w-2xl font-bold [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">Take a photo or choose an avatar, pick your dominant hand, and enter your fighter name to get started.</p>
                  </div>
                </div>

                {/* Gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 pointer-events-none" />
              </GlassCard>
            </motion.div>

            {/* Combined Identity Card - RIGHT (Col Span 1) - Single stack */}
            <motion.div
              className="lg:col-span-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <GlassCard className="p-8 h-full border-white/10 bg-black/40 backdrop-blur-xl flex flex-col justify-between">
                <div className="space-y-8">
                  {/* 1. Preferences Stance (Now Top) */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-[#ffff00]" />
                        <p className="text-sm text-white font-black uppercase tracking-[0.2em] italic" style={{ fontFamily: "'Orbitron', sans-serif" }}>PREFERENCES STANCE</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setPreferredHand('left')}
                        className={`group relative py-4 rounded-xl border-2 transition-all text-[10px] font-black tracking-[0.2em] uppercase italic ${preferredHand === 'left'
                            ? 'border-[#ffff00] bg-[#ffff00]/10 text-[#ffff00] shadow-[0_0_20px_#ffff0030]'
                            : 'border-white/10 bg-white/5 text-white/30 hover:border-white/30 hover:bg-white/10'
                          }`}
                        style={{ fontFamily: "'Orbitron', sans-serif" }}
                      >
                        LEFT HANDED
                      </button>
                      <button
                        onClick={() => setPreferredHand('right')}
                        className={`group relative py-4 rounded-xl border-2 transition-all text-[10px] font-black tracking-[0.2em] uppercase italic ${preferredHand === 'right'
                            ? 'border-[#ffff00] bg-[#ffff00]/10 text-[#ffff00] shadow-[0_0_20px_#ffff0030]'
                            : 'border-white/10 bg-white/5 text-white/30 hover:border-white/30 hover:bg-white/10'
                          }`}
                        style={{ fontFamily: "'Orbitron', sans-serif" }}
                      >
                        RIGHT HANDED
                      </button>
                    </div>
                  </div>

                  {/* 2. Player Image Group (Middle) */}
                  <div className="space-y-6 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-[#ff006e]" />
                      <p className="text-sm text-white font-black uppercase tracking-[0.2em] italic" style={{ fontFamily: "'Orbitron', sans-serif" }}>PLAYER IMAGE</p>
                    </div>

                    {/* Subsection: Photo */}
                    <div className="space-y-3">
                      <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em] ml-1">TAKE A PHOTO</p>
                      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-white/10 bg-black/60 shadow-inner group/camera">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover transition-opacity duration-700 ${(selectedAvatar === 0 && photoDataUrl && cameraCountdown === null) ? 'opacity-20' : 'opacity-100'}`}
                          />
                          {selectedAvatar === 0 && photoDataUrl && cameraCountdown === null && (
                            <motion.img 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              src={photoDataUrl} 
                              alt="Scan" 
                              className="absolute inset-0 w-full h-full object-cover z-10" 
                            />
                          )}
                          
                          {/* Scan Line Animation */}
                          <motion.div 
                            className="absolute inset-x-0 h-[2px] bg-[#ff006e] z-30 shadow-[0_0_15px_#ff006e]"
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                          />
                          
                          {/* Countdown (No Blur) */}
                          {cameraCountdown !== null && (
                            <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/20">
                              <motion.span 
                                key={cameraCountdown}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-6xl font-black italic text-white drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                                style={{ fontFamily: "'Orbitron', sans-serif" }}
                              >
                                {cameraCountdown}
                              </motion.span>
                            </div>
                          )}

                          {/* Face Target Reticle (Only when no photo and no countdown) */}
                          {!photoDataUrl && cameraCountdown === null && (
                            <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none opacity-40">
                              <Focus className="w-24 h-24 text-white animate-pulse" />
                            </div>
                          )}

                          {/* Bottom-Middle Capture/Re-capture Button */}
                          {cameraCountdown === null && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
                               <motion.button
                                onClick={startCameraCountdown}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="px-8 py-3 bg-[#ff006e] text-white rounded-xl font-black italic uppercase text-xs tracking-widest
                                         shadow-[0_0_30px_#ff006e80] hover:bg-[#ff006e] transition-all duration-300"
                                style={{ fontFamily: "'Orbitron', sans-serif" }}
                              >
                                {photoDataUrl ? 'RE-CAPTURE' : 'CAPTURE'}
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Subsection: Avatar (One Row) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em] ml-1">OR SELECT AVATAR</p>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => setAvatarPage(p => Math.max(0, p - 1))}
                            disabled={avatarPage === 0}
                            className="p-1 hover:bg-white/10 rounded-md transition-colors disabled:opacity-20"
                          >
                            <ChevronLeft className="w-4 h-4 text-[#00f0ff]" />
                          </button>
                          <button 
                            onClick={() => setAvatarPage(p => Math.min(Math.floor(avatarOptions.length / AVATARS_PER_PAGE), p + 1))}
                            disabled={avatarPage >= Math.floor(avatarOptions.length / AVATARS_PER_PAGE)}
                            className="p-1 hover:bg-white/10 rounded-md transition-colors disabled:opacity-20"
                          >
                            <ChevronRight className="w-4 h-4 text-[#00f0ff]" />
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2 p-1 overflow-hidden">
                        {avatarOptions.slice(avatarPage * AVATARS_PER_PAGE, (avatarPage + 1) * AVATARS_PER_PAGE).map((avatar) => (
                          <motion.button
                            key={avatar.id}
                            onClick={() => setSelectedAvatar(avatar.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`
                            flex-1 aspect-square rounded-xl border-2 p-1 overflow-hidden transition-all duration-300
                            ${selectedAvatar === avatar.id
                                ? 'border-[#ff006e] bg-[#ff006e]/10 shadow-[0_0_15px_#ff006e40]'
                                : 'border-white/10 bg-white/5 hover:border-white/20'
                              }
                          `}
                          >
                            <img src={avatar.url} alt="Profile" className="w-full h-full object-cover rounded-lg" />
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 3. Player Name (Bottom) */}
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                        <Edit3 className="w-5 h-5 text-[#00f0ff]" />
                        <p className="text-sm text-white font-black uppercase tracking-[0.2em] italic" style={{ fontFamily: "'Orbitron', sans-serif" }}>PLAYER NAME</p>
                    </div>
                    <div className="relative group">
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="ENTER PLAYER NAME..."
                        maxLength={20}
                        className="w-full px-12 py-5 bg-white/5 border-2 border-white/10 rounded-2xl
                                 text-white placeholder-white/20 outline-none
                                 focus:border-[#00f0ff] focus:bg-[#00f0ff]/5 focus:shadow-[0_0_30px_#00f0ff20]
                                 transition-all duration-300 caret-[#00f0ff] text-base font-black tracking-widest uppercase italic"
                        style={{ fontFamily: 'var(--font-family-heading)' }}
                      />
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-[#00f0ff] transition-colors" />
                      
                      <button className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Mic className="w-5 h-5 text-white/20 hover:text-[#00f0ff] transition-colors" />
                      </button>

                      {isValidating && (
                        <div className="absolute right-14 top-1/2 -translate-y-1/2">
                          <motion.div
                            className="w-4 h-4 border-2 border-[#00f0ff] border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Complete Button */}
          <div className="pt-8">
            <NeonButton
              variant="primary"
              color="yellow"
              onClick={handleComplete}
              className={`w-full py-6 text-xl font-bold ${(!playerName || nameError || (!selectedAvatar && selectedAvatar !== 0)) ? 'opacity-40 grayscale pointer-events-none' : ''}`}
            >
              {isSyncing ? 'SYNCING DATA...' : isEditing ? 'UPDATE PROFILE' : 'COMPLETE SETUP'}
            </NeonButton>
          </div>
        </div>
      </div>
    </div>
  );
}