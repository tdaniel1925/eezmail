# Remaining Features Implementation Guide

## Overview

This document provides complete implementation instructions for the 7 remaining UX improvement features. Each section includes code examples, file locations, and step-by-step instructions.

---

## 1. Login/Signup Validation Enhancements

### Files to Modify

- `src/app/(auth)/signup/page.tsx`
- `src/app/(auth)/login/page.tsx`

### Signup Page Changes

**Add new state variables:**

```typescript
const [usernameValidation, setUsernameValidation] = useState<{
  valid: boolean;
  message: string;
  checking: boolean;
}>({ valid: false, message: '', checking: false });

const [passwordStrength, setPasswordStrength] = useState<{
  score: number; // 0-4
  label: string; // weak, fair, good, strong
  checks: {
    length: boolean;
    number: boolean;
    special: boolean;
    uppercase: boolean;
  };
}>({
  score: 0,
  label: 'weak',
  checks: { length: false, number: false, special: false, uppercase: false },
});
```

**Add validation functions:**

```typescript
// Username validation (debounced)
const validateUsername = useCallback(
  debounce(async (value: string) => {
    if (!value || value.length < 3) {
      setUsernameValidation({
        valid: false,
        message: 'Username must be at least 3 characters',
        checking: false,
      });
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      setUsernameValidation({
        valid: false,
        message: 'Only letters, numbers, _ and - allowed',
        checking: false,
      });
      return;
    }

    setUsernameValidation({ valid: false, message: '', checking: true });

    // Check availability
    try {
      const response = await fetch(
        `/api/auth/check-username?username=${value}`
      );
      const data = await response.json();

      if (data.available) {
        setUsernameValidation({
          valid: true,
          message: 'Username available!',
          checking: false,
        });
      } else {
        const suggestions = data.suggestions || [];
        setUsernameValidation({
          valid: false,
          message: `Taken. Try: ${suggestions.slice(0, 2).join(', ')}`,
          checking: false,
        });
      }
    } catch (error) {
      setUsernameValidation({
        valid: false,
        message: 'Could not check availability',
        checking: false,
      });
    }
  }, 500),
  []
);

// Password strength calculation
const calculatePasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 8,
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    uppercase: /[A-Z]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const labels = ['weak', 'weak', 'fair', 'good', 'strong'];

  setPasswordStrength({
    score,
    label: labels[score],
    checks,
  });
};
```

**Username input with validation UI:**

```tsx
<div>
  <label htmlFor="username" className="...">
    Username *
  </label>
  <div className="relative">
    <input
      id="username"
      value={username}
      onChange={(e) => {
        setUsername(e.target.value);
        validateUsername(e.target.value);
      }}
      className="..."
    />
    {/* Validation indicator */}
    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
      {usernameValidation.checking ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      ) : usernameValidation.valid ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : username.length > 0 ? (
        <XCircle className="h-5 w-5 text-red-500" />
      ) : null}
    </div>
  </div>
  {/* Validation message */}
  {usernameValidation.message && (
    <p
      className={cn(
        'text-xs mt-1',
        usernameValidation.valid ? 'text-green-600' : 'text-red-600'
      )}
    >
      {usernameValidation.message}
    </p>
  )}
</div>
```

**Password input with strength meter:**

```tsx
<div>
  <label htmlFor="password">Password *</label>
  <input
    type="password"
    value={password}
    onChange={(e) => {
      setPassword(e.target.value);
      calculatePasswordStrength(e.target.value);
    }}
  />

  {/* Strength meter */}
  {password && (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300',
              passwordStrength.score === 1 && 'w-1/4 bg-red-500',
              passwordStrength.score === 2 && 'w-1/2 bg-orange-500',
              passwordStrength.score === 3 && 'w-3/4 bg-yellow-500',
              passwordStrength.score === 4 && 'w-full bg-green-500'
            )}
          />
        </div>
        <span className="text-xs font-medium capitalize">
          {passwordStrength.label}
        </span>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs">
          {passwordStrength.checks.length ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <X className="h-3 w-3 text-gray-400" />
          )}
          <span
            className={passwordStrength.checks.length ? 'text-green-600' : ''}
          >
            At least 8 characters
          </span>
        </div>
        {/* Repeat for number, special, uppercase */}
      </div>
    </div>
  )}
</div>
```

