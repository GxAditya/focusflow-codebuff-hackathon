import { useState } from 'react';
import { Grid, Paper, Text, Group, Box, Badge, Tooltip } from '@mantine/core';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from 'date-fns';
import { CalendarEvent } from '../../stores/calendarStore';
import { useCalendarStore } from '../../stores/calendarStore';
import { EventModal } from './EventModal';

interface MonthViewProps {
  events: CalendarEvent[];
}

export function MonthView({ events }: MonthViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [dateForNewEvent, setDateForNewEvent] = useState<Date | null>(null);
  
  const { selectedDate, setSelectedDate } = useCalendarStore();
  
  // Generate days for the month view
  const generateDaysGrid = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const rows = [];
    let days = [];
    let day = startDate;
    
    // Create header row with day names
    const dayNames = [];
    for (let i = 0; i < 7; i++) {
      dayNames.push(
        <Grid.Col span={1} key={`header-${i}`}>
          <Text fw={500} ta="center">
            {format(addDays(startDate, i), 'EEE')}
          </Text>
        </Grid.Col>
      );
    }
    rows.push(
      <Grid key="header" gutter={0} style={{ marginBottom: 8 }}>
        {dayNames}
      </Grid>
    );
    
    // Create calendar grid
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const clonedDay = new Date(day);
        const dayEvents = getEventsForDay(clonedDay);
        const isCurrentMonth = isSameMonth(day, monthStart);
        
        days.push(
          <Grid.Col span={1} key={day.toISOString()}>
            <Paper
              p="xs"
              style={{
                height: 120,
                backgroundColor: isCurrentMonth ? undefined : '#f9f9f9',
                opacity: isCurrentMonth ? 1 : 0.7,
                cursor: 'pointer',
                overflow: 'hidden',
                border: isSameDay(day, new Date()) ? '1px solid blue' : '1px solid #eee',
                boxSizing: 'border-box',
              }}
              onClick={() => {
                setSelectedDate(clonedDay);
                setDateForNewEvent(clonedDay);
                if (dayEvents.length === 0) {
                  setIsEventModalOpen(true);
                }
              }}
            >
              <Text fw={isSameDay(day, new Date()) ? 700 : 400} size="sm" mb={6}>
                {format(day, 'd')}
              </Text>
              
              <Box>
                {dayEvents.slice(0, 3).map(event => (
                  <Tooltip key={event.id} label={event.title} position="bottom">
                    <Badge
                      fullWidth
                      style={{
                        cursor: 'pointer',
                        marginBottom: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                        setIsEventModalOpen(true);
                      }}
                      color={findEventColor(event)}
                    >
                      {formatEventTime(event)} {event.title}
                    </Badge>
                  </Tooltip>
                ))}
                
                {dayEvents.length > 3 && (
                  <Text size="xs" c="dimmed" ta="center">
                    +{dayEvents.length - 3} more
                  </Text>
                )}
              </Box>
            </Paper>
          </Grid.Col>
        );
        
        day = addDays(day, 1);
      }
      
      rows.push(
        <Grid key={day.toISOString()} gutter={0}>
          {days}
        </Grid>
      );
      days = [];
    }
    
    return <div>{rows}</div>;
  };
  
  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    
    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      
      return (
        // Event starts on this day
        (eventStart >= dayStart && eventStart <= dayEnd) ||
        // Event ends on this day
        (eventEnd >= dayStart && eventEnd <= dayEnd) ||
        // Event spans over this day
        (eventStart <= dayStart && eventEnd >= dayEnd)
      );
    });
  };
  
  // Find color for event based on calendar source
  const findEventColor = (event: CalendarEvent) => {
    const sources = useCalendarStore.getState().sources;
    const source = sources.find(s => s.id === event.calendarId);
    return source?.color || 'blue';
  };
  
  // Format event time for display
  const formatEventTime = (event: CalendarEvent) => {
    if (event.allDay) {
      return '';
    }
    return format(event.startTime, 'h:mm a');
  };
  
  return (
    <>
      {generateDaysGrid()}
      
      {isEventModalOpen && (
        <EventModal
          event={selectedEvent}
          selectedDate={dateForNewEvent || selectedDate}
          onClose={() => {
            setIsEventModalOpen(false);
            setSelectedEvent(null);
            setDateForNewEvent(null);
          }}
        />
      )}
    </>
  );
} 