'use client';

import { useState } from 'react';
import {
  Search,
  Plus,
  List,
  Grid3x3,
  Star,
  Mail,
  Phone,
  Building2,
  Menu,
} from 'lucide-react';
import { ContactAvatar } from './ContactAvatar';
import { cn } from '@/lib/utils';
import { getContactAvatarData } from '@/lib/contacts/avatar';
import type { ContactListItem } from '@/lib/contacts/data';
import { format } from 'date-fns';

interface ContactListProps {
  contacts: ContactListItem[];
  onContactSelect: (contactId: string) => void;
  onToggleSidebar?: () => void;
  onAddContact?: () => void;
}

export function ContactList({
  contacts,
  onContactSelect,
  onToggleSidebar,
  onAddContact,
}: ContactListProps): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Filter contacts
  const filteredContacts = contacts.filter((contact) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.firstName?.toLowerCase().includes(query) ||
      contact.lastName?.toLowerCase().includes(query) ||
      contact.displayName?.toLowerCase().includes(query) ||
      contact.company?.toLowerCase().includes(query) ||
      contact.primaryEmail?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        {/* Search Bar */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between gap-3">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Toggle sidebar"
              >
                <Menu size={18} className="text-gray-600 dark:text-gray-400" />
              </button>
            )}
            <div className="relative flex-1 max-w-xl">
              <Search
                className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  )}
                  title="List view"
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  )}
                  title="Grid view"
                >
                  <Grid3x3 size={16} />
                </button>
              </div>
              {/* Add Contact Button */}
              <button
                onClick={onAddContact}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                Add Contact
              </button>
            </div>
          </div>
        </div>

        {/* Title Section */}
        <div className="px-4 pb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            Contacts
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {filteredContacts.length} contact
            {filteredContacts.length !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      {/* Contact List/Grid */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <div className="mb-2 text-4xl">👥</div>
            <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
              {searchQuery ? 'No contacts found' : 'No contacts yet'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Add your first contact to get started'}
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredContacts.map((contact) => {
              const avatarData = getContactAvatarData(
                contact,
                contact.primaryEmail || undefined
              );

              return (
                <div
                  key={contact.id}
                  onClick={() => onContactSelect(contact.id)}
                  className="group px-4 py-3 hover:bg-white dark:hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <ContactAvatar
                      avatarUrl={avatarData.url}
                      name={avatarData.name}
                      initials={avatarData.initials}
                      color={avatarData.color}
                      size="lg"
                    />

                    {/* Contact Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {avatarData.name}
                        </h3>
                        {contact.isFavorite && (
                          <Star
                            size={14}
                            className="text-yellow-500 fill-yellow-500 flex-shrink-0"
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {contact.company && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Building2 size={14} className="flex-shrink-0" />
                            <span className="truncate">{contact.company}</span>
                            {contact.jobTitle && (
                              <span className="text-gray-400 dark:text-gray-500">
                                · {contact.jobTitle}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {contact.primaryEmail && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail size={14} className="flex-shrink-0" />
                            <span className="truncate">
                              {contact.primaryEmail}
                            </span>
                          </div>
                        )}
                        {contact.primaryPhone && (
                          <div className="flex items-center gap-1.5">
                            <Phone size={14} className="flex-shrink-0" />
                            <span>{contact.primaryPhone}</span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {contact.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {contact.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className={cn(
                                'px-2 py-0.5 text-xs font-medium rounded-full',
                                tag.color === 'blue' &&
                                  'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
                                tag.color === 'green' &&
                                  'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
                                tag.color === 'red' &&
                                  'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
                                tag.color === 'purple' &&
                                  'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
                                tag.color === 'orange' &&
                                  'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
                                tag.color === 'pink' &&
                                  'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300'
                              )}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Last Contacted */}
                    {contact.lastContactedAt && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-right flex-shrink-0">
                        Last contacted
                        <br />
                        {format(new Date(contact.lastContactedAt), 'MMM d')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
            {filteredContacts.map((contact) => {
              const avatarData = getContactAvatarData(
                contact,
                contact.primaryEmail || undefined
              );

              return (
                <div
                  key={contact.id}
                  onClick={() => onContactSelect(contact.id)}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex flex-col items-center text-center">
                    <ContactAvatar
                      avatarUrl={avatarData.url}
                      name={avatarData.name}
                      initials={avatarData.initials}
                      color={avatarData.color}
                      size="xl"
                      className="mb-3"
                    />

                    <div className="flex items-center gap-1.5 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                        {avatarData.name}
                      </h3>
                      {contact.isFavorite && (
                        <Star
                          size={12}
                          className="text-yellow-500 fill-yellow-500 flex-shrink-0"
                        />
                      )}
                    </div>

                    {contact.company && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate w-full mb-2">
                        {contact.company}
                      </p>
                    )}

                    {contact.primaryEmail && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-full">
                        {contact.primaryEmail}
                      </p>
                    )}

                    {contact.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 justify-center">
                        {contact.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag.id}
                            className={cn(
                              'px-1.5 py-0.5 text-[10px] font-medium rounded-full',
                              tag.color === 'blue' &&
                                'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
                              tag.color === 'green' &&
                                'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
                              tag.color === 'red' &&
                                'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
                              tag.color === 'purple' &&
                                'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                            )}
                          >
                            {tag.name}
                          </span>
                        ))}
                        {contact.tags.length > 2 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            +{contact.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
