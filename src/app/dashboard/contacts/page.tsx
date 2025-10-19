import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getContactsList } from '@/lib/contacts/data';
import { ContactsPageClient } from './ContactsPageClient';

export default async function ContactsPage() {
  // Get authenticated user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch real contacts from database
  const contactsData = await getContactsList(user.id, {
    sortBy: 'name_asc',
    page: 1,
    perPage: 100,
  });

  return (
    <Suspense fallback={<div>Loading contacts...</div>}>
      <ContactsPageClient
        initialContacts={contactsData.contacts}
        userId={user.id}
      />
    </Suspense>
  );
}
