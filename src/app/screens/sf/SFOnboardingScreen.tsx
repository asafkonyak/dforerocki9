import { useState } from 'react';
import { useNavigate } from 'react-router';
import { SFButton } from '../../components/SFButton';
import { SFCard } from '../../components/SFCard';
import { motion } from 'motion/react';

const FIGHTERS = [
  { 
    id: 1, 
    name: 'LIGHTNING', 
    emoji: '⚡', 
    style: 'Speed',
    color: '#FFD700',
    bgColor: 'from-yellow-500 to-orange-500'
  },
  { 
    id: 2, 
    name: 'INFERNO', 
    emoji: '🔥', 
    style: 'Power',
    color: '#FF4500',
    bgColor: 'from-red-500 to-red-700'
  },
  { 
    id: 3, 
    name: 'SHADOW', 
    emoji: '🥷', 
    style: 'Stealth',
    color: '#9333EA',
    bgColor: 'from-purple-600 to-indigo-700'
  },
];

const FIGHT_NAMES = ['DragonFist', 'TigerClaw', 'PhoenixKick'];

export function SFOnboardingScreen() {
  const navigate = useNavigate();
  const [selectedFighter, setSelectedFighter] = useState(1);
  const [selectedName, setSelectedName] = useState(0);

  const handleStart = () => {
    navigate('/sf/menu');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-red-900 to-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Diagonal stripes background */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 40px)',
        }}
      />

      <motion.div
        className="max-w-md w-full space-y-6 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header with comic style */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="inline-block"
          >
            <div 
              className="bg-yellow-400 border-4 border-black px-8 py-4 shadow-[6px_6px_0px_#000] mb-4"
              style={{
                clipPath: 'polygon(5% 0%, 95% 0%, 100% 25%, 100% 100%, 95% 100%, 5% 100%, 0% 75%, 0% 25%)',
              }}
            >
              <h2 
                className="text-3xl text-black"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  textShadow: '2px 2px 0px rgba(255,255,255,0.5)',
                }}
              >
                SELECT FIGHTER
              </h2>
            </div>
          </motion.div>
          <p className="text-yellow-400 text-sm uppercase tracking-wider">Choose your warrior</p>
        </div>

        {/* Fighter Selection - Character Select Style */}
        <SFCard className="p-6" variant="character">
          <h3 className="text-yellow-400 text-lg mb-4 text-center uppercase tracking-wider border-b-4 border-yellow-400 pb-2">
            FIGHTER SELECT
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {FIGHTERS.map((fighter) => {
              const isSelected = selectedFighter === fighter.id;
              
              return (
                <motion.button
                  key={fighter.id}
                  onClick={() => setSelectedFighter(fighter.id)}
                  className={`
                    relative p-3 transition-all duration-200
                    ${isSelected
                      ? 'border-4 border-yellow-400 shadow-[4px_4px_0px_#000] scale-110'
                      : 'border-4 border-gray-600 hover:border-white'
                    }
                  `}
                  style={{
                    background: isSelected 
                      ? `linear-gradient(to bottom right, ${fighter.color}40, #000)` 
                      : '#1a1a1a'
                  }}
                  whileHover={{ scale: isSelected ? 1.1 : 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Character portrait */}
                  <div className={`text-4xl mb-2 ${isSelected ? 'animate-pulse' : ''}`}>
                    {fighter.emoji}
                  </div>
                  
                  {/* Name plate */}
                  <div className={`text-xs uppercase tracking-tight ${isSelected ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {fighter.name}
                  </div>
                  
                  {/* Style indicator */}
                  <div className="text-[10px] text-white/60 mt-1">
                    {fighter.style}
                  </div>

                  {/* Selected indicator */}
                  {isSelected && (
                    <motion.div
                      className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 border-2 border-black flex items-center justify-center"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring" }}
                    >
                      <span className="text-black text-sm">✓</span>
                    </motion.div>
                  )}

                  {/* Health bar aesthetic */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-green-500 to-yellow-400"
                      initial={{ width: 0 }}
                      animate={{ width: isSelected ? '100%' : '70%' }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Fighter stats */}
          <div className="mt-4 p-3 bg-black/50 border-2 border-yellow-400/50">
            <div className="text-yellow-400 text-xs uppercase mb-2">Fighter Stats</div>
            <div className="space-y-1">
              {['Power', 'Speed', 'Defense'].map((stat, i) => (
                <div key={stat} className="flex items-center gap-2">
                  <span className="text-white/60 text-xs w-16">{stat}</span>
                  <div className="flex-1 h-2 bg-gray-800 border border-gray-600">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-red-500 to-yellow-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${60 + i * 15}%` }}
                      transition={{ delay: i * 0.1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SFCard>

        {/* Name Selection */}
        <SFCard className="p-6">
          <h3 className="text-red-400 text-lg mb-4 text-center uppercase tracking-wider border-b-4 border-red-400 pb-2">
            FIGHTER NAME
          </h3>
          <div className="space-y-2">
            {FIGHT_NAMES.map((name, index) => (
              <motion.button
                key={name}
                onClick={() => setSelectedName(index)}
                className={`
                  w-full p-3 transition-all duration-200
                  flex items-center justify-center gap-3
                  ${selectedName === index
                    ? 'bg-red-600 border-4 border-yellow-400 shadow-[4px_4px_0px_#000]'
                    : 'bg-gray-800 border-4 border-gray-600 hover:border-white'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {selectedName === index && (
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                )}
                <span 
                  className={`text-lg uppercase tracking-wider ${selectedName === index ? 'text-yellow-400' : 'text-white'}`}
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  {name}
                </span>
              </motion.button>
            ))}
          </div>
        </SFCard>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
        >
          <SFButton
            variant="primary"
            onClick={handleStart}
            className="w-full"
            size="lg"
          >
            READY TO FIGHT!
          </SFButton>
        </motion.div>
      </motion.div>
    </div>
  );
}
