import { useState } from 'react';
import { motion } from 'motion/react';
import { GlassCard } from '../components/GlassCard';
import { Activity, Zap, Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

type TrainingBot = 'endurance' | 'explosive' | 'strength';

export function TrainingSimulatorScreen() {
  const navigate = useNavigate();
  const [selectedBot, setSelectedBot] = useState<TrainingBot>('explosive');

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-[#0a0515] via-[#1a0a2e] to-[#0a0515] relative flex flex-col">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="w-full h-full" 
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 240, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 240, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Bio-metric corner patterns */}
      <div className="absolute top-0 left-0 w-64 h-64 opacity-20">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx="0" cy="0" r="150" fill="none" stroke="#00f0ff" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="120" fill="none" stroke="#00f0ff" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="90" fill="none" stroke="#00f0ff" strokeWidth="0.5" />
        </svg>
      </div>
      <div className="absolute bottom-0 right-0 w-64 h-64 opacity-20 rotate-180">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx="0" cy="0" r="150" fill="none" stroke="#ff006e" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="120" fill="none" stroke="#ff006e" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="90" fill="none" stroke="#ff006e" strokeWidth="0.5" />
        </svg>
      </div>
      
      {/* Back Button */}
      <motion.button
        onClick={() => navigate('/menu')}
        className="absolute left-8 top-8 flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-[#00f0ff]/30 transition-all z-50"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft className="w-5 h-5 text-[#00f0ff]" />
        <span className="text-white/60 text-sm uppercase tracking-wider font-bold">Back</span>
      </motion.button>

      {/* Header */}
      <motion.div
        className="pt-8 pb-6 text-center relative z-10"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl md:text-5xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] via-[#ffff00] to-[#ff006e]">
          TRAINING SIMULATOR
        </h1>
        <motion.div
          className="mt-2 text-white/70 uppercase tracking-[0.3em] text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Select Workout Protocol
        </motion.div>
        <motion.div
          className="mt-4 h-[2px] w-24 mx-auto bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        />
      </motion.div>

      {/* Main Content - Training Bots */}
      <div className="flex-1 flex items-center justify-center px-8 pb-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl w-full">
          
          {/* AERO-BOT: ENDURANCE - Cyan Theme */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            whileHover={{ y: -8 }}
            onClick={() => setSelectedBot('endurance')}
          >
            <GlassCard 
              className={`
                p-8 h-full transition-all duration-500 relative overflow-hidden
                ${selectedBot === 'endurance' ? 'scale-110 border-2 border-[#00f0ff] shadow-[0_0_40px_rgba(0,240,255,0.6)]' : 'hover:border-[#00f0ff]/50'}
              `}
              onClick={() => setSelectedBot('endurance')}
            >
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff]/10 to-transparent" />
              
              <div className="relative flex flex-col items-center text-center gap-6 h-full">
                {/* Robot Avatar */}
                <motion.div 
                  className="w-24 h-24 rounded-full bg-[#00f0ff]/20 flex items-center justify-center relative border-2 border-[#00f0ff]/40"
                  animate={{
                    boxShadow: selectedBot === 'endurance' 
                      ? ['0 0 20px rgba(0,240,255,0.4)', '0 0 40px rgba(0,240,255,0.8)', '0 0 20px rgba(0,240,255,0.4)']
                      : '0 0 10px rgba(0,240,255,0.2)'
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    type: 'tween'
                  }}
                >
                  <Activity className="w-12 h-12 text-[#00f0ff]" />
                  {/* Orbit rings */}
                  <motion.div
                    className="absolute inset-0 border-2 border-[#00f0ff]/30 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear', type: 'tween' }}
                  />
                </motion.div>

                {/* Title */}
                <div>
                  <h2 className="text-2xl text-[#00f0ff] mb-1 tracking-wider">AERO-BOT</h2>
                  <p className="text-sm text-[#00f0ff]/80 uppercase tracking-widest">Endurance</p>
                </div>

                {/* Stats UI */}
                <div className="flex-1 flex flex-col justify-center w-full space-y-3 mt-2">
                  <div className="bg-black/30 border border-[#00f0ff]/30 rounded-lg p-3">
                    <div className="text-[#00f0ff]/60 text-xs uppercase tracking-wider mb-1">Duration</div>
                    <div className="text-white text-lg">60 seconds</div>
                  </div>
                  <div className="bg-black/30 border border-[#00f0ff]/30 rounded-lg p-3">
                    <div className="text-[#00f0ff]/60 text-xs uppercase tracking-wider mb-1">Resistance</div>
                    <div className="text-white text-lg">Constant 15 KG</div>
                  </div>
                </div>

                {/* Selection indicator */}
                {selectedBot === 'endurance' && (
                  <motion.div
                    className="absolute top-4 right-4 w-4 h-4 rounded-full bg-[#00f0ff]"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-full bg-[#00f0ff]"
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', type: 'tween' }}
                    />
                  </motion.div>
                )}
              </div>
            </GlassCard>
          </motion.div>

          {/* SPARK: EXPLOSIVE POWER - Yellow/Electric Theme (SELECTED) */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            whileHover={{ y: -8 }}
            onClick={() => setSelectedBot('explosive')}
          >
            <GlassCard 
              className={`
                p-8 h-full transition-all duration-500 relative overflow-hidden
                ${selectedBot === 'explosive' ? 'scale-110 border-2 border-[#ffff00] shadow-[0_0_50px_rgba(255,255,0,0.7)]' : 'hover:border-[#ffff00]/50'}
              `}
              onClick={() => setSelectedBot('explosive')}
            >
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#ffff00]/15 via-[#ffff00]/5 to-transparent" />
              
              {/* Electric sparks effect */}
              {selectedBot === 'explosive' && (
                <>
                  <motion.div
                    className="absolute top-0 left-1/4 w-1 h-8 bg-gradient-to-b from-[#ffff00] to-transparent"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1, type: 'tween' }}
                  />
                  <motion.div
                    className="absolute top-0 right-1/3 w-1 h-12 bg-gradient-to-b from-[#ffff00] to-transparent"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.7, delay: 0.3, type: 'tween' }}
                  />
                </>
              )}
              
              <div className="relative flex flex-col items-center text-center gap-6 h-full">
                {/* Robot Avatar - Dynamic/Agile */}
                <motion.div 
                  className="w-24 h-24 rounded-full bg-[#ffff00]/20 flex items-center justify-center relative border-2 border-[#ffff00]/40"
                  animate={{
                    boxShadow: selectedBot === 'explosive'
                      ? ['0 0 30px rgba(255,255,0,0.5)', '0 0 50px rgba(255,255,0,0.9)', '0 0 30px rgba(255,255,0,0.5)']
                      : '0 0 10px rgba(255,255,0,0.2)'
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    type: 'tween'
                  }}
                >
                  <Zap className="w-12 h-12 text-[#ffff00]" />
                  {/* Energy pulse */}
                  <motion.div
                    className="absolute inset-0 border-2 border-[#ffff00] rounded-full"
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [0.8, 0, 0.8]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', type: 'tween' }}
                  />
                </motion.div>

                {/* Title */}
                <div>
                  <h2 className="text-3xl text-[#ffff00] mb-1 tracking-wider">SPARK</h2>
                  <p className="text-sm text-[#ffff00]/80 uppercase tracking-widest">Explosive Power</p>
                </div>

                {/* Stats UI */}
                <div className="flex-1 flex flex-col justify-center w-full space-y-3 mt-2">
                  <div className="bg-black/40 border border-[#ffff00]/40 rounded-lg p-3">
                    <div className="text-[#ffff00]/60 text-xs uppercase tracking-wider mb-1">Mode</div>
                    <div className="text-white text-lg">Reaction Time</div>
                  </div>
                  <div className="bg-black/40 border border-[#ffff00]/40 rounded-lg p-3">
                    <div className="text-[#ffff00]/60 text-xs uppercase tracking-wider mb-1">Load Pattern</div>
                    <div className="text-white text-lg">Sudden 30 KG Spikes</div>
                  </div>
                </div>

                {/* Selection indicator */}
                {selectedBot === 'explosive' && (
                  <motion.div
                    className="absolute top-4 right-4 w-4 h-4 rounded-full bg-[#ffff00]"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-full bg-[#ffff00]"
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', type: 'tween' }}
                    />
                  </motion.div>
                )}
              </div>
            </GlassCard>
          </motion.div>

          {/* TITAN: MAX STRENGTH - Crimson/Red Theme */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            whileHover={{ y: -8 }}
            onClick={() => setSelectedBot('strength')}
          >
            <GlassCard 
              className={`
                p-8 h-full transition-all duration-500 relative overflow-hidden
                ${selectedBot === 'strength' ? 'scale-110 border-2 border-[#ff006e] shadow-[0_0_40px_rgba(255,0,110,0.6)]' : 'hover:border-[#ff006e]/50'}
              `}
              onClick={() => setSelectedBot('strength')}
            >
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff006e]/10 to-transparent" />
              
              <div className="relative flex flex-col items-center text-center gap-6 h-full">
                {/* Robot Avatar - Heavy/Armored */}
                <motion.div 
                  className="w-24 h-24 rounded-full bg-[#ff006e]/20 flex items-center justify-center relative border-2 border-[#ff006e]/40"
                  animate={{
                    boxShadow: selectedBot === 'strength'
                      ? ['0 0 20px rgba(255,0,110,0.4)', '0 0 40px rgba(255,0,110,0.8)', '0 0 20px rgba(255,0,110,0.4)']
                      : '0 0 10px rgba(255,0,110,0.2)'
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    type: 'tween'
                  }}
                >
                  <Shield className="w-12 h-12 text-[#ff006e]" />
                  {/* Heavy armor plates */}
                  <motion.div
                    className="absolute inset-0 border-2 border-[#ff006e]/40 rounded-full"
                    style={{ borderStyle: 'dashed' }}
                    animate={{ rotate: -360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'linear', type: 'tween' }}
                  />
                </motion.div>

                {/* Title */}
                <div>
                  <h2 className="text-2xl text-[#ff006e] mb-1 tracking-wider">TITAN</h2>
                  <p className="text-sm text-[#ff006e]/80 uppercase tracking-widest">Max Strength</p>
                </div>

                {/* Stats UI */}
                <div className="flex-1 flex flex-col justify-center w-full space-y-3 mt-2">
                  <div className="bg-black/30 border border-[#ff006e]/30 rounded-lg p-3">
                    <div className="text-[#ff006e]/60 text-xs uppercase tracking-wider mb-1">Pace</div>
                    <div className="text-white text-lg">Slow & Steady</div>
                  </div>
                  <div className="bg-black/30 border border-[#ff006e]/30 rounded-lg p-3">
                    <div className="text-[#ff006e]/60 text-xs uppercase tracking-wider mb-1">Peak Load</div>
                    <div className="text-white text-lg">60+ KG</div>
                  </div>
                </div>

                {/* Selection indicator */}
                {selectedBot === 'strength' && (
                  <motion.div
                    className="absolute top-4 right-4 w-4 h-4 rounded-full bg-[#ff006e]"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-full bg-[#ff006e]"
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', type: 'tween' }}
                    />
                  </motion.div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>

      {/* Bottom CTA Button */}
      <motion.div
        className="pb-8 px-8 relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <motion.button
          className="w-full max-w-4xl mx-auto h-20 relative overflow-hidden rounded-2xl border-2 group"
          style={{
            borderColor: selectedBot === 'endurance' ? '#00f0ff' : selectedBot === 'explosive' ? '#ffff00' : '#ff006e'
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (selectedBot === 'endurance') {
              navigate('/training/endurance');
            } else if (selectedBot === 'explosive') {
              navigate('/training/explosive');
            } else if (selectedBot === 'strength') {
              navigate('/training/strength');
            }
          }}
        >
          {/* Animated background */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: selectedBot === 'endurance' 
                ? 'linear-gradient(90deg, rgba(0,240,255,0.1), rgba(0,240,255,0.3), rgba(0,240,255,0.1))'
                : selectedBot === 'explosive'
                ? 'linear-gradient(90deg, rgba(255,255,0,0.1), rgba(255,255,0,0.3), rgba(255,255,0,0.1))'
                : 'linear-gradient(90deg, rgba(255,0,110,0.1), rgba(255,0,110,0.3), rgba(255,0,110,0.1))'
            }}
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
              type: 'tween'
            }}
          />
          
          {/* Scan line effect */}
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: selectedBot === 'endurance'
                ? 'linear-gradient(0deg, transparent 48%, rgba(0,240,255,0.8) 50%, transparent 52%)'
                : selectedBot === 'explosive'
                ? 'linear-gradient(0deg, transparent 48%, rgba(255,255,0,0.8) 50%, transparent 52%)'
                : 'linear-gradient(0deg, transparent 48%, rgba(255,0,110,0.8) 50%, transparent 52%)',
              backgroundSize: '100% 200%'
            }}
            animate={{
              backgroundPosition: ['0% 0%', '0% 100%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
              type: 'tween'
            }}
          />

          {/* Button text */}
          <div className="relative z-10 flex items-center justify-center h-full">
            <span 
              className="text-3xl tracking-[0.3em] uppercase"
              style={{
                color: selectedBot === 'endurance' ? '#00f0ff' : selectedBot === 'explosive' ? '#ffff00' : '#ff006e',
                textShadow: selectedBot === 'endurance' 
                  ? '0 0 20px rgba(0,240,255,0.8)'
                  : selectedBot === 'explosive'
                  ? '0 0 20px rgba(255,255,0,0.8)'
                  : '0 0 20px rgba(255,0,110,0.8)'
              }}
            >
              Initiate Protocol
            </span>
          </div>

          {/* Corner accents */}
          <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 opacity-60"
            style={{
              borderColor: selectedBot === 'endurance' ? '#00f0ff' : selectedBot === 'explosive' ? '#ffff00' : '#ff006e'
            }}
          />
          <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 opacity-60"
            style={{
              borderColor: selectedBot === 'endurance' ? '#00f0ff' : selectedBot === 'explosive' ? '#ffff00' : '#ff006e'
            }}
          />
          <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 opacity-60"
            style={{
              borderColor: selectedBot === 'endurance' ? '#00f0ff' : selectedBot === 'explosive' ? '#ffff00' : '#ff006e'
            }}
          />
          <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 opacity-60"
            style={{
              borderColor: selectedBot === 'endurance' ? '#00f0ff' : selectedBot === 'explosive' ? '#ffff00' : '#ff006e'
            }}
          />
        </motion.button>
      </motion.div>
    </div>
  );
}