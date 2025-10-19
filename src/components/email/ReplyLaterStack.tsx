'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X } from 'lucide-react';
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
  const isMobile = useMediaQuery('(max-width: 768px)'); // Changed to 768px to match Tailwind's md breakpoint

  useEffect(() => {
    setMounted(true);
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
  const getAvatarColor = (email: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-red-500',
      'bg-orange-500',
      'bg-yellow-500',
      'bg-green-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-indigo-500',
    ];
    const index =
      email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      colors.length;
    return colors[index];
  };

  const getInitials = (name: string, email: string): string => {
    if (name && name !== email) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const isOverdue = (date: Date | null): boolean => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  return (
    <>
      {/* Floating Badge */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 justify-center"
      >
        <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-1.5 shadow-lg">
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
      </motion.div>

      {/* Bubble Stack */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 justify-center items-end gap-0"
      >
        <div className="flex items-end justify-center">
          {visibleEmails.map((email, index) => {
            const senderName =
              email.fromAddress.name || email.fromAddress.email;
            const senderEmail = email.fromAddress.email;
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(email.id);
                    }}
                    className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white shadow-md transition-all hover:bg-red-500 group-hover:flex"
                  >
                    <X className="h-3 w-3" />
                  </button>
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
    </>
  );
}
