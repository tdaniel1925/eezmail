'use client';

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MeetingData {
  hasMeeting: boolean;
  title?: string;
  date?: string;
  time?: string;
  duration?: number;
  location?: string;
  attendees?: string[];
  agenda?: string;
  confidence?: 'high' | 'medium' | 'low';
}

interface MeetingDetectorProps {
  emailId: string;
  subject: string;
  bodyText: string;
  senderName?: string;
}

export function MeetingDetector({
  emailId,
  subject,
  bodyText,
  senderName,
}: MeetingDetectorProps): JSX.Element {
  const [meeting, setMeeting] = useState<MeetingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);

  // Detect meeting on component mount
  useEffect(() => {
    detectMeeting();
  }, [emailId]);

  const detectMeeting = async (): Promise<void> => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/detect-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          bodyText,
          senderName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to detect meeting');
      }

      const data = await response.json();

      if (data.success && data.hasMeeting) {
        setMeeting(data);
      }
    } catch (error) {
      console.error('Error detecting meeting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCalendar = async (): Promise<void> => {
    if (!meeting || !meeting.hasMeeting) return;

    setIsAddingToCalendar(true);

    try {
      // TODO: Implement calendar integration
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success('Meeting added to calendar!');
    } catch (error) {
      console.error('Error adding to calendar:', error);
      toast.error('Failed to add to calendar');
    } finally {
      setIsAddingToCalendar(false);
    }
  };

  if (isLoading || !meeting || !meeting.hasMeeting) {
    return <></>;
  }

  const confidenceColor =
    meeting.confidence === 'high'
      ? 'border-green-300 dark:border-green-500/40 bg-green-50 dark:bg-green-500/10'
      : meeting.confidence === 'medium'
        ? 'border-yellow-300 dark:border-yellow-500/40 bg-yellow-50 dark:bg-yellow-500/10'
        : 'border-gray-300 dark:border-gray-500/40 bg-gray-50 dark:bg-gray-500/10';

  return (
    <div
      className={cn('rounded-lg border p-4 transition-all', confidenceColor)}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Meeting Detected
          </h3>
        </div>
        <span
          className={cn(
            'text-xs font-medium uppercase px-2 py-0.5 rounded-full',
            meeting.confidence === 'high'
              ? 'bg-green-200 dark:bg-green-500/30 text-green-700 dark:text-green-300'
              : meeting.confidence === 'medium'
                ? 'bg-yellow-200 dark:bg-yellow-500/30 text-yellow-700 dark:text-yellow-300'
                : 'bg-gray-200 dark:bg-gray-500/30 text-gray-700 dark:text-gray-300'
          )}
        >
          {meeting.confidence} confidence
        </span>
      </div>

      <div className="space-y-2">
        {meeting.title && (
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {meeting.title}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-white/70">
          {meeting.date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(meeting.date).toLocaleDateString()}</span>
            </div>
          )}

          {meeting.time && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                {meeting.time}
                {meeting.duration && ` (${meeting.duration} min)`}
              </span>
            </div>
          )}

          {meeting.location && (
            <div className="col-span-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{meeting.location}</span>
            </div>
          )}

          {meeting.attendees && meeting.attendees.length > 0 && (
            <div className="col-span-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{meeting.attendees.join(', ')}</span>
            </div>
          )}
        </div>

        {meeting.agenda && (
          <p className="mt-2 text-sm text-gray-600 dark:text-white/60">
            {meeting.agenda}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={addToCalendar}
        disabled={isAddingToCalendar}
        className={cn(
          'mt-4 w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2 px-4',
          'transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
          'flex items-center justify-center gap-2'
        )}
      >
        <Calendar className="h-4 w-4" />
        {isAddingToCalendar ? 'Adding...' : 'Add to Calendar'}
      </button>
    </div>
  );
}

