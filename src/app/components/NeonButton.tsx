import { ReactNode } from 'react';

interface NeonButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  color?: 'cyan' | 'pink' | 'yellow';
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function NeonButton({ 
  children, 
  variant = 'primary', 
  color = 'cyan', 
  onClick, 
  className = '',
  size = 'md'
}: NeonButtonProps) {
  const colorClasses = {
    cyan: {
      primary: 'bg-[#00f0ff] text-black shadow-[0_0_30px_#00f0ff] hover:shadow-[0_0_50px_#00f0ff]',
      secondary: 'bg-[#00f0ff]/20 text-[#00f0ff] border-2 border-[#00f0ff] shadow-[0_0_20px_#00f0ff]/50 hover:bg-[#00f0ff]/30',
      outline: 'bg-transparent text-[#00f0ff] border-2 border-[#00f0ff] hover:bg-[#00f0ff]/10 shadow-[0_0_15px_#00f0ff]/30'
    },
    pink: {
      primary: 'bg-[#ff006e] text-white shadow-[0_0_30px_#ff006e] hover:shadow-[0_0_50px_#ff006e]',
      secondary: 'bg-[#ff006e]/20 text-[#ff006e] border-2 border-[#ff006e] shadow-[0_0_20px_#ff006e]/50 hover:bg-[#ff006e]/30',
      outline: 'bg-transparent text-[#ff006e] border-2 border-[#ff006e] hover:bg-[#ff006e]/10 shadow-[0_0_15px_#ff006e]/30'
    },
    yellow: {
      primary: 'bg-[#ffff00] text-black shadow-[0_0_30px_#ffff00] hover:shadow-[0_0_50px_#ffff00]',
      secondary: 'bg-[#ffff00]/20 text-[#ffff00] border-2 border-[#ffff00] shadow-[0_0_20px_#ffff00]/50 hover:bg-[#ffff00]/30',
      outline: 'bg-transparent text-[#ffff00] border-2 border-[#ffff00] hover:bg-[#ffff00]/10 shadow-[0_0_15px_#ffff00]/30'
    }
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <button
      onClick={onClick}
      className={`
        ${colorClasses[color][variant]}
        ${sizeClasses[size]}
        rounded-xl uppercase tracking-wider
        transition-all duration-300
        ${className}
      `}
    >
      {children}
    </button>
  );
}
