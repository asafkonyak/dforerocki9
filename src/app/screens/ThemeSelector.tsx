import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useGlobalAudio } from '../../contexts/AudioContext';
import { useSettings } from '../../contexts/SettingsContext';
import { NeonButton } from '../components/NeonButton';
import { useEffect, useState, useRef } from 'react';
import { Settings, X, Video, VideoOff, Camera, Download, AlertCircle, Copy, Check } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
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

  // Video Test & Recording State
  const [isVideoTestEnabled, setIsVideoTestEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sharingLink, setSharingLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [videoTestError, setVideoTestError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const playbackVideoRef = useRef<HTMLVideoElement>(null);

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

  const startRecording = async () => {
    setVideoTestError(null);
    recordedChunksRef.current = [];

    const getStream = async () => {
      // 1. Try Vertical (9:16) WITHOUT Audio (User Priority)
      try {
        console.log('[Camera] Attempting vertical (9:16) WITHOUT audio...');
        return await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1080 },
            height: { ideal: 1920 },
            aspectRatio: { ideal: 9/16 },
            frameRate: { ideal: 30 }
          },
          audio: false
        });
      } catch (err) {
        console.warn('[Camera] Vertical WITHOUT audio failed, trying vertical WITH audio...', err);
      }

      // 2. Try Vertical (9:16) WITH Audio
      try {
        console.log('[Camera] Attempting vertical (9:16) WITH audio...');
        return await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1080 },
            height: { ideal: 1920 },
            aspectRatio: { ideal: 9/16 }
          },
          audio: true
        });
      } catch (err) {
        console.warn('[Camera] Vertical WITH audio failed, trying basic video...', err);
      }

      // 3. Try Basic Video only
      try {
        console.log('[Camera] Attempting basic video constraints...');
        return await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (err) {
        console.error('[Camera] All constraints failed:', err);
        throw err;
      }
    };

    try {
      const stream = await getStream();
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        
        // 1. Local Download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.href = url;
        a.download = `rehearsal_${timestamp}.webm`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // 2. Upload to Port 8088 API
        setIsUploading(true);
        try {
          const formData = new FormData();
          formData.append('video', blob, `rehearsal_${timestamp}.webm`);
          formData.append('upload_to_supabase', 'true');
          
          const response = await fetch('http://localhost:8088/process-video', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) throw new Error('Upload failed');
          
          const data = await response.json();
          // The API returns the sharing link or ID
          setSharingLink(typeof data === 'string' ? data : data.url || data.id);
          
          // Set playback source to the recorded blob for local preview
          if (playbackVideoRef.current) {
            playbackVideoRef.current.src = url;
          }
        } catch (uploadErr: any) {
          console.error('Upload Error:', uploadErr);
          setVideoTestError('Failed to upload video for processing');
        } finally {
          setIsUploading(false);
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Recording error:', err);
      setVideoTestError(err.message || 'Failed to access camera');
    }
  };

  const stopAndSave = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
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
                <DialogDescription className="text-white/40 uppercase text-[10px] tracking-widest">
                  Configure your arena experience and peripheral connections.
                </DialogDescription>
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

                {/* Video Test Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold tracking-widest text-white/80 uppercase">Video Test</Label>
                    <p className="text-[10px] text-white/40 uppercase">Test vertical recording (9:16)</p>
                  </div>
                  <Switch 
                    checked={isVideoTestEnabled} 
                    onCheckedChange={(checked) => {
                      setIsVideoTestEnabled(checked);
                      if (!checked && isRecording) stopAndSave();
                    }}
                    className="data-[state=checked]:bg-[#fbff00]"
                  />
                </div>

                {/* Video Test Section */}
                <AnimatePresence>
                  {isVideoTestEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pt-2"
                    >
                      <div className="flex gap-4 items-start justify-center">
                        {/* Recording Preview */}
                        <div className="relative w-full max-w-[160px] aspect-[9/16] rounded-xl overflow-hidden bg-black/40 border-2 border-dashed border-white/10 flex flex-col items-center justify-center">
                          <video 
                            ref={videoPreviewRef} 
                            autoPlay 
                            muted 
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          {!isRecording && !videoTestError && (
                            <Camera className="w-8 h-8 text-white/20 mb-2 relative z-10" />
                          )}
                          {videoTestError && (
                            <div className="p-4 text-center relative z-10">
                              <AlertCircle className="w-6 h-6 text-[#ff006e] mx-auto mb-2" />
                              <p className="text-[8px] text-white/60 uppercase">{videoTestError}</p>
                            </div>
                          )}
                          {isRecording && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                              <motion.div 
                                className="w-1.5 h-1.5 rounded-full bg-red-600"
                                animate={{ opacity: [1, 0.4, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                              />
                              <span className="text-[6px] font-bold text-white uppercase tracking-tighter">REC</span>
                            </div>
                          )}
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[6px] text-white/40 uppercase tracking-widest font-bold">Live Preview</div>
                        </div>

                        {/* Player Back (Playback) */}
                        <div className="relative w-full max-w-[160px] aspect-[9/16] rounded-xl overflow-hidden bg-black/60 border-2 border-white/10 flex flex-col items-center justify-center">
                          <video 
                            ref={playbackVideoRef} 
                            controls
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          {!sharingLink && !isUploading && (
                            <div className="text-center p-4">
                              <Video className="w-8 h-8 text-white/10 mx-auto mb-2" />
                              <span className="text-[6px] text-white/20 uppercase font-black italic">Player Back</span>
                            </div>
                          )}
                          {isUploading && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 z-10">
                              <div className="w-6 h-6 border-2 border-[#00f0ff]/30 border-t-[#00f0ff] rounded-full animate-spin" />
                              <span className="text-[6px] text-[#00f0ff] font-bold uppercase tracking-widest">Processing...</span>
                            </div>
                          )}
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[6px] text-white/40 uppercase tracking-widest font-bold">Replay</div>
                        </div>
                      </div>

                      {sharingLink && (
                        <motion.div 
                          className="p-4 bg-white/5 border border-white/10 rounded-lg flex flex-col items-center gap-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className="text-[10px] text-[#00f0ff] font-bold uppercase tracking-widest text-center">Scan to Share Reel</div>
                          
                          {/* QR Code Display */}
                          <div className="p-2 bg-white rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                            <QRCode 
                              value={sharingLink} 
                              size={120}
                              level="H"
                              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            />
                          </div>

                          <div className="w-full space-y-2">
                            <div className="text-[8px] text-white/40 uppercase tracking-widest font-bold px-1">Shareable Link</div>
                            <div className="flex items-center gap-2 bg-black/40 p-2 rounded border border-white/5 overflow-hidden">
                              <div className="text-[10px] text-white/80 font-mono truncate flex-1">{sharingLink}</div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-[#00f0ff] hover:bg-[#00f0ff]/10"
                                onClick={() => {
                                  navigator.clipboard.writeText(sharingLink);
                                  setIsCopied(true);
                                  setTimeout(() => setIsCopied(false), 2000);
                                }}
                              >
                                {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={startRecording}
                          disabled={isRecording || isUploading}
                          className="bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/50 hover:bg-[#00f0ff]/30 py-6 uppercase font-black italic text-xs tracking-widest"
                          style={{ fontFamily: "'Orbitron', sans-serif" }}
                        >
                          <Camera className="w-4 h-4 mr-2" /> Start
                        </Button>
                        <Button
                          onClick={stopAndSave}
                          disabled={!isRecording || isUploading}
                          className="bg-[#fbff00]/20 text-[#fbff00] border border-[#fbff00]/50 hover:bg-[#fbff00]/30 py-6 uppercase font-black italic text-xs tracking-widest"
                          style={{ fontFamily: "'Orbitron', sans-serif" }}
                        >
                          {isUploading ? (
                             <div className="flex items-center gap-2">
                               <div className="w-3 h-3 border-2 border-[#fbff00]/30 border-t-[#fbff00] rounded-full animate-spin" />
                               <span>Uploading</span>
                             </div>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" /> Save & Share
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

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