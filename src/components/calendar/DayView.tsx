'use client';

import { format, isSameHour, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { MapPin, Users, Video } from 'lucide-react';
import type { CalendarEvent } from './types';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date, hour: number) => void;
}

export function DayView({
  currentDate,
  events,
  onEventClick,
  onTimeSlotClick,
}: DayViewProps): JSX.Element {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const isCurrentDay = isToday(currentDate);

  // Get events for a specific hour
  const getEventsForHour = (hour: number): CalendarEvent[] => {
    return events.filter((event) => {
      const eventStart = new Date(event.startTime);
      const eventHour = eventStart.getHours();
      
      return (
        format(eventStart, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd') &&
        eventHour === hour
      );
    });
  };

  // Calculate event position and height for better visualization
  const getEventStyle = (event: CalendarEvent) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const minutes = start.getMinutes();
    const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutes
    
    return {
      top: `${(minutes / 60) * 100}%`,
      height: `${Math.max((duration / 60) * 100, 10)}%`, // Minimum 10% height
    };
  };

  // Get current time indicator position
  const getCurrentTimePosition = (): number | null => {
    if (!isCurrentDay) return null;
    
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    return (hours * 80) + (minutes / 60 * 80); // 80px per hour
  };

  const currentTimePosition = getCurrentTimePosition();

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900">
      {/* Day header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 uppercase">
              {format(currentDate, 'EEEE')}
            </div>
            <div
              className={cn(
                'text-4xl font-bold mt-1',
                isCurrentDay
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-800 dark:text-gray-200'
              )}
            >
              {format(currentDate, 'MMMM d, yyyy')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {events.length} {events.length === 1 ? 'event' : 'events'} today
            </div>
          </div>
        </div>
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-auto relative">
        <div className="min-h-full">
          {hours.map((hour) => {
            const hourEvents = getEventsForHour(hour);
            
            return (
              <div
                key={hour}
                onClick={() => onTimeSlotClick(currentDate, hour)}
                className="relative h-20 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer"
              >
                {/* Hour label */}
                <div className="absolute left-0 top-0 w-24 px-4 py-2 text-right">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {format(new Date().setHours(hour, 0, 0, 0), 'h:mm a')}
                  </span>
                </div>

                {/* Events for this hour */}
                <div className="ml-24 h-full relative">
                  {hourEvents.map((event, index) => {
                    const style = getEventStyle(event);
                    
                    return (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        style={{
                          top: style.top,
                          height: style.height,
                          left: `${index * 5}%`,
                          right: `${5 + index * 5}%`,
                        }}
                        className={cn(
                          'absolute rounded-lg p-3 cursor-pointer overflow-hidden z-10',
                          'shadow-md hover:shadow-xl transition-all',
                          'border-l-4',
                          event.color === 'blue' &&
                            'bg-blue-50 dark:bg-blue-900/30 border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40',
                          event.color === 'purple' &&
                            'bg-purple-50 dark:bg-purple-900/30 border-purple-500 hover:bg-purple-100 dark:hover:bg-purple-900/40',
                          event.color === 'green' &&
                            'bg-green-50 dark:bg-green-900/30 border-green-500 hover:bg-green-100 dark:hover:bg-green-900/40',
                          event.color === 'orange' &&
                            'bg-orange-50 dark:bg-orange-900/30 border-orange-500 hover:bg-orange-100 dark:hover:bg-orange-900/40',
                          event.color === 'red' &&
                            'bg-red-50 dark:bg-red-900/30 border-red-500 hover:bg-red-100 dark:hover:bg-red-900/40',
                          event.color === 'pink' &&
                            'bg-pink-50 dark:bg-pink-900/30 border-pink-500 hover:bg-pink-100 dark:hover:bg-pink-900/40'
                        )}
                      >
                        {/* Time */}
                        <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                          {format(new Date(event.startTime), 'h:mm a')} -{' '}
                          {format(new Date(event.endTime), 'h:mm a')}
                        </div>

                        {/* Title */}
                        <div className="font-bold text-gray-900 dark:text-white mb-2">
                          {event.title}
                        </div>

                        {/* Details */}
                        <div className="space-y-1">
                          {event.location && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                              {event.isVirtual ? (
                                <Video className="h-3 w-3" />
                              ) : (
                                <MapPin className="h-3 w-3" />
                              )}
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}

                          {event.attendees && event.attendees.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                              <Users className="h-3 w-3" />
                              <span>
                                {event.attendees.length}{' '}
                                {event.attendees.length === 1 ? 'attendee' : 'attendees'}
                              </span>
                            </div>
                          )}

                          {event.description && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-2">
                              {event.description}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Current time indicator */}
        {currentTimePosition !== null && (
          <div
            style={{ top: `${currentTimePosition}px` }}
            className="absolute left-0 right-0 z-20 pointer-events-none"
          >
            <div className="flex items-center">
              <div className="w-24 flex justify-end pr-2">
                <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
              </div>
              <div className="flex-1 h-0.5 bg-red-500"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

