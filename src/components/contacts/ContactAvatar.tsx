'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ContactAvatarProps {
  avatarUrl?: string | null;
  name: string;
  initials: string;
  color: string; // Tailwind gradient class like 'from-blue-500 to-blue-600'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
  '2xl': 'h-24 w-24 text-2xl',
};

export function ContactAvatar({
  avatarUrl,
  name,
  initials,
  color,
  size = 'md',
  className,
}: ContactAvatarProps): JSX.Element {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const showImage = avatarUrl && !imageError;

  return (
    <div
      className={cn(
        'relative flex flex-shrink-0 items-center justify-center rounded-full font-semibold text-white overflow-hidden',
        sizeClasses[size],
        !showImage && `bg-gradient-to-br ${color}`,
        className
      )}
      title={name}
    >
      {showImage ? (
        <>
          <img
            src={avatarUrl}
            alt={name}
            className={cn(
              'h-full w-full object-cover',
              imageLoading && 'opacity-0'
            )}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
            </div>
          )}
        </>
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

