'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
  UserPlus,
  Bell,
  CheckSquare,
  Reply,
  Forward,
} from 'lucide-react';
import type { Email } from '@/db/schema';
import {
  detectEmailContext,
  type ContextualAction,
} from '@/lib/email/context-detector';
import { toast } from '@/lib/toast';

interface ContextualActionsProps {
  email: Email;
}

const ACTION_ICONS = {
  calendar: Calendar,
  contact: UserPlus,
  reminder: Bell,
  task: CheckSquare,
  reply: Reply,
  forward: Forward,
  archive: CheckSquare,
};

export function ContextualActions({
  email,
}: ContextualActionsProps): JSX.Element {
  const [actions, setActions] = useState<ContextualAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Detect contextual actions
    const detectedActions = detectEmailContext(email);
    setActions(detectedActions);
    setLoading(false);
  }, [email.id]);

  const handleAction = async (action: ContextualAction): Promise<void> => {
    switch (action.type) {
      case 'calendar':
        toast.success('Calendar feature coming soon!');
        break;
      case 'contact':
        toast.success('Contact feature coming soon!');
        break;
      case 'reminder':
        toast.success('Reminder feature coming soon!');
        break;
      case 'task':
        toast.success('Task feature coming soon!');
        break;
      case 'reply':
        // Navigate to compose with reply
        window.location.href = `/dashboard/compose?reply=${email.id}`;
        break;
      case 'forward':
        // Navigate to compose with forward
        window.location.href = `/dashboard/compose?forward=${email.id}`;
        break;
      default:
        toast.info('Action not implemented yet');
    }
  };

  if (loading || actions.length === 0) {
    return <></>;
  }

  return (
    <div
      className="flex flex-wrap gap-2 mt-6 pt-3 border-t"
      style={{ borderColor: 'var(--border-color)' }}
    >
      <div
        className="text-xs font-medium"
        style={{ color: 'var(--text-secondary)' }}
      >
        Suggested Actions:
      </div>
      <div className="flex flex-wrap gap-2 w-full">
        {actions.map((action) => {
          const Icon = ACTION_ICONS[action.type];
          return (
            <button
              key={action.type}
              onClick={(e) => {
                e.stopPropagation();
                handleAction(action);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border"
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--accent-blue)',
                color: 'var(--accent-blue)',
              }}
              title={action.description}
            >
              <Icon size={14} />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
