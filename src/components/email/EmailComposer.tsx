'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Send,
  Paperclip,
  Smile,
  AtSign,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { toast, confirmDialog } from '@/lib/toast';

interface EmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'compose' | 'reply' | 'forward';
  initialData?: {
    to?: string;
    subject?: string;
    body?: string;
  };
}

export function EmailComposer({
  isOpen,
  onClose,
  mode = 'compose',
  initialData,
}: EmailComposerProps): JSX.Element | null {
  const [to, setTo] = useState(initialData?.to || '');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(initialData?.subject || '');
  const [body, setBody] = useState(initialData?.body || '');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [mounted, setMounted] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Auto-focus body when composer opens
  useEffect(() => {
    if (isOpen && !isMinimized && bodyRef.current) {
      bodyRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSend = async (): Promise<void> => {
    if (!to || !subject || !body) {
      toast.warning('Please fill in all required fields (To, Subject, Body)');
      return;
    }

    setIsSending(true);

    try {
      // TODO: Implement actual email sending via API
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Mock delay

      console.log('Sending email:', { to, cc, bcc, subject, body });

      // Reset and close
      setTo('');
      setCc('');
      setBcc('');
      setSubject('');
      setBody('');
      onClose();

      toast.success('Email sent successfully!');
    } catch (error) {
      console.error('Failed to send email:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = async (): Promise<void> => {
    if (body || subject || to) {
      const confirmed = await confirmDialog(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirmed) return;
    }
    onClose();
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      {!isMinimized && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          style={{ zIndex: 9998 }}
          onClick={handleClose}
        />
      )}

      {/* Composer Window */}
      <div
        className="fixed flex flex-col overflow-hidden rounded-lg border border-white/20 bg-white shadow-2xl dark:bg-gray-900"
        style={
          !isMinimized
            ? {
                zIndex: 9999,
                position: 'fixed',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '900px',
                height: '700px',
                maxWidth: '90vw',
                maxHeight: '90vh',
              }
            : {
                zIndex: 50,
                position: 'fixed',
                bottom: '1rem',
                right: '1rem',
                width: '320px',
                height: '56px',
              }
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200/80 bg-white/60 px-4 py-3 dark:border-white/10 dark:bg-white/5">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {mode === 'reply'
              ? 'Reply'
              : mode === 'forward'
                ? 'Forward'
                : 'New Message'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Composer Body */}
        {!isMinimized && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Recipients */}
            <div className="border-b border-gray-200/80 bg-white/40 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <label className="w-12 text-sm font-medium text-gray-700 dark:text-gray-300">
                  To:
                </label>
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none dark:text-white dark:placeholder:text-gray-500"
                />
                <div className="flex items-center gap-2 text-sm">
                  {!showCc && (
                    <button
                      type="button"
                      onClick={() => setShowCc(true)}
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                      Cc
                    </button>
                  )}
                  {!showBcc && (
                    <button
                      type="button"
                      onClick={() => setShowBcc(true)}
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                      Bcc
                    </button>
                  )}
                </div>
              </div>

              {showCc && (
                <div className="mt-2 flex items-center gap-2">
                  <label className="w-12 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cc:
                  </label>
                  <input
                    type="email"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc@example.com"
                    className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none dark:text-white dark:placeholder:text-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCc('');
                      setShowCc(false);
                    }}
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {showBcc && (
                <div className="mt-2 flex items-center gap-2">
                  <label className="w-12 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bcc:
                  </label>
                  <input
                    type="email"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    placeholder="bcc@example.com"
                    className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none dark:text-white dark:placeholder:text-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setBcc('');
                      setShowBcc(false);
                    }}
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Subject */}
            <div className="border-b border-gray-200/80 bg-white/40 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <label className="w-12 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subject:
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none dark:text-white dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4">
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message..."
                className="h-full w-full resize-none bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none dark:text-white dark:placeholder:text-gray-500"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-gray-200/80 bg-white/60 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  aria-label="Attach file"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  aria-label="Insert emoji"
                >
                  <Smile className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  aria-label="Mention"
                >
                  <AtSign className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleSend}
                disabled={isSending || !to || !subject || !body}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 font-semibold text-white transition-all hover:bg-primary/90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
