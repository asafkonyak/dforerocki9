import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Scan, Lock, Mail, ArrowLeft } from 'lucide-react';
import QRCode from 'react-qr-code';
import { supabase } from '../../lib/supabase';

export function LoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRegister, setIsRegister] = useState(true);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = window.setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    } else {
      if (timerRef.current) window.clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [cooldown]);

  const handleRateLimit = (message: string) => {
    if (message.toLowerCase().includes('rate limit exceeded')) {
      setError("Too many requests. Cyber-security active. Please wait 60 seconds.");
      setCooldown(60);
      return true;
    }
    return false;
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const { error: authError } = isRegister 
      ? await supabase.auth.signUp({
          email,
          password,
        })
      : await supabase.auth.signInWithPassword({
          email,
          password,
        });

    if (authError) {
      if (!handleRateLimit(authError.message)) {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    if (isRegister) {
      setSuccessMessage("Account created! Check your email for verification.");
      setTimeout(() => {
        navigate('/login-transition');
      }, 2000);
      setLoading(false);
    } else {
      navigate('/login-transition');
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setSuccessMessage(null);

    if (!email) {
      setError("Please enter your email to reset password.");
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);

    if (resetError) {
      if (!handleRateLimit(resetError.message)) {
        setError(resetError.message);
      }
    } else {
      setSuccessMessage("Password reset link sent to your email.");
      setCooldown(60);
    }
    setLoading(false);
  };

  const handleQRLogin = () => {
    navigate('/login-transition');
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#0a0515] via-[#1a0a2e] to-[#0a0515] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/assets/registration.mp4" type="video/mp4" />
        </video>
        {/* Dark Overlay for Readability */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      {/* Animated background elements - Keeping legacy glows but reduced opacity */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-1">
        <motion.div
          className="absolute w-96 h-96 bg-[#00f0ff] rounded-full blur-[150px] opacity-20"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            type: 'tween',
          }}
          style={{ top: '10%', left: '20%' }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-[#ff006e] rounded-full blur-[150px] opacity-20"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            type: 'tween',
          }}
          style={{ bottom: '10%', right: '20%' }}
        />
      </div>
      
      {/* Back Button */}
      <motion.button
        onClick={() => navigate(-1)}
        className="absolute top-8 left-8 z-50 flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-[#00f0ff]/30 transition-all text-white/60 text-sm uppercase tracking-wider"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft className="w-5 h-5 text-[#00f0ff]" />
        <span>Back</span>
      </motion.button>

      {/* Header */}
      <motion.div
        className="relative z-10 mb-8"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 
          className="text-6xl tracking-wider text-white"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          D-FORCE
        </h1>
        <motion.div 
          className="h-[2px] bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent mt-2"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        />
      </motion.div>

      {/* Main Login Container */}
      <motion.div
        className="relative z-10 w-full max-w-6xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <div 
          className="rounded-3xl border border-[#00f0ff]/30 overflow-hidden"
          style={{
            background: 'rgba(26, 10, 46, 0.4)',
            backdropFilter: 'blur(40px)',
            boxShadow: '0 0 60px rgba(0, 240, 255, 0.2)',
          }}
        >
          <div className="grid grid-cols-2 divide-x divide-[#00f0ff]/20">
            {/* Left Column - Manual Login */}
            <motion.div 
              className="p-12 flex flex-col justify-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 
                  className="text-2xl text-[#00f0ff] uppercase tracking-wider"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  {isRegister ? 'Register' : 'Login'}
                </h2>

                {/* Mode Toggle */}
                <div className="flex bg-black/40 p-1 rounded-xl border border-[#00f0ff]/30">
                  <button
                    onClick={() => setIsRegister(true)}
                    className={`px-4 py-1.5 rounded-lg text-xs uppercase tracking-widest transition-all ${isRegister ? 'bg-[#00f0ff] text-black shadow-[0_0_10px_#00f0ff]' : 'text-[#00f0ff]/60'}`}
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    Register
                  </button>
                  <button
                    onClick={() => setIsRegister(false)}
                    className={`px-4 py-1.5 rounded-lg text-xs uppercase tracking-widest transition-all ${!isRegister ? 'bg-[#ff006e] text-black shadow-[0_0_10px_#ff006e]' : 'text-[#ff006e]/60'}`}
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    Login
                  </button>
                </div>
              </div>

              <form onSubmit={handleManualLogin} className="space-y-6">
                {(error || successMessage) && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg border text-sm ${
                      error 
                        ? 'bg-red-500/10 border-red-500/50 text-red-500' 
                        : 'bg-green-500/10 border-green-500/50 text-green-500'
                    }`}
                  >
                    {error || successMessage}
                  </motion.div>
                )}
                {/* Email Input */}
                <div className="space-y-2">
                  <label 
                    className="text-sm text-white/60 uppercase tracking-widest flex items-center gap-2"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    <Mail className="w-4 h-4" />
                    Email / Cyber-ID
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      required
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-black/40 border border-[#00f0ff]/30 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#00f0ff] focus:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all"
                      placeholder="user@dforce.fit"
                      style={{ fontFamily: 'Rajdhani, sans-serif' }}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label 
                    className="text-sm text-white/60 uppercase tracking-widest flex items-center gap-2"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    <Lock className="w-4 h-4" />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      required
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-4 py-3 bg-black/40 border border-[#00f0ff]/30 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#00f0ff] focus:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all`}
                      placeholder="••••••••••"
                      style={{ fontFamily: 'Rajdhani, sans-serif' }}
                    />
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading || cooldown > 0}
                  className={`w-full px-8 py-4 ${loading || cooldown > 0 ? 'opacity-50 cursor-not-allowed' : ''} bg-[#00f0ff] text-black rounded-xl uppercase tracking-wider shadow-[0_0_30px_#00f0ff] hover:shadow-[0_0_50px_#00f0ff] transition-all duration-300 flex items-center justify-center gap-2`}
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-black border-t-transparent rounded-full"
                      />
                      Processing...
                    </>
                  ) : cooldown > 0 ? (
                    `COOLDOWN: ${cooldown}s`
                  ) : (
                    isRegister ? 'Create Identity' : 'Access Mainframe'
                  )}
                </button>

                {/* Forgot Password Removed */}
              </form>
            </motion.div>

            {/* Center Divider with OR */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <motion.div
                className="relative"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.6 }}
              >
                <div className="w-20 h-20 rounded-full border-2 border-[#ff006e] flex items-center justify-center"
                  style={{
                    background: 'rgba(26, 10, 46, 0.8)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 0 30px rgba(255, 0, 110, 0.5)',
                  }}
                >
                  <p 
                    className="text-2xl text-[#ff006e]"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    OR
                  </p>
                </div>
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-[#ff006e]"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeOut',
                    type: 'tween',
                  }}
                />
              </motion.div>
            </div>

            {/* Right Column - QR Login */}
            <motion.div 
              className="p-12 flex flex-col justify-center items-center"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <h2 
                className="text-2xl text-[#ff006e] mb-8 uppercase tracking-wider h-8"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                {/* Text Removed */}
              </h2>

              {/* QR Container (Not clickable) */}
              <div
                className="group relative w-full max-w-md aspect-square rounded-3xl border-2 border-[#ff006e]/50 transition-all duration-300 overflow-hidden"
                style={{
                  background: 'rgba(255, 0, 110, 0.05)',
                  boxShadow: '0 0 40px rgba(255, 0, 110, 0.2)',
                }}
              >
                {/* Animated scan line */}
                <motion.div
                  className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#ff006e] to-transparent"
                  animate={{
                    top: ['0%', '100%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                    type: 'tween',
                  }}
                  style={{
                    boxShadow: '0 0 20px rgba(255, 0, 110, 0.8)',
                  }}
                />

                {/* QR Viewfinder corners */}
                <div className="absolute top-8 left-8 w-16 h-16 border-t-4 border-l-4 border-[#ff006e]" />
                <div className="absolute top-8 right-8 w-16 h-16 border-t-4 border-r-4 border-[#ff006e]" />
                <div className="absolute bottom-8 left-8 w-16 h-16 border-b-4 border-l-4 border-[#ff006e]" />
                <div className="absolute bottom-8 right-8 w-16 h-16 border-b-4 border-r-4 border-[#ff006e]" />

                {/* Center QR Code */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full p-8">
                  <motion.div
                    className="p-4 bg-white rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.3)] mb-4"
                    animate={{
                      scale: [1, 1.02, 1],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <QRCode 
                      value="https://dforce.fit" 
                      size={200}
                      fgColor="#000000"
                      bgColor="#FFFFFF"
                      level="H"
                    />
                  </motion.div>
                  <p 
                    className="text-xl text-[#ff006e] uppercase tracking-wider h-8"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    {/* Text Removed */}
                  </p>
                  <p 
                    className="text-sm text-white/60 mt-2 uppercase tracking-widest text-center"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    Scan to visit dforce.fit
                  </p>
                </div>

                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#ff006e]/10 to-transparent transition-opacity duration-300" />
              </div>

              {/* Text Removed */}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Footer Removed */}

      {/* Corner accents */}
      <div className="absolute top-8 left-8 w-24 h-24 border-t-2 border-l-2 border-[#00f0ff]/30" />
      <div className="absolute top-8 right-8 w-24 h-24 border-t-2 border-r-2 border-[#ff006e]/30" />
      <div className="absolute bottom-8 left-8 w-24 h-24 border-b-2 border-l-2 border-[#ff006e]/30" />
      <div className="absolute bottom-8 right-8 w-24 h-24 border-b-2 border-r-2 border-[#00f0ff]/30" />
    </div>
  );
}