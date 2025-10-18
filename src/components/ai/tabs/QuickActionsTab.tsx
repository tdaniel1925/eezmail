'use client';

import { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Mic,
  Mail,
  Users,
  Calendar,
  Settings,
  MessageSquare,
  FileText,
  Clock,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { EmailComposer } from '@/components/email/EmailComposer';

interface AccordionSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function AccordionSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {isOpen && <div className="p-4 pt-0 space-y-2">{children}</div>}
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  onClick: () => void;
}

function ActionButton({
  icon: Icon,
  label,
  description,
  onClick,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 p-3 rounded-md border border-gray-200 hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:hover:border-primary dark:hover:bg-primary/10 transition-colors text-left"
    >
      <div className="flex-shrink-0 mt-0.5">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </p>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {description}
          </p>
        )}
      </div>
    </button>
  );
}

export function QuickActionsTab(): JSX.Element {
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<
    'email' | 'voice' | 'dictation'
  >('email');

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
      // Small delay to let composer render
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
      <div className="flex-1 overflow-y-auto">
        {/* Voice Recording */}
        <AccordionSection title="Voice Recording" icon={Mic} defaultOpen={true}>
          <ActionButton
            icon={Mic}
            label="Record Voice Message"
            description="Create an audio message to send via email"
            onClick={handleOpenVoiceRecorder}
          />
          <ActionButton
            icon={MessageSquare}
            label="Dictate Email"
            description="Use voice to compose an email"
            onClick={handleOpenDictation}
          />
        </AccordionSection>

        {/* Email Management */}
        <AccordionSection title="Email Management" icon={Mail}>
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
        </AccordionSection>

        {/* Contacts */}
        <AccordionSection title="Contacts" icon={Users}>
          <ActionButton
            icon={Users}
            label="Add Contact"
            description="Manually add a new contact"
            onClick={() => {
              window.location.href = '/dashboard/contacts?action=add';
            }}
          />
          <ActionButton
            icon={Users}
            label="Import Contacts"
            description="Import from CSV or other sources"
            onClick={() => {
              window.location.href = '/dashboard/contacts?action=import';
            }}
          />
          <ActionButton
            icon={Users}
            label="Manage Groups"
            description="Organize contacts into groups"
            onClick={() => {
              window.location.href = '/dashboard/contacts?view=groups';
            }}
          />
        </AccordionSection>

        {/* Calendar */}
        <AccordionSection title="Calendar" icon={Calendar}>
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
        </AccordionSection>

        {/* Settings Quick Access */}
        <AccordionSection title="Settings" icon={Settings}>
          <ActionButton
            icon={Settings}
            label="Email Preferences"
            description="Configure email settings"
            onClick={() => {
              window.location.href = '/dashboard/settings?tab=email-accounts';
            }}
          />
          <ActionButton
            icon={Settings}
            label="Notification Settings"
            description="Manage notifications"
            onClick={() => {
              window.location.href = '/dashboard/settings?tab=notifications';
            }}
          />
          <ActionButton
            icon={Settings}
            label="Account Settings"
            description="Manage your account"
            onClick={() => {
              window.location.href = '/dashboard/settings?tab=account';
            }}
          />
        </AccordionSection>
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
