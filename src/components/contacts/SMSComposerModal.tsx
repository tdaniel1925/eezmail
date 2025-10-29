'use client';

/**
 * SMS Composer Modal
 * Send SMS messages to contacts
 */

import { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { sendContactSMS } from '@/lib/contacts/communication-actions';

interface SMSComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string;
  recipientName: string;
  recipientPhone: string;
}

export function SMSComposerModal({
  isOpen,
  onClose,
  contactId,
  recipientName,
  recipientPhone,
}: SMSComposerModalProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const MAX_LENGTH = 160;
  const remaining = MAX_LENGTH - message.length;

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!message.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a message' });
      return;
    }

    if (message.length > MAX_LENGTH) {
      setStatusMessage({
        type: 'error',
        text: `Message is too long (${message.length}/${MAX_LENGTH} characters)`,
      });
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    try {
      const result = await sendContactSMS(contactId, message);

      if (result.success) {
        setStatusMessage({
          type: 'success',
          text: `✅ SMS sent successfully to ${recipientName}! Delivery status will be tracked.`,
        });
        setMessage('');

        // Check delivery status after 5 seconds
        if (result.messageSid) {
          setTimeout(async () => {
            try {
              const statusResponse = await fetch(
                `/api/twilio/sms-status/${result.messageSid}`
              );
              const statusData = await statusResponse.json();

              if (statusData.success) {
                const status = statusData.status;
                if (status === 'delivered') {
                  setStatusMessage({
                    type: 'success',
                    text: `✅ SMS delivered to ${recipientName}!`,
                  });
                } else if (status === 'failed' || status === 'undelivered') {
                  setStatusMessage({
                    type: 'error',
                    text: `❌ SMS failed to deliver: ${statusData.errorMessage || 'Unknown error'}`,
                  });
                } else {
                  setStatusMessage({
                    type: 'success',
                    text: `📤 SMS ${status} - waiting for delivery confirmation...`,
                  });
                }
              }
            } catch (error) {
              console.error('Error checking SMS status:', error);
            }
          }, 5000);
        }

        // Auto-close after 7 seconds (AFTER status check completes at 5s)
        setTimeout(() => {
          onClose();
          setStatusMessage(null);
        }, 7000); // ✅ Fixed: Close after status check
      } else {
        setStatusMessage({
          type: 'error',
          text: result.error || 'Failed to send SMS',
        });
      }
    } catch (error) {
      console.error('SMS send error:', error);
      setStatusMessage({
        type: 'error',
        text: 'Failed to send SMS. Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSend();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Send SMS
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                To: {recipientName} ({recipientPhone})
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Inline Status Message */}
            {statusMessage && (
              <div
                className={`mb-4 p-3 rounded-lg ${
                  statusMessage.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                }`}
              >
                <p className="text-sm font-medium">{statusMessage.text}</p>
              </div>
            )}

            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setStatusMessage(null); // Clear status when typing
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              disabled={isSending}
              autoFocus
            />

            {/* Character Counter */}
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                SMS charges may apply depending on your plan
              </p>
              <p
                className={`text-sm font-medium ${
                  remaining < 0
                    ? 'text-red-600'
                    : remaining < 20
                      ? 'text-yellow-600'
                      : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {remaining} / {MAX_LENGTH}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={
                isSending || !message.trim() || message.length > MAX_LENGTH
              }
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send SMS</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