### Login Page Changes

**Add username/email toggle:**

```tsx
const [loginMode, setLoginMode] = useState<'username' | 'email'>('username');

<div>
  <div className="flex items-center justify-between mb-2">
    <label>Username or Email</label>
    <button
      type="button"
      onClick={() =>
        setLoginMode(loginMode === 'username' ? 'email' : 'username')
      }
      className="text-xs text-primary hover:underline"
    >
      Use {loginMode === 'username' ? 'email' : 'username'} instead
    </button>
  </div>
  <input
    type={loginMode === 'email' ? 'email' : 'text'}
    placeholder={loginMode === 'email' ? 'you@example.com' : 'username'}
    // ... rest
  />
</div>;
```

---

## 2. Settings Search Functionality

### Create Search Component

**File:** `src/components/settings/SettingsSearch.tsx`

```typescript
'use client';

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsSearchProps {
  tabs: Array<{
    id: string;
    label: string;
    description?: string;
    keywords?: string[];
  }>;
  onTabSelect: (tabId: string) => void;
}

export function SettingsSearch({ tabs, onTabSelect }: SettingsSearchProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const filteredResults = useMemo(() => {
    if (!query) return [];

    const lowerQuery = query.toLowerCase();
    return tabs.filter((tab) => {
      const searchText = [
        tab.label,
        tab.description,
        ...(tab.keywords || []),
      ].join(' ').toLowerCase();

      return searchText.includes(lowerQuery);
    });
  }, [query, tabs]);

  const handleSelectResult = (tabId: string) => {
    onTabSelect(tabId);
    setQuery('');
    setIsFocused(false);
  };

  return (
    <div className="relative">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder="Search settings..."
          className="w-full pl-10 pr-10 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Search results dropdown */}
      {isFocused && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
          {filteredResults.length > 0 ? (
            <div className="py-2">
              {filteredResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelectResult(result.id)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {result.label}
                  </div>
                  {result.description && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {result.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              No settings found for "{query}"
            </div>
          )}
        </div>
      )}

      {/* Keyboard shortcut hint */}
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">⌘K</kbd> to search
      </div>
    </div>
  );
}
```

**Add to settings page** (`src/app/dashboard/settings/page.tsx`):

```tsx
const [selectedTab, setSelectedTab] = useState('account');

// Add keywords to tabs
const tabs = [
  {
    id: 'account',
    label: 'Account',
    description: 'Profile, password, and preferences',
    keywords: ['profile', 'user', 'name', 'avatar', 'password', 'security'],
  },
  // ... other tabs with keywords
];

return (
  <div>
    {/* Add search at top */}
    <SettingsSearch tabs={tabs} onTabSelect={setSelectedTab} />

    {/* Rest of settings UI */}
  </div>
);
```

---

## 3. Account Management UX Improvements

### Enhanced Removal Confirmation

**File:** `src/components/settings/AccountRemovalDialog.tsx`

