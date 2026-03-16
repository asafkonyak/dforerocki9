import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { GlassCard } from '../components/GlassCard';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RotateCcw, Zap, User, Weight } from 'lucide-react';

import { SUGGESTED_NAMES } from '../data/suggestedNames';

const AVATAR_OPTIONS = [
  { id: 1, emoji: '🤖', label: 'Cyber Bot' },
  { id: 2, emoji: '👾', label: 'Glitch Entity' },
  { id: 3, emoji: '🦾', label: 'Mech Warrior' }
];

export function PlayerSetupScreen() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [weight, setWeight] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null);
  const [cameraCountdown, setCameraCountdown] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  useEffect(() => {
    // Pick 5 random suggestions from the pool
    const shuffled = [...SUGGESTED_NAMES].sort(() => 0.5 - Math.random());
    setSuggestions(shuffled.slice(0, 5));
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
      // Simulate photo taken
      setTimeout(() => {
        setCameraCountdown(null);
        setSelectedAvatar(0); // Use camera photo
      }, 500);
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

  const handleComplete = () => {
    // Navigate to main menu after setup
    navigate('/menu');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0515] via-[#1a0a2e] to-[#0a0515] p-6 overflow-y-auto relative">
      {/* Video Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover fixed top-0 left-0"
        >
          <source src="/assets/registration.mp4" type="video/mp4" />
        </video>
        {/* Dark Overlay for Readability */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] fixed top-0 left-0" />
      </div>

      <div className="max-w-2xl mx-auto space-y-6 pb-24 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center pt-8 pb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl mb-2 text-[#00f0ff]">PLAYER SETUP</h1>
          <p className="text-white/60 text-sm uppercase tracking-widest">Create Your Identity</p>
        </motion.div>

        {/* Card 1: Identity (Name) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <GlassCard className="p-6">
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
                <div className="flex flex-wrap gap-2">
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
            </div>
          </GlassCard>
        </motion.div>

        {/* Card 2: Avatar & Camera */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <GlassCard className="p-6">
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
                <div className="relative aspect-square max-w-xs mx-auto">
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
                          className="absolute inset-0 flex items-center justify-center
                                   bg-black/70 backdrop-blur-sm z-10"
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
                    <div className="absolute inset-0 flex items-center justify-center">
                      {selectedAvatar === 0 ? (
                        <motion.div
                          className="text-6xl"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", duration: 0.8 }}
                        >
                          📸
                        </motion.div>
                      ) : (
                        <div className="text-center">
                          <Camera className="w-16 h-16 text-[#ff006e]/40 mx-auto mb-2" />
                          <p className="text-white/40 text-sm">Position your face</p>
                        </div>
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
                  {selectedAvatar !== 0 && cameraCountdown === null && (
                    <motion.button
                      onClick={startCameraCountdown}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2
                               px-6 py-3 bg-[#ff006e] text-white rounded-full
                               hover:bg-[#ff006e]/80 hover:shadow-[0_0_20px_#ff006e80]
                               transition-all duration-300"
                      style={{ fontFamily: 'var(--font-family-heading)' }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      CAPTURE
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Avatar Thumbnails */}
              <div className="space-y-2">
                <label className="block text-xs text-white/40 uppercase tracking-wider">
                  Or Choose Avatar
                </label>
                <div className="flex gap-3 justify-center">
                  {AVATAR_OPTIONS.map((avatar, index) => (
                    <motion.button
                      key={avatar.id}
                      onClick={() => setSelectedAvatar(avatar.id)}
                      className={`
                        w-20 h-20 rounded-xl border-2 flex items-center justify-center text-3xl
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

        {/* Card 3: Physical Stats (Weight) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <GlassCard className="p-6">
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
                <div className="flex gap-3 items-start">
                  {/* Manual Input */}
                  <div className="flex-1">
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
                    className="relative px-6 py-3 bg-gradient-to-r from-[#ffff00]/20 to-[#00f0ff]/20
                             border-2 border-[#ffff00] rounded-lg
                             text-[#ffff00] hover:shadow-[0_0_25px_#ffff0060]
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-300 overflow-hidden group"
                    style={{ fontFamily: 'var(--font-family-heading)' }}
                    whileHover={{ scale: isSyncing ? 1 : 1.05 }}
                    whileTap={{ scale: isSyncing ? 1 : 0.95 }}
                  >
                    <div className="flex items-center gap-2 relative z-10">
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

        {/* Complete Button */}
        <motion.button
          onClick={handleComplete}
          disabled={!playerName || (!selectedAvatar && selectedAvatar !== 0) || !weight}
          className="w-full py-4 bg-gradient-to-r from-[#00f0ff] via-[#ff006e] to-[#ffff00]
                   text-black rounded-xl shadow-[0_0_30px_#00f0ff60]
                   hover:shadow-[0_0_50px_#00f0ff80]
                   disabled:opacity-30 disabled:cursor-not-allowed
                   transition-all duration-300"
          style={{ fontFamily: 'var(--font-family-heading)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          COMPLETE SETUP
        </motion.button>
      </div>
    </div>
  );
}
