'use client';

import { useState } from 'react';
import {
  ChevronDown,
  Plus,
  MoreVertical,
  Tag,
  Pencil,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/stores/sidebarStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { reorderLabels } from '@/lib/labels/actions';
import { toast } from 'sonner';
import type { CustomLabel } from '@/db/schema';

interface CustomLabelsProps {
  isCollapsed?: boolean;
  onCreateLabel?: () => void;
  onEditLabel?: (label: CustomLabel) => void;
  onDeleteLabel?: (labelId: string) => void;
}

export function CustomLabels({
  isCollapsed = false,
  onCreateLabel,
  onEditLabel,
  onDeleteLabel,
}: CustomLabelsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { customLabels, setCustomLabels } = useSidebarStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = customLabels.findIndex((label) => label.id === active.id);
    const newIndex = customLabels.findIndex((label) => label.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistically update UI
    const newLabels = arrayMove(customLabels, oldIndex, newIndex);
    setCustomLabels(newLabels);

    // Update in database
    const labelIds = newLabels.map((label) => label.id);
    const result = await reorderLabels(labelIds);

    if (!result.success) {
      // Revert on error
      setCustomLabels(customLabels);
      toast.error(result.error || 'Failed to reorder labels');
    }
  };

  if (isCollapsed) {
    return (
      <div className="px-3 py-2">
        <button
          onClick={onCreateLabel}
          className="w-full h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors group"
          title="Labels"
        >
          <Tag size={18} className="text-gray-600 dark:text-gray-400" />

          {/* Tooltip */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Labels
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      {/* Header */}
      <div className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 flex-1"
        >
          <ChevronDown
            size={14}
            className={cn(
              'text-gray-500 transition-transform duration-200',
              !isExpanded && '-rotate-90'
            )}
          />
          <span className="flex-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Labels
          </span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCreateLabel?.();
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded"
        >
          <Plus size={14} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Labels List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={customLabels.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="mt-1 space-y-0.5">
                  {customLabels.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                      No labels yet
                    </div>
                  ) : (
                    customLabels.map((label) => (
                      <SortableLabelItem
                        key={label.id}
                        label={label}
                        activeMenu={activeMenu}
                        setActiveMenu={setActiveMenu}
                        onEditLabel={onEditLabel}
                        onDeleteLabel={onDeleteLabel}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sortable Label Item Component
interface SortableLabelItemProps {
  label: CustomLabel;
  activeMenu: string | null;
  setActiveMenu: (id: string | null) => void;
  onEditLabel?: (label: CustomLabel) => void;
  onDeleteLabel?: (labelId: string) => void;
}

function SortableLabelItem({
  label,
  activeMenu,
  setActiveMenu,
  onEditLabel,
  onDeleteLabel,
}: SortableLabelItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: label.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group cursor-pointer',
        isDragging && 'opacity-50 z-50'
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
      >
        <GripVertical size={14} className="text-gray-400 dark:text-gray-600" />
      </div>

      {/* Color Indicator */}
      <div
        className="w-3 h-3 rounded-sm flex-shrink-0"
        style={{ backgroundColor: label.color }}
      />

      {/* Label Name */}
      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
        {label.name}
      </span>

      {/* Actions Menu */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveMenu(activeMenu === label.id ? null : label.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded transition-opacity"
        >
          <MoreVertical
            size={14}
            className="text-gray-600 dark:text-gray-400"
          />
        </button>

        {/* Context Menu */}
        <AnimatePresence>
          {activeMenu === label.id && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setActiveMenu(null)}
              />

              {/* Menu */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 top-full mt-1 z-50 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => {
                    onEditLabel?.(label);
                    setActiveMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <Pencil size={14} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    onDeleteLabel?.(label.id);
                    setActiveMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
