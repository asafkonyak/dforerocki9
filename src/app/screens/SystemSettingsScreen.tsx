import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '../components/GlassCard';
import { Camera, Settings, ChevronLeft, Save, Shield, Cpu, RefreshCw, Zap } from 'lucide-react';
import { useCamera } from '../../contexts/CameraContext';
import { CameraFeed } from '../components/CameraFeed';

export function SystemSettingsScreen() {
  const navigate = useNavigate();
  const { availableCameras, mainCameraId, player2CameraId, setMainCamera, setPlayer2Camera, refreshCameras } = useCamera();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [levelConfigs, setLevelConfigs] = useState(() => {
    const saved = localStorage.getItem('fighter_level_configs');
    if (saved) return JSON.parse(saved);
    return {
      1: { power: 7, xp: 500 },
      2: { power: 10, xp: 750 },
      3: { power: 12.5, xp: 1000 },
      4: { power: 20, xp: 1250 },
      5: { power: 25, xp: 1500 }
    };
  });
  const [autoSaveReplays, setAutoSaveReplays] = useState(() => {
    const saved = localStorage.getItem('fighter_auto_save_replays');
    return saved === null ? true : saved === 'true';
  });

  const handleLevelChange = (level: number, field: 'power' | 'xp', value: string) => {
    const numVal = parseFloat(value) || 0;
    setLevelConfigs((prev: any) => ({
      ...prev,
      [level]: { ...prev[level], [field]: numVal }
    }));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshCameras();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleSave = () => {
    // Save level configs
    localStorage.setItem('fighter_level_configs', JSON.stringify(levelConfigs));
    localStorage.setItem('fighter_auto_save_replays', autoSaveReplays.toString());
    // Already saved to localStorage in the context but navigate back
    navigate('/cyber');
  };

  return (
    <div className="h-screen bg-[#0a0515] relative overflow-hidden flex flex-col">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#00f0ff 1px, transparent 1px), linear-gradient(90deg, #00f0ff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Top Header */}
      <div className="relative z-20 p-8 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/cyber')}
            className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors" />
            <ChevronLeft className="w-6 h-6 relative z-10" />
          </button>
          <div>
            <h1 className="text-3xl font-black italic text-white tracking-widest flex items-center gap-3" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              <Settings className="w-8 h-8 text-[#00f0ff]" />
              SYSTEM CONFIGURATION
            </h1>
            <p className="text-[#00f0ff]/40 text-[10px] font-black tracking-[0.4em] uppercase">Multi-Camera Management Protocol</p>
          </div>
        </div>

        <button 
          onClick={handleRefresh}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-[#00f0ff] hover:border-[#00f0ff]/40 transition-all font-bold text-[10px] tracking-widest uppercase items-center"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Sync Hardware
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-12 scrollbar-none relative z-10">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* MAIN CAMERA SETUP */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-[#00f0ff]" />
                  <h2 className="text-xl font-black italic text-white uppercase tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>Main Camera</h2>
                </div>
                <span className="text-[10px] text-[#00f0ff] font-sans font-bold uppercase tracking-widest bg-[#00f0ff]/10 px-3 py-1 rounded-full border border-[#00f0ff]/20 shadow-[0_0_10px_rgba(0,240,255,0.2)]">Primary Node</span>
              </div>

              <GlassCard className="p-4 border-2 border-[#00f0ff]/30 bg-black/60 shadow-[0_0_40px_rgba(0,240,255,0.1)]">
                <div className="aspect-video rounded-xl overflow-hidden border border-white/10 bg-black mb-6 relative group">
                  <CameraFeed deviceId={mainCameraId || undefined} transparent={true} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
                    <span className="text-white text-[9px] font-black uppercase tracking-[0.2em]">LIVE FEED 01</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] text-white/30 font-black tracking-widest uppercase block mb-1">Assign Input Device</label>
                  <div className="grid grid-cols-1 gap-2">
                    {availableCameras.map((device) => (
                      <button
                        key={device.deviceId}
                        onClick={() => setMainCamera(device.deviceId)}
                        className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${
                          mainCameraId === device.deviceId 
                          ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-white' 
                          : 'border-white/10 bg-white/5 text-white/40 hover:border-white/30 hover:bg-white/10'
                        }`}
                      >
                        {mainCameraId === device.deviceId && (
                          <motion.div 
                            layoutId="main-active"
                            className="absolute inset-0 border-2 border-[#00f0ff] z-10" 
                          />
                        )}
                        <div className="flex items-center justify-between relative z-20">
                          <div className="flex items-center gap-3">
                            <Camera className={`w-5 h-5 ${mainCameraId === device.deviceId ? 'text-[#00f0ff]' : 'text-white/20'}`} />
                            <span className="text-xs font-bold uppercase tracking-wider">{device.label || `USB Camera ${device.deviceId.slice(0, 4)}`}</span>
                          </div>
                          {mainCameraId === device.deviceId && <div className="w-2 h-2 rounded-full bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* PLAYER 2 CAMERA SETUP */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-[#ff006e]" />
                  <h2 className="text-xl font-black italic text-white uppercase tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>Player 2 Camera</h2>
                </div>
                <span className="text-[10px] text-[#ff006e] font-sans font-bold uppercase tracking-widest bg-[#ff006e]/10 px-3 py-1 rounded-full border border-[#ff006e]/20 shadow-[0_0_10px_rgba(255,0,110,0.2)]">Secondary Node</span>
              </div>

              <GlassCard className="p-4 border-2 border-[#ff006e]/30 bg-black/60 shadow-[0_0_40px_rgba(255,0,110,0.1)]">
                <div className="aspect-video rounded-xl overflow-hidden border border-white/10 bg-black mb-6 relative group">
                  <CameraFeed deviceId={player2CameraId || undefined} transparent={true} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#ff006e] animate-pulse" />
                    <span className="text-white text-[9px] font-black uppercase tracking-[0.2em]">LIVE FEED 02</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] text-white/30 font-black tracking-widest uppercase block mb-1">Assign Input Device</label>
                  <div className="grid grid-cols-1 gap-2">
                    {availableCameras.map((device) => (
                      <button
                        key={device.deviceId}
                        onClick={() => setPlayer2Camera(device.deviceId)}
                        className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${
                          player2CameraId === device.deviceId 
                          ? 'border-[#ff006e] bg-[#ff006e]/10 text-white' 
                          : 'border-white/10 bg-white/5 text-white/40 hover:border-white/30 hover:bg-white/10'
                        }`}
                      >
                        {player2CameraId === device.deviceId && (
                          <motion.div 
                            layoutId="p2-active"
                            className="absolute inset-0 border-2 border-[#ff006e] z-10" 
                          />
                        )}
                        <div className="flex items-center justify-between relative z-20">
                          <div className="flex items-center gap-3">
                            <Camera className={`w-5 h-5 ${player2CameraId === device.deviceId ? 'text-[#ff006e]' : 'text-white/20'}`} />
                            <span className="text-xs font-bold uppercase tracking-wider">{device.label || `USB Camera ${device.deviceId.slice(0, 4)}`}</span>
                          </div>
                          {player2CameraId === device.deviceId && <div className="w-2 h-2 rounded-full bg-[#ff006e] shadow-[0_0_10px_#ff006e]" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* PRACTICE CALIBRATION SETUP */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 px-2">
              <Zap className="w-6 h-6 text-[#ffff00]" />
              <h2 className="text-2xl font-black italic text-white uppercase tracking-widest" style={{ fontFamily: "'Orbitron', sans-serif" }}>Practice Node Calibration</h2>
            </div>

            <GlassCard className="p-8 border-2 border-[#ffff00]/20 bg-black/60 shadow-[0_0_50px_rgba(255,255,0,0.05)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <div key={lvl} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#ffff00] tracking-widest uppercase">Level {lvl}</span>
                    </div>
                    
                    <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10 group hover:border-[#ffff00]/30 transition-all">
                      <div>
                        <label className="text-[8px] text-white/30 font-black tracking-widest uppercase block mb-1.5">Resistance (KG)</label>
                        <input 
                          type="number" 
                          step="0.5"
                          value={levelConfigs[lvl as keyof typeof levelConfigs]?.power || ''}
                          onChange={(e) => handleLevelChange(lvl, 'power', e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-[#ffff00]/50 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] text-white/30 font-black tracking-widest uppercase block mb-1.5">Base Reward (XP)</label>
                        <input 
                          type="number" 
                          value={levelConfigs[lvl as keyof typeof levelConfigs]?.xp || ''}
                          onChange={(e) => handleLevelChange(lvl, 'xp', e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-[#ffff00]/50 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
 
          {/* GAME FEATURE TOGGLES */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 px-2">
              <RefreshCw className="w-6 h-6 text-[#00f0ff]" />
              <h2 className="text-2xl font-black italic text-white uppercase tracking-widest" style={{ fontFamily: "'Orbitron', sans-serif" }}>Feature Configuration</h2>
            </div>
 
            <GlassCard className="p-8 border-2 border-[#00f0ff]/20 bg-black/60 shadow-[0_0_50px_rgba(0,240,255,0.05)]">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white italic tracking-wider uppercase">Auto-save Replays</h3>
                  <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Automatically download match replays to local storage</p>
                </div>
                
                <button 
                  onClick={() => setAutoSaveReplays(!autoSaveReplays)}
                  className={`w-16 h-8 rounded-full relative transition-all duration-300 ${autoSaveReplays ? 'bg-[#00f0ff]' : 'bg-white/10'}`}
                >
                  <motion.div 
                    className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg"
                    animate={{ x: autoSaveReplays ? 32 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </GlassCard>
          </motion.div>


          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center pt-8"
          >
            <button
              onClick={handleSave}
              className="px-12 py-5 bg-[#00f0ff] text-black font-black text-xl italic tracking-tighter rounded-2xl shadow-[0_0_40px_rgba(0,240,255,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              SAVE CONFIGURATION
              <Save className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            </button>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
