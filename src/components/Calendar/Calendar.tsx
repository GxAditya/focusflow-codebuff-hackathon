import { useState, useEffect } from 'react';
import { Stack, Title, Group, SegmentedControl, Button, Text } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconCalendarEvent } from '@tabler/icons-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';
import { useCalendarStore } from '../../stores/calendarStore';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { EventModal } from './EventModal';
import { CalendarSourcesPanel } from './CalendarSourcesPanel';

export function Calendar() {
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  
  // Access calendar store for state and methods
  const {
    activeView,
    selectedDate,
    events,
    sources,
    setActiveView,
    moveNext,
    movePrevious,
    moveToday,
    loadEvents,
    loadSources
  } = useCalendarStore();
  
  // Get events for the current view range
  const getViewDateRange = () => {
    switch (activeView) {
      case 'month':
        return { 
          start: startOfMonth(selectedDate), 
          end: endOfMonth(selectedDate) 
        };
      case 'week':
        return { 
          start: startOfWeek(selectedDate, { weekStartsOn: 1 }), 
          end: endOfWeek(selectedDate, { weekStartsOn: 1 }) 
        };
      case 'day':
        return { 
          start: startOfDay(selectedDate), 
          end: endOfDay(selectedDate) 
        };
    }
  };
  
  // Load calendar data on component mount
  useEffect(() => {
    const initializeCalendar = async () => {
      await loadSources();
      await loadEvents();
    };
    
    initializeCalendar();
  }, [loadSources, loadEvents]);
  
  // Get date range title based on active view
  const getDateRangeTitle = () => {
    switch (activeView) {
      case 'month':
        return format(selectedDate, 'MMMM yyyy');
      case 'week': {
        const { start, end } = getViewDateRange();
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
      }
      case 'day':
        return format(selectedDate, 'EEEE, MMMM d, yyyy');
    }
  };
  
  // Render the appropriate view component
  const renderView = () => {
    const { start, end } = getViewDateRange();
    const visibleEvents = useCalendarStore.getState().getEventsInRange(start, end);
    
    switch (activeView) {
      case 'month':
        return <MonthView events={visibleEvents} />;
      case 'week':
        return <WeekView events={visibleEvents} />;
      case 'day':
        return <DayView events={visibleEvents} />;
    }
  };
  
  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Title order={2}>Calendar</Title>
        <Button 
          leftSection={<IconCalendarEvent size={16} />}
          onClick={() => setIsEventModalOpen(true)}
        >
          Create Event
        </Button>
      </Group>
      
      <Group justify="space-between" align="center" mb="md">
        <Group>
          <Button variant="subtle" onClick={moveToday}>Today</Button>
          <Button variant="subtle" onClick={movePrevious} p={6}>
            <IconChevronLeft size={18} />
          </Button>
          <Button variant="subtle" onClick={moveNext} p={6}>
            <IconChevronRight size={18} />
          </Button>
          <Text fw={500} size="lg">{getDateRangeTitle()}</Text>
        </Group>
        
        <SegmentedControl
          value={activeView}
          onChange={(value) => setActiveView(value as 'month' | 'week' | 'day')}
          data={[
            { label: 'Month', value: 'month' },
            { label: 'Week', value: 'week' },
            { label: 'Day', value: 'day' }
          ]}
        />
      </Group>
      
      <Group align="flex-start" style={{ height: 'calc(100vh - 220px)' }}>
        <CalendarSourcesPanel />
        <div style={{ flex: 1, overflow: 'auto', height: '100%' }}>
          {renderView()}
        </div>
      </Group>
      
      {isEventModalOpen && (
        <EventModal
          onClose={() => setIsEventModalOpen(false)}
          selectedDate={selectedDate}
        />
      )}
    </Stack>
  );
} 