import { create } from 'zustand';
import * as db from '../services/db';
import { useTaskStore } from './taskStore';

// Define interfaces for our calendar data structures
export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startTime: Date; 
  endTime: Date;
  allDay: boolean;
  location: string | null;
  calendarId: string;
  externalId: string | null;
  recurrenceRule: string | null;
  taskId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarSource {
  id: string;
  name: string;
  type: 'google' | 'outlook' | 'local';
  color: string;
  isEnabled: boolean;
  lastSynced: Date | null;
  authData: string | null;
}

// Typed interface for our store
interface CalendarStore {
  events: CalendarEvent[];
  sources: CalendarSource[];
  activeView: 'month' | 'week' | 'day';
  selectedDate: Date;
  
  // Calendar navigation methods
  setActiveView: (view: 'month' | 'week' | 'day') => void;
  setSelectedDate: (date: Date) => void;
  moveNext: () => void;
  movePrevious: () => void;
  moveToday: () => void;
  
  // Event management methods
  loadEvents: () => Promise<void>;
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CalendarEvent>;
  updateEvent: (id: string, eventData: Partial<Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getEventsInRange: (startDate: Date, endDate: Date) => CalendarEvent[];
  
  // Calendar source management methods
  loadSources: () => Promise<void>;
  addSource: (source: Omit<CalendarSource, 'id' | 'isEnabled' | 'lastSynced'>) => Promise<CalendarSource>;
  updateSource: (id: string, sourceData: Partial<Omit<CalendarSource, 'id'>>) => Promise<void>;
  deleteSource: (id: string) => Promise<void>;
  
  // Calendar sync methods
  syncWithGoogleCalendar: (authData: string) => Promise<void>;
  syncWithOutlookCalendar: (authData: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  events: [],
  sources: [],
  activeView: 'month',
  selectedDate: new Date(),
  
  // Calendar navigation methods
  setActiveView: (view) => set({ activeView: view }),
  
  setSelectedDate: (date) => set({ selectedDate: date }),
  
  moveNext: () => {
    const { activeView, selectedDate } = get();
    const newDate = new Date(selectedDate);
    
    switch (activeView) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
    }
    
    set({ selectedDate: newDate });
  },
  
  movePrevious: () => {
    const { activeView, selectedDate } = get();
    const newDate = new Date(selectedDate);
    
    switch (activeView) {
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
    }
    
    set({ selectedDate: newDate });
  },
  
  moveToday: () => set({ selectedDate: new Date() }),
  
  // Event management methods
  loadEvents: async () => {
    try {
      const events = await db.getAllCalendarEvents();
      
      // Convert string dates to Date objects and convert to camelCase
      const mappedEvents = events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        startTime: new Date(event.start_time),
        endTime: new Date(event.end_time),
        allDay: event.all_day,
        location: event.location,
        calendarId: event.calendar_id,
        externalId: event.external_id,
        recurrenceRule: event.recurrence_rule,
        taskId: event.task_id,
        createdAt: new Date(event.created_at),
        updatedAt: new Date(event.updated_at)
      }));
      
