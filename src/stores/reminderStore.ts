import { create } from 'zustand';
import * as db from '../services/db';
import { useTaskStore } from './taskStore';

export interface Reminder {
  id: string;
  taskId: string;
  reminderTime: Date;
  isCompleted: boolean;
  createdAt: Date;
}

export interface ReminderWithTask extends Reminder {
  taskTitle: string;
}

interface ReminderStore {
  reminders: Reminder[];
  loadReminders: () => Promise<void>;
  addReminder: (taskId: string, reminderTime: Date) => Promise<void>;
  updateReminder: (id: string, reminderTime?: Date, isCompleted?: boolean) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  deleteRemindersByTask: (taskId: string) => Promise<void>;
  getUpcomingReminders: (hours?: number) => ReminderWithTask[];
  checkReminders: () => ReminderWithTask[];
  markReminderAsCompleted: (id: string) => Promise<void>;
}

export const useReminderStore = create<ReminderStore>((set, get) => ({
  reminders: [],
  
  loadReminders: async () => {
    try {
      const reminders = await db.getAllReminders();
      console.log('Raw reminders from DB:', reminders);
      
      const mappedReminders = reminders.map(reminder => ({
        id: reminder.id,
        taskId: reminder.task_id,
        reminderTime: new Date(reminder.reminder_time),
        isCompleted: reminder.is_completed,
        createdAt: new Date(reminder.created_at)
      }));
      
      console.log('Mapped reminders with proper date objects:', mappedReminders);
      
      set({
        reminders: mappedReminders
      });
    } catch (error) {
      console.error('Failed to load reminders:', error);
      set({ reminders: [] });
    }
  },
  
  addReminder: async (taskId, reminderTime) => {
    try {
      const id = crypto.randomUUID();
      console.log('Adding new reminder:', {
        id,
        taskId,
        reminderTime: reminderTime.toISOString(),
      });
      
      // Ensure reminderTime is a Date object
      const reminderTimeDate = reminderTime instanceof Date 
        ? reminderTime 
        : new Date(reminderTime);
      
      await db.addReminder(
        id,
        taskId,
        reminderTimeDate.toISOString()
      );
      
      const newReminder = {
        id,
        taskId,
        reminderTime: reminderTimeDate, // Use the properly converted date
        isCompleted: false,
        createdAt: new Date()
      };
      
      console.log('Created reminder object:', {
        ...newReminder,
        reminderTime: newReminder.reminderTime.toISOString(),
        reminderTimeType: typeof newReminder.reminderTime,
        isDate: newReminder.reminderTime instanceof Date
      });
      
      set((state) => {
        const updatedState = {
          reminders: [
            newReminder,
            ...state.reminders
          ]
        };
        console.log('Updated store reminders count:', updatedState.reminders.length);
        return updatedState;
      });
    } catch (error) {
      console.error('Failed to add reminder:', error);
    }
  },
  
  updateReminder: async (id, reminderTime, isCompleted) => {
    try {
      await db.updateReminder(
        id,
        reminderTime?.toISOString() || null,
        isCompleted !== undefined ? isCompleted : false
      );
      
      set((state) => ({
        reminders: state.reminders.map((r) =>
          r.id === id
            ? {
                ...r,
                ...(reminderTime && { reminderTime }),
                ...(isCompleted !== undefined && { isCompleted })
              }
            : r
        )
      }));
    } catch (error) {
      console.error('Failed to update reminder:', error);
    }
  },
  
  deleteReminder: async (id) => {
    try {
      await db.deleteReminder(id);
      set((state) => ({
        reminders: state.reminders.filter((r) => r.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete reminder:', error);
    }
  },
  
  deleteRemindersByTask: async (taskId) => {
    try {
      await db.deleteRemindersByTask(taskId);
      set((state) => ({
        reminders: state.reminders.filter((r) => r.taskId !== taskId)
      }));
    } catch (error) {
      console.error('Failed to delete reminders for task:', error);
    }
  },
  
  getUpcomingReminders: (hours = 24) => {
    try {
      // Get current time with seconds and milliseconds set to 0 for more consistent comparison
      const now = new Date();
      // Set time to beginning of minute for more consistent comparison
      now.setSeconds(0, 0);
      
      const future = new Date(now.getTime() + hours * 60 * 60 * 1000);
      const tasks = useTaskStore.getState().tasks;
      
      // Debug logging
      console.log('Current time:', now.toISOString());
      console.log('Future time limit:', future.toISOString());
      console.log('Total reminders in store:', get().reminders.length);
      
      // Log each reminder for debugging
      get().reminders.forEach(reminder => {
        // Ensure reminder time is a proper date object 
        const reminderTime = reminder.reminderTime instanceof Date
          ? reminder.reminderTime
          : new Date(reminder.reminderTime);
        
        // Create more readable time comparisons
        const reminderTimestamp = reminderTime.getTime();
        const nowTimestamp = now.getTime();
        const futureTimestamp = future.getTime();
        const diffFromNow = Math.floor((reminderTimestamp - nowTimestamp) / (1000 * 60)); // Diff in minutes
        
        console.log('Reminder:', {
          id: reminder.id,
          taskId: reminder.taskId,
          reminderTime: reminderTime.toISOString(),
          isCompleted: reminder.isCompleted,
          minutesFromNow: diffFromNow,
          isInDateRange: reminderTimestamp >= nowTimestamp && reminderTimestamp <= futureTimestamp,
          taskFound: tasks.some(t => t.id === reminder.taskId)
        });
      });
      
      const filteredReminders = get().reminders
        .filter(reminder => {
          // Ensure reminder time is a proper date object
          const reminderTime = reminder.reminderTime instanceof Date
            ? reminder.reminderTime
            : new Date(reminder.reminderTime);
          
          const isNotCompleted = !reminder.isCompleted;
          const isAfterNow = reminderTime.getTime() >= now.getTime();
          const isBeforeFuture = reminderTime.getTime() <= future.getTime();
          
          return isNotCompleted && isAfterNow && isBeforeFuture;
        })
        .map(reminder => {
          // Ensure reminder time is a proper date object for consistency
          const reminderTime = reminder.reminderTime instanceof Date
            ? reminder.reminderTime
            : new Date(reminder.reminderTime);
          
          const task = tasks.find(t => t.id === reminder.taskId);
          return {
            ...reminder,
            reminderTime, // Use the properly parsed date
            taskTitle: task ? task.title : 'Unknown Task'
          };
        })
        .sort((a, b) => a.reminderTime.getTime() - b.reminderTime.getTime());
      
      console.log('Filtered upcoming reminders:', filteredReminders.length);
      return filteredReminders;
    } catch (error) {
      console.error('Error getting upcoming reminders:', error);
      return [];
    }
  },
  
  checkReminders: () => {
    try {
      // Get current time with seconds and milliseconds set to 0 for more consistent comparison
      const now = new Date();
      // Set time to beginning of minute for more consistent comparison
      now.setSeconds(0, 0);
      
      const past = new Date(now.getTime() - 5 * 60 * 1000); // Include reminders from last 5 minutes
      const tasks = useTaskStore.getState().tasks;
      
      console.log('checkReminders - Current time:', now.toISOString());
      console.log('checkReminders - Past time limit:', past.toISOString());
      console.log('checkReminders - Total reminders in store:', get().reminders.length);
      
      const dueReminders = get().reminders
        .filter(reminder => {
          // Ensure reminder time is a proper date object
          const reminderTime = reminder.reminderTime instanceof Date
            ? reminder.reminderTime
            : new Date(reminder.reminderTime);
          
          const isNotCompleted = !reminder.isCompleted;
          const isAfterPast = reminderTime.getTime() >= past.getTime();
          const isBeforeNow = reminderTime.getTime() <= now.getTime();
          
          console.log('checkReminders - Reminder filter check:', {
            id: reminder.id,
            time: reminderTime.toISOString(),
            isNotCompleted,
            isAfterPast, 
            isBeforeNow,
            shouldInclude: isNotCompleted && isAfterPast && isBeforeNow
          });
          
          return isNotCompleted && isAfterPast && isBeforeNow;
        })
        .map(reminder => {
          // Ensure reminder time is a proper date object for consistency
          const reminderTime = reminder.reminderTime instanceof Date
            ? reminder.reminderTime
            : new Date(reminder.reminderTime);
          
          const task = tasks.find(t => t.id === reminder.taskId);
          return {
            ...reminder,
            reminderTime, // Use the properly parsed date
            taskTitle: task ? task.title : 'Unknown Task'
          };
        });
      
      console.log('checkReminders - Due reminders found:', dueReminders.length);
      return dueReminders;
    } catch (error) {
      console.error('Error checking reminders:', error);
      return [];
    }
  },
  
  markReminderAsCompleted: async (id) => {
    return get().updateReminder(id, undefined, true);
  }
})); 