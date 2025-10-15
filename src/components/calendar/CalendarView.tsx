'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EventModal } from './EventModal';
import type { CalendarEvent } from './types';

interface CalendarViewProps {
  onToggleSidebar?: () => void;
}

// Mock events data
const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Q4 Strategy Meeting',
    description: 'Discuss Q4 marketing strategy with team',
    startTime: new Date(2025, 9, 15, 10, 0), // Oct 15, 2025, 10:00 AM
    endTime: new Date(2025, 9, 15, 11, 30),
    type: 'meeting',
    location: 'Conference Room A',
    attendees: ['Sarah Chen', 'Michael Rodriguez'],
    color: 'blue',
  },
  {
    id: '2',
    title: 'Product Demo',
    description: 'Demo new features to clients',
    startTime: new Date(2025, 9, 15, 14, 0),
    endTime: new Date(2025, 9, 15, 15, 0),
    type: 'meeting',
    isVirtual: true,
    attendees: ['Client Team'],
    color: 'purple',
  },
  {
    id: '3',
    title: 'Design Review',
    description: 'Review mockups from Emma',
    startTime: new Date(2025, 9, 16, 9, 0),
    endTime: new Date(2025, 9, 16, 10, 0),
    type: 'meeting',
    attendees: ['Emma Thompson'],
    color: 'green',
  },
  {
    id: '4',
    title: 'Lunch with Alex',
    description: 'Discuss project updates',
    startTime: new Date(2025, 9, 16, 12, 30),
    endTime: new Date(2025, 9, 16, 13, 30),
    type: 'personal',
    location: 'Downtown Bistro',
    color: 'orange',
  },
  {
    id: '5',
    title: 'Email Campaign Review',
    description: 'Review and approve Q4 email campaigns',
    startTime: new Date(2025, 9, 17, 15, 0),
    endTime: new Date(2025, 9, 17, 16, 30),
    type: 'task',
    color: 'red',
  },
];

type ViewMode = 'month' | 'week' | 'day';

export function CalendarView({
  onToggleSidebar,
}: CalendarViewProps): JSX.Element {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Navigation
  const goToPreviousMonth = (): void => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = (): void => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const goToToday = (): void => {
    setCurrentDate(new Date());
  };

  // Get calendar days for month view
  const getCalendarDays = (): Date[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days: Date[] = [];
    const current = new Date(startDate);

    while (days.length < 42) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if date is in current month
  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Handle date click
  const handleDateClick = (date: Date): void => {
    setSelectedDate(date);
  };

  // Handle create event
  const handleCreateEvent = (): void => {
    setSelectedEvent(null);
    setIsEventModalOpen(true);
  };

  // Handle edit event
  const handleEditEvent = (event: CalendarEvent): void => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  // Handle save event
  const handleSaveEvent = (event: CalendarEvent): void => {
    if (selectedEvent) {
      // Update existing event
      setEvents(events.map((e) => (e.id === event.id ? event : e)));
    } else {
      // Add new event
      setEvents([...events, { ...event, id: Date.now().toString() }]);
    }
    setIsEventModalOpen(false);
    setSelectedEvent(null);
  };

  // Handle delete event
  const handleDeleteEvent = (eventId: string): void => {
    setEvents(events.filter((e) => e.id !== eventId));
    setIsEventModalOpen(false);
    setSelectedEvent(null);
  };

  const calendarDays = getCalendarDays();

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Toggle sidebar"
              >
                <Menu size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Calendar
            </h1>
          </div>

          <button
            onClick={handleCreateEvent}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200"
          >
            <Plus size={20} />
            New Event
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Date Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={goToToday}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Today
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft
                  size={20}
                  className="text-gray-600 dark:text-gray-400"
                />
              </button>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Next month"
              >
                <ChevronRight
                  size={20}
                  className="text-gray-600 dark:text-gray-400"
                />
              </button>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </div>

          {/* View Mode Selector */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-4 py-2 rounded-md font-medium capitalize transition-all duration-200',
                  viewMode === mode
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-6">
        {viewMode === 'month' && (
          <div className="bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Days of week header */}
            <div className="grid grid-cols-7 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              {daysOfWeek.map((day) => (
                <div
                  key={day}
                  className="p-4 text-center font-semibold text-gray-700 dark:text-gray-300"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const dayEvents = getEventsForDate(day);
                const isTodayDate = isToday(day);
                const isInCurrentMonth = isCurrentMonth(day);

                return (
                  <div
                    key={index}
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      'min-h-[120px] p-2 border-b border-r border-gray-200 dark:border-gray-800 cursor-pointer transition-colors',
                      !isInCurrentMonth &&
                        'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600',
                      isTodayDate &&
                        'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700',
                      'hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    <div
                      className={cn(
                        'text-sm font-medium mb-1',
                        isTodayDate
                          ? 'text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-gray-700 dark:text-gray-300'
                      )}
                    >
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEvent(event);
                          }}
                          className={cn(
                            'text-xs px-2 py-1 rounded truncate',
                            event.color === 'blue' &&
                              'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
                            event.color === 'purple' &&
                              'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
                            event.color === 'green' &&
                              'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
                            event.color === 'orange' &&
                              'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
                            event.color === 'red' &&
                              'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                          )}
                        >
                          {event.startTime.toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}{' '}
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'week' && (
          <div className="text-center py-20">
            <CalendarIcon
              size={64}
              className="mx-auto text-gray-400 dark:text-gray-600 mb-4"
            />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Week view coming soon!
            </p>
          </div>
        )}

        {viewMode === 'day' && (
          <div className="text-center py-20">
            <Clock
              size={64}
              className="mx-auto text-gray-400 dark:text-gray-600 mb-4"
            />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Day view coming soon!
            </p>
          </div>
        )}
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setSelectedEvent(null);
        }}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        event={selectedEvent}
        selectedDate={selectedDate}
      />
    </div>
  );
}
