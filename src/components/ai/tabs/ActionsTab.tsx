'use client';

import { useState, useEffect } from 'react';
import {
  Mic,
  Mail,
  Users,
  Calendar,
  Settings,
  MessageSquare,
  Clock,
  Zap,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { EmailComposer } from '@/components/email/EmailComposer';

interface ActionButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  onClick: () => void;
  variant?: 'default' | 'primary';
}

function ActionButton({
  icon: Icon,
  label,
  description,
  onClick,
  variant = 'default',
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-start gap-3 p-4 rounded-lg border transition-all text-left w-full
        ${
          variant === 'primary'
            ? 'bg-gradient-to-br from-primary/10 to-pink-500/10 border-primary hover:border-primary/80 hover:shadow-md'
            : 'bg-white dark:bg-gray-800 border-gray-200 hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:hover:border-primary dark:hover:bg-primary/10'
        }
      `}
    >
      <div className="flex-shrink-0 mt-0.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </button>
  );
}

export function ActionsTab(): JSX.Element {
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<'email' | 'voice' | 'dictation'>('email');

  const handleOpenVoiceRecorder = () => {
    setComposerMode('voice');
    setIsComposerOpen(true);
    toast.success('Opening voice recorder...');
  };

  const handleOpenDictation = () => {
    setComposerMode('dictation');
    setIsComposerOpen(true);
    toast.success('Starting dictation...');
  };

  // Trigger voice recording or dictation after composer opens
  useEffect(() => {
    if (!isComposerOpen) return;

    if (composerMode === 'voice') {
      const timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('start-voice-recording'));
      }, 500);
      return () => clearTimeout(timer);
    } else if (composerMode === 'dictation') {
      const timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('start-dictation'));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isComposerOpen, composerMode]);

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {/* Voice Features */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">
              Voice Features
            </h3>
            <div className="grid gap-3">
              <ActionButton
                icon={Mic}
                label="Record Voice Message"
                description="Create an audio message to send via email"
                onClick={handleOpenVoiceRecorder}
                variant="primary"
              />
              <ActionButton
                icon={MessageSquare}
                label="Dictate Email"
                description="Use voice to compose an email with AI"
                onClick={handleOpenDictation}
              />
            </div>
          </div>

          {/* Email Management */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">
              Email Management
            </h3>
            <div className="grid gap-3">
              <ActionButton
                icon={Clock}
                label="Scheduled Emails"
                description="View and manage scheduled emails"
                onClick={() => {
                  window.location.href = '/dashboard/scheduled';
                }}
              />
              <ActionButton
                icon={Zap}
                label="Email Rules"
                description="Automate email actions with rules"
                onClick={() => {
                  window.location.href = '/dashboard/settings?tab=rules';
                }}
              />
              <ActionButton
                icon={FileText}
                label="Attachments"
                description="View all email attachments"
                onClick={() => {
                  window.location.href = '/dashboard/attachments';
                }}
              />
            </div>
          </div>

          {/* Contacts & Communication */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">
              Contacts
            </h3>
            <div className="grid gap-3">
              <ActionButton
                icon={Users}
                label="View Contacts"
                description="Manage your contacts and groups"
                onClick={() => {
                  window.location.href = '/dashboard/contacts';
                }}
              />
              <ActionButton
                icon={Users}
                label="Add Contact"
                description="Manually add a new contact"
                onClick={() => {
                  window.location.href = '/dashboard/contacts?action=add';
                }}
              />
            </div>
          </div>

          {/* Calendar */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">
              Calendar
            </h3>
            <div className="grid gap-3">
              <ActionButton
                icon={Calendar}
                label="Schedule Meeting"
                description="Create a new calendar event"
                onClick={() => {
                  window.location.href = '/dashboard/calendar?action=new';
                }}
              />
              <ActionButton
                icon={Calendar}
                label="View Events"
                description="See your upcoming events"
                onClick={() => {
                  window.location.href = '/dashboard/calendar';
                }}
              />
            </div>
          </div>

          {/* Quick Settings */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">
              Quick Settings
            </h3>
            <div className="grid gap-3">
              <ActionButton
                icon={Settings}
                label="Email Accounts"
                description="Manage connected email accounts"
                onClick={() => {
                  window.location.href = '/dashboard/settings?tab=email-accounts';
                }}
              />
              <ActionButton
                icon={Settings}
                label="Preferences"
                description="Configure app settings"
                onClick={() => {
                  window.location.href = '/dashboard/settings';
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Email Composer Modal */}
      <EmailComposer
        isOpen={isComposerOpen}
        onClose={() => {
          setIsComposerOpen(false);
          setComposerMode('email');
        }}
        initialData={undefined}
      />
    </>
  );
}

