'use client';

/**
 * Admin Component: Email Template Management System
 * Complete CRUD + Trigger Assignment + Preview + Testing
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Mail,
  Eye,
  Edit,
  Trash2,
  Copy,
  Plus,
  Search,
  Filter,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  X,
  Info,
  Loader2,
  Settings,
  Zap,
} from 'lucide-react';
import {
  SANDBOX_TEMPLATES,
  type TemplateVariables,
} from '@/lib/notifications/sandbox-email-templates';
import { InlineNotification } from '@/components/ui/inline-notification';

// Types
interface Template {
  key: keyof typeof SANDBOX_TEMPLATES;
  name: string;
  description: string;
  icon: string;
  trigger: TriggerType;
  enabled: boolean;
}

type TriggerType =
  | 'company_created'
  | 'user_assigned'
  | 'user_removed'
  | 'manual';

interface Notification {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface TemplatePreviewProps {
  templateKey: keyof typeof SANDBOX_TEMPLATES;
  onClose: () => void;
  onCopySuccess: (message: string) => void;
}

interface TemplateEditorProps {
  template: Template;
  onClose: () => void;
  onSave: (template: Template) => void;
  onError: (message: string) => void;
}

interface TriggerAssignmentProps {
  template: Template;
  onClose: () => void;
  onSave: (trigger: TriggerType, enabled: boolean) => void;
  onError: (message: string) => void;
}

// Trigger Assignment Modal
function TriggerAssignment({
  template,
  onClose,
  onSave,
  onError,
}: TriggerAssignmentProps): JSX.Element {
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerType>(
    template.trigger
  );
  const [isEnabled, setIsEnabled] = useState(template.enabled);
  const [isSaving, setIsSaving] = useState(false);

  const triggers: Array<{
    value: TriggerType;
    label: string;
    description: string;
  }> = [
    {
      value: 'company_created',
      label: 'Company Created',
      description: 'Triggered when a new sandbox company is created',
    },
    {
      value: 'user_assigned',
      label: 'User Assigned',
      description: 'Triggered when a user is assigned to a sandbox company',
    },
    {
      value: 'user_removed',
      label: 'User Removed',
      description: 'Triggered when a user is removed from a sandbox company',
    },
    {
      value: 'manual',
      label: 'Manual Only',
      description: 'Only sent when manually triggered',
    },
  ];

  const handleSave = async (): Promise<void> => {
    try {
      setIsSaving(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      onSave(selectedTrigger, isEnabled);
      onClose();
    } catch (error) {
      onError('Failed to save trigger assignment');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trigger-modal-title"
    >
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div>
            <h2
              id="trigger-modal-title"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              Configure Trigger
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {template.name}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 px-6 py-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Template Status
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enable or disable this template
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
              <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                {isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>

          {/* Trigger Selection */}
          <div>
            <label className="mb-3 block text-sm font-semibold text-gray-900 dark:text-white">
              Trigger Event
            </label>
            <div className="space-y-2">
              {triggers.map((trigger) => (
                <label
                  key={trigger.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-all ${
                    selectedTrigger === trigger.value
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="trigger"
                    value={trigger.value}
                    checked={selectedTrigger === trigger.value}
                    onChange={(e) =>
                      setSelectedTrigger(e.target.value as TriggerType)
                    }
                    className="mt-1 h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {trigger.label}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {trigger.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <h4 className="mb-1 text-sm font-medium text-blue-900 dark:text-blue-100">
                  How Triggers Work
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  When the selected event occurs, this template will be
                  automatically used to send notifications. You can assign
                  multiple templates to different triggers, or set a template to
                  manual-only for on-demand sending.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Template Preview Modal
function TemplatePreview({
  templateKey,
  onClose,
  onCopySuccess,
}: TemplatePreviewProps): JSX.Element {
  const [sampleVariables] = useState<TemplateVariables>({
    userName: 'John Doe',
    userEmail: 'john.doe@example.com',
    companyName: 'Acme Corp Sandbox',
    companyId: '123e4567-e89b-12d3-a456-426614174000',
    adminName: 'Admin User',
    adminEmail: 'admin@easemail.ai',
    twilioPhoneNumber: '+1 (555) 123-4567',
    hasTwilioCredentials: '✅ Yes',
    hasOpenAICredentials: '✅ Yes',
    assignedDate: 'January 15, 2025',
    createdDate: 'January 15, 2025',
    loginUrl: 'https://app.easemail.ai',
    dashboardUrl: 'https://app.easemail.ai',
    supportUrl: 'https://app.easemail.ai',
    additionalInfo: 'Additional information here',
  });

  const template = SANDBOX_TEMPLATES[templateKey](sampleVariables);

  const handleCopy = async (content: string, label: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(content);
      onCopySuccess(`${label} copied to clipboard!`);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="my-8 w-full max-w-4xl rounded-lg bg-white shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="sticky top-0 z-10 rounded-t-lg border-b border-gray-200 bg-white px-6 pb-4 pt-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Email Template Preview
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Template: <span className="font-mono">{templateKey}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Close preview"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto px-6 py-4">
          {/* Subject Line */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Subject Line
              </h3>
              <button
                onClick={() => handleCopy(template.subject, 'Subject')}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 font-medium text-gray-900 dark:bg-gray-900 dark:text-white">
              {template.subject}
            </div>
          </div>

          {/* HTML Preview */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                HTML Email
              </h3>
              <button
                onClick={() => handleCopy(template.html, 'HTML')}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Copy className="h-4 w-4" />
                Copy HTML
              </button>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <iframe
                srcDoc={template.html}
                className="h-[600px] w-full bg-white"
                title="Email Preview"
                sandbox="allow-same-origin"
              />
            </div>
          </div>

          {/* Plain Text Preview */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Plain Text Email
              </h3>
              <button
                onClick={() => handleCopy(template.text, 'Plain text')}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Copy className="h-4 w-4" />
                Copy Text
              </button>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300">
              {template.text}
            </pre>
          </div>

          {/* Template Variables */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
              <Info className="h-4 w-4" />
              Available Variables
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.keys(sampleVariables).map((key) => (
                <code
                  key={key}
                  className="rounded bg-white px-2 py-1 font-mono text-blue-700 dark:bg-gray-800 dark:text-blue-300"
                >
                  {`{{${key}}}`}
                </code>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Component
export function EmailTemplateManager(): JSX.Element {
  const [templates, setTemplates] = useState<Template[]>([
    {
      key: 'userWelcome',
      name: 'User Welcome Email',
      description: 'Sent to users when they are assigned to a sandbox company',
      icon: '👋',
      trigger: 'user_assigned',
      enabled: true,
    },
    {
      key: 'adminCompanyCreated',
      name: 'Company Created (Admin)',
      description: 'Sent to admins when a new sandbox company is created',
      icon: '🏢',
      trigger: 'company_created',
      enabled: true,
    },
    {
      key: 'adminUserAssigned',
      name: 'User Assigned (Admin)',
      description: 'Sent to admins when a user is assigned to a company',
      icon: '✅',
      trigger: 'user_assigned',
      enabled: true,
    },
    {
      key: 'userRemoved',
      name: 'User Removed Email',
      description: 'Sent to users when they are removed from a sandbox company',
      icon: '👋',
      trigger: 'user_removed',
      enabled: true,
    },
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<
    keyof typeof SANDBOX_TEMPLATES | null
  >(null);
  const [editingTrigger, setEditingTrigger] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [notification, setNotification] = useState<Notification | null>(null);

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      !statusFilter ||
      (statusFilter === 'enabled' && template.enabled) ||
      (statusFilter === 'disabled' && !template.enabled);

    return matchesSearch && matchesStatus;
  });

  const handleCopySuccess = useCallback((message: string): void => {
    setNotification({ type: 'success', message });
  }, []);

  const handleError = useCallback((message: string): void => {
    setNotification({ type: 'error', message });
  }, []);

  const handleSaveTrigger = useCallback(
    (templateKey: keyof typeof SANDBOX_TEMPLATES) =>
      (trigger: TriggerType, enabled: boolean): void => {
        setTemplates((prev) =>
          prev.map((t) =>
            t.key === templateKey ? { ...t, trigger, enabled } : t
          )
        );
        setNotification({
          type: 'success',
          message: 'Trigger configuration saved successfully!',
        });
      },
    []
  );

  const clearNotification = useCallback((): void => {
    setNotification(null);
  }, []);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Email Notification Templates
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Preview and customize email templates for sandbox company
          notifications
        </p>
      </div>

      {/* Inline Notification */}
      {notification && (
        <InlineNotification
          type={notification.type}
          message={notification.message}
          onClose={clearNotification}
        />
      )}

      {/* Info Box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100">
              Email Template System
            </p>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              These templates are automatically sent when specific events occur
              (company creation, user assignment, etc.). You can preview each
              template, configure triggers, and copy the HTML/text for
              customization in your email service provider.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">All Templates</option>
          <option value="enabled">Enabled Only</option>
          <option value="disabled">Disabled Only</option>
        </select>
      </div>

      {/* Template List */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredTemplates.map((template) => (
          <div
            key={template.key}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="text-3xl">{template.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {template.name}
                    </h3>
                    {template.enabled ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                        <XCircle className="h-3 w-3" />
                        Disabled
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {template.description}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Zap className="h-3 w-3" />
                    Trigger:{' '}
                    <span className="font-medium">
                      {template.trigger.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setSelectedTemplate(template.key)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
              <button
                onClick={() => setEditingTrigger(template)}
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Settings className="h-4 w-4" />
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <Mail className="mb-4 h-12 w-12 text-gray-400" />
          <p className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
            No templates found
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Customization Guide */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          How to Customize Email Templates
        </h2>
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
              Option 1: Edit Template Files (Recommended)
            </h3>
            <ol className="ml-4 list-inside list-decimal space-y-1">
              <li>
                Open{' '}
                <code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs dark:bg-gray-700">
                  src/lib/notifications/sandbox-email-templates.ts
                </code>
              </li>
              <li>Modify the HTML and text templates as needed</li>
              <li>
                Use template variables like <code>{`{{userName}}`}</code>
              </li>
              <li>Restart your dev server to see changes</li>
            </ol>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
              Option 2: Use External Email Service
            </h3>
            <ol className="ml-4 list-inside list-decimal space-y-1">
              <li>Copy the HTML template using the "Copy HTML" button</li>
              <li>
                Create a template in your email service (SendGrid, Postmark,
                etc.)
              </li>
              <li>
                Update the email sending service to use your provider's API
              </li>
              <li>
                Edit{' '}
                <code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs dark:bg-gray-700">
                  src/lib/notifications/sandbox-notifications.ts
                </code>
              </li>
            </ol>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
              Option 3: Configure SMTP Settings
            </h3>
            <p>
              Add SMTP credentials to your <code>.env.local</code> file and
              update the <code>sendEmailViaService</code> function to use
              Nodemailer or similar.
            </p>
          </div>
        </div>
      </div>

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <TemplatePreview
          templateKey={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onCopySuccess={handleCopySuccess}
        />
      )}

      {/* Trigger Assignment Modal */}
      {editingTrigger && (
        <TriggerAssignment
          template={editingTrigger}
          onClose={() => setEditingTrigger(null)}
          onSave={handleSaveTrigger(editingTrigger.key)}
          onError={handleError}
        />
      )}
    </div>
  );
}
