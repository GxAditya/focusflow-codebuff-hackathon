import { MantineProvider, createTheme, LoadingOverlay } from '@mantine/core';
import { useEffect, useState } from 'react';
import { AppShell } from './components/Layout/AppShell';
import { useTaskStore } from './stores/taskStore';
import { useCategoryStore } from './stores/categoryStore';
import { useTimerStore } from './stores/timerStore';
import { useNoteStore } from './stores/noteStore';
import { useAnalyticsStore } from './stores/analyticsStore';
import { useReminderStore } from './stores/reminderStore';
import { ReminderAlert } from './components/Reminders/ReminderAlert';
import { initializeDB } from './services/db';
import { useCalendarStore } from './stores/calendarStore';

const theme = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'sm',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  components: {
    Card: {
      defaultProps: {
        bg: '#FCFCF7',
      },
    },
  },
  colors: {
    // Keep existing colors
  },
});

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const loadCategories = useCategoryStore((state) => state.loadCategories);
  const loadTimeEntries = useTimerStore((state) => state.loadTimeEntries);
  const loadNotes = useNoteStore((state) => state.loadNotes);
  const loadReminders = useReminderStore((state) => state.loadReminders);
  const loadCalendarEvents = useCalendarStore((state) => state.loadEvents);
  const loadCalendarSources = useCalendarStore((state) => state.loadSources);
  const calculateAnalytics = useAnalyticsStore((state) => state.calculateAnalytics);

  // Load core data first
  useEffect(() => {
    async function loadData() {
      try {
        // First initialize the database
        console.log('Initializing database...');
        await initializeDB();
        
        // Load data sequentially with error handling
        console.log('Loading categories...');
        try {
          await loadCategories();
        } catch (e) {
          console.error('Error loading categories:', e);
        }
        
        console.log('Loading tasks...');
        try {
          await loadTasks();
        } catch (e) {
          console.error('Error loading tasks:', e);
        }
        
        console.log('Loading time entries...');
        try {
          await loadTimeEntries();
        } catch (e) {
          console.error('Error loading time entries:', e);
        }
        
        console.log('Loading notes...');
        try {
          await loadNotes();
        } catch (e) {
          console.error('Error loading notes:', e);
        }
        
        console.log('Loading reminders...');
        try {
          await loadReminders();
        } catch (e) {
          console.error('Error loading reminders:', e);
        }
        
        console.log('Loading calendar sources...');
        try {
          await loadCalendarSources();
        } catch (e) {
          console.error('Error loading calendar sources:', e);
        }
        
        console.log('Loading calendar events...');
        try {
          await loadCalendarEvents();
        } catch (e) {
          console.error('Error loading calendar events:', e);
        }
        
        console.log('Core data loading complete');
        setIsDataLoaded(true);
        setIsLoading(false);
      } catch (e) {
        console.error('Application initialization error:', e);
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [loadCategories, loadTasks, loadTimeEntries, loadNotes, loadReminders, loadCalendarSources, loadCalendarEvents]);

  // Calculate analytics after core data is loaded
  useEffect(() => {
    if (isDataLoaded) {
      console.log('Calculating analytics in separate effect...');
      try {
        setTimeout(() => {
          try {
            calculateAnalytics();
            console.log('Analytics calculation complete');
          } catch (e) {
            console.error('Error calculating analytics:', e);
            // Even if analytics fail, don't break the app
          }
        }, 300); // Slightly longer delay to ensure UI is responsive first
      } catch (e) {
        console.error('Error in analytics effect:', e);
      }
    }
  }, [isDataLoaded, calculateAnalytics]);

  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <div style={{ 
        position: 'relative', 
        minHeight: '100vh',
        backgroundColor: '#FFFFF0' 
      }}>
        <LoadingOverlay visible={isLoading} />
        {error ? (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#FFFFF0'
          }}>
            <h2>Error</h2>
            <p>{error}</p>
          </div>
        ) : (
          <>
            <AppShell />
            <ReminderAlert />
          </>
        )}
      </div>
    </MantineProvider>
  );
}

export default App;
