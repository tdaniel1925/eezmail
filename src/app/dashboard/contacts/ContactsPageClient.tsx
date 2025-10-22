'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContactList } from '@/components/contacts/ContactList';
import { ContactDetailModal } from '@/components/contacts/ContactDetailModal';
import {
  ContactFormModal,
  type ContactFormData,
} from '@/components/contacts/ContactFormModal';
import {
  ContactsSidebar,
  type ContactFilter,
} from '@/components/contacts/ContactsSidebar';
import { BulkActionsToolbar } from '@/components/contacts/BulkActionsToolbar';
import { CreateGroupModal } from '@/components/contacts/CreateGroupModal';
import { ManageTagsModal } from '@/components/contacts/ManageTagsModal';
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
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactListItem[]>(initialContacts);

  // Debug: Log initial contacts
  console.log(
    '📋 ContactsPageClient initialized with',
    initialContacts.length,
    'contacts'
  );
  console.log('📋 Initial contacts:', initialContacts);
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

  // Sidebar filtering and bulk selection state
  const [currentFilter, setCurrentFilter] = useState<ContactFilter>({
    type: 'all',
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showManageTagsModal, setShowManageTagsModal] = useState(false);

  // Client-side filtering based on current filter
  const filteredContacts = contacts.filter((contact) => {
    if (currentFilter.type === 'all') return true;
    if (currentFilter.type === 'favorites') return contact.isFavorite;
    if (currentFilter.type === 'group') {
      return contact.groups?.some((g) => g.id === currentFilter.groupId);
    }
    if (currentFilter.type === 'tag') {
      return contact.tags?.some((t) => currentFilter.tagIds?.includes(t.id));
    }
    return true;
  });

  // Bulk selection handlers
  const toggleSelectContact = (contactId: string) => {
    setSelectedIds((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const selectAllContacts = () => {
    setSelectedIds(filteredContacts.map((c) => c.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

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
      console.log('🔄 Starting refresh...');

      // Method 1: Force server-side re-render (best for SSR pages)
      router.refresh();

      // Method 2: Also fetch via API for immediate update
      const response = await fetch('/api/contacts/list', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await response.json();

      console.log('🔄 Refreshed contacts:', {
        success: data.success,
        count: data.contacts?.length || 0,
        total: data.total,
        contacts: data.contacts?.map((c: any) => c.id), // Show IDs
      });

      if (data.success) {
        console.log(
          '✅ Setting contacts state with',
          data.contacts.length,
          'contacts'
        );
        console.log('📋 Current contacts state:', contacts.length);
        setContacts(data.contacts);
        console.log(
          '📋 After setState - this might not show immediately due to async'
        );

        // Force a re-render check
        setTimeout(() => {
          console.log('📋 State after 100ms:', contacts.length);
        }, 100);
      } else {
        console.error('❌ Failed to refresh contacts:', data.error);
      }
    } catch (error) {
      console.error('❌ Error refreshing contacts:', error);
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
          console.log('✅ Contact created successfully:', result.contactId);
          toast.success('Contact created successfully');
          await refreshContacts();
          handleCloseFormModal();
        } else {
          console.error('❌ Failed to create contact:', result.error);
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
    <div className="flex flex-1 h-full overflow-hidden bg-white dark:bg-gray-900">
      {/* Contacts Sidebar */}
      <ContactsSidebar
        currentFilter={currentFilter}
        onFilterChange={setCurrentFilter}
        onCreateGroup={() => setShowCreateGroupModal(true)}
        onManageTags={() => setShowManageTagsModal(true)}
      />

      {/* Main Content - ContactList with full flex */}
      <div className="flex-1 h-full overflow-hidden flex flex-col">
        <ContactList
          contacts={filteredContacts}
          onContactSelect={handleContactSelect}
          onAddContact={handleOpenAddModal}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelectContact}
          onSelectAll={selectAllContacts}
          onClearSelection={clearSelection}
        />
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedIds.length}
          selectedIds={selectedIds}
          onClearSelection={clearSelection}
          onRefresh={refreshContacts}
        />
      )}

      {/* Modals */}
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
      <CreateGroupModal
        open={showCreateGroupModal}
        onOpenChange={setShowCreateGroupModal}
        onSuccess={refreshContacts}
      />
      <ManageTagsModal
        open={showManageTagsModal}
        onOpenChange={setShowManageTagsModal}
        onSuccess={refreshContacts}
      />
    </div>
  );
}
