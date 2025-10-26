'use client';

/**
 * Impersonation Banner Component
 * Displays prominent banner when admin is impersonating a user
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, LogOut, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ImpersonationBannerProps {
  targetUserEmail: string;
  targetUserName: string | null;
  adminEmail: string;
  startedAt: Date;
  readOnly: boolean;
  onExit: () => void;
}

export function ImpersonationBanner({
  targetUserEmail,
  targetUserName,
  adminEmail,
  startedAt,
  readOnly,
  onExit,
}: ImpersonationBannerProps) {
  const [duration, setDuration] = useState<string>('');

  useEffect(() => {
    // Update duration every second
    const interval = setInterval(() => {
      setDuration(
        formatDistanceToNow(new Date(startedAt), { addSuffix: false })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="rounded-full bg-white/20 p-2">
              {readOnly ? (
                <Eye className="h-5 w-5" />
              ) : (
                <EyeOff className="h-5 w-5" />
              )}
            </div>

            {/* Main Message */}
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">
                    Viewing as {targetUserName || targetUserEmail}
                  </span>
                  {readOnly && (
                    <Badge
                      variant="secondary"
                      className="bg-white/20 text-white hover:bg-white/30"
                    >
                      Read-Only
                    </Badge>
                  )}
                </div>
                <div className="text-xs opacity-90 mt-0.5">
                  Admin: {adminEmail}
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/10">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">{duration}</span>
            </div>

            {/* Warning */}
            {!readOnly && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-white/10">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span className="text-sm font-medium">
                  All actions will be logged
                </span>
              </div>
            )}
          </div>

          {/* Exit Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onExit}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Exit Impersonation
          </Button>
        </div>
      </div>
    </div>
  );
}
