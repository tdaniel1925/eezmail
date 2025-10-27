'use client';

/**
 * Ticket Comments Component
 * Comment thread with internal notes support
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MessageSquare, Lock, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { InlineNotification } from '@/components/ui/inline-notification';

interface TicketCommentsProps {
  ticketId: string;
  comments: Array<{
    comment: {
      id: string;
      comment: string;
      isInternal: boolean;
      createdAt: Date;
    };
    author: {
      name: string | null;
      email: string;
    } | null;
  }>;
  currentUserId: string;
}

export function TicketComments({
  ticketId,
  comments,
  currentUserId,
}: TicketCommentsProps) {
  const router = useRouter();
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      setNotification({
        type: 'error',
        message: 'Please enter a comment',
      });
      return;
    }

    setIsSubmitting(true);
    setNotification(null);
    try {
      const response = await fetch(
        `/api/admin/support/tickets/${ticketId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comment: newComment,
            isInternal,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add comment');
      }

      setNotification({
        type: 'success',
        message: 'Comment added successfully',
      });
      setNewComment('');
      setIsInternal(false);

      // Refresh after a short delay to show success message
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error('Failed to add comment:', error);
      setNotification({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Failed to add comment',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-6 space-y-6">
      {notification && (
        <InlineNotification
          type={notification.type}
          message={notification.message}
          onDismiss={() => setNotification(null)}
        />
      )}

      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-gray-500" />
        <h2 className="text-lg font-semibold">Comments ({comments.length})</h2>
      </div>

      {/* Comment Thread */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No comments yet. Be the first to respond!
          </p>
        ) : (
          comments.map(({ comment, author }) => (
            <div
              key={comment.id}
              className={`p-4 rounded-lg ${
                comment.isInternal
                  ? 'bg-yellow-50 border-l-4 border-yellow-400'
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {author?.name || author?.email || 'Unknown'}
                  </span>
                  {comment.isInternal && (
                    <div className="flex items-center gap-1 text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                      <Lock className="h-3 w-3" />
                      Internal Note
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap text-sm">
                {comment.comment}
              </p>
            </div>
          ))
        )}
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment or internal note..."
          rows={4}
          className="resize-none"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="internal"
              checked={isInternal}
              onCheckedChange={(checked) => setIsInternal(checked as boolean)}
            />
            <Label htmlFor="internal" className="text-sm cursor-pointer">
              Internal note (not visible to customer)
            </Label>
          </div>

          <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Sending...' : 'Send Comment'}
          </Button>
        </div>
      </form>
    </div>
  );
}