```typescript
'use client';

import { useState } from 'react';
import { AlertTriangle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface AccountRemovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  accountEmail: string;
  emailCount: number;
  folderCount: number;
  draftCount: number;
}

export function AccountRemovalDialog({
  isOpen,
  onClose,
  onConfirm,
  accountEmail,
  emailCount,
  folderCount,
  draftCount,
}: AccountRemovalDialogProps) {
  const [understood, setUnderstood] = useState(false);
  const [disconnectOnly, setDisconnectOnly] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6">
        {/* Warning icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-center mb-2">Remove Account?</h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          {accountEmail}
        </p>

        {/* Data loss warning */}
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="font-medium text-red-900 dark:text-red-100 mb-2">
            This will permanently delete:
          </p>
          <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
            <li>• {emailCount.toLocaleString()} emails</li>
            <li>• {folderCount} folders</li>
            <li>• {draftCount} drafts</li>
            <li>• All search history and filters</li>
          </ul>
        </div>

        {/* Alternative option */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={disconnectOnly}
              onCheckedChange={(checked) => setDisconnectOnly(checked as boolean)}
            />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Disconnect temporarily instead
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Keep your data but stop syncing. You can reconnect anytime.
              </p>
            </div>
          </label>
        </div>

        {/* Export option */}
        <Button
          variant="outline"
          className="w-full mb-4"
          onClick={() => {
            // Trigger export
            window.open(`/api/export/account?id=${accountEmail}`, '_blank');
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Export My Data First
        </Button>

        {/* Confirmation checkbox */}
        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <Checkbox
            checked={understood}
            onCheckedChange={(checked) => setUnderstood(checked as boolean)}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            I understand this action {!disconnectOnly && 'cannot be undone and will permanently delete all my data'}
          </span>
        </label>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!understood}
            className="flex-1"
          >
            {disconnectOnly ? 'Disconnect' : 'Delete Everything'}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### Default Account Tooltip

**Add to ConnectedAccounts.tsx:**

```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>
      <Badge>Default</Badge>
    </TooltipTrigger>
    <TooltipContent>
      <div className="space-y-2 max-w-xs">
        <p className="font-medium">Default Account</p>
        <p className="text-xs">This account is used for:</p>
        <ul className="text-xs space-y-1">
          <li>• Composing new emails</li>
          <li>• AI suggestions and summaries</li>
          <li>• Scheduled sends</li>
          <li>• Quick replies</li>
        </ul>
      </div>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>;
```

---

## 4. Error History and Troubleshooting

**File:** `src/components/settings/ErrorHistory.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, ChevronRight, Trash2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorEntry {
  id: string;
  timestamp: Date;
  accountId: string;
  accountEmail: string;
  errorType: string;
  message: string;
  resolved: boolean;
  resolvedAt?: Date;
}

