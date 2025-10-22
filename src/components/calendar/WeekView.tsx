'use client';

import { useState } from 'react';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from './types';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date, hour: number) => void;
}

export function WeekView({
  currentDate,
  events,
  onEventClick,
  onTimeSlotClick,
}: WeekViewProps): JSX.Element {
  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Get events for a specific day and hour
  const getEventsForTimeSlot = (date: Date, hour: number): CalendarEvent[] => {
    return events.filter((event) => {
      const eventStart = new Date(event.startTime);
      const eventHour = eventStart.getHours();
      
      return (
        isSameDay(eventStart, date) &&
        eventHour === hour
      );
    });
  };

  // Calculate event position and height
  const getEventStyle = (event: CalendarEvent) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const minutes = start.getMinutes();
    const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutes
    
    return {
      top: `${(minutes / 60) * 100}%`,
      height: `${Math.max((duration / 60) * 100, 5)}%`, // Minimum 5% height
    };
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900">
      {/* Week header with days */}
      <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
        <div className="p-4 border-r border-gray-200 dark:border-gray-800">
          <span className="text-xs text-gray-500 dark:text-gray-400">Time</span>
        </div>
        {weekDays.map((day, index) => {
          const isCurrentDay = isToday(day);
          
          return (
            <div
              key={index}
              className={cn(
                'p-4 text-center border-r border-gray-200 dark:border-gray-800',
                isCurrentDay && 'bg-blue-50 dark:bg-blue-900/20'
              )}
            >
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                {format(day, 'EEE')}
              </div>
              <div
                className={cn(
                  'text-2xl font-semibold mt-1',
                  isCurrentDay
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-800 dark:text-gray-200'
                )}
              >
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-8">
          {/* Hour labels column */}
          <div className="border-r border-gray-200 dark:border-gray-800">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-16 px-2 py-1 border-b border-gray-200 dark:border-gray-800 text-right"
              >
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className="border-r border-gray-200 dark:border-gray-800"
            >
              {hours.map((hour) => {
                const timeSlotEvents = getEventsForTimeSlot(day, hour);
                
                return (
                  <div
                    key={hour}
                    onClick={() => onTimeSlotClick(day, hour)}
                    className="relative h-16 border-b border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                  >
                    {timeSlotEvents.map((event, index) => {
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
                            left: `${index * 2}%`,
                            right: `${index * 2}%`,
                          }}
                          className={cn(
                            'absolute px-2 py-1 text-xs rounded-md cursor-pointer overflow-hidden z-10',
                            'hover:shadow-lg transition-shadow',
                            event.color === 'blue' &&
                              'bg-blue-500 text-white border border-blue-600',
                            event.color === 'purple' &&
                              'bg-purple-500 text-white border border-purple-600',
                            event.color === 'green' &&
                              'bg-green-500 text-white border border-green-600',
                            event.color === 'orange' &&
                              'bg-orange-500 text-white border border-orange-600',
                            event.color === 'red' &&
                              'bg-red-500 text-white border border-red-600',
                            event.color === 'pink' &&
                              'bg-pink-500 text-white border border-pink-600'
                          )}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          {event.location && (
                            <div className="text-xs opacity-90 truncate">
                              {event.location}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

