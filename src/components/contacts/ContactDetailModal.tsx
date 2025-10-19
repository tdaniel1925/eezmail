'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContactOverview } from './ContactOverview';
import { ContactTimeline } from './ContactTimeline';
import { ContactNotes } from './ContactNotes';
import { ContactDocuments } from './ContactDocuments';
import { ContactActivity } from './ContactActivity';

export interface Contact {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  company: string | null;
  jobTitle: string | null;
  avatarUrl: string | null;
  isFavorite: boolean;
  createdAt: Date;
  lastContactedAt: Date | null;
}

interface ContactDetailModalProps {
  contact: Contact;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

type TabType = 'overview' | 'timeline' | 'notes' | 'documents' | 'activity';

interface Tab {
  id: TabType;
  label: string;
}

export function ContactDetailModal({
  contact,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: ContactDetailModalProps): JSX.Element | null {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!isOpen) return null;

  const tabs: Tab[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'notes', label: 'Notes' },
    { id: 'documents', label: 'Documents' },
    { id: 'activity', label: 'Activity' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <ContactOverview
            contact={contact}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        );
      case 'timeline':
        return <ContactTimeline contactId={contact.id} />;
      case 'notes':
        return <ContactNotes contactId={contact.id} />;
      case 'documents':
        return <ContactDocuments contactId={contact.id} />;
      case 'activity':
        return <ContactActivity contactId={contact.id} />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              {contact.avatarUrl ? (
                <img
                  src={contact.avatarUrl}
                  alt={contact.displayName || 'Contact'}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
                  {(contact.displayName || contact.firstName || 'C')
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}

              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {contact.displayName ||
                    `${contact.firstName} ${contact.lastName}` ||
                    'Contact'}
                </h2>
                {contact.jobTitle && contact.company && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {contact.jobTitle} at {contact.company}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-6">
            <nav className="flex -mb-px space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  )}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">{renderTabContent()}</div>
        </div>
      </div>
    </>
  );
}
