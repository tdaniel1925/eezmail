'use client';

import { useState } from 'react';
import { ReplyLaterStack } from './ReplyLaterStack';
import { EmailComposer } from './EmailComposer';
import { useReplyLater } from '@/contexts/ReplyLaterContext';
import { toast } from 'sonner';
import type { Email } from '@/db/schema';

export function ReplyLaterStackWrapper(): JSX.Element | null {
  const { emails, removeEmail } = useReplyLater();
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  const handleOpenFull = async (email: Email): Promise<void> => {
    // Simply open the composer with the recipient pre-filled
    // User can manually write or use AI tools within the composer
    setSelectedEmail(email);
    setComposerOpen(true);
  };

  const handleComposerClose = (): void => {
    // Just close composer, keep email in Reply Later queue
    setComposerOpen(false);
    setSelectedEmail(null);
  };

  const handleEmailSent = async (): Promise<void> => {
    // Only remove from Reply Later when email is actually sent
    if (selectedEmail) {
      await removeEmail(selectedEmail.id);
      toast.success('Email sent and removed from Reply Later');
    }
    setComposerOpen(false);
    setSelectedEmail(null);
  };

  const handleRemove = async (emailId: string): Promise<void> => {
    await removeEmail(emailId);
    toast.success('Removed from Reply Later');
  };

  return (
    <>
      <ReplyLaterStack
        emails={emails}
        onRemove={handleRemove}
        onOpenFull={handleOpenFull}
      />
      {selectedEmail && (
        <EmailComposer
          isOpen={composerOpen}
          onClose={handleComposerClose}
          onSent={handleEmailSent}
          mode="compose"
          initialData={{
            to: selectedEmail.fromAddress?.address || '',
            subject: '',
            body: '',
          }}
          replyLaterEmailId={selectedEmail.id}
        />
      )}
    </>
  );
}
