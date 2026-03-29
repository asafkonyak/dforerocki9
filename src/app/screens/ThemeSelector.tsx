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
      {/* Animated Cyberpunk Background Blobs */}

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
        {/* Quick Config Button */}
        <div className="absolute -top-20 -right-4 md:-right-20">
          <motion.button
            onClick={() => navigate('/settings')}
            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#fbff00] hover:bg-white/10 transition-all group relative"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
            <div className="absolute inset-0 bg-[#fbff00]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
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

          <motion.button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 px-8 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-[#fbff00]/20 hover:border-[#fbff00]/40 transition-all group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings className="w-5 h-5 text-[#fbff00] group-hover:rotate-90 transition-transform duration-500" />
            <span className="text-white/40 text-xs font-black uppercase tracking-widest group-hover:text-white transition-colors">System Configuration</span>
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}