export function ErrorHistory() {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [patterns, setPatterns] = useState<string[]>([]);

  useEffect(() => {
    loadErrorHistory();
    detectPatterns();
  }, []);

  const loadErrorHistory = async () => {
    const response = await fetch('/api/errors/history');
    const data = await response.json();
    setErrors(data.errors || []);
  };

  const detectPatterns = () => {
    // Pattern detection logic
    const detectedPatterns: string[] = [];

    // Check for recurring errors
    const errorCounts = errors.reduce((acc, err) => {
      acc[err.errorType] = (acc[err.errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(errorCounts).forEach(([type, count]) => {
      if (count >= 3) {
        detectedPatterns.push(`${type} occurred ${count} times`);
      }
    });

    // Check for time patterns
    const errorsByDay = errors.reduce((acc, err) => {
      const day = err.timestamp.getDay();
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const maxDay = Object.entries(errorsByDay).reduce((max, [day, count]) =>
      count > (errorsByDay[max] || 0) ? parseInt(day) : max, 0
    );

    if (errorsByDay[maxDay] >= 2) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      detectedPatterns.push(`Errors frequently occur on ${dayNames[maxDay]}`);
    }

    setPatterns(detectedPatterns);
  };

  const clearHistory = async () => {
    await fetch('/api/errors/history', { method: 'DELETE' });
    setErrors([]);
  };

  const filteredErrors = showResolved
    ? errors
    : errors.filter(e => !e.resolved);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Error History</h3>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
            />
            Show resolved
          </label>
          <Button size="sm" variant="ghost" onClick={clearHistory}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear History
          </Button>
        </div>
      </div>

      {/* Pattern detection */}
      {patterns.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                Patterns Detected
              </p>
              <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                {patterns.map((pattern, i) => (
                  <li key={i}>• {pattern}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Error list */}
      <div className="space-y-2">
        {filteredErrors.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No errors recorded</p>
          </div>
        ) : (
          filteredErrors.map((error) => (
            <div
              key={error.id}
              className="flex items-start gap-3 p-3 border rounded-lg hover:border-primary transition-colors"
            >
              {error.resolved ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium text-sm">{error.accountEmail}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {error.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {error.timestamp.toLocaleString()}
                  {error.resolved && error.resolvedAt && (
                    <span className="text-green-600 ml-2">
                      • Resolved {error.resolvedAt.toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

---

## 5. Contextual Help System

**File:** `src/components/ui/help-tooltip.tsx`

```typescript
'use client';

import { HelpCircle, ExternalLink } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HelpTooltipProps {
  content: string;
  example?: string;
  learnMoreUrl?: string;
}

export function HelpTooltip({ content, example, learnMoreUrl }: HelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-2">
            <p className="text-sm">{content}</p>
            {example && (
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                <p className="font-medium mb-1">Example:</p>
                <p>{example}</p>
              </div>
            )}
            {learnMoreUrl && (
              <a
                href={learnMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Learn more
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

**Usage example:**

```tsx
<div className="flex items-center gap-2">
  <label>Folder Type</label>
  <HelpTooltip
    content="Choose how this folder should be categorized in your inbox"
    example="'Inbox' for primary emails, 'Archive' for old emails, 'Custom' for project folders"
    learnMoreUrl="/help/folder-types"
  />
</div>
```

---

## 6. Keyboard Shortcuts

**File:** `src/components/ui/keyboard-shortcuts-modal.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { X, Command } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Navigation
  { keys: ['⌘', 'K'], description: 'Search settings', category: 'Navigation' },
  { keys: ['G', 'I'], description: 'Go to Inbox', category: 'Navigation' },
  { keys: ['G', 'S'], description: 'Go to Sent', category: 'Navigation' },
  { keys: ['G', 'D'], description: 'Go to Drafts', category: 'Navigation' },

  // Actions
  { keys: ['⌘', 'N'], description: 'New email', category: 'Actions' },
  { keys: ['⌘', 'S'], description: 'Sync all accounts', category: 'Actions' },
  { keys: ['⌘', 'Enter'], description: 'Send email', category: 'Actions' },
  { keys: ['R'], description: 'Reply', category: 'Actions' },
  { keys: ['A'], description: 'Reply all', category: 'Actions' },
  { keys: ['F'], description: 'Forward', category: 'Actions' },

  // Selection
  { keys: ['J'], description: 'Next email', category: 'Selection' },
  { keys: ['K'], description: 'Previous email', category: 'Selection' },
  { keys: ['X'], description: 'Select email', category: 'Selection' },

  // General
  { keys: ['?'], description: 'Show this help', category: 'General' },
  { keys: ['Esc'], description: 'Close modal', category: 'General' },
];

export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show shortcuts modal on "?"
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsOpen(true);
      }

      // Close on Escape
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Command className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Shortcuts by category */}
        <div className="space-y-6">
          {categories.map(category => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts
                  .filter(s => s.category === category)
                  .map((shortcut, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, j) => (
                          <kbd
                            key={j}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-xs font-mono"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">?</kbd> anytime to show this menu
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Add to root layout:**

```tsx
import { KeyboardShortcutsModal } from '@/components/ui/keyboard-shortcuts-modal';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <KeyboardShortcutsModal />
      </body>
    </html>
  );
}
```

---

## 7. Detailed Sync Stage Visibility

**Enhance AccountStatusCard.tsx with detailed stages:**

```typescript
interface SyncStage {
  id: string;
  label: string;
  icon: React.ReactNode;
  percentage: number;
  description: string;
}

const syncStages: SyncStage[] = [
  {
    id: 'auth',
    label: 'Authenticating',
    icon: '🔗',
    percentage: 5,
    description: 'Verifying your credentials',
  },
  {
    id: 'folders',
    label: 'Loading Folders',
    icon: '📁',
    percentage: 15,
    description: 'Fetching folder structure',
  },
  {
    id: 'detecting',
    label: 'Detecting Types',
    icon: '🔍',
    percentage: 25,
    description: 'Categorizing folders',
  },
  {
    id: 'inbox',
    label: 'Syncing Inbox',
    icon: '📧',
    percentage: 50,
    description: 'Fetching inbox emails',
  },
  {
    id: 'other',
    label: 'Syncing Other Folders',
    icon: '📬',
    percentage: 80,
    description: 'Fetching remaining emails',
  },
  {
    id: 'indexing',
    label: 'Indexing for Search',
    icon: '🔎',
    percentage: 95,
    description: 'Building search index',
  },
  {
    id: 'complete',
    label: 'Complete',
    icon: '✓',
    percentage: 100,
    description: 'All done!',
  },
];

// In component:
const currentStageIndex = syncStages.findIndex(s => s.percentage >= syncProgress);
const currentStage = syncStages[currentStageIndex] || syncStages[0];

{status === 'syncing' && (
  <div className="space-y-4">
    {/* Stage indicator */}
    <div className="flex items-center gap-3">
      <span className="text-2xl">{currentStage.icon}</span>
      <div className="flex-1">
        <div className="font-medium text-sm">{currentStage.label}</div>
        <div className="text-xs text-gray-500">{currentStage.description}</div>
      </div>
      <span className="text-sm font-medium text-primary">
        {currentStage.percentage}%
      </span>
    </div>

    {/* Progress timeline */}
    <div className="relative pt-4">
      <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700" />
      <div
        className="absolute top-6 left-0 h-0.5 bg-primary transition-all duration-500"
        style={{ width: `${syncProgress}%` }}
      />

      <div className="flex justify-between relative">
        {syncStages.slice(0, -1).map((stage, i) => (
          <div key={stage.id} className="flex flex-col items-center">
            <div
              className={cn(
                'w-3 h-3 rounded-full border-2 bg-white dark:bg-gray-900 transition-colors',
                i <= currentStageIndex
                  ? 'border-primary bg-primary'
                  : 'border-gray-300 dark:border-gray-700'
              )}
            />
            <span className="text-xs mt-2 text-gray-500">{stage.label}</span>
          </div>
        ))}
      </div>
    </div>

    {/* ETA */}
    {syncTotal > 0 && (
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          {syncProgress.toLocaleString()} of {syncTotal.toLocaleString()} emails
        </span>
        <span>
          About {Math.max(1, Math.ceil((syncTotal - syncProgress) / 25))} min remaining
        </span>
      </div>
    )}
  </div>
)}
```

---

## Implementation Order

1. **Start with Login/Signup** - Immediate user-facing improvements
2. **Settings Search** - High value, relatively simple
3. **Keyboard Shortcuts** - Quick wins for power users
4. **Help Tooltips** - Add throughout as you work
5. **Account Management** - Important for trust
6. **Error History** - Requires backend setup
7. **Sync Stage Visibility** - Requires backend integration

---

## Testing Checklist

For each feature:

- [ ] Works in light and dark mode
- [ ] Mobile responsive
- [ ] Keyboard accessible
- [ ] No console errors
- [ ] Proper TypeScript types
- [ ] Debug logging added
- [ ] User feedback is clear
- [ ] Loading states handled

---

## Deployment Notes

All features are:

- ✅ Backward compatible
- ✅ No database changes required (except error history)
- ✅ Can be deployed incrementally
- ✅ Can be feature-flagged if needed

---

**Estimated Time:** 12-16 hours total
**Priority:** Implement in order listed above
**Testing:** Use TESTING_CHECKLIST.md for each feature


