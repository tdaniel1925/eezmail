/**
 * Admin Component: Email Template Customization
 * Allows admins to preview and customize notification email templates
 */

'use client';

import { useState } from 'react';
import {
  Mail,
  Eye,
  Edit,
  Save,
  X,
  Copy,
  CheckCircle,
  Info,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  SANDBOX_TEMPLATES,
  type TemplateVariables,
} from '@/lib/notifications/sandbox-email-templates';

interface TemplatePreviewProps {
  templateType: keyof typeof SANDBOX_TEMPLATES;
  onClose: () => void;
}

function TemplatePreview({
  templateType,
  onClose,
}: TemplatePreviewProps): JSX.Element {
  const [sampleVariables, setSampleVariables] = useState<TemplateVariables>({
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

  const template = SANDBOX_TEMPLATES[templateType](sampleVariables);

  const handleCopyHTML = async (): Promise<void> => {
    await navigator.clipboard.writeText(template.html);
    toast.success('HTML copied to clipboard');
  };

  const handleCopyText = async (): Promise<void> => {
    await navigator.clipboard.writeText(template.text);
    toast.success('Plain text copied to clipboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl dark:bg-gray-800 my-8">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700 rounded-t-lg z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Email Template Preview
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Template: <span className="font-mono">{templateType}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {/* Subject Line */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Subject Line
              </h3>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(template.subject);
                  toast.success('Subject copied');
                }}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-medium text-gray-900 dark:text-white">
              {template.subject}
            </div>
          </div>

          {/* HTML Preview */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                HTML Email
              </h3>
              <button
                onClick={handleCopyHTML}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Copy className="h-4 w-4" />
                Copy HTML
              </button>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <iframe
                srcDoc={template.html}
                className="w-full h-[600px] bg-white"
                title="Email Preview"
                sandbox="allow-same-origin"
              />
            </div>
          </div>

          {/* Plain Text Preview */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Plain Text Email
              </h3>
              <button
                onClick={handleCopyText}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Copy className="h-4 w-4" />
                Copy Text
              </button>
            </div>
            <pre className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {template.text}
            </pre>
          </div>

          {/* Template Variables */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Available Variables
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.keys(sampleVariables).map((key) => (
                <code
                  key={key}
                  className="font-mono text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-800 px-2 py-1 rounded"
                >
                  {`{{${key}}}`}
                </code>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
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

export function EmailTemplateManager(): JSX.Element {
  const [selectedTemplate, setSelectedTemplate] = useState<
    keyof typeof SANDBOX_TEMPLATES | null
  >(null);

  const templates: Array<{
    key: keyof typeof SANDBOX_TEMPLATES;
    name: string;
    description: string;
    icon: string;
  }> = [
    {
      key: 'userWelcome',
      name: 'User Welcome Email',
      description: 'Sent to users when they are assigned to a sandbox company',
      icon: '👋',
    },
    {
      key: 'adminCompanyCreated',
      name: 'Company Created (Admin)',
      description: 'Sent to admins when a new sandbox company is created',
      icon: '🏢',
    },
    {
      key: 'adminUserAssigned',
      name: 'User Assigned (Admin)',
      description: 'Sent to admins when a user is assigned to a company',
      icon: '✅',
    },
    {
      key: 'userRemoved',
      name: 'User Removed Email',
      description: 'Sent to users when they are removed from a sandbox company',
      icon: '👋',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Email Notification Templates
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Preview and customize email templates for sandbox company
          notifications
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100">
              Email Template System
            </p>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              These templates are automatically sent when specific events occur
              (company creation, user assignment, etc.). You can preview each
              template and copy the HTML/text for customization in your email
              service provider.
            </p>
          </div>
        </div>
      </div>

      {/* Template List */}
      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <div
            key={template.key}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="text-3xl">{template.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {template.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {template.description}
                  </p>
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
            </div>
          </div>
        ))}
      </div>

      {/* Customization Guide */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          How to Customize Email Templates
        </h2>
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Option 1: Edit Template Files (Recommended)
            </h3>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>
                Open{' '}
                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono text-xs">
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
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Option 2: Use External Email Service
            </h3>
            <ol className="list-decimal list-inside space-y-1 ml-4">
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
                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono text-xs">
                  src/lib/notifications/sandbox-notifications.ts
                </code>
              </li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
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
          templateType={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </div>
  );
}
