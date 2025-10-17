'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createLabel, updateLabel } from '@/lib/labels/actions';
import { toast } from 'sonner';
import type { CustomLabel } from '@/db/schema';

interface LabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  label?: CustomLabel; // If provided, we're editing; otherwise creating
  onSuccess?: () => void;
}

const PRESET_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#22C55E', // Green
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#0EA5E9', // Sky
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#D946EF', // Fuchsia
  '#EC4899', // Pink
];

export function LabelModal({
  isOpen,
  onClose,
  label,
  onSuccess,
}: LabelModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!label;

  // Initialize form when label changes
  useEffect(() => {
    if (label) {
      setName(label.name);
      setColor(label.color);
    } else {
      setName('');
      setColor('#3B82F6');
    }
  }, [label]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a label name');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing) {
        const result = await updateLabel(label.id, {
          name: name.trim(),
          color,
        });
        if (result.success) {
          toast.success('Label updated successfully');
          onSuccess?.();
          onClose();
        } else {
          toast.error(result.error || 'Failed to update label');
        }
      } else {
        const result = await createLabel({ name: name.trim(), color });
        if (result.success) {
          toast.success('Label created successfully');
          onSuccess?.();
          onClose();
        } else {
          toast.error(result.error || 'Failed to create label');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Tag size={20} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {isEditing ? 'Edit Label' : 'Create Label'}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isEditing
                        ? 'Update label details'
                        : 'Add a new custom label'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={18} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Label Name */}
                <div>
                  <label
                    htmlFor="label-name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Label Name
                  </label>
                  <input
                    id="label-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Important, Work, Personal"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    maxLength={50}
                    autoFocus
                  />
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Label Color
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {PRESET_COLORS.map((presetColor) => (
                      <button
                        key={presetColor}
                        type="button"
                        onClick={() => setColor(presetColor)}
                        className={cn(
                          'w-10 h-10 rounded-lg transition-all',
                          color === presetColor
                            ? 'ring-2 ring-offset-2 ring-primary scale-110'
                            : 'hover:scale-105'
                        )}
                        style={{ backgroundColor: presetColor }}
                        title={presetColor}
                      />
                    ))}
                  </div>

                  {/* Custom Color Input */}
                  <div className="mt-4 flex items-center gap-3">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-12 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        placeholder="#3B82F6"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preview
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {name || 'Label Name'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !name.trim()}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {isSubmitting
                      ? 'Saving...'
                      : isEditing
                        ? 'Update Label'
                        : 'Create Label'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
