'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Send, RefreshCw } from 'lucide-react';
import {
  startAIReplyWorkflow,
  answerQuestion,
  updateDraft,
  regenerateDraft,
} from '@/lib/ai-reply/workflow';
import { toast } from '@/lib/toast';

interface AIReplyModalProps {
  emailId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface Draft {
  id: string;
  draftBody: string;
  draftSubject: string;
  status: string;
  questions: string[];
  userResponses: Record<string, string>;
}

export function AIReplyModal({
  emailId,
  isOpen,
  onClose,
}: AIReplyModalProps): JSX.Element | null {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && emailId) {
      initializeDraft();
    }
  }, [isOpen, emailId]);

  const initializeDraft = async (): Promise<void> => {
    if (!emailId) return;

    setIsLoading(true);
    try {
      const result = await startAIReplyWorkflow(emailId);
      if (result.success && result.draftId) {
        // Fetch draft details
        // For now, set a mock draft
        setDraft({
          id: result.draftId,
          draftBody: '',
          draftSubject: 'Re: Email',
          status: 'questioning',
          questions: [
            'What is the main purpose of your reply?',
            'What tone would you like to use?',
            'Are there any specific details you want to include?',
          ],
          userResponses: {},
        });
        setCurrentQuestionIndex(0);
      } else {
        toast.error(result.error || 'Failed to start AI reply');
        onClose();
      }
    } catch (error) {
      console.error('Error initializing draft:', error);
      toast.error('Failed to start AI reply');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSubmit = async (): Promise<void> => {
    if (!draft || !currentAnswer.trim()) return;

    setIsLoading(true);
    try {
      const result = await answerQuestion(
        draft.id,
        currentQuestionIndex,
        currentAnswer
      );

      if (result.success) {
        // Update local state
        const newResponses = {
          ...draft.userResponses,
          [currentQuestionIndex.toString()]: currentAnswer,
        };

        setDraft({
          ...draft,
          userResponses: newResponses,
          status: result.allAnswered ? 'ready' : 'questioning',
        });

        setCurrentAnswer('');
        if (!result.allAnswered) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        }

        toast.success('Answer recorded!');
      } else {
        toast.error(result.error || 'Failed to record answer');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to submit answer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDraft = async (
    body: string,
    subject: string
  ): Promise<void> => {
    if (!draft) return;

    try {
      const result = await updateDraft(draft.id, body, subject);
      if (result.success) {
        setDraft({ ...draft, draftBody: body, draftSubject: subject });
        toast.success('Draft updated!');
      }
    } catch (error) {
      console.error('Error updating draft:', error);
      toast.error('Failed to update draft');
    }
  };

  const handleRegenerate = async (): Promise<void> => {
    if (!draft) return;

    setIsLoading(true);
    try {
      const result = await regenerateDraft(draft.id);
      if (result.success) {
        toast.success('Draft regenerated!');
        // Refresh draft
        await initializeDraft();
      } else {
        toast.error(result.error || 'Failed to regenerate');
      }
    } catch (error) {
      console.error('Error regenerating:', error);
      toast.error('Failed to regenerate draft');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !draft) return null;

  const handleBackdropClick = (e: React.MouseEvent): void => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                AI Reply Assistant
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Craft the perfect email with AI guidance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Questioning Phase */}
          {draft.status === 'questioning' && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Answer a few questions to help me craft the perfect reply...
                </p>
              </div>

              {draft.questions.map((question, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-white/10 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="flex-1 font-medium text-gray-900 dark:text-white pt-1">
                      {question}
                    </p>
                  </div>

                  {draft.userResponses[index.toString()] ? (
                    <div className="ml-11 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        ✓ {draft.userResponses[index.toString()]}
                      </p>
                    </div>
                  ) : index === currentQuestionIndex ? (
                    <div className="ml-11 space-y-2">
                      <textarea
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        placeholder="Your answer..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[80px]"
                      />
                      <button
                        onClick={handleAnswerSubmit}
                        disabled={!currentAnswer.trim() || isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {isLoading ? 'Submitting...' : 'Submit Answer'}
                      </button>
                    </div>
                  ) : (
                    <div className="ml-11 text-sm text-gray-500 dark:text-gray-400 italic">
                      Answer previous questions first
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Ready Phase */}
          {draft.status === 'ready' && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Your AI-generated reply is ready! Feel free to edit before
                  sending.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject:
                </label>
                <input
                  type="text"
                  value={draft.draftSubject}
                  onChange={(e) =>
                    handleUpdateDraft(draft.draftBody, e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Body:
                </label>
                <textarea
                  value={draft.draftBody}
                  onChange={(e) =>
                    handleUpdateDraft(e.target.value, draft.draftSubject)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[300px] font-mono text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors font-medium"
          >
            Close
          </button>

          {draft.status === 'ready' && (
            <div className="flex gap-3">
              <button
                onClick={handleRegenerate}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition-colors font-medium"
              >
                <RefreshCw size={16} />
                Regenerate
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                <Send size={16} />
                Send Reply
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
