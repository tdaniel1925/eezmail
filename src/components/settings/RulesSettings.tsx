'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  PlayCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import {
  getRules,
  createRule,
  updateRule,
  deleteRule,
  toggleRule,
  updateRulePriorities,
  testRule,
  type RuleData,
  type RuleCondition,
  type RuleAction,
} from '@/lib/settings/rule-actions';
import { toast, confirmDialog } from '@/lib/toast';
import type { EmailRule } from '@/db/schema';

const FIELD_OPTIONS = [
  { value: 'from', label: 'From' },
  { value: 'to', label: 'To' },
  { value: 'cc', label: 'CC' },
  { value: 'subject', label: 'Subject' },
  { value: 'body', label: 'Body' },
  { value: 'has_attachment', label: 'Has Attachment' },
  { value: 'is_starred', label: 'Is Starred' },
  { value: 'is_important', label: 'Is Important' },
];

const OPERATOR_OPTIONS = [
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does not contain' },
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'matches_regex', label: 'Matches regex' },
  { value: 'is_true', label: 'Is true' },
  { value: 'is_false', label: 'Is false' },
];

const ACTION_OPTIONS = [
  { value: 'move_to_folder', label: 'Move to folder', needsValue: true },
  { value: 'add_label', label: 'Add label', needsValue: true },
  { value: 'star', label: 'Star email', needsValue: false },
  { value: 'mark_as_read', label: 'Mark as read', needsValue: false },
  { value: 'mark_as_important', label: 'Mark as important', needsValue: false },
  { value: 'delete', label: 'Delete', needsValue: false },
  { value: 'archive', label: 'Archive', needsValue: false },
  { value: 'forward_to', label: 'Forward to', needsValue: true },
  { value: 'mark_as_spam', label: 'Mark as spam', needsValue: false },
];

// Rule templates for quick setup
const RULE_TEMPLATES = [
  {
    name: 'Move Newsletters to Folder',
    description: 'Automatically organize newsletter subscriptions',
    icon: '📰',
    rule: {
      name: 'Newsletters',
      conditions: [
        { field: 'subject', operator: 'contains', value: 'newsletter' },
      ],
      actions: [{ type: 'move_to_folder', value: 'Newsletters' }],
      matchType: 'any' as const,
    },
  },
  {
    name: 'Archive Receipts',
    description: 'Auto-archive order confirmations and receipts',
    icon: '🧾',
    rule: {
      name: 'Receipts',
      conditions: [
        { field: 'subject', operator: 'contains', value: 'receipt' },
        { field: 'subject', operator: 'contains', value: 'order confirmation' },
      ],
      actions: [{ type: 'archive', value: '' }],
      matchType: 'any' as const,
    },
  },
  {
    name: 'Star Emails from Boss',
    description: 'Never miss important emails from your manager',
    icon: '⭐',
    rule: {
      name: 'VIP Emails',
      conditions: [{ field: 'from', operator: 'contains', value: '' }],
      actions: [{ type: 'star', value: '' }],
      matchType: 'all' as const,
    },
  },
  {
    name: 'Auto-Delete Spam',
    description: 'Delete emails from known spam sources',
    icon: '🗑️',
    rule: {
      name: 'Auto-delete Spam',
      conditions: [{ field: 'from', operator: 'contains', value: 'spam' }],
      actions: [{ type: 'delete', value: '' }],
      matchType: 'any' as const,
    },
  },
  {
    name: 'Mark Social Media as Read',
    description: 'Auto-mark social notifications as read',
    icon: '📱',
    rule: {
      name: 'Social Media',
      conditions: [
        { field: 'from', operator: 'contains', value: 'facebook.com' },
        { field: 'from', operator: 'contains', value: 'twitter.com' },
        { field: 'from', operator: 'contains', value: 'linkedin.com' },
      ],
      actions: [{ type: 'mark_as_read', value: '' }],
      matchType: 'any' as const,
    },
  },
  {
    name: 'Organize Work Projects',
    description: 'Move project emails to dedicated folder',
    icon: '💼',
    rule: {
      name: 'Work Projects',
      conditions: [{ field: 'subject', operator: 'contains', value: 'project' }],
      actions: [{ type: 'move_to_folder', value: 'Projects' }],
      matchType: 'any' as const,
    },
  },
];

