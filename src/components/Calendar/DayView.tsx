import { useState } from 'react';
import { Paper, Text, Group, Box, Badge, Tooltip, Title } from '@mantine/core';
import { format, differenceInMinutes } from 'date-fns';
import { CalendarEvent } from '../../stores/calendarStore';
import { useCalendarStore } from '../../stores/calendarStore';
import { EventModal } from './EventModal';

interface DayViewProps {
  events: CalendarEvent[];
}

export function DayView({ events }: DayViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  
  const { selectedDate } = useCalendarStore();
  
  // Generate hours for the time grid (5am to 9pm)
  const hours = [];
  for (let i = 5; i <= 21; i++) {
    hours.push(i);
  }
  
  // Split events into all-day and timed events
  const allDayEvents = events.filter(event => event.allDay);
  const timedEvents = events.filter(event => !event.allDay);
  
  // Position an event on the time grid
  const getEventPosition = (event: CalendarEvent) => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    // Calculate top position (as percentage of day)
    const startMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
    // Adjust against our starting hour (5am = 300 minutes)
    const adjustedStartMinutes = Math.max(0, startMinutes - 300);
    const topPercentage = (adjustedStartMinutes / (17 * 60)) * 100; // 17 hours total in our view (5am to 10pm)
    
    // Calculate event height (as percentage of day)
    const durationMinutes = differenceInMinutes(eventEnd, eventStart);
    const heightPercentage = (durationMinutes / (17 * 60)) * 100;
    
    return {
      top: `${topPercentage}%`,
      height: `${heightPercentage}%`,
      width: '95%',
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
      <Title order={4} mb={10}>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</Title>
      
      {/* All-day events section */}
      <Box mb={20}>
        <Text fw={500} mb={5}>All-Day Events</Text>
        <Paper p="sm" withBorder>
          <Group>
            {allDayEvents.map(event => (
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
            {allDayEvents.length === 0 && (
              <Text size="sm" c="dimmed">No all-day events</Text>
            )}
          </Group>
        </Paper>
      </Box>
      
      {/* Day view grid */}
      <Group align="flex-start" noWrap>
        {/* Time labels column */}
        <Box w={50}>
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
        </Box>
        
        {/* Events column */}
        <Box style={{ flex: 1, position: 'relative' }}>
          {/* Time slots */}
          {hours.map(hour => (
            <div
              key={hour}
              style={{
                height: 60,
                borderBottom: '1px solid #eee',
                cursor: 'pointer',
              }}
              onClick={() => {
                const clickTime = new Date(selectedDate);
                clickTime.setHours(hour, 0, 0, 0);
                setSelectedTime(clickTime);
                setIsEventModalOpen(true);
              }}
            ></div>
          ))}
          
          {/* Position events on the grid */}
          {timedEvents.map(event => {
            const style = getEventPosition(event);
            return (
              <Tooltip key={event.id} label={`${format(event.startTime, 'h:mm a')} - ${format(event.endTime, 'h:mm a')}: ${event.title}`}>
                <Paper
                  p="xs"
                  style={{
                    ...style,
                    backgroundColor: findEventColor(event),
                    color: 'white',
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setSelectedEvent(event);
                    setIsEventModalOpen(true);
                  }}
                >
                  <Text fw={500} lineClamp={1}>{event.title}</Text>
                  <Text size="sm" lineClamp={1}>
                    {format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}
                  </Text>
                  {event.location && (
                    <Text size="xs" lineClamp={1}>📍 {event.location}</Text>
                  )}
                </Paper>
              </Tooltip>
            );
          })}
          
          {/* Current time marker */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: '2px',
              backgroundColor: 'red',
              zIndex: 2,
              top: `${getCurrentTimePosition()}%`
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: -5,
                top: -4,
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: 'red'
              }}
            />
          </div>
        </Box>
      </Group>
      
      {isEventModalOpen && (
        <EventModal
          event={selectedEvent}
          selectedDate={selectedTime || selectedDate}
          onClose={() => {
            setIsEventModalOpen(false);
            setSelectedEvent(null);
            setSelectedTime(null);
          }}
        />
      )}
    </>
  );
  
  // Helper function to calculate current time position
  function getCurrentTimePosition() {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    // Adjust against our starting hour (5am = 300 minutes)
    const adjustedMinutes = Math.max(0, minutes - 300);
    return (adjustedMinutes / (17 * 60)) * 100; // 17 hours total in our view (5am to 10pm)
  }
} 