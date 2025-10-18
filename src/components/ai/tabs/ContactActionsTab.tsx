'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  X,
  Mail,
  Mic,
  Calendar,
  StickyNote,
  ExternalLink,
  FileText,
  ChevronDown,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { useAIPanelStore } from '@/stores/aiPanelStore';
import { toast } from 'sonner';
import { EmailComposer } from '@/components/email/EmailComposer';
import { ContactDetailModal } from '@/components/contacts/ContactDetailModal';

interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
}

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  timestamp: Date;
}

export function ContactActionsTab(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<'email' | 'voice'>('email');
  const [composerInitialData, setComposerInitialData] = useState<
    | {
        to?: string;
        subject?: string;
        body?: string;
      }
    | undefined
  >(undefined);
  const { setSelectedContact } = useAIPanelStore();

  // Mock search results
  const mockContacts: Contact[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Acme Corp',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      company: 'Tech Inc',
    },
    {
      id: '3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      company: 'StartupXYZ',
    },
  ];

  // Mock timeline events
  const recentTimeline: TimelineEvent[] = [
    {
      id: '1',
      type: 'email_sent',
      title: 'Sent project proposal',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
      id: '2',
      type: 'note_added',
      title: 'Added note about Q4 planning',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    },
    {
      id: '3',
      type: 'email_received',
      title: 'Received budget update',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
    },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setIsSearching(true);
      // Mock search - filter contacts
      const filtered = mockContacts.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.email.toLowerCase().includes(query.toLowerCase()) ||
          c.company?.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  const addContact = (contact: Contact) => {
    if (!selectedContacts.find((c) => c.id === contact.id)) {
      setSelectedContacts([...selectedContacts, contact]);
      setSelectedContact(contact.id);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeContact = (contactId: string) => {
    setSelectedContacts(selectedContacts.filter((c) => c.id !== contactId));
  };

  // Effect to trigger voice recording when composer opens in voice mode
  useEffect(() => {
    if (isComposerOpen && composerMode === 'voice') {
      // Small delay to let composer mount first
      const timer = setTimeout(() => {
        // Dispatch custom event to trigger voice recording
        window.dispatchEvent(new CustomEvent('start-voice-recording'));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isComposerOpen, composerMode]);

  const handleOpenEmailComposer = () => {
    const recipients = selectedContacts.map((c) => c.email).join(', ');
    setComposerInitialData({
      to: recipients,
      subject: '',
      body: '',
    });
    setComposerMode('email');
    setIsComposerOpen(true);
    toast.success('Opening email composer...');
  };

  const handleOpenVoiceRecorder = () => {
    const recipients = selectedContacts.map((c) => c.email).join(', ');
    setComposerInitialData({
      to: recipients,
      subject: 'Voice Message',
      body: '',
    });
    setComposerMode('voice');
    setIsComposerOpen(true);
    toast.success('Opening voice recorder...');
  };

  const handleScheduleMeeting = () => {
    if (selectedContacts.length === 0) {
      toast.error('Please select at least one contact');
      return;
    }

    const contactEmails = selectedContacts.map((c) => c.email).join(',');
    window.location.href = `/dashboard/calendar?action=new&contacts=${encodeURIComponent(contactEmails)}`;
  };

  const handleAddNote = () => {
    if (selectedContacts.length === 0) {
      toast.error('Please select at least one contact');
      return;
    }

    if (selectedContacts.length > 1) {
      toast.error('Please select only one contact to add a note');
      return;
    }

    setSelectedContact(selectedContacts[0].id);
    setShowContactModal(true);
    // The modal will open to the Notes tab
    setTimeout(() => {
      // Trigger add note in the modal
      window.dispatchEvent(new CustomEvent('contact-modal-add-note'));
    }, 500);
  };

  const handleViewFullProfile = () => {
    if (selectedContacts.length === 0) {
      toast.error('Please select a contact');
      return;
    }

    if (selectedContacts.length > 1) {
      toast.error('Please select only one contact to view profile');
      return;
    }

    setSelectedContact(selectedContacts[0].id);
    setShowContactModal(true);
  };

  const handleShareDocument = () => {
    if (selectedContacts.length === 0) {
      toast.error('Please select at least one contact');
      return;
    }

    const recipients = selectedContacts.map((c) => c.email).join(', ');
    setComposerInitialData({
      to: recipients,
      subject: 'Document Sharing',
      body: '',
    });
    setComposerMode('email');
    setIsComposerOpen(true);

    // Trigger file picker after composer opens
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('composer-add-attachment'));
    }, 500);
  };

  const handleCloseComposer = () => {
    setIsComposerOpen(false);
    setComposerMode('email');
    setComposerInitialData(undefined);
  };

  const actions = [
    {
      icon: Mail,
      label: 'Send Email',
      onClick: handleOpenEmailComposer,
    },
    {
      icon: Mic,
      label: 'Record Voice Message',
      onClick: handleOpenVoiceRecorder,
    },
    {
      icon: Calendar,
      label: 'Schedule Meeting',
      onClick: handleScheduleMeeting,
    },
    {
      icon: StickyNote,
      label: 'Add Note',
      onClick: handleAddNote,
    },
    {
      icon: ExternalLink,
      label: 'View Full Profile',
      onClick: handleViewFullProfile,
    },
    {
      icon: FileText,
      label: 'Share Document',
      onClick: handleShareDocument,
    },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Search Bar */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute z-10 mt-1 w-full max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((contact) => (
              <button
                key={contact.id}
                onClick={() => addContact(contact)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  {contact.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {contact.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {contact.email}
                  </p>
                  {contact.company && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {contact.company}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Contacts */}
      {selectedContacts.length > 0 && (
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Selected Contacts ({selectedContacts.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
              >
                <span className="font-medium">{contact.name}</span>
                <button
                  onClick={() => removeContact(contact.id)}
                  className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Menu */}
      {selectedContacts.length > 0 && (
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <button
              onClick={() => setShowActionMenu(!showActionMenu)}
              className="w-full flex items-center justify-between px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              <span className="text-sm font-medium">Actions</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {showActionMenu && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg overflow-hidden">
                {actions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => {
                        action.onClick();
                        setShowActionMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {action.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Timeline Events */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Recent Activity
        </h3>
        {selectedContacts.length > 0 ? (
          <div className="space-y-3">
            {recentTimeline.map((event) => (
              <div
                key={event.id}
                className="flex gap-3 p-3 rounded-md bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {event.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {event.timestamp.toLocaleDateString()} at{' '}
                    {event.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Search and select contacts to see their activity
            </p>
          </div>
        )}
      </div>

      {/* Email Composer Modal */}
      <EmailComposer
        isOpen={isComposerOpen}
        onClose={handleCloseComposer}
        initialData={composerInitialData}
      />

      {/* Contact Detail Modal */}
      {showContactModal && selectedContact && (
        <ContactDetailModal
          contactId={selectedContact}
          isOpen={showContactModal}
          onClose={() => {
            setShowContactModal(false);
            setSelectedContact(null);
          }}
        />
      )}
    </div>
  );
}
