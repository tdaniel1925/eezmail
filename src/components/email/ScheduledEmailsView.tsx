'use client';

import { useState, useEffect } from 'react';
import { Clock, Edit, Trash2, Mail, Calendar, AlertCircle } from 'lucide-react';
import {
  getScheduledEmails,
  cancelScheduledEmail,
  type ScheduledEmail,
} from '@/lib/email/scheduler-actions';
import { toast } from 'sonner';

export function ScheduledEmailsView() {
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent' | 'failed'>(
    'pending'
  );

  useEffect(() => {
    loadScheduledEmails();
  }, [filter]);

  const loadScheduledEmails = async () => {
    setIsLoading(true);
    try {
      const result = await getScheduledEmails({
        status: filter === 'all' ? undefined : filter,
      });

      if (result.success && result.scheduledEmails) {
        setScheduledEmails(result.scheduledEmails);
      } else {
        toast.error(result.error || 'Failed to load scheduled emails');
      }
    } catch (error) {
      console.error('Error loading scheduled emails:', error);
      toast.error('Failed to load scheduled emails');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (emailId: string) => {
    if (
      !confirm(
        'Are you sure you want to cancel this scheduled email? This cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const result = await cancelScheduledEmail(emailId);

      if (result.success) {
        toast.success('Scheduled email cancelled');
        loadScheduledEmails();
      } else {
        toast.error(result.error || 'Failed to cancel scheduled email');
      }
    } catch (error) {
      console.error('Error cancelling scheduled email:', error);
      toast.error('Failed to cancel scheduled email');
    }
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950';
      case 'sent':
        return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950';
      case 'failed':
        return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950';
      default:
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'sent':
        return <Mail className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 px-8 py-6 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Scheduled Emails
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              View and manage your scheduled emails
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
            {(['all', 'pending', 'sent', 'failed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  filter === status
                    ? 'bg-white text-primary shadow-sm dark:bg-gray-900'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto p-8">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <div className="text-gray-600 dark:text-gray-400">
                Loading scheduled emails...
              </div>
            </div>
          </div>
        ) : scheduledEmails.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <Calendar className="mb-4 h-16 w-16 text-gray-400" />
            <p className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              No scheduled emails
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filter === 'pending'
                ? 'You have no pending scheduled emails'
                : filter === 'sent'
                  ? 'No emails have been sent yet'
                  : filter === 'failed'
                    ? 'No failed emails to show'
                    : "You haven't scheduled any emails yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {scheduledEmails.map((email) => (
              <div
                key={email.id}
                className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  {/* Email Info */}
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(email.status)}`}
                      >
                        {getStatusIcon(email.status)}
                        {email.status.charAt(0).toUpperCase() +
                          email.status.slice(1)}
                      </span>

                      {/* Scheduled Time */}
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        {email.status === 'sent' && email.sentAt
                          ? `Sent ${formatDateTime(email.sentAt)}`
                          : `Scheduled for ${formatDateTime(email.scheduledFor)}`}
                      </div>
                    </div>

                    {/* Subject */}
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                      {email.subject}
                    </h3>

                    {/* To */}
                    <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">To:</span> {email.to}
                      {email.cc && (
                        <>
                          {' '}
                          • <span className="font-medium">Cc:</span> {email.cc}
                        </>
                      )}
                    </p>

                    {/* Body Preview */}
                    <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                      {email.body.replace(/<[^>]*>/g, '').substring(0, 150)}...
                    </p>

                    {/* Error Message */}
                    {email.status === 'failed' && email.errorMessage && (
                      <div className="mt-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
                        <div>
                          <p className="text-sm font-medium text-red-900 dark:text-red-100">
                            Failed to send
                          </p>
                          <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                            {email.errorMessage}
                          </p>
                          {email.attemptCount > 0 && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                              Attempted {email.attemptCount} time(s)
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Attachments Count */}
                    {email.attachments &&
                      Array.isArray(email.attachments) &&
                      email.attachments.length > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                          <Mail className="h-4 w-4" />
                          {email.attachments.length} attachment(s)
                        </div>
                      )}
                  </div>

                  {/* Actions */}
                  {email.status === 'pending' && (
                    <div className="ml-4 flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      {/* Cancel Button */}
                      <button
                        onClick={() => handleCancel(email.id)}
                        className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        <Trash2 className="h-4 w-4" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
