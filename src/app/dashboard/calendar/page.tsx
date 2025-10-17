'use client';

import { CalendarView } from '@/components/calendar/CalendarView';
import { ChatBot } from '@/components/ai/ChatBot';

export default function CalendarPage(): JSX.Element {
  return (
    <>
      <CalendarView />
      <ChatBot />
    </>
  );
}
