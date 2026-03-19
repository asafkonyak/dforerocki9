import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { GlassCard } from '../components/GlassCard';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RotateCcw, Zap, User, Weight, ArrowLeft } from 'lucide-react';
import { NeonButton } from '../components/NeonButton';
import { supabase } from '../../lib/supabase';

import { SUGGESTED_NAMES } from '../data/suggestedNames';

const AVATAR_OPTIONS = [
  { id: 1, emoji: '🤖', label: 'Cyber Bot' },
  { id: 2, emoji: '👾', label: 'Glitch Entity' },
  { id: 3, emoji: '🦾', label: 'Mech Warrior' }
];

export function OnboardingScreen() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [weight, setWeight] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null);
  const [cameraCountdown, setCameraCountdown] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
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
    // Pick 5 random suggestions from the pool
    const shuffled = [...SUGGESTED_NAMES].sort(() => 0.5 - Math.random());
    setSuggestions(shuffled.slice(0, 5));
  }, []);

  const handleComplete = async () => {
    setIsSyncing(true); // Reusing state for loading
    
    // Check if real user or guest
    const { data: { user } } = await supabase.auth.getUser();
    
    // Handle Avatar Upload if a real photo was taken
    let finalAvatarUrl = '👤';
    
    if (selectedAvatar === 0 && photoDataUrl) {
      try {
        // Convert Base64 to Blob
        const fetchResponse = await fetch(photoDataUrl);
        const blob = await fetchResponse.blob();
        
        // Generate unique filename
        const fileName = `avatar_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: false
          });
          
        if (uploadError) throw uploadError;
        
        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
          
        finalAvatarUrl = publicUrl;
      } catch (err) {
        console.error("Avatar upload failed:", err);
        alert("Failed to upload avatar, falling back to default.");
      }
    } else if (selectedAvatar) {
      finalAvatarUrl = AVATAR_OPTIONS.find(a => a.id === selectedAvatar)?.emoji || '👤';
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
      // 0. Ensure Name Uniqueness
      let finalName = playerName;
      let isUnique = false;
      let checkCounter = 0;

      while (!isUnique) {
        const checkName = checkCounter === 0 ? playerName : `${playerName}${checkCounter}`;
        const { data: existingPlayers, error: checkError } = await supabase
          .from('players')
          .select('id')
          .eq('username', checkName)
          .limit(1);

        if (checkError) throw checkError;

        const existingPlayer = existingPlayers && existingPlayers.length > 0 ? existingPlayers[0] : null;

        // If no one has this name, or the person who has it is US (updating profile)
        if (!existingPlayer || existingPlayer.id === playerId) {
          finalName = checkName;
          isUnique = true;
        } else {
          checkCounter++;
        }
        
        if (checkCounter > 100) throw new Error("Could not generate a unique name after 100 attempts.");
      }

      // 1. Upsert to players table
      const { error: playerError } = await supabase.from('players').upsert({
        id: playerId,
        user_id: user?.id || null,
        username: finalName,
        avatar_url: finalAvatarUrl,
        weight: parseInt(weight) || 0,
        gauntlet_progress: 1,
        updated_at: new Date().toISOString()
      });

      if (playerError) throw playerError;

      // Ensure playerId is in localStorage for fallback
      localStorage.setItem('fighter_player_id', playerId);
      // Reset Gauntlet progress for new player
      localStorage.setItem('fighter_gauntlet_progress', '1');

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
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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
              CREATE YOUR IDENTITY
            </h1>
          </motion.div>

          {/* Right: Hardware Sync Badge */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="px-4 py-2 border-2 border-[#00ff00]/40 bg-gradient-to-r from-[#00ff00]/10 to-[#00ff00]/5 shadow-[0_0_20px_rgba(0,255,0,0.4)]">
              <div className="flex items-center gap-3">
                {/* Pulsing Green Dot */}
                <motion.div
                  className="relative"
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    type: 'tween',
                  }}
                >
                  <div className="w-3 h-3 rounded-full bg-[#00ff00] shadow-[0_0_10px_#00ff00]" />
                  {/* Outer glow ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-[#00ff00]"
                    animate={{
                      scale: [1, 2, 1],
                      opacity: [0.8, 0, 0.8],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      type: 'tween',
                    }}
                  />
                </motion.div>

                {/* Badge Text */}
                <div className="text-sm">
                  <div className="text-[#00ff00] font-bold uppercase tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    ROCKI: CONNECTED
                  </div>
                  <div className="text-white/40 text-xs uppercase tracking-wider">
                    Hardware Synced
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content - Scrollable if needed */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0 relative z-10">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Three Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card 1: Identity (Name) - LEFT */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <GlassCard className="p-6 h-full">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#00f0ff]/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-[#00f0ff]" />
                    </div>
                    <h2 className="text-2xl text-white">Identity</h2>
                  </div>

                  {/* Name Input with Glowing Cursor */}
                  <div className="relative">
                    <label className="block text-sm text-[#00f0ff] mb-2 uppercase tracking-wider">
                      Player Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Enter your name..."
                        maxLength={20}
                        className="w-full px-4 py-3 bg-black/40 border-2 border-[#00f0ff]/30 rounded-lg
                                 text-white placeholder-white/30 outline-none
                                 focus:border-[#00f0ff] focus:shadow-[0_0_20px_#00f0ff40]
                                 transition-all duration-300 caret-[#00f0ff]"
                        style={{
                          fontFamily: 'var(--font-family-heading)',
                        }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-lg pointer-events-none"
                        animate={{
                          boxShadow: playerName 
                            ? ['0 0 0px #00f0ff', '0 0 20px #00f0ff40', '0 0 0px #00f0ff']
                            : '0 0 0px #00f0ff',
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          type: "tween"
                        }}
                      />
                    </div>
                  </div>

                  {/* Suggestion Chips */}
                  <div className="space-y-2">
                    <label className="block text-xs text-white/40 uppercase tracking-wider">
                      Quick Suggestions
                    </label>
                    <div className="flex flex-col gap-2">
                      {suggestions.map((name, index) => (
                        <motion.button
                          key={name}
                          onClick={() => setPlayerName(name)}
                          className="px-4 py-2 bg-gradient-to-r from-[#ff006e]/20 to-[#ffff00]/20
                                   border border-[#ff006e]/50 rounded-full text-sm text-white
                                   hover:from-[#ff006e]/30 hover:to-[#ffff00]/30 
                                   hover:shadow-[0_0_15px_#ff006e40]
                                   transition-all duration-300"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 + index * 0.1 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {name}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Immediate CTA for Identity */}
                  <motion.div
                    className="pt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: playerName ? 1 : 0.5 }}
                  >
                    <NeonButton
                      variant="primary"
                      color="cyan"
                      onClick={() => {
                        // Just a visual feedback button for now, or could scroll to next section
                        const attrSection = document.getElementById('avatar-section');
                        attrSection?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full"
                    >
                      Create Identity
                    </NeonButton>
                  </motion.div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Card 2: Avatar & Camera - MIDDLE */}
            <motion.div
              id="avatar-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <GlassCard className="p-6 h-full">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#ff006e]/20 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-[#ff006e]" />
                    </div>
                    <h2 className="text-2xl text-white">Avatar</h2>
                  </div>

                  {/* Live Camera Placeholder */}
                  <div className="relative">
                    <label className="block text-sm text-[#ff006e] mb-2 uppercase tracking-wider">
                      Camera Photo
                    </label>
                    <div className="relative aspect-square w-full">
                    {/* Camera Frame */}
                    <motion.div
                      className="relative w-full h-full rounded-2xl overflow-hidden
                               border-4 border-[#ff006e] bg-black/60
                               shadow-[0_0_30px_#ff006e40]"
                      animate={{
                        boxShadow: cameraCountdown !== null
                          ? ['0 0 30px #ff006e40', '0 0 50px #ff006e80', '0 0 30px #ff006e40']
                          : '0 0 30px #ff006e40',
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut",
                        type: "tween"
                      }}
                    >
                      {/* Camera Grid Overlay */}
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20">
                        {Array.from({ length: 9 }).map((_, i) => (
                          <div key={i} className="border border-[#ff006e]/50" />
                        ))}
                      </div>

                      {/* Countdown Overlay */}
                      <AnimatePresence>
                        {cameraCountdown !== null && cameraCountdown > 0 && (
                          <motion.div
                            className="absolute inset-0 flex items-center justify-center z-10"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <motion.div
                              className="text-8xl text-[#ffff00]"
                              style={{ fontFamily: 'var(--font-family-heading)' }}
                              key={cameraCountdown}
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1.5, opacity: 1 }}
                              exit={{ scale: 2, opacity: 0 }}
                              transition={{ duration: 0.8 }}
                            >
                              {cameraCountdown}
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Camera Content */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        {/* Always show video feed unless a photo is finalized and we aren't counting down */}
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          muted /* Important to prevent feedback loop */
                          className={`w-full h-full object-cover ${(selectedAvatar === 0 && photoDataUrl && cameraCountdown === null) ? 'opacity-0 absolute' : 'opacity-100 relative'}`}
                        />
                        
                        {/* Show standard camera icon if video isn't loaded yet */}
                        {!streamRef.current && cameraCountdown === null && selectedAvatar !== 0 && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                            <Camera className="w-16 h-16 text-[#ff006e]/40 mx-auto mb-2" />
                            <p className="text-white/40 text-sm">Initializing Camera...</p>
                          </div>
                        )}

                        {/* Show captured photo on top if selected */}
                        {selectedAvatar === 0 && photoDataUrl && cameraCountdown === null && (
                          <motion.img
                            src={photoDataUrl}
                            alt="Captured Avatar"
                            className="absolute inset-0 w-full h-full object-cover z-20"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", duration: 0.8 }}
                          />
                        )}
                      </div>

                      {/* Retake Button */}
                      {selectedAvatar === 0 && (
                        <motion.button
                          onClick={startCameraCountdown}
                          className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-sm
                                   border border-[#ff006e]/50 rounded-lg
                                   hover:bg-[#ff006e]/20 transition-all"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <RotateCcw className="w-5 h-5 text-[#ff006e]" />
                        </motion.button>
                      )}
                    </motion.div>

                    {/* Take Photo Button */}
                    {cameraCountdown === null && (
                      <motion.button
                        onClick={startCameraCountdown}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2
                                 px-6 py-3 bg-[#ff006e] text-white rounded-full
                                 hover:bg-[#ff006e]/80 hover:shadow-[0_0_20px_#ff006e80]
                                 transition-all duration-300 z-30"
                        style={{ fontFamily: 'var(--font-family-heading)' }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {photoDataUrl ? 'Retake Photo' : 'CAPTURE'}
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Avatar Thumbnails */}
                <div className="space-y-2">
                  <label className="block text-xs text-white/40 uppercase tracking-wider">
                    Or Choose Avatar
                  </label>
                  <div className="flex gap-2 justify-center">
                    {AVATAR_OPTIONS.map((avatar, index) => (
                      <motion.button
                        key={avatar.id}
                        onClick={() => setSelectedAvatar(avatar.id)}
                        className={`
                          flex-1 aspect-square rounded-xl border-2 flex items-center justify-center text-3xl
                          transition-all duration-300
                          ${selectedAvatar === avatar.id
                            ? 'border-[#ff006e] bg-[#ff006e]/20 shadow-[0_0_20px_#ff006e60]'
                            : 'border-white/20 bg-black/40 hover:border-[#ff006e]/50'
                          }
                        `}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {avatar.emoji}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
              </GlassCard>
            </motion.div>

            {/* Card 3: Physical Stats (Weight) - RIGHT */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <GlassCard className="p-6 h-full">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#ffff00]/20 flex items-center justify-center">
                      <Weight className="w-5 h-5 text-[#ffff00]" />
                    </div>
                    <h2 className="text-2xl text-white">Physical Stats</h2>
                  </div>

                  {/* Weight Input and Auto-Sync */}
                  <div className="space-y-3">
                    <label className="block text-sm text-[#ffff00] mb-2 uppercase tracking-wider">
                      Weight (kg)
                    </label>
                    <div className="space-y-3">
                      {/* Manual Input */}
                      <div>
                        <input
                          type="number"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          placeholder="Enter weight..."
                          min="30"
                          max="200"
                          className="w-full px-4 py-3 bg-black/40 border-2 border-[#ffff00]/30 rounded-lg
                                   text-white placeholder-white/30 outline-none
                                   focus:border-[#ffff00] focus:shadow-[0_0_20px_#ffff0040]
                                   transition-all duration-300"
                          style={{
                            fontFamily: 'var(--font-family-heading)',
                          }}
                        />
                      </div>

                      {/* Auto-Sync Button */}
                      <motion.button
                        onClick={handleAutoSync}
                        disabled={isSyncing}
                        className="relative w-full px-6 py-3 bg-gradient-to-r from-[#ffff00]/20 to-[#00f0ff]/20
                                 border-2 border-[#ffff00] rounded-lg
                                 text-[#ffff00] hover:shadow-[0_0_25px_#ffff0060]
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 transition-all duration-300 overflow-hidden group"
                        style={{ fontFamily: 'var(--font-family-heading)' }}
                        whileHover={{ scale: isSyncing ? 1 : 1.05 }}
                        whileTap={{ scale: isSyncing ? 1 : 0.95 }}
                      >
                        <div className="flex items-center justify-center gap-2 relative z-10">
                          <Zap className="w-5 h-5" />
                          <span className="whitespace-nowrap">
                            {isSyncing ? 'SYNCING...' : 'AUTO-SYNC'}
                          </span>
                        </div>

                        {/* Biometric Scan Animation */}
                        {isSyncing && (
                          <>
                            {/* Sweeping Laser Effect */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffff00]/40 to-transparent"
                              animate={{
                                x: ['-100%', '200%'],
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "linear",
                                type: "tween"
                              }}
                            />
                            
                            {/* Digital Data Stream */}
                            <motion.div
                              className="absolute inset-0 opacity-30"
                              style={{
                                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #ffff00 2px, #ffff00 4px)',
                              }}
                              animate={{
                                y: ['0%', '100%'],
                              }}
                              transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                ease: "linear",
                                type: "tween"
                              }}
                            />
                          </>
                        )}
                      </motion.button>
                    </div>

                    {/* Biometric Info */}
                    {isSyncing && (
                      <motion.div
                        className="flex items-center gap-2 text-sm text-[#ffff00]/60 px-4 py-2
                                 bg-[#ffff00]/5 border border-[#ffff00]/20 rounded-lg"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear", type: "tween" }}
                        >
                          <Zap className="w-4 h-4" />
                        </motion.div>
                        <span>Connecting to health app...</span>
                      </motion.div>
                    )}
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
              className={`w-full py-6 text-xl font-bold ${(!playerName || (!selectedAvatar && selectedAvatar !== 0) || !weight) ? 'opacity-40 grayscale pointer-events-none' : ''}`}
            >
              {isSyncing ? 'SYNCING DATA...' : 'COMPLETE SETUP'}
            </NeonButton>
          </div>
        </div>
      </div>
    </div>
  );
}