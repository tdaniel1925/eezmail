'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  getContactNotes,
  createContactNote,
  updateContactNote,
  deleteContactNote,
} from '@/lib/contacts/notes-actions';

interface Note {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ContactNotesProps {
  contactId: string;
}

export function ContactNotes({ contactId }: ContactNotesProps): JSX.Element {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load notes from server
  useEffect(() => {
    loadNotes();
  }, [contactId]);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const result = await getContactNotes(contactId);
      if (result.success && result.notes) {
        setNotes(
          result.notes.map((note) => ({
            ...note,
            createdAt: new Date(note.createdAt),
            updatedAt: new Date(note.updatedAt),
          }))
        );
      } else {
        toast.error(result.error || 'Failed to load notes');
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) {
      toast.error('Note content cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      const result = await createContactNote(contactId, newNoteContent.trim());
      if (result.success && result.note) {
        const newNote = {
          ...result.note,
          createdAt: new Date(result.note.createdAt),
          updatedAt: new Date(result.note.updatedAt),
        };
        setNotes([newNote, ...notes]);
        setNewNoteContent('');
        setIsAdding(false);
        toast.success('Note added successfully');
      } else {
        toast.error(result.error || 'Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = async (noteId: string) => {
    if (!editContent.trim()) {
      toast.error('Note content cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateContactNote(noteId, editContent.trim());
      if (result.success && result.note) {
        setNotes(
          notes.map((note) =>
            note.id === noteId
              ? {
                  ...result.note,
                  createdAt: new Date(result.note.createdAt),
                  updatedAt: new Date(result.note.updatedAt),
                }
              : note
          )
        );
        setEditingId(null);
        setEditContent('');
        toast.success('Note updated successfully');
      } else {
        toast.error(result.error || 'Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      const result = await deleteContactNote(noteId);
      if (result.success) {
        setNotes(notes.filter((note) => note.id !== noteId));
        toast.success('Note deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Note Button */}
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Note
        </button>
      )}

      {/* New Note Form */}
      {isAdding && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Type your note here..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
            autoFocus
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAddNote}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Note'}
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewNoteContent('');
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No notes yet. Add your first note to start tracking information
            about this contact.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              {editingId === note.id ? (
                // Edit Mode
                <>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleSaveEdit(note.id)}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                // View Mode
                <>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <p>Created: {note.createdAt.toLocaleString()}</p>
                      {note.updatedAt.getTime() !==
                        note.createdAt.getTime() && (
                        <p>Updated: {note.updatedAt.toLocaleString()}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartEdit(note)}
                        className="p-1.5 text-gray-600 hover:text-primary hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Edit note"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
