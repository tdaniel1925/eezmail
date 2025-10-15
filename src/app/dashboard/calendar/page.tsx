'use client';

import { EmailLayout } from '@/components/layout/EmailLayout';
import { Sidebar } from '@/components/layout/Sidebar';
import { CalendarView } from '@/components/calendar/CalendarView';

export default function CalendarPage(): JSX.Element {
  return <EmailLayout sidebar={<Sidebar />} emailList={<CalendarView />} />;
}


