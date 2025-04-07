import { useState } from 'react';
import { Grid, Paper, Text, Group, Box, Badge, Tooltip } from '@mantine/core';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isBefore, isAfter, differenceInMinutes } from 'date-fns';
import { CalendarEvent } from '../../stores/calendarStore';
import { useCalendarStore } from '../../stores/calendarStore';
import { EventModal } from './EventModal';

interface WeekViewProps {
  events: CalendarEvent[];
}

export function WeekView({ events }: WeekViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [dateForNewEvent, setDateForNewEvent] = useState<Date | null>(null);
  
  const { selectedDate, setSelectedDate } = useCalendarStore();
  
  // Generate hours for the time grid (5am to 9pm)
  const hours = [];
  for (let i = 5; i <= 21; i++) {
    hours.push(i);
  }
  
  // Generate weekdays
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(weekStart, i));
  }
  
  // Get events for a specific day, filtered to normal (non-all-day) events
  const getEventsForDay = (day: Date) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    
    return events
      .filter(event => !event.allDay)
      .filter(event => {
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
  
  // Get all-day events for the entire week
  const getAllDayEvents = () => {
    return events
      .filter(event => event.allDay)
      .filter(event => {
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);
        
        // Check if event overlaps with the week
        return (
          (eventStart <= weekEnd && eventEnd >= weekStart)
        );
      });
  };
  
  // Position an event on the time grid
  const getEventPosition = (event: CalendarEvent, day: Date) => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    
    // Clamp event times to day boundaries
    const clampedStart = isBefore(eventStart, dayStart) ? dayStart : eventStart;
    const clampedEnd = isAfter(eventEnd, dayEnd) ? dayEnd : eventEnd;
    
    // Calculate top position (as percentage of day)
    const startMinutes = clampedStart.getHours() * 60 + clampedStart.getMinutes();
    // Adjust against our starting hour (5am = 300 minutes)
    const adjustedStartMinutes = Math.max(0, startMinutes - 300);
    const topPercentage = (adjustedStartMinutes / (17 * 60)) * 100; // 17 hours total in our view (5am to 10pm)
    
    // Calculate event height (as percentage of day)
    const durationMinutes = differenceInMinutes(clampedEnd, clampedStart);
    const heightPercentage = (durationMinutes / (17 * 60)) * 100;
    
    return {
      top: `${topPercentage}%`,
      height: `${heightPercentage}%`,
      width: '90%',
      position: 'absolute' as const,
      zIndex: 1
    };
  };
  
  // Find color for event based on calendar source
  const findEventColor = (event: CalendarEvent) => {
    const sources = useCalendarStore.getState().sources;
    const source = sources.find(s => s.id === event.calendarId);
    return source?.color || 'blue';
  };
  
  return (
    <>
      {/* All-day events section */}
      <Box mb={20}>
        <Text fw={500} mb={5}>All-Day Events</Text>
        <Paper p="sm" withBorder>
          <Group>
            {getAllDayEvents().map(event => (
              <Badge
                key={event.id}
                size="lg"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setSelectedEvent(event);
                  setIsEventModalOpen(true);
                }}
                color={findEventColor(event)}
              >
                {event.title}
              </Badge>
            ))}
            {getAllDayEvents().length === 0 && (
              <Text size="sm" c="dimmed">No all-day events</Text>
            )}
          </Group>
        </Paper>
      </Box>
      
      {/* Week view grid */}
      <Grid>
        {/* Time labels column */}
        <Grid.Col span={1}>
          <div style={{ height: 50 }}></div> {/* Header spacer */}
          {hours.map(hour => (
            <div 
              key={hour} 
              style={{ 
                height: 60, 
                borderBottom: '1px solid #eee',
                position: 'relative',
                paddingRight: 8
              }}
            >
              <Text size="xs" ta="right" style={{ position: 'absolute', top: -10 }}>
                {hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour-12} PM`}
              </Text>
            </div>
          ))}
        </Grid.Col>
        
        {/* Day columns */}
        {days.map((day, index) => (
          <Grid.Col key={index} span={1.5}>
            {/* Day header */}
            <Paper 
              p="xs" 
              withBorder
              style={{
                marginBottom: 10,
                backgroundColor: isSameDay(day, new Date()) ? '#e6f7ff' : undefined,
                fontWeight: isSameDay(day, new Date()) ? 'bold' : undefined,
                height: 50,
              }}
            >
              <Text ta="center">{format(day, 'EEE')}</Text>
              <Text ta="center" size="lg">{format(day, 'd')}</Text>
            </Paper>
            
            {/* Time slots */}
            <div style={{ position: 'relative' }}>
              {hours.map(hour => (
                <div
                  key={hour}
                  style={{
                    height: 60,
                    borderBottom: '1px solid #eee',
                    borderLeft: '1px solid #eee',
                    cursor: 'pointer',
                    backgroundColor: isSameDay(day, new Date()) ? '#f9fcff' : undefined,
                  }}
                  onClick={() => {
                    const clickTime = new Date(day);
                    clickTime.setHours(hour, 0, 0, 0);
                    setSelectedDate(clickTime);
                    setDateForNewEvent(clickTime);
                    setIsEventModalOpen(true);
                  }}
                ></div>
              ))}
              
              {/* Position events on the grid */}
              {getEventsForDay(day).map(event => {
                const style = getEventPosition(event, day);
                return (
                  <Tooltip key={event.id} label={`${format(event.startTime, 'h:mm a')} - ${event.title}`}>
                    <Paper
                      p="xs"
                      style={{
                        ...style,
                        backgroundColor: findEventColor(event),
                        color: 'white',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                      onClick={() => {
                        setSelectedEvent(event);
                        setIsEventModalOpen(true);
                      }}
                    >
                      <Text size="xs" fw={500} lineClamp={1}>{event.title}</Text>
                      <Text size="xs" lineClamp={1}>
                        {format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}
                      </Text>
                    </Paper>
                  </Tooltip>
                );
              })}
            </div>
          </Grid.Col>
        ))}
      </Grid>
      
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