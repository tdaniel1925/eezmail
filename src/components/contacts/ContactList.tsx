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
import { GroupBadge } from './GroupBadge';
import { TagBadge } from './TagBadge';
import { UnifiedHeader } from '@/components/layout/UnifiedHeader';
import { cn } from '@/lib/utils';
import { getContactAvatarData } from '@/lib/contacts/avatar';
import type { ContactListItem } from '@/lib/contacts/data';
import { format } from 'date-fns';

interface ContactListProps {
  contacts: ContactListItem[];
  onContactSelect: (contactId: string) => void;
  onToggleSidebar?: () => void;
  onAddContact?: () => void;
  selectedIds?: string[];
  onToggleSelect?: (contactId: string) => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
}

export function ContactList({
  contacts,
  onContactSelect,
  onToggleSidebar,
  onAddContact,
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
  onClearSelection,
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
      {/* Unified Header */}
      <UnifiedHeader
        title="Contacts"
        subtitle={`${filteredContacts.length} contact${filteredContacts.length !== 1 ? 's' : ''}`}
        onToggleSidebar={onToggleSidebar}
        customActions={
          <>
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
            {onAddContact && (
              <button
                onClick={onAddContact}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                Add Contact
              </button>
            )}
          </>
        }
      />

      {/* Search Bar */}
      <div className="px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
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
      </div>

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
          <div>
            {/* Table Header - Fixed height with aligned bottom border */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 h-12 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                {/* Checkbox Column */}
                {onToggleSelect && (
                  <div className="flex items-center justify-center w-4 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === filteredContacts.length &&
                        filteredContacts.length > 0
                      }
                      onChange={() => {
                        if (selectedIds.length === filteredContacts.length) {
                          onClearSelection?.();
                        } else {
                          onSelectAll?.();
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>
                )}

                {/* Avatar Spacer */}
                <div className="w-12 flex-shrink-0" />

                {/* Name Column */}
                <div className="flex-1 min-w-[200px]">Name</div>

                {/* Company Column */}
                <div className="w-48 flex-shrink-0">Company</div>

                {/* Email Column */}
                <div className="w-56 flex-shrink-0">Email</div>

                {/* Phone Column */}
                <div className="w-40 flex-shrink-0">Phone</div>

                {/* Tags/Groups Column */}
                <div className="w-48 flex-shrink-0">Tags & Groups</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredContacts.map((contact) => {
                const avatarData = getContactAvatarData(
                  contact,
                  contact.primaryEmail || undefined
                );

                return (
                  <div
                    key={contact.id}
                    className="group px-4 py-3 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox - Always visible */}
                      {onToggleSelect && (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(contact.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            onToggleSelect(contact.id);
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}

                      {/* Avatar */}
                      <div
                        onClick={() => onContactSelect(contact.id)}
                        className="cursor-pointer flex-shrink-0"
                      >
                        <ContactAvatar
                          avatarUrl={avatarData.url}
                          name={avatarData.name}
                          initials={avatarData.initials}
                          color={avatarData.color}
                          size="lg"
                        />
                      </div>

                      {/* Name Column - flex-1 to match header */}
                      <div
                        onClick={() => onContactSelect(contact.id)}
                        className="flex-1 min-w-[200px] cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
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
                        {contact.jobTitle && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {contact.jobTitle}
                          </p>
                        )}
                      </div>

                      {/* Company Column - w-48 to match header */}
                      <div className="w-48 flex-shrink-0">
                        {contact.company && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                            <Building2 size={14} className="flex-shrink-0" />
                            <span className="truncate">{contact.company}</span>
                          </div>
                        )}
                      </div>

                      {/* Email Column - w-56 to match header */}
                      <div className="w-56 flex-shrink-0">
                        {contact.primaryEmail && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                            <Mail size={14} className="flex-shrink-0" />
                            <span className="truncate">
                              {contact.primaryEmail}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Phone Column - w-40 to match header */}
                      <div className="w-40 flex-shrink-0">
                        {contact.primaryPhone && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                            <Phone size={14} className="flex-shrink-0" />
                            <span className="truncate">
                              {contact.primaryPhone}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Tags/Groups Column - w-48 to match header */}
                      <div className="w-48 flex-shrink-0">
                        {(contact.groups && contact.groups.length > 0) ||
                        contact.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {/* Groups */}
                            {contact.groups?.slice(0, 2).map((group) => (
                              <GroupBadge
                                key={group.id}
                                name={group.name}
                                color={group.color}
                                size="sm"
                              />
                            ))}
                            {/* Tags */}
                            {contact.tags.slice(0, 2).map((tag) => (
                              <TagBadge
                                key={tag.id}
                                name={tag.name}
                                color={tag.color}
                                size="sm"
                              />
                            ))}
                            {/* Show +N if more */}
                            {(contact.groups ? contact.groups.length : 0) +
                              contact.tags.length >
                              4 && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                +
                                {(contact.groups ? contact.groups.length : 0) +
                                  contact.tags.length -
                                  4}
                              </span>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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

                    {/* Groups and Tags */}
                    {((contact.groups && contact.groups.length > 0) ||
                      contact.tags.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-2 justify-center max-w-full">
                        {/* Show first group */}
                        {contact.groups && contact.groups.length > 0 && (
                          <GroupBadge
                            name={contact.groups[0].name}
                            color={contact.groups[0].color}
                            size="sm"
                          />
                        )}
                        {/* Show first 2 tags */}
                        {contact.tags.slice(0, 2).map((tag) => (
                          <TagBadge
                            key={tag.id}
                            name={tag.name}
                            color={tag.color}
                            size="sm"
                          />
                        ))}
                        {/* Show +N if more items */}
                        {(contact.groups ? contact.groups.length - 1 : 0) +
                          (contact.tags.length > 2
                            ? contact.tags.length - 2
                            : 0) >
                          0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            +
                            {(contact.groups ? contact.groups.length - 1 : 0) +
                              (contact.tags.length > 2
                                ? contact.tags.length - 2
                                : 0)}
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
