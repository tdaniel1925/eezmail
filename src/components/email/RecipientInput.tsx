'use client';

import { useState, useRef, useEffect } from 'react';
import { X, User, Users, Mail } from 'lucide-react';
import {
  searchRecipientsAction,
  isValidEmail,
  type ContactSearchResult,
  type GroupSearchResult,
} from '@/lib/contacts/search-actions';

interface RecipientInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export function RecipientInput({
  value,
  onChange,
  placeholder = 'Enter email addresses...',
  label,
}: RecipientInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [contacts, setContacts] = useState<ContactSearchResult[]>([]);
  const [groups, setGroups] = useState<GroupSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Parse emails from value string
  const recipients = value
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  // Search contacts when input changes
  useEffect(() => {
    if (!inputValue.trim()) {
      // Show recent contacts when input is empty
      performSearch('');
      return;
    }

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(inputValue);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [inputValue]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const result = await searchRecipientsAction(query, 8);
      if (result.success) {
        setContacts(result.contacts || []);
        setGroups(result.groups || []);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Error searching recipients:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addRecipient = (email: string) => {
    if (!email) return;

    // Don't add if already exists
    if (recipients.includes(email)) return;

    const newValue = recipients.length > 0 ? `${value}, ${email}` : email;
    onChange(newValue);
    setInputValue('');
    setShowDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const addGroupMembers = (group: GroupSearchResult) => {
    const newEmails = group.memberEmails.filter(
      (email) => !recipients.includes(email)
    );

    if (newEmails.length === 0) return;

    const newValue =
      recipients.length > 0
        ? `${value}, ${newEmails.join(', ')}`
        : newEmails.join(', ');
    onChange(newValue);
    setInputValue('');
    setShowDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const removeRecipient = (email: string) => {
    const newRecipients = recipients.filter((r) => r !== email);
    onChange(newRecipients.join(', '));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    // If user types comma or semicolon, try to add email
    if (val.includes(',') || val.includes(';')) {
      const email = val.replace(/[,;]/g, '').trim();
      if (isValidEmail(email)) {
        addRecipient(email);
      } else {
        // Keep the input if it's not a valid email yet
        setInputValue(email);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allResults = [...groups, ...contacts];

    if (e.key === 'Enter') {
      e.preventDefault();

      // If there's a selection in dropdown, use it
      if (selectedIndex >= 0 && allResults.length > 0) {
        const selected = allResults[selectedIndex];
        if ('memberEmails' in selected) {
          addGroupMembers(selected as GroupSearchResult);
        } else {
          addRecipient((selected as ContactSearchResult).email);
        }
      } else if (inputValue.trim() && isValidEmail(inputValue.trim())) {
        // Otherwise, try to add the input value as email
        addRecipient(inputValue.trim());
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < allResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setSelectedIndex(-1);
    } else if (e.key === 'Backspace' && !inputValue && recipients.length > 0) {
      // Remove last recipient if backspace on empty input
      removeRecipient(recipients[recipients.length - 1]);
    }
  };

  const allResults = [...groups, ...contacts];

  return (
    <div className="relative flex-1">
      {/* Recipient Chips + Input */}
      <div className="flex flex-wrap items-center gap-1.5 min-h-[36px]">
        {recipients.map((email) => (
          <div
            key={email}
            className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 text-sm text-blue-700 dark:text-blue-300"
          >
            <Mail className="h-3 w-3" />
            <span>{email}</span>
            <button
              onClick={() => removeRecipient(email)}
              className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
              type="button"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowDropdown(true)}
          placeholder={recipients.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[200px] border-none bg-transparent text-sm focus:outline-none focus:ring-0 dark:text-white"
        />
      </div>

      {/* Autocomplete Dropdown */}
      {showDropdown && (contacts.length > 0 || groups.length > 0) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 max-h-[300px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-50"
        >
          {/* Groups */}
          {groups.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                Groups
              </div>
              {groups.map((group, idx) => (
                <button
                  key={group.id}
                  onClick={() => addGroupMembers(group)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    selectedIndex === idx ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                  type="button"
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: group.color }}
                  >
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {group.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Contacts */}
          {contacts.length > 0 && (
            <div>
              {groups.length > 0 && (
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  Contacts
                </div>
              )}
              {contacts.map((contact, idx) => (
                <button
                  key={contact.id}
                  onClick={() => addRecipient(contact.email)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    selectedIndex === groups.length + idx
                      ? 'bg-gray-100 dark:bg-gray-700'
                      : ''
                  }`}
                  type="button"
                >
                  {contact.avatarUrl ? (
                    <img
                      src={contact.avatarUrl}
                      alt={contact.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600">
                      <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {contact.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {contact.email}
                    </div>
                  </div>
                  {contact.isFrequent && (
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      Frequent
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

