export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: 'meeting' | 'task' | 'personal' | 'reminder';
  location?: string;
  attendees?: string[];
  isVirtual?: boolean;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink';
}


