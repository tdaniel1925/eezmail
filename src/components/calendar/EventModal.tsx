'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Users, Video, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createCalendarEvent, updateCalendarEvent } from '@/lib/calendar/calendar-actions';
import { toast } from 'sonner';
import type { CalendarEvent } from './types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  event: CalendarEvent | null;
  selectedDate: Date | null;
}

export function EventModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  selectedDate,
}: EventModalProps): JSX.Element | null {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState<CalendarEvent['type']>('meeting');
  const [location, setLocation] = useState('');
  const [attendees, setAttendees] = useState('');
  const [isVirtual, setIsVirtual] = useState(false);
  const [color, setColor] = useState<CalendarEvent['color']>('blue');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (event) {
      // Edit mode
      setTitle(event.title);
      setDescription(event.description || '');
      setStartDate(event.startTime.toISOString().split('T')[0]);
      setStartTime(event.startTime.toTimeString().split(' ')[0].slice(0, 5));
      setEndDate(event.endTime.toISOString().split('T')[0]);
      setEndTime(event.endTime.toTimeString().split(' ')[0].slice(0, 5));
      setType(event.type);
      setLocation(event.location || '');
      setAttendees(event.attendees?.join(', ') || '');
      setIsVirtual(event.isVirtual || false);
      setColor(event.color);
    } else if (selectedDate) {
      // New event with selected date
      const dateStr = selectedDate.toISOString().split('T')[0];
      setStartDate(dateStr);
      setEndDate(dateStr);
      setStartTime('09:00');
      setEndTime('10:00');
      resetForm();
    } else {
      // New event
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      setStartDate(dateStr);
      setEndDate(dateStr);
      setStartTime('09:00');
      setEndTime('10:00');
      resetForm();
    }
  }, [event, selectedDate, isOpen]);

  const resetForm = (): void => {
    setTitle('');
    setDescription('');
    setType('meeting');
    setLocation('');
    setAttendees('');
    setIsVirtual(false);
    setColor('blue');
  };

  const handleSave = async (): Promise<void> => {
    if (!title || !startDate || !startTime || !endDate || !endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);
      
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);

      const eventData = {
        title,
        description: description || undefined,
        startTime: startDateTime,
        endTime: endDateTime,
        type,
        location: location || undefined,
        isVirtual,
        color,
      };

      const attendeeEmails = attendees
        ? attendees.split(',').map((a) => a.trim()).filter(Boolean)
        : [];

      const attendeeData = attendeeEmails.map((email) => ({
        email,
        name: email.split('@')[0], // Simple name extraction
      }));

      let result;
      if (event?.id) {
        // Update existing event
        result = await updateCalendarEvent(event.id, eventData, attendeeData);
      } else {
        // Create new event
        result = await createCalendarEvent(eventData, attendeeData, [
          // Default reminders
          { minutesBefore: 15, method: 'email' as const },
        ]);
      }

      if (result.success) {
        toast.success(event ? 'Event updated!' : 'Event created!');
        
        // Call onSave with the event data (for calendar refresh)
        const newEvent: CalendarEvent = {
          id: event?.id || result.eventId || '',
          title,
          description,
          startTime: startDateTime,
          endTime: endDateTime,
          type,
          location,
          attendees: attendeeEmails,
          isVirtual,
          color,
        };
        
        onSave(newEvent);
      } else {
        toast.error(result.error || 'Failed to save event');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (): void => {
    if (event?.id) {
      onDelete(event.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {event ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Event Type
            </label>
            <div className="flex gap-2">
              {(['meeting', 'task', 'personal', 'reminder'] as const).map(
                (t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={cn(
                      'px-4 py-2 rounded-lg font-medium capitalize transition-colors',
                      type === t
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    )}
                  >
                    {t}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <MapPin
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Add location"
                  disabled={isVirtual}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                />
              </div>
              <button
                onClick={() => setIsVirtual(!isVirtual)}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors',
                  isVirtual
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                <Video size={20} />
                Virtual
              </button>
            </div>
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Attendees
            </label>
            <div className="relative">
              <Users
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                placeholder="Add attendees (comma separated)"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color Label
            </label>
            <div className="flex gap-2">
              {(
                ['blue', 'purple', 'green', 'orange', 'red', 'pink'] as const
              ).map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-10 h-10 rounded-full transition-all',
                    c === 'blue' && 'bg-blue-500',
                    c === 'purple' && 'bg-purple-500',
                    c === 'green' && 'bg-green-500',
                    c === 'orange' && 'bg-orange-500',
                    c === 'red' && 'bg-red-500',
                    c === 'pink' && 'bg-pink-500',
                    color === c
                      ? 'ring-4 ring-gray-300 dark:ring-gray-600 scale-110'
                      : 'hover:scale-105'
                  )}
                  aria-label={`Select ${c} color`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-800">
          {event ? (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors"
            >
              <Trash2 size={18} />
              Delete Event
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={
                !title || !startDate || !startTime || !endDate || !endTime || isSaving
              }
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{event ? 'Save Changes' : 'Create Event'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
