'use client';

import { useState } from 'react';
import { ReplyLaterStack } from './ReplyLaterStack';
import { EmailComposer } from './EmailComposer';
import { useReplyLater } from '@/contexts/ReplyLaterContext';
import { generateReplyDraft } from '@/lib/email/reply-later-actions';
import { toast } from 'sonner';
import type { Email } from '@/db/schema';

export function ReplyLaterStackWrapper(): JSX.Element | null {
  const { emails, removeEmail } = useReplyLater();
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<string>('');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  const handleOpenFull = async (email: Email): Promise<void> => {
    setSelectedEmail(email);
    setIsGeneratingDraft(true);

    // Show loading toast
    const toastId = toast.loading('Writing your response now...');

    // Try to get existing AI reply or generate a new draft
    let draft = email.aiReply || '';

    if (!draft) {
      try {
        const result = await generateReplyDraft(email.id);
        if (result.success && result.draftContent) {
          draft = result.draftContent;
          toast.success('Response ready!', { id: toastId });
        } else {
          const errorMsg = result.error || 'Could not generate AI draft';
          console.error('Draft generation failed:', errorMsg);
          toast.error(errorMsg, { id: toastId });
          // Still open composer with empty body so user can write manually
        }
      } catch (error) {
        console.error('Error generating draft:', error);
        const errorMsg =
          error instanceof Error
            ? error.message
            : 'Could not generate AI draft';
        toast.error(errorMsg, { id: toastId });
        // Still open composer with empty body so user can write manually
      }
    } else {
      toast.success('Response ready!', { id: toastId });
    }

    setSelectedDraft(draft);
    setIsGeneratingDraft(false);
    setComposerOpen(true);
  };

  const handleComposerClose = (): void => {
    // Just close composer, keep email in Reply Later queue
    setComposerOpen(false);
    setSelectedEmail(null);
    setSelectedDraft('');
  };

  const handleEmailSent = async (): Promise<void> => {
    // Only remove from Reply Later when email is actually sent
    if (selectedEmail) {
      await removeEmail(selectedEmail.id);
      toast.success('Email sent and removed from Reply Later');
    }
    setComposerOpen(false);
    setSelectedEmail(null);
    setSelectedDraft('');
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
          mode="reply"
          initialData={{
            to: selectedEmail.fromAddress.email,
            subject: `Re: ${selectedEmail.subject}`,
            body: selectedDraft,
          }}
          isAIDraft={true}
          replyLaterEmailId={selectedEmail.id}
        />
      )}
    </>
  );
}
