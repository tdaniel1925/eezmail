'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  Mic,
  Phone,
  Calendar,
  FileText,
  Share2,
  UserPlus,
  Edit,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getContactTimelineEvents } from '@/lib/contacts/timeline-actions';
import type { ContactEventType } from '@/lib/contacts/timeline-actions';
import { toast } from 'sonner';

interface TimelineEvent {
  id: string;
  eventType: ContactEventType;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

interface ContactTimelineProps {
  contactId: string;
}

const eventIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  email_sent: Mail,
  email_received: Mail,
  voice_message_sent: Mic,
  voice_message_received: Mic,
  note_added: FileText,
  call_made: Phone,
  meeting_scheduled: Calendar,
  document_shared: Share2,
  contact_created: UserPlus,
  contact_updated: Edit,
};

const eventColors: Record<string, string> = {
  email_sent: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  email_received: 'text-green-600 bg-green-100 dark:bg-green-900/30',
  voice_message_sent: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
  voice_message_received: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
  note_added: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
  call_made: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30',
  meeting_scheduled: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30',
  document_shared: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
  contact_created: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30',
  contact_updated: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30',
};

export function ContactTimeline({
  contactId,
}: ContactTimelineProps): JSX.Element {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<ContactEventType | null>(
    null
  );

  // Load timeline from server
  useEffect(() => {
    loadTimeline();
  }, [contactId, selectedFilter]);

  const loadTimeline = async () => {
    setIsLoading(true);
    try {
      const result = await getContactTimelineEvents(contactId, selectedFilter || undefined);
      if (result.success && result.events) {
        setEvents(
          result.events.map((event) => ({
            ...event,
            createdAt: new Date(event.createdAt),
          }))
        );
      } else {
        toast.error(result.error || 'Failed to load timeline');
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
      toast.error('Failed to load timeline');
    } finally {
      setIsLoading(false);
    }
  };

  const eventTypes = Array.from(new Set(events.map((e) => e.eventType)));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No timeline events yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-500" />
        <select
          value={selectedFilter || ''}
          onChange={(e) => setSelectedFilter(e.target.value || null)}
          className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="">All Events ({events.length})</option>
          {eventTypes.map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}{' '}
              ({events.filter((e) => e.eventType === type).length})
            </option>
          ))}
        </select>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

        {/* Events */}
        <div className="space-y-6">
          {events.map((event, idx) => {
            const Icon = eventIcons[event.eventType] || FileText;
            const colorClass =
              eventColors[event.eventType] || eventColors.note_added;

            return (
              <div key={event.id} className="relative flex gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center z-10',
                    colorClass
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {event.title}
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                        {event.createdAt.toLocaleDateString()} at{' '}
                        {event.createdAt.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {events.length === 0 && selectedFilter && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No {selectedFilter.replace(/_/g, ' ')} events found
          </p>
        </div>
      )}
    </div>
  );
}
