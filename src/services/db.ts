// Remove unnecessary imports for now
// import { BaseDirectory, createDir, readTextFile, writeTextFile, exists } from '@tauri-apps/api/fs';

interface Category {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category_id: string | null;
  due_date: string | null;
  created_at: string;
}

interface TimeEntry {
  id: string;
  task_id: string;
  start_time: string;
  end_time: string | null;
}

interface Note {
  id: string;
  title: string;
  content: string;
  task_id: string | null;
  tags: string | null; // JSON stringified array
  created_at: string;
  updated_at: string;
}

interface Reminder {
  id: string;
  task_id: string;
  reminder_time: string;
  is_completed: boolean;
  created_at: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean;
  location: string | null;
  calendar_id: string;
  external_id: string | null;
  recurrence_rule: string | null;
  task_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CalendarSource {
  id: string;
  name: string;
  type: 'google' | 'outlook' | 'local';
  color: string;
  is_enabled: boolean;
  last_synced: string | null;
  auth_data: string | null; // JSON stringified auth data
}

interface DB {
  categories: Category[];
  tasks: Task[];
  time_entries: TimeEntry[];
  notes: Note[];
  reminders: Reminder[];
  calendar_events: CalendarEvent[];
  calendar_sources: CalendarSource[];
}

// Initialize with empty arrays
const db: DB = {
  categories: [] as Category[],
  tasks: [] as Task[],
  time_entries: [] as TimeEntry[],
  notes: [] as Note[],
  reminders: [] as Reminder[],
  calendar_events: [] as CalendarEvent[],
  calendar_sources: [] as CalendarSource[]
};

// For now, let's simplify the database to fix the immediate issue
export async function initializeDB() {
  try {
    console.log('Database initialized with in-memory storage');
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
}

export async function getAllCategories(): Promise<Category[]> {
  return db.categories;
}

export async function addCategory(id: string, name: string, color: string) {
  const category = {
    id,
    name,
    color,
    created_at: new Date().toISOString()
  };
  db.categories.unshift(category);
}

export async function updateCategory(id: string, name: string, color: string) {
  const index = db.categories.findIndex(c => c.id === id);
  if (index !== -1) {
    db.categories[index] = { ...db.categories[index], name, color };
  }
}

export async function deleteCategory(id: string) {
  db.categories = db.categories.filter(c => c.id !== id);
}

export async function getAllTasks(): Promise<Task[]> {
  return db.tasks;
}

export async function addTask(
  id: string,
  title: string,
  description: string | null,
  status: string,
  priority: string,
  categoryId: string | null,
  dueDate: string | null
) {
  const task = {
    id,
    title,
    description,
    status,
    priority,
    category_id: categoryId,
    due_date: dueDate,
    created_at: new Date().toISOString()
  };
  db.tasks.unshift(task);
}

export async function updateTask(
  id: string,
  title: string,
  description: string | null,
  status: string,
  priority: string,
  categoryId: string | null,
  dueDate: string | null
) {
  const index = db.tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    db.tasks[index] = {
      ...db.tasks[index],
      title,
      description,
      status,
      priority,
      category_id: categoryId,
      due_date: dueDate
    };
  }
}

export async function deleteTask(id: string) {
  db.tasks = db.tasks.filter(t => t.id !== id);
}

export async function getAllTimeEntries(): Promise<TimeEntry[]> {
  return db.time_entries;
}

export async function getTimeEntriesByTask(taskId: string): Promise<TimeEntry[]> {
  return db.time_entries.filter(e => e.task_id === taskId);
}

export async function addTimeEntry(
  id: string,
  taskId: string,
  startTime: string,
  endTime: string | null
) {
  const entry = { id, task_id: taskId, start_time: startTime, end_time: endTime };
  db.time_entries.unshift(entry);
}

export async function updateTimeEntry(id: string, endTime: string) {
  const index = db.time_entries.findIndex(e => e.id === id);
  if (index !== -1) {
    db.time_entries[index] = { ...db.time_entries[index], end_time: endTime };
  }
}

// Note management functions
export async function getAllNotes(): Promise<Note[]> {
  return db.notes;
}

export async function addNote(
  id: string,
  title: string,
  content: string,
  taskId: string | null,
  tags: string,
  createdAt: string,
  updatedAt: string
) {
  const note = {
    id,
    title,
    content,
    task_id: taskId,
    tags,
    created_at: createdAt,
    updated_at: updatedAt
  };
  db.notes.unshift(note);
}

export async function updateNote(
  id: string,
  title: string,
  content: string,
  taskId: string | null,
  tags: string,
  updatedAt: string
) {
  const index = db.notes.findIndex(n => n.id === id);
  if (index !== -1) {
    db.notes[index] = {
      ...db.notes[index],
      title,
      content,
      task_id: taskId,
      tags,
      updated_at: updatedAt
    };
  }
}

export async function deleteNote(id: string) {
  db.notes = db.notes.filter(n => n.id !== id);
}

export async function getNotesByTask(taskId: string): Promise<Note[]> {
  return db.notes.filter(n => n.task_id === taskId);
}

// Reminder management functions
export async function getAllReminders(): Promise<Reminder[]> {
  return db.reminders;
}

export async function getRemindersByTask(taskId: string): Promise<Reminder[]> {
  return db.reminders.filter(r => r.task_id === taskId);
}

export async function addReminder(
  id: string,
  taskId: string,
  reminderTime: string
) {
  const reminder = {
    id,
    task_id: taskId,
    reminder_time: reminderTime,
    is_completed: false,
    created_at: new Date().toISOString()
  };
  db.reminders.unshift(reminder);
}

export async function updateReminder(
  id: string,
  reminderTime: string | null,
  isCompleted: boolean
) {
  const index = db.reminders.findIndex(r => r.id === id);
  if (index !== -1) {
    db.reminders[index] = {
      ...db.reminders[index],
      reminder_time: reminderTime !== null ? reminderTime : db.reminders[index].reminder_time,
      is_completed: isCompleted
    };
  }
}

export async function deleteReminder(id: string) {
  db.reminders = db.reminders.filter(r => r.id !== id);
}

export async function deleteRemindersByTask(taskId: string) {
  db.reminders = db.reminders.filter(r => r.task_id !== taskId);
}

// Calendar source management functions
export async function getAllCalendarSources(): Promise<CalendarSource[]> {
  return db.calendar_sources;
}

export async function addCalendarSource(
  id: string,
  name: string,
  type: 'google' | 'outlook' | 'local',
  color: string,
  authData: string | null
) {
  const source = {
    id,
    name,
    type,
    color,
    is_enabled: true,
    last_synced: null,
    auth_data: authData
  };
  db.calendar_sources.push(source);
}

export async function updateCalendarSource(
  id: string,
  name?: string,
  color?: string,
  isEnabled?: boolean,
  lastSynced?: string | null,
  authData?: string | null
) {
  const index = db.calendar_sources.findIndex(s => s.id === id);
  if (index !== -1) {
    const source = db.calendar_sources[index];
    db.calendar_sources[index] = {
      ...source,
      ...(name !== undefined && { name }),
      ...(color !== undefined && { color }),
      ...(isEnabled !== undefined && { is_enabled: isEnabled }),
      ...(lastSynced !== undefined && { last_synced: lastSynced }),
      ...(authData !== undefined && { auth_data: authData })
    };
  }
}

export async function deleteCalendarSource(id: string) {
  db.calendar_sources = db.calendar_sources.filter(s => s.id !== id);
  // Also delete all events associated with this calendar
  db.calendar_events = db.calendar_events.filter(e => e.calendar_id !== id);
}

// Calendar event management functions
export async function getAllCalendarEvents(): Promise<CalendarEvent[]> {
  return db.calendar_events;
}

export async function getCalendarEventsBySource(calendarId: string): Promise<CalendarEvent[]> {
  return db.calendar_events.filter(e => e.calendar_id === calendarId);
}

export async function getCalendarEventsByTask(taskId: string): Promise<CalendarEvent[]> {
  return db.calendar_events.filter(e => e.task_id === taskId);
}

export async function getCalendarEventsByDateRange(startDate: string, endDate: string): Promise<CalendarEvent[]> {
  const startTimestamp = new Date(startDate).getTime();
  const endTimestamp = new Date(endDate).getTime();
  
  return db.calendar_events.filter(event => {
    const eventStart = new Date(event.start_time).getTime();
    const eventEnd = new Date(event.end_time).getTime();
    
    // Event starts or ends within the range, or spans the entire range
    return (eventStart >= startTimestamp && eventStart <= endTimestamp) ||
           (eventEnd >= startTimestamp && eventEnd <= endTimestamp) ||
           (eventStart <= startTimestamp && eventEnd >= endTimestamp);
  });
}

export async function addCalendarEvent(
  id: string,
  title: string,
  description: string | null,
  startTime: string,
  endTime: string,
  allDay: boolean,
  location: string | null,
  calendarId: string,
  externalId: string | null,
  recurrenceRule: string | null,
  taskId: string | null
) {
  const now = new Date().toISOString();
  const event = {
    id,
    title,
    description,
    start_time: startTime,
    end_time: endTime,
    all_day: allDay,
    location,
    calendar_id: calendarId,
    external_id: externalId,
    recurrence_rule: recurrenceRule,
    task_id: taskId,
    created_at: now,
    updated_at: now
  };
  db.calendar_events.push(event);
}

export async function updateCalendarEvent(
  id: string,
  title?: string,
  description?: string | null,
  startTime?: string,
  endTime?: string,
  allDay?: boolean,
  location?: string | null,
  recurrenceRule?: string | null,
  taskId?: string | null
) {
  const index = db.calendar_events.findIndex(e => e.id === id);
  if (index !== -1) {
    const event = db.calendar_events[index];
    db.calendar_events[index] = {
      ...event,
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(startTime !== undefined && { start_time: startTime }),
      ...(endTime !== undefined && { end_time: endTime }),
      ...(allDay !== undefined && { all_day: allDay }),
      ...(location !== undefined && { location }),
      ...(recurrenceRule !== undefined && { recurrence_rule: recurrenceRule }),
      ...(taskId !== undefined && { task_id: taskId }),
      updated_at: new Date().toISOString()
    };
  }
}

export async function deleteCalendarEvent(id: string) {
  db.calendar_events = db.calendar_events.filter(e => e.id !== id);
}