import { ReactNode } from 'react';

interface SFCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'character' | 'battle';
}

export function SFCard({ children, className = '', onClick, disabled = false, variant = 'default' }: SFCardProps) {
  const borderStyles = {
    default: 'border-4 border-yellow-400 shadow-[8px_8px_0px_#000]',
    character: 'border-4 border-red-500 shadow-[8px_8px_0px_#000] bg-gradient-to-br from-yellow-400/10 to-red-500/10',
    battle: 'border-4 border-orange-500 shadow-[8px_8px_0px_#000] bg-gradient-to-br from-red-600/20 to-orange-400/20',
  };

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`
        relative bg-gradient-to-br from-gray-900 to-black
        ${borderStyles[variant]}
        ${onClick && !disabled ? 'cursor-pointer hover:shadow-[10px_10px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200' : ''}
        ${disabled ? 'opacity-40 cursor-not-allowed grayscale' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
