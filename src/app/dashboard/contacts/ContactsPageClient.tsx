'use client';

import { useState } from 'react';
import { ContactList } from '@/components/contacts/ContactList';
import { ContactDetailModal } from '@/components/contacts/ContactDetailModal';
import {
  ContactFormModal,
  type ContactFormData,
} from '@/components/contacts/ContactFormModal';
import { toast } from 'sonner';
import type { ContactListItem, ContactDetails } from '@/lib/contacts/data';
import type { Contact } from '@/db/schema';
import {
  createContact,
  updateContact,
  deleteContact,
} from '@/lib/contacts/actions';
import { getContactDetails } from '@/lib/contacts/data';

interface ContactsPageClientProps {
  initialContacts: ContactListItem[];
  userId: string;
}

export function ContactsPageClient({
  initialContacts,
  userId,
}: ContactsPageClientProps): JSX.Element {
  const [contacts, setContacts] = useState<ContactListItem[]>(initialContacts);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [selectedContact, setSelectedContact] = useState<ContactDetails | null>(
    null
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isLoadingContact, setIsLoadingContact] = useState(false);

  const handleContactSelect = async (contactId: string) => {
    setSelectedContactId(contactId);
    setIsLoadingContact(true);
    setIsDetailModalOpen(true);

    try {
      const details = await getContactDetails(contactId, userId);
      setSelectedContact(details);
    } catch (error) {
      console.error('Error loading contact details:', error);
      toast.error('Failed to load contact details');
    } finally {
      setIsLoadingContact(false);
    }
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedContactId(null);
    setSelectedContact(null);
  };

  const handleOpenAddModal = () => {
    setEditingContact(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = () => {
    if (selectedContact) {
      setEditingContact(selectedContact);
      setIsFormModalOpen(true);
      setIsDetailModalOpen(false);
    }
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingContact(null);
  };

  const refreshContacts = async () => {
    try {
      const response = await fetch('/api/contacts/list');
      const data = await response.json();
      if (data.success) {
        setContacts(data.contacts);
      }
    } catch (error) {
      console.error('Error refreshing contacts:', error);
    }
  };

  const handleSaveContact = async (data: ContactFormData) => {
    try {
      if (editingContact) {
        // Update existing contact
        const result = await updateContact(editingContact.id, userId, {
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          displayName: data.displayName || null,
          nickname: data.nickname || null,
          company: data.company || null,
          jobTitle: data.jobTitle || null,
          department: data.department || null,
          birthday: data.birthday || null,
          notes: data.notes || null,
          avatarUrl: data.avatarUrl || null,
          isFavorite: data.isFavorite,
        });

        if (result.success) {
          toast.success('Contact updated successfully');
          await refreshContacts();
          handleCloseFormModal();
        } else {
          toast.error(result.error || 'Failed to update contact');
        }
      } else {
        // Create new contact
        const result = await createContact(userId, {
          firstName: data.firstName,
          lastName: data.lastName,
          displayName: data.displayName,
          nickname: data.nickname,
          company: data.company,
          jobTitle: data.jobTitle,
          department: data.department,
          emails: data.emails,
          phones: data.phones,
          addresses: [],
          socialLinks: [],
          birthday: data.birthday,
          notes: data.notes,
          avatarUrl: data.avatarUrl,
          isFavorite: data.isFavorite,
          tags: data.tags,
        });

        if (result.success) {
          toast.success('Contact created successfully');
          await refreshContacts();
          handleCloseFormModal();
        } else {
          toast.error(result.error || 'Failed to create contact');
        }
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error('Failed to save contact');
    }
  };

  const handleDeleteContact = async () => {
    if (!selectedContactId) return;

    if (
      !confirm(
        'Are you sure you want to delete this contact? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const result = await deleteContact(selectedContactId, userId, true);

      if (result.success) {
        toast.success('Contact deleted successfully');
        await refreshContacts();
        handleCloseDetailModal();
      } else {
        toast.error(result.error || 'Failed to delete contact');
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    }
  };

  return (
    <>
      <ContactList
        contacts={contacts}
        onContactSelect={handleContactSelect}
        onAddContact={handleOpenAddModal}
      />
      {isDetailModalOpen && selectedContact && (
        <ContactDetailModal
          contact={selectedContact}
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteContact}
        />
      )}
      <ContactFormModal
        contact={editingContact}
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onSave={handleSaveContact}
      />
    </>
  );
}
