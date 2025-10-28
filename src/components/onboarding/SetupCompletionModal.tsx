'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Sparkles, Zap, Keyboard, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SetupCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncProgress?: number;
  syncTotal?: number;
  accountEmail?: string;
}

export function SetupCompletionModal({
  isOpen,
  onClose,
  syncProgress = 0,
  syncTotal = 0,
  accountEmail,
}: SetupCompletionModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  console.log('[SETUP_COMPLETE] Modal opened:', {
    isOpen,
    syncProgress,
    syncTotal,
  });

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Hide confetti after animation
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const syncPercentage =
    syncTotal > 0 ? Math.round((syncProgress / syncTotal) * 100) : 0;
  const isSyncing = syncProgress < syncTotal && syncTotal > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random()}s`,
              }}
            >
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  [
                    'bg-red-500',
                    'bg-blue-500',
                    'bg-green-500',
                    'bg-yellow-500',
                    'bg-purple-500',
                    'bg-pink-500',
                  ][Math.floor(Math.random() * 6)]
                )}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative animate-in zoom-in-95 duration-300">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>

          {/* Success icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center animate-in zoom-in duration-500">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
              {/* Pulse effect */}
              <div className="absolute inset-0 w-20 h-20 rounded-full bg-green-500 animate-ping opacity-20" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
            Welcome to EaseMail! 🎉
          </h2>
          {accountEmail && (
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              {accountEmail} is connected
            </p>
          )}

          {/* Sync progress */}
          {isSyncing ? (
            <div className="mb-8">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">
                  Your inbox is syncing...
                </span>
                <span className="font-semibold text-primary">
                  {syncProgress.toLocaleString()} / {syncTotal.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-500 ease-out"
                  style={{ width: `${syncPercentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                {syncPercentage}% complete - This may take a few minutes
              </p>
            </div>
          ) : (
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Sync complete! You're all set.
              </div>
            </div>
          )}

          {/* Quick tips */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              While you wait, here's what you can do:
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    AI-powered compose
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Let AI help you write better emails faster
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Keyboard className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    Keyboard shortcuts
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Press{' '}
                    <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                      ?
                    </kbd>{' '}
                    to see all shortcuts
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Filter className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    Smart filters
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Automatically organize emails into Imbox, Feed, and Paper
                    Trail
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="flex items-center gap-3">
            <Button onClick={onClose} className="flex-1" size="lg">
              {isSyncing
                ? 'View my inbox (syncing in background)'
                : 'Got it, show my inbox →'}
            </Button>
          </div>

          {/* Footer note */}
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
            You can always access settings from the sidebar
          </p>
        </div>
      </div>

      {/* Confetti CSS animation */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
      `}</style>
    </>
  );
}


