'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import useSWR from 'swr';
import type { Email } from '@/db/schema';
import {
  getReplyLaterEmails,
  markAsReplyLater,
  removeFromReplyLater,
} from '@/lib/email/reply-later-actions';
import { toast } from 'sonner';

interface ReplyLaterContextType {
  emails: Email[];
  isLoading: boolean;
  error: string | null;
  refreshEmails: () => Promise<void>;
  addEmail: (
    emailId: string,
    replyLaterUntil: Date,
    note?: string
  ) => Promise<boolean>;
  removeEmail: (emailId: string) => Promise<boolean>;
  sendReply: (emailId: string, replyContent: string) => Promise<void>;
}

const ReplyLaterContext = createContext<ReplyLaterContextType | undefined>(
  undefined
);

// Fetcher for SWR
const fetcher = async () => {
  const result = await getReplyLaterEmails();
  if (result.success && result.emails) {
    return result.emails;
  }
  throw new Error(result.error || 'Failed to load emails');
};

export function ReplyLaterProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  // Use SWR for automatic caching and revalidation
  const { data, error, isLoading, mutate } = useSWR<Email[]>(
    'reply-later-emails',
    fetcher,
    {
      // Only revalidate every 3 minutes (less aggressive)
      refreshInterval: 180000,
      // Don't revalidate on focus (too aggressive)
      revalidateOnFocus: false,
      // Keep previous data while revalidating
      keepPreviousData: true,
      // Dedupe requests within 5 seconds
      dedupingInterval: 5000,
      // Don't retry on error (avoid hammering)
      shouldRetryOnError: false,
    }
  );

  const emails = data ?? [];
  const errorMessage = error ? error.message : null;

  // Manual refresh function
  const refreshEmails = async () => {
    await mutate();
  };

  // Add email to reply later
  const addEmail = async (
    emailId: string,
    replyLaterUntil: Date,
    note?: string
  ): Promise<boolean> => {
    try {
      const result = await markAsReplyLater(emailId, replyLaterUntil, note);

      if (result.success) {
        // Refresh the list
        await mutate();
        return true;
      } else {
        toast.error(result.error || 'Failed to add to Reply Later');
        return false;
      }
    } catch (err) {
      console.error('Error adding to reply later:', err);
      toast.error('Failed to add to Reply Later');
      return false;
    }
  };

  // Remove email from reply later
  const removeEmail = async (emailId: string): Promise<boolean> => {
    try {
      // Optimistic update
      mutate(
        (currentEmails) =>
          currentEmails ? currentEmails.filter((e) => e.id !== emailId) : [],
        false
      );

      const result = await removeFromReplyLater(emailId);

      if (result.success) {
        // Revalidate to ensure consistency
        await mutate();
        toast.success('Removed from Reply Later');
        return true;
      } else {
        // Rollback on error
        await mutate();
        toast.error(result.error || 'Failed to remove from Reply Later');
        return false;
      }
    } catch (err) {
      console.error('Error removing from reply later:', err);
      await mutate(); // Rollback
      toast.error('Failed to remove from Reply Later');
      return false;
    }
  };

  // Send reply and remove from queue
  const sendReply = async (
    emailId: string,
    replyContent: string
  ): Promise<void> => {
    try {
      // Find the email to get recipient details
      const email = emails.find((e) => e.id === emailId);
      if (!email) {
        throw new Error('Email not found');
      }

      // Send the reply via the email sending action
      const response = await fetch('/api/ai/send-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email.fromAddress.email,
          subject: `Re: ${email.subject}`,
          body: replyContent,
          inReplyTo: email.messageId,
          references: email.messageId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send reply');
      }

      // Remove from reply later queue
      await removeEmail(emailId);

      toast.success('Reply sent successfully!');
    } catch (err) {
      console.error('Error sending reply:', err);
      throw err;
    }
  };

  const value: ReplyLaterContextType = {
    emails,
    isLoading,
    error: errorMessage,
    refreshEmails,
    addEmail,
    removeEmail,
    sendReply,
  };

  return (
    <ReplyLaterContext.Provider value={value}>
      {children}
    </ReplyLaterContext.Provider>
  );
}

export function useReplyLater(): ReplyLaterContextType {
  const context = useContext(ReplyLaterContext);
  if (context === undefined) {
    throw new Error('useReplyLater must be used within a ReplyLaterProvider');
  }
  return context;
}
