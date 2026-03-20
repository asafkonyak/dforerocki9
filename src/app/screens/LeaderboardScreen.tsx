import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '../components/GlassCard';
import { ArrowLeft, Crown, Zap, Globe, TrendingUp, TrendingDown, Swords, Flame } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AvatarDisplay } from '../components/AvatarDisplay';

interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  recentForm: ('W' | 'L')[];
  rank: number;
}

interface FightResult {
  result: 'win' | 'loss';
  scoreChange: number;
  rankChange: number;
  combo: number;
  taps: number;
}

// Removed GLOBAL_PLAYERS and BASE_USER constants to use live data from Supabase

function FormDots({ form, highlightLast }: { form: ('W' | 'L')[]; highlightLast?: boolean }) {
  return (
    <div className="flex gap-1.5 items-center">
      {form.map((result, i) => {
        const isLast = highlightLast && i === form.length - 1;
        return (
          <motion.div
            key={i}
            className={`w-2.5 h-2.5 rounded-full ${
              result === 'W'
                ? 'bg-[#00f0ff] shadow-[0_0_6px_#00f0ff]'
                : 'bg-[#ff2244] shadow-[0_0_6px_#ff2244]'
            } ${isLast ? 'ring-2 ring-white/60 ring-offset-1 ring-offset-transparent' : ''}`}
            initial={{ scale: 0 }}
            animate={{ scale: isLast ? [0, 1.4, 1] : 1 }}
            transition={{ 
              delay: isLast ? 1.2 : i * 0.08, 
              type: isLast ? 'tween' : 'spring', 
              stiffness: isLast ? undefined : 300,
              duration: isLast ? 0.5 : undefined
            }}
          />
        );
      })}
    </div>
  );
}

function PodiumPlayer({ player, position }: { player: Player; position: 1 | 2 | 3 }) {
  const sizes = {
    1: { avatar: 'w-20 h-20', podium: 'h-28', delay: 0.3, ring: 'border-[#ffd700] shadow-[0_0_20px_#ffd700aa,0_0_40px_#ffd70044]' },
    2: { avatar: 'w-16 h-16', podium: 'h-20', delay: 0.4, ring: 'border-[#c0c0c0] shadow-[0_0_12px_#c0c0c0aa]' },
    3: { avatar: 'w-14 h-14', podium: 'h-14', delay: 0.5, ring: 'border-[#cd7f32] shadow-[0_0_12px_#cd7f32aa]' },
  };

  const config = sizes[position];
  const order = position === 1 ? 'order-2' : position === 2 ? 'order-1' : 'order-3';

  return (
    <motion.div
      className={`flex flex-col items-center ${order} flex-1`}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: config.delay, duration: 0.6, type: 'spring' }}
    >
      {position === 1 && (
        <motion.div
          initial={{ opacity: 0, scale: 0, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
          className="mb-1"
        >
          <Crown className="w-8 h-8 text-[#ffd700] drop-shadow-[0_0_8px_#ffd700]" />
        </motion.div>
      )}

      <div
        className={`${config.avatar} rounded-full border-2 ${config.ring} 
        bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md
        flex items-center justify-center mb-2 overflow-hidden`}
      >
        <AvatarDisplay 
          avatar={player.avatar} 
          size={position === 1 ? 'lg' : 'md'} 
          className="w-full h-full rounded-none"
        />
      </div>

      <p className="text-white text-xs tracking-wider mb-0.5" style={{ fontFamily: "'Orbitron', sans-serif" }}>
        {player.name}
      </p>

      <p
        className={`text-xs mb-1.5 ${
          position === 1 ? 'text-[#ffd700]' : position === 2 ? 'text-[#c0c0c0]' : 'text-[#cd7f32]'
        }`}
        style={{ fontFamily: "'Orbitron', sans-serif" }}
      >
        {player.score.toLocaleString()} PP
      </p>

      <FormDots form={player.recentForm} />

      <motion.div
        className={`w-full ${config.podium} mt-3 rounded-t-lg relative overflow-hidden`}
        initial={{ height: 0 }}
        animate={{ height: position === 1 ? 112 : position === 2 ? 80 : 56 }}
        transition={{ delay: config.delay + 0.2, duration: 0.5, type: 'spring' }}
        style={{
          background:
            position === 1
              ? 'linear-gradient(180deg, rgba(255,215,0,0.3) 0%, rgba(255,215,0,0.05) 100%)'
              : position === 2
              ? 'linear-gradient(180deg, rgba(192,192,192,0.25) 0%, rgba(192,192,192,0.05) 100%)'
              : 'linear-gradient(180deg, rgba(205,127,50,0.25) 0%, rgba(205,127,50,0.05) 100%)',
        }}
      >
        <div className="absolute inset-0 backdrop-blur-sm border border-white/10 rounded-t-lg" />
        <div className="relative z-10 flex items-center justify-center h-full">
          <span
            className={`text-2xl ${
              position === 1 ? 'text-[#ffd700]' : position === 2 ? 'text-[#c0c0c0]' : 'text-[#cd7f32]'
            }`}
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            #{position}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RankedRow({ player, index }: { player: Player; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6 + index * 0.05, duration: 0.4 }}
    >
      <GlassCard className="px-4 py-3 flex items-center gap-3">
        <div className="w-8 text-center">
          <span className="text-white/60 text-sm" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            {player.rank}
          </span>
        </div>

        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
          <AvatarDisplay avatar={player.avatar} size="sm" className="w-full h-full rounded-none" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white text-sm tracking-wider truncate" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            {player.name}
          </p>
          <p className="text-[#00f0ff]/70 text-xs" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            {player.score.toLocaleString()} PP
          </p>
        </div>

        <FormDots form={player.recentForm} />
      </GlassCard>
    </motion.div>
  );
}

