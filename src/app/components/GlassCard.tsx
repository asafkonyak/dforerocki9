import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function GlassCard({ children, className = '', onClick, disabled = false }: GlassCardProps) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`
        relative backdrop-blur-xl bg-white/5 
        border border-white/10 rounded-2xl
        shadow-2xl shadow-purple-900/20
        ${onClick && !disabled ? 'cursor-pointer hover:bg-white/10 transition-all duration-300' : ''}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