      set({ events: mappedEvents });
    } catch (error) {
      console.error('Failed to load calendar events:', error);
      set({ events: [] });
    }
  },
  
  addEvent: async (eventData) => {
    try {
      const id = crypto.randomUUID();
      const now = new Date();
      
      const newEvent = {
        id,
        ...eventData,
        createdAt: now,
        updatedAt: now
      };
      
      await db.addCalendarEvent(
        id,
        eventData.title,
        eventData.description,
        eventData.startTime.toISOString(),
        eventData.endTime.toISOString(),
        eventData.allDay,
        eventData.location,
        eventData.calendarId,
        eventData.externalId,
        eventData.recurrenceRule,
        eventData.taskId
      );
      
      set(state => ({
        events: [...state.events, newEvent]
      }));
      
      return newEvent;
    } catch (error) {
      console.error('Failed to add calendar event:', error);
      throw error;
    }
  },
  
  updateEvent: async (id, eventData) => {
    try {
      const updates: Record<string, any> = {};
      
      if (eventData.title !== undefined) updates.title = eventData.title;
      if (eventData.description !== undefined) updates.description = eventData.description;
      if (eventData.startTime !== undefined) updates.startTime = eventData.startTime.toISOString();
      if (eventData.endTime !== undefined) updates.endTime = eventData.endTime.toISOString();
      if (eventData.allDay !== undefined) updates.allDay = eventData.allDay;
      if (eventData.location !== undefined) updates.location = eventData.location;
      if (eventData.recurrenceRule !== undefined) updates.recurrenceRule = eventData.recurrenceRule;
      if (eventData.taskId !== undefined) updates.taskId = eventData.taskId;
      
      await db.updateCalendarEvent(
        id,
        updates.title,
        updates.description,
        updates.startTime,
        updates.endTime,
        updates.allDay,
        updates.location,
        updates.recurrenceRule,
        updates.taskId
      );
      
      set(state => ({
        events: state.events.map(event => 
          event.id === id 
            ? { 
                ...event, 
                ...eventData,
                updatedAt: new Date() 
              } 
            : event
        )
      }));
    } catch (error) {
      console.error('Failed to update calendar event:', error);
      throw error;
    }
  },
  
  deleteEvent: async (id) => {
    try {
      await db.deleteCalendarEvent(id);
      
      set(state => ({
        events: state.events.filter(event => event.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      throw error;
    }
  },
  
  getEventsInRange: (startDate, endDate) => {
    return get().events.filter(event => {
      // Handle all-day events specially
      if (event.allDay) {
        const eventStartDay = new Date(event.startTime);
        eventStartDay.setHours(0, 0, 0, 0);
        const eventEndDay = new Date(event.endTime);
        eventEndDay.setHours(23, 59, 59, 999);
        
        return (
          (eventStartDay <= endDate && eventEndDay >= startDate) || // Event overlaps with range
          (eventStartDay >= startDate && eventEndDay <= endDate)    // Event is within range
        );
      }
      
      // Regular event logic
      return (
        (event.startTime >= startDate && event.startTime <= endDate) || // Event starts in range
        (event.endTime >= startDate && event.endTime <= endDate) ||    // Event ends in range
        (event.startTime <= startDate && event.endTime >= endDate)     // Event spans range
      );
    });
  },
  
  // Calendar source management methods
  loadSources: async () => {
    try {
      const sources = await db.getAllCalendarSources();
      
      // Convert string dates to Date objects and convert to camelCase
      const mappedSources = sources.map(source => ({
        id: source.id,
        name: source.name,
        type: source.type,
        color: source.color,
        isEnabled: source.is_enabled,
        lastSynced: source.last_synced ? new Date(source.last_synced) : null,
        authData: source.auth_data
      }));
      
      set({ sources: mappedSources });
    } catch (error) {
      console.error('Failed to load calendar sources:', error);
      set({ sources: [] });
    }
  },
  
  addSource: async (sourceData) => {
    try {
      const id = crypto.randomUUID();
      
      const newSource = {
        id,
        ...sourceData,
        isEnabled: true,
        lastSynced: null
      };
      
      await db.addCalendarSource(
        id,
        sourceData.name,
        sourceData.type,
        sourceData.color,
        sourceData.authData
      );
      
      set(state => ({
        sources: [...state.sources, newSource]
      }));
      
      return newSource;
    } catch (error) {
      console.error('Failed to add calendar source:', error);
      throw error;
    }
  },
  
  updateSource: async (id, sourceData) => {
    try {
      const updates: Record<string, any> = {};
      
      if (sourceData.name !== undefined) updates.name = sourceData.name;
      if (sourceData.color !== undefined) updates.color = sourceData.color;
      if (sourceData.isEnabled !== undefined) updates.isEnabled = sourceData.isEnabled;
      if (sourceData.lastSynced !== undefined) updates.lastSynced = sourceData.lastSynced?.toISOString();
      if (sourceData.authData !== undefined) updates.authData = sourceData.authData;
      
      await db.updateCalendarSource(
        id,
        updates.name,
        updates.color,
        updates.isEnabled,
        updates.lastSynced,
        updates.authData
      );
      
      set(state => ({
        sources: state.sources.map(source => 
          source.id === id 
            ? { ...source, ...sourceData } 
            : source
        )
      }));
    } catch (error) {
      console.error('Failed to update calendar source:', error);
      throw error;
    }
  },
  
  deleteSource: async (id) => {
    try {
      await db.deleteCalendarSource(id);
      
      set(state => ({
        sources: state.sources.filter(source => source.id !== id),
        events: state.events.filter(event => event.calendarId !== id)
      }));
    } catch (error) {
      console.error('Failed to delete calendar source:', error);
      throw error;
    }
  },
  
  // Calendar sync methods (these would be implemented in a real app)
  syncWithGoogleCalendar: async (authData) => {
    try {
      console.log('Google Calendar sync would happen here with auth data:', authData);
      // In a real app, this would:
      // 1. Authenticate with Google API
      // 2. Fetch events
      // 3. Compare with local events (by externalId)
      // 4. Add/Update/Delete events as needed
      // 5. Update lastSynced timestamp
      
      // For now, just add a placeholder calendar if none exists
      const sources = get().sources;
      const googleSource = sources.find(source => source.type === 'google');
      
      if (!googleSource) {
        const newSource = await get().addSource({
          name: 'Google Calendar',
          type: 'google',
          color: '#4285F4',
          authData
        });
        
        // Update the lastSynced time
        await get().updateSource(newSource.id, {
          lastSynced: new Date()
        });
      } else {
        // Update the lastSynced time
        await get().updateSource(googleSource.id, {
          lastSynced: new Date(),
          authData
        });
      }
    } catch (error) {
      console.error('Failed to sync with Google Calendar:', error);
      throw error;
    }
  },
  
  syncWithOutlookCalendar: async (authData) => {
    try {
      console.log('Outlook Calendar sync would happen here with auth data:', authData);
      // Similar to Google Calendar sync, but with Outlook API
      
      // For now, just add a placeholder calendar if none exists
      const sources = get().sources;
      const outlookSource = sources.find(source => source.type === 'outlook');
      
      if (!outlookSource) {
        const newSource = await get().addSource({
          name: 'Outlook Calendar',
          type: 'outlook',
          color: '#0078D4',
          authData
        });
        
        // Update the lastSynced time
        await get().updateSource(newSource.id, {
          lastSynced: new Date()
        });
      } else {
        // Update the lastSynced time
        await get().updateSource(outlookSource.id, {
          lastSynced: new Date(),
          authData
        });
      }
    } catch (error) {
      console.error('Failed to sync with Outlook Calendar:', error);
      throw error;
    }
  }
})); 