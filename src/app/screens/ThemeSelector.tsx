import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useGlobalAudio } from '../../contexts/AudioContext';
import { useSettings } from '../../contexts/SettingsContext';
import { NeonButton } from '../components/NeonButton';
import { useEffect, useState, useRef } from 'react';
import { Settings, X, Video, VideoOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import Peer from 'simple-peer';
import { io } from 'socket.io-client';

export function ThemeSelector() {
  const navigate = useNavigate();
  const { startIntroMusic } = useGlobalAudio();
  const { 
    isSimulationEnabled, 
    setSimulationEnabled, 
    isWebRTCEnabled, 
    setWebRTCEnabled,
    testWebRTC 
  } = useSettings();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTestingWebRTC, setIsTestingWebRTC] = useState(false);
  const [testStream, setTestStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const otherVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<any>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    // Attempt to start music on mount (may be blocked by autoplay)
    startIntroMusic();
  }, [startIntroMusic]);

  const handleStart = () => {
    startIntroMusic();
    navigate('/cyber');
  };

  const startWebRTCTest = async () => {
    setIsTestingWebRTC(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setTestStream(stream);
      if (myVideoRef.current) myVideoRef.current.srcObject = stream;

      // Connect to signaling server for test
      const socket = io('http://localhost:9000'); 
      socketRef.current = socket;

      const createPeer = (initiator: boolean, stream: MediaStream, incomingSignal: any = null) => {
        const peer = new Peer({ initiator, trickle: false, stream });

        peer.on('signal', data => {
          socket.emit('signal', data);
        });

        peer.on('stream', remoteStream => {
          setRemoteStream(remoteStream);
          if (otherVideoRef.current) otherVideoRef.current.srcObject = remoteStream;
        });

        if (incomingSignal) {
          peer.signal(incomingSignal);
        }

        peerRef.current = peer;
      };

      socket.on('signal', (data) => {
        if (peerRef.current) {
          peerRef.current.signal(data);
        } else {
          createPeer(false, stream, data);
        }
      });

      // For testing, we can trigger the initiator if we are the first one
      socket.on('connect', () => {
        console.log('[WebRTC Test] Connected to signaling server');
        // In a real test, you'd wait for another peer, but for demo we can start
        // createPeer(true, stream);
      });

    } catch (err) {
      console.error('Failed to start WebRTC test:', err);
      setIsTestingWebRTC(false);
    }
  };

  const stopWebRTCTest = () => {
    if (testStream) {
      testStream.getTracks().forEach(track => track.stop());
      setTestStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsTestingWebRTC(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0515] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Video Background (Base Layer) */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/assets/intro.mp4" type="video/mp4" />
      </video>

      {/* Dark Overlay (Darkening the video) */}
      <div className="absolute inset-0 bg-black/60 z-[5] pointer-events-none" />

      {/* Animated Cyberpunk Blobs (Overlaying Video and Dark Layer) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        <motion.div
          className="absolute w-[500px] h-[500px] bg-[#00f0ff] rounded-full blur-[140px] opacity-30"
          animate={{
            x: [-100, 100, -100],
            y: [-50, 50, -50],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-[600px] h-[600px] bg-[#ff006e] rounded-full blur-[140px] opacity-30"
          animate={{
            x: [100, -100, 100],
            y: [50, -50, 50],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ bottom: '10%', right: '10%' }}
        />
      </div>

      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none z-20"
        style={{
          backgroundImage: `
          linear-gradient(#00f0ff 1px, transparent 1px),
          linear-gradient(90deg, #00f0ff 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      <motion.div
        className="relative z-30 flex flex-col items-center gap-12 w-full max-w-4xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Settings Button */}
        <div className="absolute -top-20 -right-4 md:-right-20">
          <Dialog open={isSettingsOpen} onOpenChange={(open) => {
            setIsSettingsOpen(open);
            if (!open) stopWebRTCTest();
          }}>
            <DialogTrigger asChild>
              <button className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#00f0ff] hover:bg-white/10 transition-all group relative">
                <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                <div className="absolute inset-0 bg-[#00f0ff]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a0515]/95 backdrop-blur-2xl border-white/10 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic tracking-wider text-[#00f0ff]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  SYSTEM SETTINGS
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Simulation Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold tracking-widest text-white/80 uppercase">Simulation Mode</Label>
                    <p className="text-[10px] text-white/40 uppercase">Enable auto-play and bot fighters</p>
                  </div>
                  <Switch 
                    checked={isSimulationEnabled} 
                    onCheckedChange={setSimulationEnabled}
                    className="data-[state=checked]:bg-[#00f0ff]"
                  />
                </div>

                {/* WebRTC Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold tracking-widest text-white/80 uppercase">WebRTC Connection</Label>
                    <p className="text-[10px] text-white/40 uppercase">Enable peer-to-peer video calls</p>
                  </div>
                  <Switch 
                    checked={isWebRTCEnabled} 
                    onCheckedChange={setWebRTCEnabled}
                    className="data-[state=checked]:bg-[#ff006e]"
                  />
                </div>

                {/* WebRTC Test Section */}
                <AnimatePresence>
                  {isWebRTCEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <Button
                        onClick={isTestingWebRTC ? stopWebRTCTest : startWebRTCTest}
                        className={`w-full py-6 font-bold tracking-widest uppercase transition-all ${
                          isTestingWebRTC 
                            ? 'bg-[#ff006e]/20 text-[#ff006e] border border-[#ff006e]/50 hover:bg-[#ff006e]/30' 
                            : 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/50 hover:bg-[#00f0ff]/30'
                        }`}
                        style={{ fontFamily: "'Orbitron', sans-serif" }}
                      >
                        {isTestingWebRTC ? (
                          <>
                            <VideoOff className="w-4 h-4 mr-2" /> Stop Test
                          </>
                        ) : (
                          <>
                            <Video className="w-4 h-4 mr-2" /> Test WebRTC
                          </>
                        )}
                      </Button>

                      {isTestingWebRTC && (
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-black/40 border border-white/10">
                          {/* Remote Video (Full) */}
                          <video 
                            ref={otherVideoRef} 
                            autoPlay 
                            playsInline
                            className="w-full h-full object-cover"
                          />
                          {!remoteStream && (
                            <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
                              <div className="w-8 h-8 border-2 border-[#00f0ff]/30 border-t-[#00f0ff] rounded-full animate-spin" />
                              <span className="text-[10px] text-white/40 uppercase tracking-widest">Waiting for peer...</span>
                            </div>
                          )}

                          {/* Local Video (Floating) */}
                          <div className="absolute bottom-3 right-3 w-32 aspect-video rounded-lg overflow-hidden border border-white/20 shadow-2xl z-10">
                            <video 
                              ref={myVideoRef} 
                              autoPlay 
                              muted 
                              playsInline
                              className="w-full h-full object-cover bg-black"
                            />
                          </div>
                          
                          <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[8px] text-[#00f0ff] font-bold uppercase tracking-widest border border-[#00f0ff]/30">
                            Live Test Feed
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Text-based Logo Layout */}
        <div className="text-center">
          <motion.h1 
            className="text-8xl md:text-9xl font-black italic text-white tracking-tighter"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            D-FORCE
          </motion.h1>
          <motion.div
            className="h-1 bg-gradient-to-r from-transparent via-[#ff006e] to-transparent w-full mt-4"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          />
          <motion.p 
            className="text-white/60 text-sm uppercase tracking-[0.4em] font-medium mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            POWER BEYOND BORDERS
          </motion.p>
        </div>

        {/* CTA Section */}
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <NeonButton
            variant="outline"
            color="pink"
            onClick={handleStart}
            size="lg"
            className="px-16 py-6 text-2xl"
          >
            ENTER ARENA
          </NeonButton>
        </motion.div>
      </motion.div>
    </div>
  );
}