export function RulesSettings(): JSX.Element {
  const [rules, setRules] = useState<EmailRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const [editingRule, setEditingRule] = useState<EmailRule | null>(null);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    const result = await getRules();
    if (result.success && result.rules) {
      setRules(result.rules);
    }
    setLoading(false);
  };

  const handleCreate = () => {
    setEditingRule(null);
    setShowModal(true);
  };

  const handleCreateFromTemplate = (template: typeof RULE_TEMPLATES[0]) => {
    // Pre-fill the modal with template data
    setEditingRule({
      id: '', // Will be generated on save
      userId: '',
      ...template.rule,
      isEnabled: true,
      priority: rules.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as EmailRule);
    setShowModal(true);
  };

  const handleEdit = (rule: EmailRule) => {
    setEditingRule(rule);
    setShowModal(true);
  };

  const handleDelete = async (ruleId: string) => {
    const confirmed = await confirmDialog(
      'Are you sure you want to delete this rule?'
    );
    if (!confirmed) return;

    const result = await deleteRule(ruleId);
    if (result.success) {
      toast.success('Rule deleted successfully');
      loadRules();
    } else {
      toast.error(result.error || 'Failed to delete rule');
    }
  };

  const handleToggle = async (ruleId: string, isEnabled: boolean) => {
    const result = await toggleRule(ruleId, isEnabled);
    if (result.success) {
      toast.success(`Rule ${isEnabled ? 'enabled' : 'disabled'}`);
      loadRules();
    } else {
      toast.error(result.error || 'Failed to toggle rule');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newRules = [...rules];
    [newRules[index - 1], newRules[index]] = [
      newRules[index],
      newRules[index - 1],
    ];
    setRules(newRules);
    await updateRulePriorities(newRules.map((r) => r.id));
  };

  const handleMoveDown = async (index: number) => {
    if (index === rules.length - 1) return;
    const newRules = [...rules];
    [newRules[index], newRules[index + 1]] = [
      newRules[index + 1],
      newRules[index],
    ];
    setRules(newRules);
    await updateRulePriorities(newRules.map((r) => r.id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Email Rules
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
              Automatically organize and manage incoming emails
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Rule
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          How Rules Work
        </h4>
        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400">•</span>
            <span>Rules are processed in order from top to bottom</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400">•</span>
            <span>Use drag & drop or arrows to reorder rules</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400">•</span>
            <span>Rules apply to new incoming emails automatically</span>
          </li>
        </ul>
      </div>

      {/* Quick Templates */}
      {showTemplates && rules.length === 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Start Templates
            </h3>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Hide
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {RULE_TEMPLATES.map((template) => (
              <button
                key={template.name}
                onClick={() => handleCreateFromTemplate(template)}
                className="text-left p-4 rounded-lg border-2 border-gray-200 dark:border-white/10 hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="text-3xl mb-2">{template.icon}</div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary">
                  {template.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {template.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="text-center py-12 bg-white/60 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
          <div className="text-4xl mb-4">⚙️</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No rules yet
          </h3>
          <p className="text-sm text-gray-600 dark:text-white/60 mb-4">
            Create your first rule to automatically organize your emails
          </p>
          <Button variant="primary" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Rule
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule, index) => (
            <div
              key={rule.id}
              className="rounded-lg border-2 p-4 bg-white/60 dark:bg-white/5 backdrop-blur-md border-gray-200 dark:border-white/10"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                      #{index + 1}
                    </span>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {rule.name}
                    </h3>
                    {!rule.isEnabled && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                        Disabled
                      </span>
                    )}
                    {rule.stopProcessing && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full">
                        Stop after match
                      </span>
                    )}
                  </div>

                  {rule.description && (
                    <p className="text-sm text-gray-600 dark:text-white/60 mb-2">
                      {rule.description}
                    </p>
                  )}

                  <div className="text-sm space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        If:
                      </span>
                      <span className="text-gray-600 dark:text-white/60">
                        {rule.conditions.logic === 'AND' ? 'All' : 'Any'} of{' '}
                        {rule.conditions.rules.length} condition(s)
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Then:
                      </span>
                      <span className="text-gray-600 dark:text-white/60">
                        {rule.actions.length} action(s)
                      </span>
                    </div>
                    {rule.timesTriggered > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Triggered:
                        </span>
                        <span className="text-gray-600 dark:text-white/60">
                          {rule.timesTriggered} times
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    title="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === rules.length - 1}
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(rule.id, !rule.isEnabled)}
                    title={rule.isEnabled ? 'Disable' : 'Enable'}
                  >
                    {rule.isEnabled ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(rule)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(rule.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <RuleModal
          rule={editingRule}
          onClose={() => {
            setShowModal(false);
            setEditingRule(null);
          }}
          onSave={async () => {
            setShowModal(false);
            setEditingRule(null);
            loadRules();
          }}
        />
      )}
    </div>
  );
}

interface RuleModalProps {
  rule: EmailRule | null;
  onClose: () => void;
  onSave: () => void;
}

function RuleModal({ rule, onClose, onSave }: RuleModalProps) {
  const [formData, setFormData] = useState<RuleData>({
    name: rule?.name || '',
    description: rule?.description || '',
    conditions: rule?.conditions || {
      logic: 'AND',
      rules: [{ field: 'from', operator: 'contains', value: '' }],
    },
    actions: rule?.actions || [{ type: 'move_to_folder', value: '' }],
    isEnabled: rule?.isEnabled !== false,
    stopProcessing: rule?.stopProcessing || false,
  });
  const [saving, setSaving] = useState(false);

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: {
        ...formData.conditions,
        rules: [
          ...formData.conditions.rules,
          { field: 'from', operator: 'contains', value: '' },
        ],
      },
    });
  };

  const removeCondition = (index: number) => {
    const newRules = formData.conditions.rules.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      conditions: {
        ...formData.conditions,
        rules: newRules,
      },
    });
  };

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    const newRules = [...formData.conditions.rules];
    newRules[index] = { ...newRules[index], ...updates };
    setFormData({
      ...formData,
      conditions: {
        ...formData.conditions,
        rules: newRules,
      },
    });
  };

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { type: 'star' }],
    });
  };

  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index),
    });
  };

  const updateAction = (index: number, updates: Partial<RuleAction>) => {
    const newActions = [...formData.actions];
    newActions[index] = { ...newActions[index], ...updates };
    setFormData({
      ...formData,
      actions: newActions,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const result = rule
      ? await updateRule(rule.id, formData)
      : await createRule(formData);

    setSaving(false);

    if (result.success) {
      toast.success(
        rule ? 'Rule updated successfully' : 'Rule created successfully'
      );
      onSave();
    } else {
      toast.error(result.error || 'Failed to save rule');
    }
  };

  const needsValue = (field: string) => {
    return !['is_true', 'is_false', 'has_attachment'].includes(field);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={rule ? 'Edit Rule' : 'Create Rule'}
      description="Set up conditions and actions for your email rule"
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Rule Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-md bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
            placeholder="e.g., Move newsletters to folder"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description (optional)
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-md bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
            placeholder="Brief description of what this rule does"
          />
        </div>

        {/* Conditions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Conditions *
            </label>
            <select
              value={formData.conditions.logic}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  conditions: {
                    ...formData.conditions,
                    logic: e.target.value as 'AND' | 'OR',
                  },
                })
              }
              className="px-3 py-1 text-sm border border-gray-300 dark:border-white/10 rounded-md bg-white dark:bg-black/20 text-gray-900 dark:text-white"
            >
              <option value="AND">Match ALL conditions</option>
              <option value="OR">Match ANY condition</option>
            </select>
          </div>

          <div className="space-y-2">
            {formData.conditions.rules.map((condition, index) => (
              <div key={index} className="flex items-center gap-2">
                <select
                  value={condition.field}
                  onChange={(e) =>
                    updateCondition(index, { field: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-white/10 rounded-md bg-white dark:bg-black/20 text-gray-900 dark:text-white text-sm"
                >
                  {FIELD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <select
                  value={condition.operator}
                  onChange={(e) =>
                    updateCondition(index, { operator: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-white/10 rounded-md bg-white dark:bg-black/20 text-gray-900 dark:text-white text-sm"
                >
                  {OPERATOR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {needsValue(condition.operator) && (
                  <input
                    type="text"
                    value={String(condition.value)}
                    onChange={(e) =>
                      updateCondition(index, { value: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-white/10 rounded-md bg-white dark:bg-black/20 text-gray-900 dark:text-white text-sm"
                    placeholder="Value"
                  />
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCondition(index)}
                  disabled={formData.conditions.rules.length === 1}
                  className="text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addCondition}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Condition
          </Button>
        </div>

        {/* Actions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Actions *
          </label>

          <div className="space-y-2">
            {formData.actions.map((action, index) => (
              <div key={index} className="flex items-center gap-2">
                <select
                  value={action.type}
                  onChange={(e) =>
                    updateAction(index, { type: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-white/10 rounded-md bg-white dark:bg-black/20 text-gray-900 dark:text-white text-sm"
                >
                  {ACTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {ACTION_OPTIONS.find((opt) => opt.value === action.type)
                  ?.needsValue && (
                  <input
                    type="text"
                    value={String(action.value || '')}
                    onChange={(e) =>
                      updateAction(index, { value: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-white/10 rounded-md bg-white dark:bg-black/20 text-gray-900 dark:text-white text-sm"
                    placeholder="Value (e.g., folder name, email address)"
                  />
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAction(index)}
                  disabled={formData.actions.length === 1}
                  className="text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addAction}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Action
          </Button>
        </div>

        {/* Options */}
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isEnabled}
              onChange={(e) =>
                setFormData({ ...formData, isEnabled: e.target.checked })
              }
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Enable this rule
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.stopProcessing}
              onChange={(e) =>
                setFormData({ ...formData, stopProcessing: e.target.checked })
              }
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Stop processing rules after this one matches
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-white/10">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={saving}>
            {rule ? 'Update' : 'Create'} Rule
          </Button>
        </div>
      </form>
    </Modal>
  );
}
