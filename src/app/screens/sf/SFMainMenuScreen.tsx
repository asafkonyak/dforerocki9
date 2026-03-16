import { useNavigate } from 'react-router';
import { SFCard } from '../../components/SFCard';
import { motion } from 'motion/react';

export function SFMainMenuScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 via-orange-800 to-yellow-600 p-6 relative overflow-hidden">
      {/* Comic book dots pattern */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, black 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          className="text-center pt-8 pb-6"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          <div className="bg-black border-4 border-yellow-400 px-6 py-3 inline-block shadow-[8px_8px_0px_rgba(0,0,0,0.5)] mb-4">
            <h1 
              className="text-4xl text-yellow-400"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                textShadow: '3px 3px 0px #000, -1px -1px 0px #ff0000',
              }}
            >
              BATTLE SELECT
            </h1>
          </div>
          <p className="text-black text-sm uppercase tracking-widest font-bold bg-yellow-400 inline-block px-4 py-1 border-2 border-black">
            Choose Your Mode
          </p>
        </motion.div>

        {/* Game Mode Cards - Horizontal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Global Tournament - Disabled */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <SFCard className="p-5 relative h-full" disabled>
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-gray-700 border-4 border-gray-600 flex items-center justify-center">
                  <span className="text-3xl opacity-50">🏆</span>
                </div>
                <div>
                  <h3 className="text-xl text-white/40 uppercase mb-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    World Tournament
                  </h3>
                  <p className="text-sm text-white/30 uppercase text-xs">Global Competition</p>
                </div>
              </div>
              
              {/* Coming Soon Stamp */}
              <div 
                className="absolute top-1/2 right-4 -translate-y-1/2 bg-red-600 border-4 border-black px-4 py-2 rotate-12 shadow-[4px_4px_0px_#000]"
              >
                <span 
                  className="text-white text-sm uppercase tracking-wider"
                  style={{ 
                    fontFamily: "'Orbitron', sans-serif",
                    textShadow: '2px 2px 0px rgba(0,0,0,0.5)',
                  }}
                >
                  Soon
                </span>
              </div>
            </SFCard>
          </motion.div>

          {/* Online 1v1 - Active */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <SFCard 
              className="p-5 relative overflow-hidden h-full" 
              onClick={() => navigate('/sf/matchmaking')}
              variant="battle"
            >
              {/* Video Background */}
              <div className="absolute inset-0 z-0">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src="/assets/1v1.mp4" type="video/mp4" />
                </video>
                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-black/70" />
              </div>
              
              <div className="relative z-10 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 border-4 border-yellow-400 flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.5)]">
                  <span className="text-3xl">⚔️</span>
                </div>
                <div>
                  <h3 className="text-2xl text-yellow-400 uppercase mb-2" style={{ fontFamily: "'Orbitron', sans-serif", textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                    VS Online
                  </h3>
                  <p className="text-sm text-white uppercase text-xs tracking-wider font-bold" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>Real Fighters</p>
                </div>
                
                {/* Live indicator */}
                <div className="flex flex-col items-center gap-1 mt-auto">
                  <div className="flex items-center gap-2 bg-red-600 px-3 py-1 border-2 border-white">
                    <motion.div 
                      className="w-2 h-2 bg-white rounded-full"
                      animate={{
                        opacity: [1, 0.3, 1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        type: "tween"
                      }}
                    />
                    <span className="text-white text-xs uppercase font-bold">LIVE</span>
                  </div>
                  <span className="text-yellow-400 text-xs font-bold" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>→ FIGHT NOW</span>
                </div>
              </div>
            </SFCard>
          </motion.div>

          {/* Vs. Computer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <SFCard 
              className="p-5 h-full relative overflow-hidden" 
              onClick={() => alert('Select difficulty to start!')}
            >
              {/* Video Background */}
              <div className="absolute inset-0 z-0">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src="/assets/training.mp4" type="video/mp4" />
                </video>
                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-black/60" />
              </div>

              <div className="relative z-10 flex flex-col items-center text-center gap-4 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 border-4 border-blue-400 flex items-center justify-center">
                  <span className="text-3xl">🤖</span>
                </div>
                <div>
                  <h3 className="text-xl text-white uppercase mb-2" style={{ fontFamily: "'Orbitron', sans-serif", textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                    Training Mode
                  </h3>
                  <p className="text-sm text-blue-400 uppercase text-xs font-bold" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>Vs Computer</p>
                </div>
                
                {/* Difficulty Levels */}
                <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t-4 border-yellow-400 w-full">
                  {[
                    { name: 'ROOKIE', emoji: '🥉', color: 'from-green-500 to-green-700' },
                    { name: 'FIGHTER', emoji: '🥈', color: 'from-blue-500 to-blue-700' },
                    { name: 'MASTER', emoji: '🥇', color: 'from-red-500 to-red-700' }
                  ].map((diff, index) => (
                    <button
                      key={diff.name}
                      className={`p-3 bg-gradient-to-b ${diff.color} border-4 border-black hover:shadow-[4px_4px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all`}
                    >
                      <div className="text-2xl mb-1">{diff.emoji}</div>
                      <p className="text-white text-[10px] uppercase font-bold">{diff.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            </SFCard>
          </motion.div>

          {/* Boss Battle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <SFCard 
              className="p-5 relative overflow-hidden h-full" 
              onClick={() => alert('Boss battle mode!')}
            >
              <div className="flex flex-col items-center text-center gap-4 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-red-700 to-black border-4 border-red-500 flex items-center justify-center shadow-[0_0_20px_rgba(255,0,0,0.5)]">
                  <span className="text-3xl">💀</span>
                </div>
                <div>
                  <h3 className="text-xl text-white uppercase mb-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    Boss Rush
                  </h3>
                  <p className="text-sm text-red-400 uppercase text-xs">Defeat All Bosses</p>
                </div>
                
                {/* Boss Progression Ladder */}
                <div className="mt-auto pt-4 border-t-4 border-red-500 w-full">
                  <div className="flex flex-col items-center gap-2">
                    {[
                      { level: 5, label: 'FINAL BOSS', emoji: '👹', cleared: false },
                      { level: 4, label: 'BOSS 4', emoji: '😈', cleared: false },
                      { level: 3, label: 'BOSS 3', emoji: '👊', cleared: true },
                      { level: 2, label: 'BOSS 2', emoji: '💪', cleared: true },
                      { level: 1, label: 'BOSS 1', emoji: '🥊', cleared: true },
                    ].map((boss) => (
                      <div
                        key={boss.level}
                        className={`
                          w-full flex items-center justify-between p-2 border-4
                          ${boss.cleared 
                            ? 'bg-green-900/50 border-green-500' 
                            : boss.level === 4
                            ? 'bg-yellow-900/50 border-yellow-400 animate-pulse'
                            : 'bg-gray-900/50 border-gray-600'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{boss.emoji}</span>
                          <span className={`text-xs uppercase font-bold ${
                            boss.cleared ? 'text-green-400' : boss.level === 4 ? 'text-yellow-400' : 'text-gray-400'
                          }`}>
                            {boss.label}
                          </span>
                        </div>
                        <div>
                          {boss.cleared ? (
                            <span className="text-green-400 text-lg">✓</span>
                          ) : boss.level === 4 ? (
                            <span className="text-yellow-400 text-xs uppercase">→</span>
                          ) : (
                            <span className="text-gray-600">🔒</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-xs text-yellow-400 mt-3 uppercase font-bold">
                    3/5 Cleared
                  </p>
                </div>
              </div>
            </SFCard>
          </motion.div>
        </div>

        {/* Footer Navigation */}
        <motion.div
          className="pt-6 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <button
            onClick={() => navigate('/sf')}
            className="bg-gray-800 border-4 border-black text-white px-6 py-2 uppercase tracking-wider hover:bg-gray-700 transition-colors shadow-[4px_4px_0px_#000]"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            ← Main Menu
          </button>
        </motion.div>
      </div>
    </div>
  );
}