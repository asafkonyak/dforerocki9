import React from 'react';

interface AvatarDisplayProps {
  avatar: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function AvatarDisplay({ avatar, className = '', size = 'md' }: AvatarDisplayProps) {
  const safeAvatar = avatar || '👤';
  const isUrl = typeof safeAvatar === 'string' && (
    safeAvatar.startsWith('http') || 
    safeAvatar.startsWith('/') || 
    safeAvatar.startsWith('data:') ||
    safeAvatar.includes('.') // Generic fallback for assets
  );
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xl',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-16 h-16 text-3xl',
    xl: 'w-32 h-32 text-6xl'
  };

  return (
    <div className={`rounded-full flex items-center justify-center overflow-hidden bg-black/20 ${sizeClasses[size]} ${className}`}>
      {isUrl ? (
        <img 
          src={safeAvatar as string} 
          alt="Avatar" 
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback for broken images
            const target = e.target as HTMLImageElement;
            target.src = 'https://ui-avatars.com/api/?name=User&background=00f0ff&color=fff';
          }}
        />
      ) : (
        <span className="leading-none select-none">{safeAvatar}</span>
      )}
    </div>
  );
}
