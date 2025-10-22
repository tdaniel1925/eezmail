'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { detectMeetingInEmailById } from '@/lib/ai/meeting-detector';
import { createEventFromEmail } from '@/lib/calendar/calendar-actions';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AddToCalendarButtonProps {
  emailId: string;
  userId: string;
  className?: string;
}

export function AddToCalendarButton({
  emailId,
  userId,
  className,
}: AddToCalendarButtonProps): JSX.Element | null {
  const [isDetecting, setIsDetecting] = useState(true);
  const [hasMeeting, setHasMeeting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [meetingDetails, setMeetingDetails] = useState<any>(null);

  useEffect(() => {
    detectMeeting();
  }, [emailId]);

  const detectMeeting = async () => {
    try {
      setIsDetecting(true);
      const result = await detectMeetingInEmailById(emailId, userId);

      if (result.detected && result.confidence > 0.6) {
        setHasMeeting(true);
        setMeetingDetails(result);
      } else {
        setHasMeeting(false);
      }
    } catch (error) {
      console.error('Error detecting meeting:', error);
      setHasMeeting(false);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleAddToCalendar = async () => {
    if (!meetingDetails || !meetingDetails.startTime) {
      toast.error('Meeting details incomplete');
      return;
    }

    try {
      setIsAdding(true);

      const result = await createEventFromEmail(emailId, {
        title: meetingDetails.title || 'Meeting',
        description: meetingDetails.agenda,
        startTime: meetingDetails.startTime,
        endTime: meetingDetails.endTime,
        location: meetingDetails.location,
        meetingUrl: meetingDetails.conferenceLink,
        attendees: meetingDetails.attendees,
      });

      if (result.success) {
        setIsAdded(true);
        toast.success('Meeting added to calendar!');
      } else {
        toast.error(result.error || 'Failed to add meeting to calendar');
      }
    } catch (error) {
      console.error('Error adding to calendar:', error);
      toast.error('Failed to add meeting to calendar');
    } finally {
      setIsAdding(false);
    }
  };

  // Don't render if still detecting or no meeting found
  if (isDetecting || !hasMeeting) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={cn('inline-flex', className)}
      >
        <button
          onClick={handleAddToCalendar}
          disabled={isAdding || isAdded}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
            'shadow-sm hover:shadow-md',
            isAdded
              ? 'bg-green-50 text-green-700 border-2 border-green-200 cursor-default dark:bg-green-900/20 dark:text-green-400 dark:border-green-700'
              : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600',
            (isAdding || isAdded) && 'cursor-not-allowed'
          )}
        >
          {isAdding ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Adding...</span>
            </>
          ) : isAdded ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>Added to Calendar</span>
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4" />
              <Plus className="h-3 w-3" />
              <span>Add to Calendar</span>
            </>
          )}
        </button>

        {/* Meeting details tooltip on hover */}
        {!isAdded && meetingDetails && (
          <div className="group relative">
            <button
              className="ml-2 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
              title="Meeting Details"
            >
              <AlertCircle className="h-4 w-4" />
            </button>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    Title:
                  </span>
                  <p className="text-gray-600 dark:text-gray-400">
                    {meetingDetails.title || 'N/A'}
                  </p>
                </div>
                {meetingDetails.date && (
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Date:
                    </span>
                    <p className="text-gray-600 dark:text-gray-400">
                      {meetingDetails.date} {meetingDetails.time}
                    </p>
                  </div>
                )}
                {meetingDetails.location && (
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Location:
                    </span>
                    <p className="text-gray-600 dark:text-gray-400">
                      {meetingDetails.location}
                    </p>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">
                    Confidence: {Math.round(meetingDetails.confidence * 100)}%
                  </span>
                </div>
              </div>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                <div className="border-8 border-transparent border-t-white dark:border-t-gray-800"></div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

