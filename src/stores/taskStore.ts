import { create } from 'zustand';
import * as db from '../services/db';
import { useReminderStore } from './reminderStore';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  categoryId?: string;
  dueDate?: Date;
  hasReminder?: boolean;
  createdAt: Date;
}

interface TaskStore {
  tasks: Task[];
  loadTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  loadTasks: async () => {
    const tasks = await db.getAllTasks();
    set({
      tasks: tasks.map(task => ({
        ...task,
        categoryId: task.category_id,
        dueDate: task.due_date ? new Date(task.due_date) : undefined,
        createdAt: new Date(task.created_at),
      }))
    });
  },
  addTask: async (task) => {
    const id = crypto.randomUUID();
    await db.addTask(
      id,
      task.title,
      task.description || null,
      task.status,
      task.priority,
      task.categoryId || null,
      task.dueDate?.toISOString() || null
    );
    
    const newTask = {
      ...task,
      id,
      createdAt: new Date(),
    };
    
    set((state) => ({
      tasks: [newTask, ...state.tasks],
    }));
    
    return newTask;
  },
  updateTask: async (id, task) => {
    const currentTask = await db.getAllTasks().then(tasks => tasks.find(t => t.id === id));
    if (currentTask) {
      await db.updateTask(
        id,
        task.title || currentTask.title,
        task.description || currentTask.description,
        task.status || currentTask.status,
        task.priority || currentTask.priority,
        task.categoryId || currentTask.category_id,
        task.dueDate?.toISOString() || currentTask.due_date
      );
    }
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...task } : t
      ),
    }));
  },
  deleteTask: async (id) => {
    await db.deleteTask(id);
    
    // Also delete any reminders for this task
    try {
      const reminderStore = useReminderStore.getState();
      await reminderStore.deleteRemindersByTask(id);
    } catch (error) {
      console.error('Failed to delete task reminders:', error);
    }
    
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));
  },
}));