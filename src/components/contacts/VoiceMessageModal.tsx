'use client';

/**
 * Voice Message Modal
 * Make voice calls with text-to-speech
 */

import { useState } from 'react';
import { X, Phone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { callContact } from '@/lib/contacts/communication-actions';

interface VoiceMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string;
  recipientName: string;
  recipientPhone: string;
}

export function VoiceMessageModal({
  isOpen,
  onClose,
  contactId,
  recipientName,
  recipientPhone,
}: VoiceMessageModalProps) {
  const [message, setMessage] = useState('');
  const [isCalling, setIsCalling] = useState(false);

  if (!isOpen) return null;

  const handleCall = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsCalling(true);

    try {
      const result = await callContact(contactId, message, 'tts');

      if (result.success) {
        toast.success(`Voice call initiated to ${recipientName}`);
        setMessage('');
        onClose();
      } else {
        toast.error(result.error || 'Failed to make call');
      }
    } catch (error) {
      console.error('Voice call error:', error);
      toast.error('Failed to make call');
    } finally {
      setIsCalling(false);
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
                Voice Call (Text-to-Speech)
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
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter the message that will be spoken..."
                className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                disabled={isCalling}
                autoFocus
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                How it works:
              </h3>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• The recipient will receive a phone call</li>
                <li>• Your message will be read aloud using text-to-speech</li>
                <li>• Voice call charges may apply based on your plan</li>
                <li>• Keep messages clear and concise for best results</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={isCalling}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCall}
              disabled={isCalling || !message.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCalling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Calling...</span>
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4" />
                  <span>Make Call</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

