import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { SFCard } from '../../components/SFCard';
import { SFButton } from '../../components/SFButton';
import { motion } from 'motion/react';

export function SFMatchmakingScreen() {
  const navigate = useNavigate();
  const [matchFound, setMatchFound] = useState(false);
  const [opponentData, setOpponentData] = useState({
    avatar: '🐉',
    name: 'DRAGON KING',
    country: '🇯🇵',
    wins: 847,
  });

  // Simulate matchmaking
  useEffect(() => {
    const timer = setTimeout(() => {
      setMatchFound(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-red-900 to-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Lightning effects */}
      {matchFound && (
        <>
          <motion.div
            className="absolute top-0 left-1/4 w-1 h-full bg-yellow-400"
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: [0, 1, 0], scaleY: [0, 1, 0] }}
            transition={{ duration: 0.3 }}
            style={{ transformOrigin: 'top' }}
          />
          <motion.div
            className="absolute top-0 right-1/4 w-1 h-full bg-yellow-400"
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: [0, 1, 0], scaleY: [0, 1, 0] }}
            transition={{ duration: 0.3, delay: 0.1 }}
            style={{ transformOrigin: 'top' }}
          />
        </>
      )}

      {/* Scan lines */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
        }}
      />

      <motion.div
        className="max-w-md w-full space-y-6 relative z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            className="inline-block"
            animate={{
              scale: matchFound ? [1, 1.2, 1] : 1,
            }}
            transition={{
              duration: 0.5,
            }}
          >
            <div 
              className={`px-8 py-4 border-4 shadow-[8px_8px_0px_#000] ${
                matchFound 
                  ? 'bg-red-600 border-yellow-400' 
                  : 'bg-gray-800 border-gray-600'
              }`}
            >
              <h2
                className={`text-3xl uppercase ${matchFound ? 'text-yellow-400' : 'text-white'}`}
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  textShadow: matchFound ? '3px 3px 0px #000, -1px -1px 0px #ff0000' : '2px 2px 0px #000',
                }}
              >
                {matchFound ? 'FIGHT!' : 'SEARCHING...'}
              </h2>
            </div>
          </motion.div>
          
          {matchFound && (
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="inline-block bg-yellow-400 border-2 border-black px-4 py-1">
                <span className="text-black text-sm uppercase font-bold">Opponent Found!</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* VS Battle Card */}
        <SFCard className="p-6 relative overflow-hidden" variant="battle">
          {/* Animated background for found state */}
          {matchFound && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-red-600/50 to-orange-500/50"
              animate={{
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
            />
          )}

          <div className="relative">
            {/* Fighter Display */}
            <div className="grid grid-cols-3 gap-4 items-center mb-6">
              {/* Player 1 */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 border-4 border-blue-400 flex items-center justify-center text-5xl shadow-[4px_4px_0px_#000]">
                  ⚡
                </div>
                <div className="text-center">
                  <div className="bg-blue-600 border-2 border-white px-2 py-1 mb-1">
                    <p className="text-white text-sm uppercase font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                      DragonFist
                    </p>
                  </div>
                  <p className="text-blue-400 text-xs uppercase">P1</p>
                </div>
                
                {/* Health bar */}
                <div className="w-full">
                  <div className="h-3 bg-black border-2 border-white">
                    <div className="h-full bg-gradient-to-r from-green-500 to-yellow-400 w-full" />
                  </div>
                </div>
              </div>

              {/* VS */}
              <div className="flex flex-col items-center">
                <motion.div
                  className="relative"
                  animate={{
                    scale: matchFound ? [1, 1.3, 1] : [1, 1.1, 1],
                    rotate: matchFound ? [0, 5, -5, 0] : 0,
                  }}
                  transition={{
                    duration: matchFound ? 0.5 : 2,
                    repeat: matchFound ? 0 : Infinity,
                  }}
                >
                  <div 
                    className="w-20 h-20 bg-yellow-400 border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_#000]"
                    style={{
                      clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
                    }}
                  >
                    <span 
                      className="text-black text-2xl"
                      style={{
                        fontFamily: "'Orbitron', sans-serif",
                        textShadow: '2px 2px 0px rgba(255,255,255,0.5)',
                      }}
                    >
                      VS
                    </span>
                  </div>
                  
                  {/* Impact burst */}
                  {matchFound && (
                    <motion.div
                      className="absolute -top-4 -right-4 text-4xl"
                      initial={{ scale: 0, rotate: 0 }}
                      animate={{ scale: 1, rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      💥
                    </motion.div>
                  )}
                </motion.div>
              </div>

              {/* Player 2 / Opponent */}
              <div className="flex flex-col items-center gap-3">
                {!matchFound ? (
                  <>
                    {/* Skeleton Loading with Street Fighter style */}
                    <motion.div
                      className="w-24 h-24 bg-gray-800 border-4 border-gray-600 flex items-center justify-center shadow-[4px_4px_0px_#000]"
                      animate={{
                        borderColor: ['#4b5563', '#6b7280', '#4b5563'],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                      }}
                    >
                      <motion.div
                        className="text-gray-600 text-5xl"
                        animate={{
                          opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                        }}
                      >
                        ?
                      </motion.div>
                    </motion.div>
                    
                    <div className="text-center w-full space-y-2">
                      <motion.div
                        className="h-6 bg-gray-700 border-2 border-gray-600 mx-auto"
                        animate={{
                          opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: 0.2,
                        }}
                      />
                      <motion.div
                        className="h-4 w-12 bg-gray-700 border-2 border-gray-600 mx-auto"
                        animate={{
                          opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: 0.4,
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Actual Opponent */}
                    <motion.div
                      className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-700 border-4 border-red-400 flex items-center justify-center text-5xl shadow-[4px_4px_0px_#000]"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.5, type: "spring" }}
                    >
                      {opponentData.avatar}
                    </motion.div>
                    
                    <motion.div
                      className="text-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="bg-red-600 border-2 border-white px-2 py-1 mb-1">
                        <p className="text-white text-sm uppercase font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                          {opponentData.name}
                        </p>
                      </div>
                      <p className="text-red-400 text-xs uppercase flex items-center justify-center gap-1">
                        {opponentData.country} P2
                      </p>
                    </motion.div>
                  </>
                )}
                
                {/* Health bar */}
                <div className="w-full">
                  <div className="h-3 bg-black border-2 border-white">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-green-500 to-yellow-400"
                      initial={{ width: 0 }}
                      animate={{ width: matchFound ? '100%' : '0%' }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Display */}
            {matchFound && (
              <motion.div
                className="grid grid-cols-2 gap-4 p-4 bg-black/80 border-4 border-yellow-400"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="text-center">
                  <p className="text-white text-xs uppercase mb-1">Your Wins</p>
                  <p className="text-yellow-400 text-2xl font-bold">156</p>
                </div>
                <div className="text-center border-l-2 border-yellow-400">
                  <p className="text-white text-xs uppercase mb-1">Their Wins</p>
                  <p className="text-red-400 text-2xl font-bold">{opponentData.wins}</p>
                </div>
              </motion.div>
            )}
          </div>
        </SFCard>

        {/* Status Indicators */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 bg-black/50 border-2 border-green-500 px-4 py-2">
            <motion.div
              className="w-3 h-3 bg-green-500 border-2 border-white"
              animate={{
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
            />
            <span className="text-green-400 text-sm uppercase font-bold">Connection: Excellent</span>
          </div>
          
          <div className="flex items-center gap-3 bg-black/50 border-2 border-yellow-400 px-4 py-2">
            <motion.div
              className="w-3 h-3 bg-yellow-400 border-2 border-white"
              animate={{
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: 0.3,
              }}
            />
            <span className="text-yellow-400 text-sm uppercase font-bold">
              {matchFound ? 'Arena Ready!' : `${Math.floor(Math.random() * 500) + 300} Fighters Online`}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {matchFound ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: "spring" }}
          >
            <SFButton
              variant="primary"
              onClick={() => alert('Fight begins!')}
              className="w-full text-2xl"
              size="lg"
            >
              BEGIN FIGHT!
            </SFButton>
          </motion.div>
        ) : (
          <SFButton
            variant="danger"
            onClick={() => navigate('/sf/menu')}
            className="w-full"
            size="md"
          >
            Cancel Search
          </SFButton>
        )}

        {/* Round indicator (cosmetic) */}
        {matchFound && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, type: "spring" }}
          >
            <div className="inline-flex items-center gap-2 bg-yellow-400 border-4 border-black px-6 py-2 shadow-[4px_4px_0px_#000]">
              <span className="text-black text-xs uppercase font-bold">Round</span>
              <span className="text-black text-2xl font-bold">1</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
