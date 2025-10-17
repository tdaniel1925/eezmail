'use client';

import { ReplyLaterStack } from './ReplyLaterStack';
import { useReplyLater } from '@/contexts/ReplyLaterContext';
import { useRouter } from 'next/navigation';
import { sendEmailAction } from '@/lib/chat/actions';
import { toast } from 'sonner';

export function ReplyLaterStackWrapper(): JSX.Element | null {
  const { emails, removeEmail } = useReplyLater();
  const router = useRouter();

  const handleSendReply = async (
    emailId: string,
    replyContent: string
  ): Promise<void> => {
    try {
      // Find the email to get recipient details
      const email = emails.find((e) => e.id === emailId);
      if (!email) {
        throw new Error('Email not found');
      }

      // Send the reply
      const result = await sendEmailAction({
        to: email.fromAddress.email,
        subject: `Re: ${email.subject}`,
        body: replyContent,
        isHtml: true,
      });

      if (result.success) {
        // Remove from reply later queue
        await removeEmail(emailId);
        toast.success('Reply sent successfully!');
      } else {
        throw new Error(result.error || 'Failed to send reply');
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      throw err;
    }
  };

  const handleOpenFull = (email: any): void => {
    // Navigate to inbox and store email ID in session storage
    // The inbox page can then open the email viewer with composer pre-loaded
    sessionStorage.setItem('openEmailId', email.id);
    sessionStorage.setItem('replyMode', 'true');
    router.push('/dashboard/inbox');
  };

  return (
    <ReplyLaterStack
      emails={emails}
      onRemove={removeEmail}
      onSendReply={handleSendReply}
      onOpenFull={handleOpenFull}
    />
  );
}

