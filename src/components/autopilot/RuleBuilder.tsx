'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Plus,
  Mail,
  Folder,
  Tag,
  Archive,
  Trash2,
  Forward,
  Check,
  AlertCircle,
} from 'lucide-react';

interface RuleConditions {
  from?: string;
  to?: string;
  subject?: string;
  body?: string;
  category?: string;
  hasAttachment?: boolean;
  priority?: 'high' | 'normal' | 'low';
}

interface RuleActions {
  moveToFolder?: string;
  addLabel?: string;
  markAs?: 'read' | 'unread' | 'important' | 'archived';
  archive?: boolean;
  delete?: boolean;
  forward?: string;
}

interface Rule {
  id?: string;
  name: string;
  enabled: boolean;
  conditions: RuleConditions;
  actions: RuleActions;
}

interface RuleBuilderProps {
  existingRule?: Rule | null;
  onSave: (rule: Rule) => void;
  onCancel: () => void;
}

export function RuleBuilder({ existingRule, onSave, onCancel }: RuleBuilderProps) {
  const [ruleName, setRuleName] = useState('');
  const [conditions, setConditions] = useState<RuleConditions>({});
  const [actions, setActions] = useState<RuleActions>({});
  const [errors, setErrors] = useState<string[]>([]);

  // Load existing rule data
  useEffect(() => {
    if (existingRule) {
      setRuleName(existingRule.name);
      setConditions(existingRule.conditions || {});
      setActions(existingRule.actions || {});
    }
  }, [existingRule]);

  const handleSave = () => {
    // Validate
    const newErrors: string[] = [];
    
    if (!ruleName.trim()) {
      newErrors.push('Rule name is required');
    }
    
    if (Object.keys(conditions).length === 0) {
      newErrors.push('At least one condition is required');
    }
    
    if (Object.keys(actions).length === 0) {
      newErrors.push('At least one action is required');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);
    
    onSave({
      ...(existingRule || {}),
      name: ruleName,
      enabled: existingRule?.enabled ?? true,
      conditions,
      actions,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {existingRule ? 'Edit Rule' : 'Create New Rule'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-red-800 dark:text-red-400">
                    Please fix the following errors:
                  </h4>
                  <ul className="mt-2 list-disc list-inside text-sm text-red-700 dark:text-red-300">
                    {errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Rule Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rule Name *
            </label>
            <input
              type="text"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              placeholder="e.g., Archive newsletters"
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Conditions Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              WHEN (Conditions) *
            </h3>
            <div className="space-y-4 rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
              {/* From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From (email address or domain)
                </label>
                <input
                  type="text"
                  value={conditions.from || ''}
                  onChange={(e) =>
                    setConditions({ ...conditions, from: e.target.value })
                  }
                  placeholder="e.g., newsletter@example.com or @example.com"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject contains
                </label>
                <input
                  type="text"
                  value={conditions.subject || ''}
                  onChange={(e) =>
                    setConditions({ ...conditions, subject: e.target.value })
                  }
                  placeholder="e.g., [Newsletter] or Invoice"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Body contains
                </label>
                <input
                  type="text"
                  value={conditions.body || ''}
                  onChange={(e) =>
                    setConditions({ ...conditions, body: e.target.value })
                  }
                  placeholder="e.g., unsubscribe"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={conditions.category || ''}
                  onChange={(e) =>
                    setConditions({ ...conditions, category: e.target.value || undefined })
                  }
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white"
                >
                  <option value="">Any category</option>
                  <option value="primary">Primary</option>
                  <option value="newsletters">Newsletters</option>
                  <option value="promotions">Promotions</option>
                  <option value="social">Social</option>
                  <option value="updates">Updates</option>
                </select>
              </div>

              {/* Has Attachment */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasAttachment"
                  checked={conditions.hasAttachment || false}
                  onChange={(e) =>
                    setConditions({
                      ...conditions,
                      hasAttachment: e.target.checked || undefined,
                    })
                  }
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label
                  htmlFor="hasAttachment"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Has attachment
                </label>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              THEN (Actions) *
            </h3>
            <div className="space-y-4 rounded-lg border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-4">
              {/* Move to Folder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Move to folder
                </label>
                <input
                  type="text"
                  value={actions.moveToFolder || ''}
                  onChange={(e) =>
                    setActions({ ...actions, moveToFolder: e.target.value || undefined })
                  }
                  placeholder="e.g., Newsletters"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white"
                />
              </div>

              {/* Add Label */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add label
                </label>
                <input
                  type="text"
                  value={actions.addLabel || ''}
                  onChange={(e) =>
                    setActions({ ...actions, addLabel: e.target.value || undefined })
                  }
                  placeholder="e.g., Important"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white"
                />
              </div>

              {/* Mark As */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mark as
                </label>
                <select
                  value={actions.markAs || ''}
                  onChange={(e) =>
                    setActions({
                      ...actions,
                      markAs: (e.target.value || undefined) as any,
                    })
                  }
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white"
                >
                  <option value="">Don't change</option>
                  <option value="read">Read</option>
                  <option value="unread">Unread</option>
                  <option value="important">Important</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Archive */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="archive"
                  checked={actions.archive || false}
                  onChange={(e) =>
                    setActions({ ...actions, archive: e.target.checked || undefined })
                  }
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label
                  htmlFor="archive"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Archive email
                </label>
              </div>

              {/* Delete */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="delete"
                  checked={actions.delete || false}
                  onChange={(e) =>
                    setActions({ ...actions, delete: e.target.checked || undefined })
                  }
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label
                  htmlFor="delete"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Delete email (move to trash)
                </label>
              </div>

              {/* Forward */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Forward to
                </label>
                <input
                  type="email"
                  value={actions.forward || ''}
                  onChange={(e) =>
                    setActions({ ...actions, forward: e.target.value || undefined })
                  }
                  placeholder="e.g., assistant@company.com"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
            <Check className="h-4 w-4 mr-2" />
            {existingRule ? 'Update Rule' : 'Create Rule'}
          </Button>
        </div>
      </Card>
    </div>
  );
}


