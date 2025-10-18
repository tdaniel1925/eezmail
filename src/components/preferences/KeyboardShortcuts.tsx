'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface Shortcut {
  id: string;
  action: string;
  defaultKey: string;
  customKey?: string;
  category: string;
}

const defaultShortcuts: Shortcut[] = [
  {
    id: 'compose',
    action: 'New Email',
    defaultKey: 'Ctrl+N',
    category: 'Compose',
  },
  { id: 'reply', action: 'Reply', defaultKey: 'Ctrl+R', category: 'Reply' },
  {
    id: 'reply-all',
    action: 'Reply All',
    defaultKey: 'Ctrl+Shift+R',
    category: 'Reply',
  },
  {
    id: 'forward',
    action: 'Forward',
    defaultKey: 'Ctrl+Shift+F',
    category: 'Reply',
  },
  { id: 'send', action: 'Send', defaultKey: 'Ctrl+Enter', category: 'Compose' },
  { id: 'delete', action: 'Delete', defaultKey: 'Delete', category: 'Actions' },
  { id: 'archive', action: 'Archive', defaultKey: 'E', category: 'Actions' },
  {
    id: 'mark-read',
    action: 'Mark as Read',
    defaultKey: 'M',
    category: 'Actions',
  },
  {
    id: 'mark-unread',
    action: 'Mark as Unread',
    defaultKey: 'U',
    category: 'Actions',
  },
  { id: 'star', action: 'Star/Unstar', defaultKey: 'S', category: 'Actions' },
  {
    id: 'search',
    action: 'Search',
    defaultKey: 'Ctrl+F',
    category: 'Navigation',
  },
  {
    id: 'refresh',
    action: 'Refresh',
    defaultKey: 'F5',
    category: 'Navigation',
  },
  { id: 'next', action: 'Next Email', defaultKey: 'J', category: 'Navigation' },
  {
    id: 'previous',
    action: 'Previous Email',
    defaultKey: 'K',
    category: 'Navigation',
  },
  {
    id: 'select-all',
    action: 'Select All',
    defaultKey: 'Ctrl+A',
    category: 'Selection',
  },
];

export function KeyboardShortcuts() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(defaultShortcuts);
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
  const [customKey, setCustomKey] = useState('');

  const handleEditShortcut = (shortcutId: string) => {
    const shortcut = shortcuts.find((s) => s.id === shortcutId);
    if (shortcut) {
      setEditingShortcut(shortcutId);
      setCustomKey(shortcut.customKey || shortcut.defaultKey);
    }
  };

  const handleSaveShortcut = () => {
    if (editingShortcut && customKey) {
      setShortcuts((prev) =>
        prev.map((s) => (s.id === editingShortcut ? { ...s, customKey } : s))
      );
      setEditingShortcut(null);
      setCustomKey('');
    }
  };

  const handleResetShortcut = (shortcutId: string) => {
    setShortcuts((prev) =>
      prev.map((s) =>
        s.id === shortcutId ? { ...s, customKey: undefined } : s
      )
    );
  };

  const handleResetAll = () => {
    setShortcuts((prev) => prev.map((s) => ({ ...s, customKey: undefined })));
  };

  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Keyboard Shortcuts
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Customize keyboard shortcuts for faster email management
          </p>
        </div>
        <Button variant="outline" onClick={handleResetAll}>
          Reset All
        </Button>
      </div>

      <div className="space-y-6">
        {categories.map((category) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category}</CardTitle>
              <CardDescription>
                Shortcuts for {category.toLowerCase()} actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {shortcuts
                  .filter((s) => s.category === category)
                  .map((shortcut) => (
                    <div
                      key={shortcut.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex-1">
                        <Label className="text-sm font-medium">
                          {shortcut.action}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        {editingShortcut === shortcut.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={customKey}
                              onChange={(e) => setCustomKey(e.target.value)}
                              className="w-32"
                              placeholder="Enter shortcut"
                            />
                            <Button size="sm" onClick={handleSaveShortcut}>
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingShortcut(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {shortcut.customKey || shortcut.defaultKey}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditShortcut(shortcut.id)}
                            >
                              Edit
                            </Button>
                            {shortcut.customKey && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleResetShortcut(shortcut.id)}
                              >
                                Reset
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


