'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
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
  addEmail: (emailId: string, replyLaterUntil: Date, note?: string) => Promise<boolean>;
  removeEmail: (emailId: string) => Promise<boolean>;
  sendReply: (emailId: string, replyContent: string) => Promise<void>;
}

const ReplyLaterContext = createContext<ReplyLaterContextType | undefined>(
  undefined
);

export function ReplyLaterProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch reply later emails
  const refreshEmails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getReplyLaterEmails();

      if (result.success && result.emails) {
        setEmails(result.emails);
      } else {
        setError(result.error || 'Failed to load emails');
      }
    } catch (err) {
      console.error('Error refreshing reply later emails:', err);
      setError('Failed to load reply later emails');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load emails on mount
  useEffect(() => {
    refreshEmails();
  }, [refreshEmails]);

  // Add email to reply later
  const addEmail = useCallback(
    async (
      emailId: string,
      replyLaterUntil: Date,
      note?: string
    ): Promise<boolean> => {
      try {
        const result = await markAsReplyLater(emailId, replyLaterUntil, note);

        if (result.success) {
          // Refresh the list
          await refreshEmails();
          toast.success('Added to Reply Later. AI is drafting your reply...');
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
    },
    [refreshEmails]
  );

  // Remove email from reply later
  const removeEmail = useCallback(
    async (emailId: string): Promise<boolean> => {
      try {
        const result = await removeFromReplyLater(emailId);

        if (result.success) {
          // Optimistically remove from UI
          setEmails((prev) => prev.filter((e) => e.id !== emailId));
          toast.success('Removed from Reply Later');
          return true;
        } else {
          toast.error(result.error || 'Failed to remove from Reply Later');
          return false;
        }
      } catch (err) {
        console.error('Error removing from reply later:', err);
        toast.error('Failed to remove from Reply Later');
        return false;
      }
    },
    []
  );

  // Send reply and remove from queue
  const sendReply = useCallback(
    async (emailId: string, replyContent: string): Promise<void> => {
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
    },
    [emails, removeEmail]
  );

  const value: ReplyLaterContextType = {
    emails,
    isLoading,
    error,
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

