'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Search,
  Plus,
  Edit,
  Trash2,
  FileText,
  Briefcase,
  User,
  Calendar,
  Mail,
  Sparkles,
} from 'lucide-react';
import {
  getUserTemplates,
  useTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  type Template,
} from '@/lib/email/template-actions';
import { toast } from '@/lib/toast';
import type { EmailTemplateCategory } from '@/db/schema';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (subject: string, body: string) => void;
}

const CATEGORY_ICONS: Record<EmailTemplateCategory, typeof FileText> = {
  work: Briefcase,
  personal: User,
  meeting: Calendar,
  followup: Mail,
  other: FileText,
};

const CATEGORY_LABELS: Record<EmailTemplateCategory, string> = {
  work: 'Work',
  personal: 'Personal',
  meeting: 'Meeting',
  followup: 'Follow-up',
  other: 'Other',
};

export function TemplateModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplateModalProps) {
  const [mounted, setMounted] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    EmailTemplateCategory | 'all'
  >('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Form state for creating/editing
  const [formName, setFormName] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formCategory, setFormCategory] =
    useState<EmailTemplateCategory>('other');

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedCategory]);

  const loadTemplates = async () => {
    setIsLoading(true);
    const result = await getUserTemplates();
    if (result.success && result.templates) {
      setTemplates(result.templates);
    } else {
      toast.error(result.error || 'Failed to load templates');
    }
    setIsLoading(false);
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.subject.toLowerCase().includes(query) ||
          t.body.toLowerCase().includes(query)
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleUseTemplate = async (template: Template) => {
    const result = await useTemplate(template.id);
    if (result.success && result.template) {
      onSelectTemplate(result.template.subject, result.template.body);
      onClose();
      toast.success(`Template "${template.name}" applied`);
    } else {
      toast.error(result.error || 'Failed to use template');
    }
  };

  const handleCreateTemplate = async () => {
    if (!formName || !formSubject || !formBody) {
      toast.warning('Please fill in all fields');
      return;
    }

    const result = await createTemplate({
      name: formName,
      subject: formSubject,
      body: formBody,
      category: formCategory,
    });

    if (result.success) {
      toast.success('Template created successfully');
      setIsCreating(false);
      resetForm();
      loadTemplates();
    } else {
      toast.error(result.error || 'Failed to create template');
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;

    const result = await updateTemplate(editingTemplate.id, {
      name: formName,
      subject: formSubject,
      body: formBody,
      category: formCategory,
    });

    if (result.success) {
      toast.success('Template updated successfully');
      setEditingTemplate(null);
      resetForm();
      loadTemplates();
    } else {
      toast.error(result.error || 'Failed to update template');
    }
  };

  const handleDeleteTemplate = async (template: Template) => {
    if (!confirm(`Delete template "${template.name}"?`)) return;

    const result = await deleteTemplate(template.id);

    if (result.success) {
      toast.success('Template deleted');
      loadTemplates();
    } else {
      toast.error(result.error || 'Failed to delete template');
    }
  };

  const startEditing = (template: Template) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormSubject(template.subject);
    setFormBody(template.body);
    setFormCategory(template.category || 'other');
    setIsCreating(true);
  };

  const resetForm = () => {
    setFormName('');
    setFormSubject('');
    setFormBody('');
    setFormCategory('other');
    setEditingTemplate(null);
  };

  const handleClose = () => {
    resetForm();
    setIsCreating(false);
    setSearchQuery('');
    setSelectedCategory('all');
    onClose();
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] max-w-[90vw] h-[700px] max-h-[90vh] bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-[9999]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isCreating
              ? editingTemplate
                ? 'Edit Template'
                : 'Create Template'
              : 'Email Templates'}
          </h2>
          <button
            onClick={handleClose}
            className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!isCreating ? (
          <>
            {/* Search and Filter Bar */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search templates..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) =>
                    setSelectedCategory(
                      e.target.value as EmailTemplateCategory | 'all'
                    )
                  }
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                {/* New Template Button */}
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-pink-500 text-white rounded-lg font-medium hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  <Plus size={18} />
                  New
                </button>
              </div>
            </div>

            {/* Templates List */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {searchQuery || selectedCategory !== 'all'
                      ? 'No templates found'
                      : 'No templates yet'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {searchQuery || selectedCategory !== 'all'
                      ? 'Try a different search or filter'
                      : 'Create your first template to get started'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredTemplates.map((template) => {
                    const Icon =
                      CATEGORY_ICONS[template.category || 'other'] || FileText;
                    return (
                      <div
                        key={template.id}
                        className="group relative rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:border-primary hover:shadow-md transition-all cursor-pointer"
                        onClick={() => handleUseTemplate(template)}
                      >
                        {/* Category Icon */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary">
                              <Icon size={16} />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {template.name}
                              </h3>
                              <span className="text-xs text-gray-500">
                                Used {template.useCount} times
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(template);
                              }}
                              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTemplate(template);
                              }}
                              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Subject Preview */}
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {template.subject}
                        </p>

                        {/* Body Preview */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {template.body.replace(/<[^>]*>/g, '')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Create/Edit Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Weekly Update"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) =>
                    setFormCategory(e.target.value as EmailTemplateCategory)
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="Email subject"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Body *
                </label>
                <textarea
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="Email body (HTML supported)"
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                />
              </div>
            </div>

            {/* Form Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setIsCreating(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={
                  editingTemplate ? handleUpdateTemplate : handleCreateTemplate
                }
                disabled={!formName || !formSubject || !formBody}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-pink-500 text-white rounded-lg font-medium hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Sparkles size={16} />
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
