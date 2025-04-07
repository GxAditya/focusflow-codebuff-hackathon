import { create } from 'zustand';
import * as db from '../services/db';

interface TimeEntry {
  id: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
}

interface TimerStore {
  activeTaskId?: string;
  isRunning: boolean;
  timeEntries: TimeEntry[];
  loadTimeEntries: () => Promise<void>;
  startTimer: (taskId: string) => Promise<void>;
  stopTimer: () => Promise<void>;
  getTaskDuration: (taskId: string) => number;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  activeTaskId: undefined,
  isRunning: false,
  timeEntries: [],
  loadTimeEntries: async () => {
    const timeEntries = await db.getAllTimeEntries();
    set({
      timeEntries: timeEntries.map(entry => ({
        ...entry,
        taskId: entry.task_id,
        startTime: new Date(entry.start_time),
        endTime: entry.end_time ? new Date(entry.end_time) : undefined,
      }))
    });
  },
  startTimer: async (taskId) => {
    const currentEntry = get().timeEntries.find(
      (entry) => entry.taskId === taskId && !entry.endTime
    );
    
    if (!currentEntry) {
      const id = crypto.randomUUID();
      const startTime = new Date();
      
      await db.addTimeEntry(
        id,
        taskId,
        startTime.toISOString(),
        null
      );

      set((state) => ({
        activeTaskId: taskId,
        isRunning: true,
        timeEntries: [...state.timeEntries, {
          id,
          taskId,
          startTime,
        }],
      }));
    }
  },
  stopTimer: async () => {
    const endTime = new Date();
    const entries = get().timeEntries;
    const currentEntry = entries.find(entry => !entry.endTime);
    
    if (currentEntry) {
      await db.updateTimeEntry(currentEntry.id, endTime.toISOString());
    }

    set((state) => ({
      activeTaskId: undefined,
      isRunning: false,
      timeEntries: state.timeEntries.map((entry) =>
        !entry.endTime ? { ...entry, endTime } : entry
      ),
    }));
  },
  getTaskDuration: (taskId) => {
    const entries = get().timeEntries.filter((entry) => entry.taskId === taskId);
    return entries.reduce((total, entry) => {
      const end = entry.endTime || new Date();
      return total + (end.getTime() - entry.startTime.getTime());
    }, 0);
  },
}));