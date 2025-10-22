'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, GripVertical } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { Email } from '@/db/schema';

interface ReplyLaterStackProps {
  emails: Email[];
  onRemove: (emailId: string) => void;
  onOpenFull: (email: Email) => Promise<void>;
}

export function ReplyLaterStack({
  emails,
  onRemove,
  onOpenFull,
}: ReplyLaterStackProps): JSX.Element | null {
  const [mounted, setMounted] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Load position from localStorage or default to center-bottom
  const [groupPosition, setGroupPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);

    // Load saved position from localStorage
    const savedPosition = localStorage.getItem('replyLaterGroupPosition');
    if (savedPosition) {
      try {
        setGroupPosition(JSON.parse(savedPosition));
      } catch (e) {
        console.error('Failed to parse saved position:', e);
      }
    }
  }, []);

  // Don't render on server, mobile, or if no emails
  if (!mounted || isMobile || emails.length === 0) {
    return null;
  }

  const visibleEmails = emails.slice(0, 6);
  const hiddenCount = emails.length - 6;

  // Check if any emails are overdue
  const hasOverdue = emails.some((email) => {
    if (!email.replyLaterUntil) return false;
    return new Date(email.replyLaterUntil) < new Date();
  });

  // Generate color from email/name
  const getAvatarColor = (email: string | undefined): string => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-red-500',
      'bg-orange-500',
      'bg-yellow-500',
      'bg-green-500',
      'bg-teal-500',
      'bg-indigo-500',
      'bg-cyan-500',
    ];
    if (!email) return colors[0];
    const index = email.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Get initials from name or email
  const getInitials = (
    name: string | undefined,
    email: string | undefined
  ): string => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  // Check if email is overdue
  const isOverdue = (date: Date | string | null | undefined): boolean => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  // Reset position to default (center-bottom)
  const handleResetPosition = () => {
    setGroupPosition({ x: 0, y: 0 });
    localStorage.removeItem('replyLaterGroupPosition');
  };

  return (
    <AnimatePresence>
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={{
          top: -window.innerHeight / 2 + 100,
          bottom: window.innerHeight / 2 - 100,
          left: -window.innerWidth / 2 + 150,
          right: window.innerWidth / 2 - 150,
        }}
        onDragEnd={(event, info) => {
          const newPos = { x: info.offset.x, y: info.offset.y };
          setGroupPosition(newPos);
          localStorage.setItem(
            'replyLaterGroupPosition',
            JSON.stringify(newPos)
          );
        }}
        onDoubleClick={handleResetPosition} // Added double-click to reset
        initial={{ x: groupPosition.x, y: groupPosition.y, opacity: 0 }}
        animate={{ x: groupPosition.x, y: groupPosition.y, opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-3 cursor-move"
        whileDrag={{ cursor: 'grabbing' }}
        title="Drag to move • Double-click to reset position" // Added tooltip
      >
        {/* Floating Badge (grouped with stack) */}
        <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-1.5 shadow-lg hover:scale-105 transition-transform">
          <GripVertical className="h-3.5 w-3.5 text-white/70" />
          <Clock className="h-3.5 w-3.5 text-white" />
          <span className="text-xs font-semibold text-white">
            {emails.length} Reply Later
          </span>
          {hasOverdue && (
            <span className="flex h-1.5 w-1.5">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-red-500"></span>
            </span>
          )}
        </div>

        {/* Bubble Stack (grouped with title) */}
        <div className="flex items-end justify-center gap-0">
          {visibleEmails.map((email, index) => {
            // Safely extract sender info with null checks
            const senderName =
              email.fromAddress?.name || email.fromAddress?.email || undefined;
            const senderEmail = email.fromAddress?.email || undefined;
            const initials = getInitials(senderName, senderEmail);
            const colorClass = getAvatarColor(senderEmail);
            const overdue = isOverdue(email.replyLaterUntil);

            return (
              <motion.div
                key={email.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
                style={{ marginLeft: index > 0 ? '-8px' : '0', zIndex: index }}
              >
                <button
                  onClick={() => {
                    onOpenFull(email).catch((err) =>
                      console.error('Error opening composer:', err)
                    );
                  }}
                  className={`group relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-white shadow-lg transition-all hover:scale-110 hover:shadow-xl ${colorClass}`}
                  title={`Reply to ${senderName}`}
                >
                  <span className="text-sm font-bold text-white">
                    {initials}
                  </span>

                  {/* Overdue indicator */}
                  {overdue && (
                    <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-md">
                      <Clock className="h-3 w-3" />
                    </div>
                  )}

                  {/* Quick dismiss on hover */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(email.id);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        onRemove(email.id);
                      }
                    }}
                    className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white shadow-md transition-all hover:bg-red-500 group-hover:flex cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </div>
                </button>
              </motion.div>
            );
          })}

          {/* +N more indicator */}
          {hiddenCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="ml-2 flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-gray-700 shadow-lg"
            >
              <span className="text-xs font-bold text-white">
                +{hiddenCount}
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