function MatchResultBanner({ fightResult }: { fightResult: FightResult }) {
  const isWin = fightResult.result === 'win';

  return (
    <motion.div
      className="mx-4 mb-4"
      initial={{ opacity: 0, y: -30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
    >
      <div
        className={`relative rounded-2xl overflow-hidden border-2 ${
          isWin
            ? 'border-[#00f0ff]/50 shadow-[0_0_25px_#00f0ff33]'
            : 'border-[#ff006e]/50 shadow-[0_0_25px_#ff006e33]'
        }`}
      >
        <div className="absolute inset-0 backdrop-blur-xl bg-[#0a0515]/70" />
        <div
          className="absolute inset-0"
          style={{
            background: isWin
              ? 'linear-gradient(135deg, rgba(0,240,255,0.1) 0%, rgba(0,240,255,0.02) 100%)'
              : 'linear-gradient(135deg, rgba(255,0,110,0.1) 0%, rgba(255,0,110,0.02) 100%)',
          }}
        />

        <div className="relative z-10 p-4">
          {/* Result Header */}
          <div className="flex items-center gap-3 mb-3">
            <motion.div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isWin ? 'bg-[#00f0ff]/20' : 'bg-[#ff006e]/20'
              }`}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, type: 'tween' }}
            >
              <Swords className={`w-6 h-6 ${isWin ? 'text-[#00f0ff]' : 'text-[#ff006e]'}`} />
            </motion.div>
            <div className="flex-1">
              <h3
                className={`text-lg tracking-wider ${isWin ? 'text-[#00f0ff]' : 'text-[#ff006e]'}`}
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                {isWin ? 'VICTORY!' : 'DEFEAT'}
              </h3>
              <p className="text-white/50 text-xs">Match result applied to rankings</p>
            </div>
            <motion.div
              className={`text-2xl ${isWin ? 'text-[#00f0ff]' : 'text-[#ff006e]'}`}
              style={{ fontFamily: "'Orbitron', sans-serif" }}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ delay: 0.5, type: 'tween', duration: 0.5 }}
            >
              {isWin ? '🏆' : '💔'}
            </motion.div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2">
            {/* Score Change */}
            <motion.div
              className="bg-white/5 rounded-xl p-3 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                {isWin ? (
                  <TrendingUp className="w-3.5 h-3.5 text-[#00ff88]" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-[#ff2244]" />
                )}
              </div>
              <motion.p
                className={`text-lg ${isWin ? 'text-[#00ff88]' : 'text-[#ff2244]'}`}
                style={{ fontFamily: "'Orbitron', sans-serif" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {fightResult.scoreChange > 0 ? '+' : ''}
                {fightResult.scoreChange}
              </motion.p>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mt-0.5">Points</p>
            </motion.div>

            {/* Rank Change */}
            <motion.div
              className="bg-white/5 rounded-xl p-3 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                {isWin ? (
                  <TrendingUp className="w-3.5 h-3.5 text-[#ffd700]" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-[#ff2244]" />
                )}
              </div>
              <motion.p
                className="text-lg text-[#ffd700]"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                {fightResult.rankChange > 0 ? '+' : ''}
                {fightResult.rankChange}
              </motion.p>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mt-0.5">Rank</p>
            </motion.div>

            {/* Combo */}
            <motion.div
              className="bg-white/5 rounded-xl p-3 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame className="w-3.5 h-3.5 text-[#ffff00]" />
              </div>
              <p
                className="text-lg text-[#ffff00]"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                {fightResult.combo}
              </p>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mt-0.5">Combo</p>
            </motion.div>

            {/* Taps */}
            <motion.div
              className="bg-white/5 rounded-xl p-3 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="w-3.5 h-3.5 text-[#00f0ff]" />
              </div>
              <p
                className="text-lg text-[#00f0ff]"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                {fightResult.taps}
              </p>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mt-0.5">Taps</p>
            </motion.div>
          </div>
        </div>

        {/* Top glow line */}
        <div
          className={`absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent ${
            isWin ? 'via-[#00f0ff]/60' : 'via-[#ff006e]/60'
          } to-transparent`}
        />
      </div>
    </motion.div>
  );
}

export function LeaderboardScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const fightResult = location.state as any | null;

  const [players, setPlayers] = useState<Player[]>([]);
  const [userPlayer, setUserPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .order('xp', { ascending: false })
          .limit(20);

        if (error) throw error;

        if (data) {
          const mapped: Player[] = data
            .filter(p => (p.username || '').toLowerCase() !== 'glitchmaster')
            .map((p, index) => ({
              id: p.id,
              name: p.username || 'Anonymous',
              avatar: p.avatar_url || '👤',
              score: p.xp || 0,
              rank: index + 1,
              recentForm: ['W', 'W', 'W'] as ('W' | 'L')[]
            }));
          setPlayers(mapped);

          // Find current user in the list or find their specific rank
          const { data: { user } } = await supabase.auth.getUser();
          let currentId = localStorage.getItem('fighter_player_id');
          if (user && user.id) {
            const { data: player } = await supabase.from('players').select('id').eq('user_id', user.id).maybeSingle();
            if (player?.id) currentId = player.id;
          }

          if (currentId) {
            const existing = mapped.find(p => p.id === currentId);
            if (existing) {
              setUserPlayer(existing);
            } else {
              // Fetch user's actual rank if not in top 20
              const { data: userStats } = await supabase.from('players').select('*').eq('id', currentId).maybeSingle();
              if (userStats) {
                // Count how many people have more XP
                const { count } = await supabase.from('players').select('*', { count: 'exact', head: true }).gt('xp', userStats.xp);
                setUserPlayer({
                  id: userStats.id,
                  name: userStats.username || 'YOU',
                  avatar: userStats.avatar_url || '🎮',
                  score: userStats.xp || 0,
                  rank: (count || 0) + 1,
                  recentForm: ['W', 'L', 'W'] as ('W' | 'L')[]
                });
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  const top3 = players.slice(0, 3);
  const rest = players.slice(3);

  useEffect(() => {
    if (fightResult) {
      const timer = setTimeout(() => setShowBanner(true), 300);
      return () => clearTimeout(timer);
    }
  }, [fightResult]);

  const isWin = fightResult?.result === 'win';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0515] via-[#1a0a2e] to-[#0a0515] flex flex-col relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#00f0ff]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-0 w-[300px] h-[300px] bg-[#ff006e]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[200px] bg-[#ffd700]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Fight result flash overlay */}
      {fightResult && (
        <motion.div
          className={`absolute inset-0 z-30 pointer-events-none ${
            isWin ? 'bg-[#00f0ff]' : 'bg-[#ff006e]'
          }`}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
        />
      )}

      {/* Header */}
      <div className="relative z-10 px-4 pt-6 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-[#00f0ff] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl text-[#00f0ff] tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>LEADERBOARD</h1>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#00f0ff]/60" />
            <span
              className="text-[#00f0ff]/60 text-xs tracking-widest uppercase"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              Global
            </span>
          </div>
          <Zap className="w-5 h-5 text-[#ffd700]" />
        </div>
      </div>

      {/* Match Result Banner */}
      <AnimatePresence>
        {showBanner && fightResult && <MatchResultBanner fightResult={fightResult} />}
      </AnimatePresence>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-28 relative z-10">
        {/* Podium */}
        <div className="pt-4 pb-6">
          <div className="flex items-end gap-2 justify-center">
            {top3[1] && <PodiumPlayer player={top3[1]} position={2} />}
            {top3[0] && <PodiumPlayer player={top3[0]} position={1} />}
            {top3[2] && <PodiumPlayer player={top3[2]} position={3} />}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#00f0ff]/30 to-transparent" />
          <span
            className="text-white/30 text-xs tracking-widest uppercase"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            Rankings
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#00f0ff]/30 to-transparent" />
        </div>

        {/* Ranked List */}
        <div className="space-y-2">
          {rest.map((player, i) => (
            <RankedRow key={player.id} player={player} index={i} />
          ))}
        </div>
      </div>

      {/* Sticky User Rank Card */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-20 p-4"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.8, type: 'spring', stiffness: 200, damping: 25 }}
      >
        <div
          className={`relative rounded-2xl overflow-hidden ${
            fightResult
              ? isWin
                ? 'shadow-[0_0_25px_#00f0ff44,0_0_50px_#00f0ff22]'
                : 'shadow-[0_0_25px_#ff006e44,0_0_50px_#ff006e22]'
              : ''
          }`}
          style={{
            background: isWin
              ? 'linear-gradient(135deg, rgba(0,240,255,0.15) 0%, rgba(0,240,255,0.05) 100%)'
              : fightResult
              ? 'linear-gradient(135deg, rgba(255,0,110,0.15) 0%, rgba(255,0,110,0.05) 100%)'
              : 'linear-gradient(135deg, rgba(0,240,255,0.15) 0%, rgba(0,240,255,0.05) 100%)',
          }}
        >
          <div
            className={`absolute inset-0 rounded-2xl border ${
              fightResult
                ? isWin
                  ? 'border-[#00f0ff]/50 shadow-[0_0_15px_#00f0ff33,inset_0_0_15px_#00f0ff11]'
                  : 'border-[#ff006e]/50 shadow-[0_0_15px_#ff006e33,inset_0_0_15px_#ff006e11]'
                : 'border-[#00f0ff]/40 shadow-[0_0_15px_#00f0ff33,inset_0_0_15px_#00f0ff11]'
            }`}
          />
          <div className="absolute inset-0 backdrop-blur-xl bg-[#0a0515]/60" />

          <div className="relative z-10 px-4 py-3.5 flex items-center gap-3">
            {/* Rank with change indicator */}
            <div className="w-12 text-center">
              <motion.span
                className="text-[#00f0ff] text-lg block"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
                initial={fightResult ? { scale: 0.5, opacity: 0 } : {}}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1, type: 'spring' }}
              >
                #{userPlayer?.rank || '--'}
              </motion.span>
              {fightResult && (
                <motion.span
                  className={`text-[10px] block ${
                    isWin ? 'text-[#00ff88]' : 'text-[#ff2244]'
                  }`}
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 }}
                >
                  {fightResult.rankChange > 0 ? '▲' : '▼'} {Math.abs(fightResult.rankChange)}
                </motion.span>
              )}
            </div>

            {/* Avatar with pulse */}
            <div className="relative">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${
                  fightResult
                    ? isWin
                      ? 'bg-[#00f0ff]/10 border-2 border-[#00f0ff]/50 shadow-[0_0_10px_#00f0ff44]'
                      : 'bg-[#ff006e]/10 border-2 border-[#ff006e]/50 shadow-[0_0_10px_#ff006e44]'
                    : 'bg-[#00f0ff]/10 border-2 border-[#00f0ff]/50 shadow-[0_0_10px_#00f0ff44]'
                }`}
              >
                <AvatarDisplay avatar={userPlayer?.avatar || '🎮'} size="md" className="w-full h-full rounded-none" />
              </div>
              {fightResult && (
                <motion.div
                  className={`absolute inset-0 rounded-full border-2 ${
                    isWin ? 'border-[#00f0ff]' : 'border-[#ff006e]'
                  }`}
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  transition={{ delay: 1, duration: 0.8 }}
                />
              )}
            </div>

            {/* Name & Score with change */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm tracking-wider ${isWin || !fightResult ? 'text-[#00f0ff]' : 'text-[#ff006e]'}`}
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                {userPlayer?.name || 'YOU'}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-white/60 text-xs" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                  {(userPlayer?.score || 0).toLocaleString()} PP
                </p>
                {fightResult && (
                  <motion.span
                    className={`text-xs ${isWin ? 'text-[#00ff88]' : 'text-[#ff2244]'}`}
                    style={{ fontFamily: "'Orbitron', sans-serif" }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1 }}
                  >
                    ({fightResult.scoreChange > 0 ? '+' : ''}
                    {fightResult.scoreChange})
                  </motion.span>
                )}
              </div>
            </div>

            {/* Recent Form with highlighted last dot */}
            <FormDots form={userPlayer?.recentForm || []} highlightLast={!!fightResult} />
          </div>

          {/* Top edge highlight */}
          <div
            className={`absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent ${
              isWin || !fightResult ? 'via-[#00f0ff]/60' : 'via-[#ff006e]/60'
            } to-transparent`}
          />
        </div>
      </motion.div>
    </div>
  );
}