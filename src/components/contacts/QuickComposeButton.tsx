'use client';

import { Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickComposeButtonProps {
  email: string;
  contactName?: string;
  className?: string;
  variant?: 'default' | 'icon' | 'minimal';
  onCompose?: (email: string, contactName?: string) => void;
}

export function QuickComposeButton({
  email,
  contactName,
  className,
  variant = 'default',
  onCompose,
}: QuickComposeButtonProps): JSX.Element {
  const handleCompose = () => {
    if (onCompose) {
      onCompose(email, contactName);
    } else {
      // Fallback to mailto: link if no onCompose handler provided
      const subject = contactName ? `Message to ${contactName}` : '';
      const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
      window.location.href = mailtoLink;
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleCompose}
        className={cn(
          'p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors',
          className
        )}
        title={`Send email to ${email}`}
      >
        <Mail size={16} className="text-gray-600 dark:text-gray-400" />
      </button>
    );
  }

  if (variant === 'minimal') {
    return (
      <button
        onClick={handleCompose}
        className={cn(
          'text-sm text-blue-600 dark:text-blue-400 hover:underline',
          className
        )}
      >
        Send Email
      </button>
    );
  }

  return (
    <button
      onClick={handleCompose}
      className={cn(
        'flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium',
        className
      )}
    >
      <Mail size={16} />
      Compose Email
    </button>
  );
}
