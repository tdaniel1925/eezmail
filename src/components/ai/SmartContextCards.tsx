'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Calendar,
  CheckSquare,
  Link as LinkIcon,
  FileText,
  TrendingUp,
  Clock,
  Mail,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Email } from '@/db/schema';

interface SmartContextCardsProps {
  email: Email | null;
}

interface ContextCard {
  type: 'person' | 'event' | 'task' | 'link' | 'document';
  title: string;
  data: any;
}

export function SmartContextCards({
  email,
}: SmartContextCardsProps): JSX.Element {
  const [cards, setCards] = useState<ContextCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      setCards([]);
      return;
    }

    const analyzeContext = async () => {
      setIsLoading(true);
      try {
        // TODO: Call AI service to analyze email and determine relevant context
        // For now, show mock cards based on email properties
        const detectedCards: ContextCard[] = [];

        // Person card - always show for sender
        detectedCards.push({
          type: 'person',
          title: 'About Sender',
          data: {
            name: email.fromAddress?.name || email.fromAddress?.email,
            email: email.fromAddress?.email,
            recentEmails: 12,
            avgResponseTime: '2 hours',
            sentiment: 'professional',
          },
        });

        // TODO: Detect events, tasks, links dynamically

        setCards(detectedCards);
      } catch (error) {
        console.error('Context analysis error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    analyzeContext();
  }, [email?.id]);

  if (!email) {
    return (
      <div className="p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
          Smart Context
        </h3>
        <div className="text-left text-sm text-gray-500 dark:text-gray-400">
          Context cards will appear here
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
          Smart Context
        </h3>
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 py-8">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Analyzing context...</span>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 p-4 border-b border-gray-200 dark:border-gray-700">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Smart Context
      </h3>

      {cards.map((card, index) => (
        <div key={index}>
          {card.type === 'person' && <PersonCard data={card.data} />}
          {card.type === 'event' && <EventCard data={card.data} />}
          {card.type === 'task' && <TaskCard data={card.data} />}
          {card.type === 'link' && <LinkCard data={card.data} />}
          {card.type === 'document' && <DocumentCard data={card.data} />}
        </div>
      ))}
    </div>
  );
}

// Person Context Card
function PersonCard({ data }: { data: any }): JSX.Element {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-900/20">
      <div className="mb-2 flex items-center space-x-2">
        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-300">
          About {data.name}
        </h4>
      </div>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-blue-600 dark:text-blue-400">
            Recent emails:
          </span>
          <span className="font-medium text-blue-700 dark:text-blue-300">
            {data.recentEmails}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-blue-600 dark:text-blue-400">
            Avg response:
          </span>
          <span className="font-medium text-blue-700 dark:text-blue-300">
            {data.avgResponseTime}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-blue-600 dark:text-blue-400">Tone:</span>
          <span className="font-medium text-blue-700 dark:text-blue-300 capitalize">
            {data.sentiment}
          </span>
        </div>
      </div>
      <button className="mt-3 w-full rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors">
        View History
      </button>
    </div>
  );
}

// Event Context Card
function EventCard({ data }: { data: any }): JSX.Element {
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-900/20">
      <div className="mb-2 flex items-center space-x-2">
        <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
        <h4 className="text-xs font-semibold text-green-700 dark:text-green-300">
          Event Detected
        </h4>
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="font-medium text-green-700 dark:text-green-300">
          {data.title}
        </div>
        <div className="text-green-600 dark:text-green-400">
          {data.date} at {data.time}
        </div>
        {data.hasConflict && (
          <div className="text-orange-600 dark:text-orange-400">
            ⚠️ Calendar conflict detected
          </div>
        )}
      </div>
      <button className="mt-3 w-full rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors">
        Add to Calendar
      </button>
    </div>
  );
}

// Task Context Card
function TaskCard({ data }: { data: any }): JSX.Element {
  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-900/20">
      <div className="mb-2 flex items-center space-x-2">
        <CheckSquare className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <h4 className="text-xs font-semibold text-orange-700 dark:text-orange-300">
          Tasks Detected
        </h4>
      </div>
      <ul className="space-y-1.5 mb-3">
        {data.tasks.map((task: string, idx: number) => (
          <li
            key={idx}
            className="flex items-start space-x-2 text-xs text-orange-700 dark:text-orange-300"
          >
            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-600" />
            <span>{task}</span>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <button className="flex-1 rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700 transition-colors">
          Create Tasks
        </button>
        <button className="flex-1 rounded-md border border-orange-600 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
          Suggest Due Date
        </button>
      </div>
    </div>
  );
}

// Link Context Card
function LinkCard({ data }: { data: any }): JSX.Element {
  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-900 dark:bg-purple-900/20">
      <div className="mb-2 flex items-center space-x-2">
        <LinkIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <h4 className="text-xs font-semibold text-purple-700 dark:text-purple-300">
          Links & Attachments
        </h4>
      </div>
      <div className="space-y-2">
        {data.links.map((link: any, idx: number) => (
          <div
            key={idx}
            className="rounded border border-purple-200 bg-white p-2 dark:border-purple-800 dark:bg-purple-950/50"
          >
            <div className="text-xs font-medium text-purple-700 dark:text-purple-300 truncate">
              {link.title}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 truncate">
              {link.url}
            </div>
            {link.isSafe !== undefined && (
              <div
                className={cn(
                  'text-xs mt-1',
                  link.isSafe ? 'text-green-600' : 'text-red-600'
                )}
              >
                {link.isSafe ? '✓ Safe' : '⚠️ Check before opening'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Document Context Card
function DocumentCard({ data }: { data: any }): JSX.Element {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-2 flex items-center space-x-2">
        <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          Related Documents
        </h4>
      </div>
      <div className="space-y-2">
        {data.documents.map((doc: any, idx: number) => (
          <button
            key={idx}
            className="w-full text-left rounded border border-gray-200 bg-gray-50 p-2 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {doc.title}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {doc.date} • {doc.type}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
