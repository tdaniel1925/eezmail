'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ArticleFeedbackProps {
  articleId: string;
}

export function ArticleFeedback({ articleId }: ArticleFeedbackProps) {
  const [feedback, setFeedback] = useState<'helpful' | 'not_helpful' | null>(
    null
  );
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFeedback = async (helpful: boolean) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/help/articles/${articleId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful }),
      });

      if (!response.ok) throw new Error('Failed to submit feedback');

      setFeedback(helpful ? 'helpful' : 'not_helpful');

      if (!helpful) {
        setShowCommentForm(true);
      } else {
        toast({
          title: 'Thank you!',
          description: 'Your feedback helps us improve our content.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/help/articles/${articleId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helpful: false,
          feedbackText: comment,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit comment');

      toast({
        title: 'Thank you!',
        description: 'Your feedback helps us improve our content.',
      });

      setShowCommentForm(false);
      setComment('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit comment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Was this article helpful?
        </h3>

        {feedback === null ? (
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleFeedback(true)}
              disabled={isSubmitting}
              className="gap-2"
            >
              <ThumbsUp className="h-5 w-5" />
              Yes
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleFeedback(false)}
              disabled={isSubmitting}
              className="gap-2"
            >
              <ThumbsDown className="h-5 w-5" />
              No
            </Button>
          </div>
        ) : (
          <Card className="inline-block px-6 py-3">
            <p className="text-sm text-gray-600">
              {feedback === 'helpful'
                ? '✓ Thank you for your feedback!'
                : 'Thank you for helping us improve!'}
            </p>
          </Card>
        )}
      </div>

      {showCommentForm && (
        <Card className="p-6">
          <h4 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
            <MessageSquare className="h-5 w-5" />
            Tell us how we can improve
          </h4>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What information were you looking for? What could be better?"
            rows={4}
            className="mb-3"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCommentForm(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCommentSubmit}
              disabled={isSubmitting || !comment.trim()}
            >
              Submit Feedback
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
