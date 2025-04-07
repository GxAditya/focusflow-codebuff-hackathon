import { create } from 'zustand';
import * as db from '../services/db';

export interface Category {
  id: string;
  name: string;
  color: string;
}

interface CategoryStore {
  categories: Category[];
  loadCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],
  loadCategories: async () => {
    const categories = await db.getAllCategories();
    set({ categories });
  },
  addCategory: async (category) => {
    const id = crypto.randomUUID();
    await db.addCategory(id, category.name, category.color);
    set((state) => ({
      categories: [{ ...category, id }, ...state.categories],
    }));
  },
  updateCategory: async (id, category) => {
    if (category.name && category.color) {
      await db.updateCategory(id, category.name, category.color);
    }
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id ? { ...c, ...category } : c
      ),
    }));
  },
  deleteCategory: async (id) => {
    await db.deleteCategory(id);
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));
  },
}));