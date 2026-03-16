import { ReactNode } from 'react';
import { motion } from 'motion/react';

interface SFButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SFButton({ 
  children, 
  variant = 'primary', 
  onClick, 
  className = '',
  size = 'md'
}: SFButtonProps) {
  const variantStyles = {
    primary: 'bg-gradient-to-b from-yellow-400 to-orange-500 text-black border-yellow-300 shadow-[0_6px_0_#c45a00]',
    secondary: 'bg-gradient-to-b from-red-500 to-red-700 text-white border-red-400 shadow-[0_6px_0_#7f1d1d]',
    danger: 'bg-gradient-to-b from-gray-700 to-gray-900 text-white border-gray-600 shadow-[0_6px_0_#1f2937]',
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-8 py-3 text-base',
    lg: 'px-12 py-4 text-xl',
  };

  return (
    <motion.button
      onClick={onClick}
      className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        border-4 uppercase tracking-wider
        transition-all duration-100
        active:translate-y-[6px] active:shadow-none
        hover:brightness-110
        ${className}
      `}
      style={{
        fontFamily: "'Orbitron', sans-serif",
        textShadow: '2px 2px 0px rgba(0,0,0,0.3)',
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  );
}
