'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Star, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import {
  getSignatures,
  createSignature,
  updateSignature,
  deleteSignature,
  setDefaultSignature,
  toggleSignature,
  type SignatureData,
} from '@/lib/settings/signature-actions';
import { toast, confirmDialog } from '@/lib/toast';
import type { EmailSignature } from '@/db/schema';

// Signature templates for quick setup
const SIGNATURE_TEMPLATES = [
  {
    name: 'Professional',
    description: 'Formal business signature',
    icon: '💼',
    content: `Best regards,
[Your Name]
[Your Title]
[Company Name]
[Phone] | [Email]`,
  },
  {
    name: 'Casual',
    description: 'Friendly and informal',
    icon: '✌️',
    content: `Cheers,
[Your Name]`,
  },
  {
    name: 'Team',
    description: 'Collaborative team signature',
    icon: '👥',
    content: `Thanks,
The [Team Name] Team
[Company Website]`,
  },
  {
    name: 'Minimal',
    description: 'Simple and clean',
    icon: '✨',
    content: `[Your Name]
[Title]`,
  },
];

export function SignaturesSettings(): JSX.Element {
  const [signatures, setSignatures] = useState<EmailSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const [editingSignature, setEditingSignature] =
    useState<EmailSignature | null>(null);

  useEffect(() => {
    loadSignatures();
  }, []);

  const loadSignatures = async () => {
    setLoading(true);
    const result = await getSignatures();
    if (result.success && result.signatures) {
      setSignatures(result.signatures);
    }
    setLoading(false);
  };

  const handleCreate = () => {
    setEditingSignature(null);
    setShowModal(true);
  };

  const handleCreateFromTemplate = (template: typeof SIGNATURE_TEMPLATES[0]) => {
    setEditingSignature({
      id: '',
      userId: '',
      name: template.name,
      content: template.content,
      isDefault: false,
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as EmailSignature);
    setShowModal(true);
  };

  const handleEdit = (signature: EmailSignature) => {
    setEditingSignature(signature);
    setShowModal(true);
  };

  const handleDelete = async (signatureId: string) => {
    const confirmed = await confirmDialog(
      'Are you sure you want to delete this signature?'
    );
    if (!confirmed) return;

    const result = await deleteSignature(signatureId);
    if (result.success) {
      toast.success('Signature deleted successfully');
      loadSignatures();
    } else {
      toast.error(result.error || 'Failed to delete signature');
    }
  };

  const handleSetDefault = async (signatureId: string) => {
    const result = await setDefaultSignature(signatureId);
    if (result.success) {
      toast.success('Default signature updated');
      loadSignatures();
    } else {
      toast.error(result.error || 'Failed to set default signature');
    }
  };

  const handleToggle = async (signatureId: string, isEnabled: boolean) => {
    const result = await toggleSignature(signatureId, isEnabled);
    if (result.success) {
      toast.success(`Signature ${isEnabled ? 'enabled' : 'disabled'}`);
      loadSignatures();
    } else {
      toast.error(result.error || 'Failed to toggle signature');
    }
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
              Email Signatures
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
              Create and manage your email signatures
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Signature
          </Button>
        </div>
      </div>

      {/* Quick Templates */}
      {showTemplates && signatures.length === 0 && (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SIGNATURE_TEMPLATES.map((template) => (
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

      {/* Signatures List */}
      {signatures.length === 0 ? (
        <div className="text-center py-12 bg-white/60 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
          <div className="text-4xl mb-4">✍️</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No signatures yet
          </h3>
          <p className="text-sm text-gray-600 dark:text-white/60 mb-4">
            Create your first email signature to use in your emails
          </p>
          <Button variant="primary" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Signature
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {signatures.map((signature) => (
            <div
              key={signature.id}
              className={`rounded-lg border-2 p-4 bg-white/60 dark:bg-white/5 backdrop-blur-md transition-all ${
                signature.isDefault
                  ? 'border-primary'
                  : 'border-gray-200 dark:border-white/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {signature.name}
                    </h3>
                    {signature.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                        <Star className="h-3 w-3 fill-current" />
                        Default
                      </span>
                    )}
                    {!signature.isEnabled && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                        Disabled
                      </span>
                    )}
                  </div>

                  {/* Signature Preview */}
                  <div
                    className="p-3 bg-gray-50 dark:bg-black/20 rounded border border-gray-200 dark:border-white/10 text-sm"
                    dangerouslySetInnerHTML={{ __html: signature.htmlContent }}
                  />
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {!signature.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(signature.id)}
                      title="Set as default"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleToggle(signature.id, !signature.isEnabled)
                    }
                    title={signature.isEnabled ? 'Disable' : 'Enable'}
                  >
                    {signature.isEnabled ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(signature)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(signature.id)}
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
        <SignatureModal
          signature={editingSignature}
          onClose={() => {
            setShowModal(false);
            setEditingSignature(null);
          }}
          onSave={async () => {
            setShowModal(false);
            setEditingSignature(null);
            loadSignatures();
          }}
        />
      )}
    </div>
  );
}

interface SignatureModalProps {
  signature: EmailSignature | null;
  onClose: () => void;
  onSave: () => void;
}

function SignatureModal({ signature, onClose, onSave }: SignatureModalProps) {
  const [formData, setFormData] = useState<SignatureData>({
    name: signature?.name || '',
    htmlContent: signature?.htmlContent || '',
    isDefault: signature?.isDefault || false,
    isEnabled: signature?.isEnabled !== false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const result = signature
      ? await updateSignature(signature.id, formData)
      : await createSignature(formData);

    setSaving(false);

    if (result.success) {
      toast.success(
        signature
          ? 'Signature updated successfully'
          : 'Signature created successfully'
      );
      onSave();
    } else {
      toast.error(result.error || 'Failed to save signature');
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={signature ? 'Edit Signature' : 'Create Signature'}
      description="Create a custom signature to use in your emails"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Signature Name
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-md bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
            placeholder="e.g., Work Signature, Personal"
          />
        </div>

        {/* HTML Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Signature Content
          </label>
          <textarea
            required
            value={formData.htmlContent}
            onChange={(e) =>
              setFormData({ ...formData, htmlContent: e.target.value })
            }
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-md bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary font-mono text-sm"
            placeholder="<p>Best regards,<br/>Your Name<br/>Your Title</p>"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            You can use HTML for formatting
          </p>
        </div>

        {/* Preview */}
        {formData.htmlContent && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Preview
            </label>
            <div
              className="p-3 bg-gray-50 dark:bg-black/20 rounded border border-gray-200 dark:border-white/10"
              dangerouslySetInnerHTML={{ __html: formData.htmlContent }}
            />
          </div>
        )}

        {/* Options */}
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) =>
                setFormData({ ...formData, isDefault: e.target.checked })
              }
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Set as default signature
            </span>
          </label>

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
              Enable this signature
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={saving}>
            {signature ? 'Update' : 'Create'} Signature
          </Button>
        </div>
      </form>
    </Modal>
  );
}
