import { create } from 'zustand';
import * as db from '../services/db';

export interface Note {
  id: string;
  title: string;
  content: string;
  taskId?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface NoteStore {
  notes: Note[];
  loadNotes: () => Promise<void>;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (id: string, note: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  getNotesByTask: (taskId: string) => Note[];
  searchNotes: (query: string) => Note[];
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  loadNotes: async () => {
    try {
      const notes = await db.getAllNotes();
      set({
        notes: notes.map(note => ({
          ...note,
          taskId: note.task_id,
          tags: note.tags ? JSON.parse(note.tags) : [],
          createdAt: new Date(note.created_at),
          updatedAt: new Date(note.updated_at),
        }))
      });
    } catch (error) {
      console.error('Failed to load notes:', error);
      // Set empty array on error to avoid breaking the UI
      set({ notes: [] });
    }
  },
  addNote: async (note) => {
    try {
      const id = crypto.randomUUID();
      const now = new Date();
      await db.addNote(
        id,
        note.title,
        note.content,
        note.taskId || null,
        JSON.stringify(note.tags || []),
        now.toISOString(),
        now.toISOString()
      );
      set((state) => ({
        notes: [{
          ...note,
          id,
          createdAt: now,
          updatedAt: now,
        }, ...state.notes],
      }));
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  },
  updateNote: async (id, note) => {
    try {
      const currentNote = (await db.getAllNotes()).find(n => n.id === id);
      if (currentNote) {
        const now = new Date();
        await db.updateNote(
          id,
          note.title || currentNote.title,
          note.content || currentNote.content,
          note.taskId || currentNote.task_id,
          note.tags ? JSON.stringify(note.tags) : currentNote.tags,
          now.toISOString()
        );
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { 
              ...n, 
              ...note,
              updatedAt: now 
            } : n
          ),
        }));
      }
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  },
  deleteNote: async (id) => {
    try {
      await db.deleteNote(id);
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  },
  getNotesByTask: (taskId) => {
    try {
      return get().notes.filter(note => note.taskId === taskId);
    } catch (error) {
      console.error('Error getting notes by task:', error);
      return [];
    }
  },
  searchNotes: (query) => {
    try {
      const lowercaseQuery = query.toLowerCase();
      return get().notes.filter(note => 
        note.title.toLowerCase().includes(lowercaseQuery) || 
        (note.content && note.content.toLowerCase().includes(lowercaseQuery)) ||
        (note.tags && Array.isArray(note.tags) && note.tags.some(tag => 
          tag && tag.toLowerCase().includes(lowercaseQuery))
        )
      );
    } catch (error) {
      console.error('Error searching notes:', error);
      return [];
    }
  },
})); 