'use client';

import { useState } from 'react';
import { EmailLayout } from '@/components/layout/EmailLayout';
import { Sidebar } from '@/components/layout/Sidebar';
import { ContactList } from '@/components/contacts/ContactList';
import { ContactDetailModal } from '@/components/contacts/ContactDetailModal';
import {
  ContactFormModal,
  type ContactFormData,
} from '@/components/contacts/ContactFormModal';
import { mockContacts, mockTags } from '@/lib/contacts/mock-data';
import type { ContactListItem, ContactDetails } from '@/lib/contacts/data';
import type { Contact } from '@/db/schema';
import { toast } from '@/lib/toast';

// Transform mock data to ContactListItem format
const mockContactsList: ContactListItem[] = mockContacts.map((mock) => {
  const tags = mockTags
    .filter((tag) => mock.tags.includes(tag.id))
    .map((tag) => ({
      id: tag.id,
      userId: '1',
      name: tag.name,
      color: tag.color,
      createdAt: new Date(),
    }));

  return {
    ...mock.contact,
    primaryEmail: mock.email,
    primaryPhone: mock.phone || null,
    tags,
  };
});

// Mock function to get full contact details
function getMockContactDetails(contactId: string): ContactDetails | null {
  const mockContact = mockContacts.find((m) => m.contact.id === contactId);
  if (!mockContact) return null;

  const tags = mockTags
    .filter((tag) => mockContact.tags.includes(tag.id))
    .map((tag) => ({
      id: tag.id,
      userId: '1',
      name: tag.name,
      color: tag.color,
      createdAt: new Date(),
    }));

  return {
    ...mockContact.contact,
    emails: [
      {
        id: '1',
        contactId: mockContact.contact.id,
        email: mockContact.email,
        type: 'work',
        isPrimary: true,
        createdAt: new Date(),
      },
    ],
    phones: mockContact.phone
      ? [
          {
            id: '1',
            contactId: mockContact.contact.id,
            phone: mockContact.phone,
            type: 'mobile',
            isPrimary: true,
            createdAt: new Date(),
          },
        ]
      : [],
    addresses: [],
    socialLinks: [],
    tags,
    customFields: [],
    notesList: [],
  };
}

export default function ContactsPage(): JSX.Element {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const handleContactSelect = (contactId: string) => {
    setSelectedContactId(contactId);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedContactId(null);
  };

  const handleOpenAddModal = () => {
    setEditingContact(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = () => {
    if (selectedContactId) {
      const contact = mockContacts.find(
        (m) => m.contact.id === selectedContactId
      );
      if (contact) {
        setEditingContact(contact.contact);
        setIsFormModalOpen(true);
        setIsDetailModalOpen(false);
      }
    }
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingContact(null);
  };

  const handleSaveContact = async (data: ContactFormData) => {
    // TODO: In production, call the actual createContact or updateContact action
    console.log('Saving contact:', data);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // In mock mode, just show success
    toast.success(editingContact ? 'Contact updated!' : 'Contact created!');

    // Close modal
    handleCloseFormModal();
  };

  const handleDeleteContact = async () => {
    if (!selectedContactId) return;

    const confirmed = await toast.promise(Promise.resolve(true), {
      loading: 'Deleting contact...',
      success: 'Contact deleted successfully',
      error: 'Failed to delete contact',
    });

    if (confirmed) {
      // TODO: In production, call deleteContact action
      console.log('Delete contact:', selectedContactId);
      handleCloseDetailModal();
    }
  };

  const selectedContact = selectedContactId
    ? getMockContactDetails(selectedContactId)
    : null;

  const sidebar = <Sidebar />;
  const contactList = (
    <ContactList
      contacts={mockContactsList}
      onContactSelect={handleContactSelect}
      onAddContact={handleOpenAddModal}
    />
  );

  return (
    <>
      <EmailLayout sidebar={sidebar} emailList={contactList} />
      <ContactDetailModal
        contact={selectedContact}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteContact}
      />
      <ContactFormModal
        contact={editingContact}
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onSave={handleSaveContact}
      />
    </>
  );
}
