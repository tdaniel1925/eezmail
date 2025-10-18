'use client';

import { useState } from 'react';
import {
  Reply,
  Forward,
  Archive,
  Trash2,
  Star,
  Sparkles,
  Calendar,
  Tag,
  Loader2,
} from 'lucide-react';
import { Email } from '@/stores/aiPanelStore';
import { toast } from 'sonner';
import { EmailComposer } from '@/components/email/EmailComposer';
import {
  archiveEmail,
  deleteEmail,
  getEmailForReply,
  getEmailForForward,
} from '@/lib/email/email-actions';

interface EmailQuickActionsProps {
  email: Email;
}

export function EmailQuickActions({
  email,
}: EmailQuickActionsProps): JSX.Element {
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<
    'compose' | 'reply' | 'forward'
  >('compose');
  const [composerInitialData, setComposerInitialData] = useState<{
    to?: string;
    subject?: string;
    body?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [showTasks, setShowTasks] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);

  // Basic Actions
  const handleReply = async () => {
    setIsLoading(true);
    setLoadingAction('reply');
    try {
      const result = await getEmailForReply(email.id);
      if (result.success && result.data) {
        setComposerMode('reply');
        setComposerInitialData({
          to: result.data.to,
          subject: result.data.subject,
          body: result.data.body,
        });
        setIsComposerOpen(true);
      } else {
        toast.error(result.error || 'Failed to load email for reply');
      }
    } catch (error) {
      console.error('Reply error:', error);
      toast.error('Failed to open reply composer');
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleForward = async () => {
    setIsLoading(true);
    setLoadingAction('forward');
    try {
      const result = await getEmailForForward(email.id);
      if (result.success && result.data) {
        setComposerMode('forward');
        setComposerInitialData({
          subject: result.data.subject,
          body: result.data.body,
        });
        setIsComposerOpen(true);
      } else {
        toast.error(result.error || 'Failed to load email for forward');
      }
    } catch (error) {
      console.error('Forward error:', error);
      toast.error('Failed to open forward composer');
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleArchive = async () => {
    setIsLoading(true);
    setLoadingAction('archive');
    try {
      const result = await archiveEmail(email.id);
      if (result.success) {
        toast.success('Email archived');
        // Trigger email list refresh
        window.dispatchEvent(new CustomEvent('refresh-email-list'));
        // Close email viewer
        window.dispatchEvent(new CustomEvent('close-email-viewer'));
      } else {
        toast.error(result.message || 'Failed to archive email');
      }
    } catch (error) {
      console.error('Archive error:', error);
      toast.error('Failed to archive email');
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Move this email to trash?')) {
      return;
    }

    setIsLoading(true);
    setLoadingAction('delete');
    try {
      const result = await deleteEmail(email.id);
      if (result.success) {
        toast.success('Email moved to trash');
        // Trigger email list refresh
        window.dispatchEvent(new CustomEvent('refresh-email-list'));
        // Close email viewer
        window.dispatchEvent(new CustomEvent('close-email-viewer'));
      } else {
        toast.error(result.message || 'Failed to delete email');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete email');
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  // AI Actions
  const handleGenerateReply = async () => {
    setIsLoading(true);
    setLoadingAction('generate-reply');
    try {
      const response = await fetch('/api/ai/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalSubject: email.subject,
          originalBody: email.body || email.snippet,
          senderEmail: email.from,
          emailId: email.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate reply');

      const data = await response.json();

      if (data.success || data.reply) {
        const replyData = data.reply || data;
        setComposerMode('reply');
        setComposerInitialData({
          to: email.from,
          subject: replyData.subject || `Re: ${email.subject}`,
          body: replyData.body || replyData.content || '',
        });
        setIsComposerOpen(true);
        toast.success('AI reply generated!');
      } else {
        throw new Error(data.error || 'Failed to generate reply');
      }
    } catch (error) {
      console.error('Generate reply error:', error);
      toast.error('Failed to generate AI reply');
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleSummarize = async () => {
    setIsLoading(true);
    setLoadingAction('summarize');
    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId: email.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to summarize email');

      const data = await response.json();

      if (data.success && data.summary) {
        setSummary(data.summary);
        setShowSummary(true);
        toast.success('Email summarized!');
      } else {
        throw new Error(data.error || 'Failed to summarize');
      }
    } catch (error) {
      console.error('Summarize error:', error);
      toast.error('Failed to generate summary');
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleExtractTasks = async () => {
    setIsLoading(true);
    setLoadingAction('extract-tasks');
    try {
      const response = await fetch('/api/ai/extract-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: email.subject,
          bodyText: email.body || email.snippet,
          emailId: email.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to extract tasks');

      const data = await response.json();

      if (data.success && data.actions) {
        setTasks(data.actions);
        setShowTasks(true);
        toast.success(
          `Found ${data.actions.length} action item${data.actions.length !== 1 ? 's' : ''}!`
        );
      } else {
        throw new Error(data.error || 'Failed to extract tasks');
      }
    } catch (error) {
      console.error('Extract tasks error:', error);
      toast.error('Failed to extract action items');
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleSmartLabel = async () => {
    setIsLoading(true);
    setLoadingAction('smart-label');
    try {
      const response = await fetch('/api/ai/analyze-sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: email.subject,
          bodyText: email.body || email.snippet,
          emailId: email.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to analyze email');

      const data = await response.json();

      if (data.success) {
        const sentiment = data.sentiment || 'neutral';
        const category = data.category || 'general';
        toast.success(`Suggested labels: ${sentiment}, ${category}`);
        // In a real implementation, you would apply these labels to the email
      } else {
        throw new Error(data.error || 'Failed to analyze');
      }
    } catch (error) {
      console.error('Smart label error:', error);
      toast.error('Failed to generate smart labels');
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const basicActions = [
    {
      icon: Reply,
      label: 'Reply',
      onClick: handleReply,
      loading: loadingAction === 'reply',
    },
    {
      icon: Forward,
      label: 'Forward',
      onClick: handleForward,
      loading: loadingAction === 'forward',
    },
    {
      icon: Archive,
      label: 'Archive',
      onClick: handleArchive,
      loading: loadingAction === 'archive',
    },
    {
      icon: Trash2,
      label: 'Delete',
      onClick: handleDelete,
      destructive: true,
      loading: loadingAction === 'delete',
    },
  ];

  const aiActions = [
    {
      icon: Sparkles,
      label: 'Generate Reply',
      onClick: handleGenerateReply,
      ai: true,
      loading: loadingAction === 'generate-reply',
    },
    {
      icon: Sparkles,
      label: 'Summarize',
      onClick: handleSummarize,
      ai: true,
      loading: loadingAction === 'summarize',
    },
    {
      icon: Calendar,
      label: 'Extract Tasks',
      onClick: handleExtractTasks,
      ai: true,
      loading: loadingAction === 'extract-tasks',
    },
    {
      icon: Tag,
      label: 'Smart Label',
      onClick: handleSmartLabel,
      ai: true,
      loading: loadingAction === 'smart-label',
    },
  ];

  return (
    <>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {basicActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  disabled={isLoading}
                  className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    action.destructive
                      ? 'border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {action.loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {aiActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-md border border-primary/30 text-primary hover:bg-primary/10 dark:border-primary/50 dark:hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {action.loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary Display */}
        {showSummary && summary && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                Summary
              </h4>
              <button
                onClick={() => setShowSummary(false)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                ×
              </button>
            </div>
            <p className="text-xs text-blue-800 dark:text-blue-200">
              {summary}
            </p>
          </div>
        )}

        {/* Tasks Display */}
        {showTasks && tasks.length > 0 && (
          <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-xs font-semibold text-purple-900 dark:text-purple-100">
                Action Items ({tasks.length})
              </h4>
              <button
                onClick={() => setShowTasks(false)}
                className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
              >
                ×
              </button>
            </div>
            <ul className="space-y-2">
              {tasks.map((task, index) => (
                <li
                  key={index}
                  className="text-xs text-purple-800 dark:text-purple-200 flex items-start gap-2"
                >
                  <span className="text-purple-500">•</span>
                  <span>
                    {task.description}
                    {task.dueDate && (
                      <span className="ml-2 text-purple-600 dark:text-purple-400">
                        (Due: {new Date(task.dueDate).toLocaleDateString()})
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Email Composer Modal */}
      <EmailComposer
        isOpen={isComposerOpen}
        onClose={() => {
          setIsComposerOpen(false);
          setComposerMode('compose');
          setComposerInitialData({});
        }}
        mode={composerMode}
        initialData={composerInitialData}
      />
    </>
  );
}
