import { motion } from 'motion/react';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-[#0a0515] z-[999] flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00f0ff] blur-[150px] opacity-10" />
      
      {/* Dynamic Grid Background */}
      <div 
        className="absolute inset-0 opacity-10" 
        style={{ 
          backgroundImage: 'linear-gradient(#00f0ff 1px, transparent 1px), linear-gradient(90deg, #00f0ff 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} 
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Ring */}
        <div className="relative mb-12">
          <motion.div 
            className="w-32 h-32 rounded-full border-4 border-[#00f0ff]/10"
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute inset-0 w-32 h-32 rounded-full border-t-4 border-[#00f0ff]"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute inset-4 w-24 h-24 rounded-full border-b-4 border-[#ff006e]"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Text and Progress Indicator */}
        <div className="flex flex-col items-center gap-4">
          <motion.h2 
            className="text-4xl font-black italic tracking-tighter text-white uppercase"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Initializing<span className="text-[#00f0ff]"> Arena</span>
          </motion.h2>
          
          <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden relative">
            <motion.div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#00f0ff] to-[#ff006e] shadow-[0_0_10px_rgba(0,240,255,1)]"
              animate={{ 
                left: ["-100%", "100%"]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut"
              }}
              style={{ width: "100%" }}
            />
          </div>
          
          <p className="text-[#00f0ff]/40 text-[10px] font-bold uppercase tracking-[0.4em] mt-2">
            Asset Synchronization In Progress
          </p>
        </div>
      </div>
    </div>
  );
}
