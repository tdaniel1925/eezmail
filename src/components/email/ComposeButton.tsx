'use client';

import { useState, useEffect } from 'react';
import { Plus, PenSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmailComposer } from './EmailComposer';

interface ComposeButtonProps {
  variant?: 'sidebar' | 'fab';
  className?: string;
}

interface InitialData {
  to?: string;
  subject?: string;
  body?: string;
}

export function ComposeButton({
  variant = 'sidebar',
  className,
}: ComposeButtonProps): JSX.Element {
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [initialData, setInitialData] = useState<InitialData | undefined>(
    undefined
  );

  // Listen for AI compose events
  useEffect(() => {
    const handleAICompose = (event: CustomEvent) => {
      setInitialData(event.detail);
      setIsComposerOpen(true);
    };

    window.addEventListener(
      'ai-compose-email',
      handleAICompose as EventListener
    );

    return () => {
      window.removeEventListener(
        'ai-compose-email',
        handleAICompose as EventListener
      );
    };
  }, []);

  const handleClose = (): void => {
    setIsComposerOpen(false);
    setInitialData(undefined);
  };

  if (variant === 'fab') {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsComposerOpen(true)}
          className={cn(
            'group fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg transition-all hover:scale-110 hover:shadow-xl',
            className
          )}
          aria-label="Compose email"
        >
          <PenSquare className="h-6 w-6 text-white" />
        </button>

        <EmailComposer
          isOpen={isComposerOpen}
          onClose={handleClose}
          initialData={initialData}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsComposerOpen(true)}
        className={cn(
          'group flex w-full items-center gap-3 rounded-lg bg-primary px-4 py-3 font-semibold text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg',
          className
        )}
      >
        <Plus className="h-5 w-5" />
        Compose
      </button>

      <EmailComposer
        isOpen={isComposerOpen}
        onClose={handleClose}
        initialData={initialData}
      />
    </>
  );
}
