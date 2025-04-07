import { useState, useEffect } from 'react';
import { Modal, TextInput, Textarea, Switch, Group, Button, Select, ColorSwatch, Box, Text, Checkbox } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { CalendarEvent, useCalendarStore } from '../../stores/calendarStore';
import { useTaskStore } from '../../stores/taskStore';
import { format, addHours } from 'date-fns';
import { useReminderStore } from '../../stores/reminderStore';

interface EventModalProps {
  event?: CalendarEvent | null;
  selectedDate: Date;
  onClose: () => void;
}

export function EventModal({ event, selectedDate, onClose }: EventModalProps) {
  const { sources, addEvent, updateEvent, deleteEvent } = useCalendarStore();
  const { tasks } = useTaskStore();
  const addReminder = useReminderStore(state => state.addReminder);
  
  // Default end time is 1 hour after start
  const defaultEndTime = addHours(selectedDate, 1);
  
  // Form state
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [startTime, setStartTime] = useState<Date>(event?.startTime || selectedDate);
  const [endTime, setEndTime] = useState<Date>(event?.endTime || defaultEndTime);
  const [allDay, setAllDay] = useState(event?.allDay || false);
  const [location, setLocation] = useState(event?.location || '');
  const [calendarId, setCalendarId] = useState(event?.calendarId || (sources.length > 0 ? sources[0].id : ''));
  const [taskId, setTaskId] = useState<string | null>(event?.taskId || null);
  const [createReminder, setCreateReminder] = useState(false);
  
  // Create or update the event
  const handleSubmit = async () => {
    try {
      // Validate form
      if (!title.trim()) {
        alert('Please enter a title');
        return;
      }
      
      if (!calendarId) {
        // Create a default local calendar if none exists
        if (sources.length === 0) {
          const localSource = await useCalendarStore.getState().addSource({
            name: 'My Calendar',
            type: 'local',
            color: '#1976d2',
            authData: null
          });
          setCalendarId(localSource.id);
        } else {
          setCalendarId(sources[0].id);
        }
      }
      
      // Prepare event data
      const eventData = {
        title,
        description: description || null,
        startTime,
        endTime, 
        allDay,
        location: location || null,
        calendarId,
        externalId: null,
        recurrenceRule: null,
        taskId
      };
      
      // Create or update event
      if (event) {
        await updateEvent(event.id, eventData);
      } else {
        const newEvent = await addEvent(eventData);
        
        // Create reminder if requested
        if (createReminder && taskId) {
          await addReminder(taskId, startTime);
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event. Please try again.');
    }
  };
  
  // Handle event deletion
  const handleDelete = async () => {
    if (!event) return;
    
    if (window.confirm('Are you sure you want to delete this event?')) {
      await deleteEvent(event.id);
      onClose();
    }
  };
  
  // Filter out completed tasks
  const availableTasks = tasks.filter(task => task.status !== 'completed');
  
  return (
    <Modal
      opened
      onClose={onClose}
      title={event ? 'Edit Event' : 'Create Event'}
      size="md"
    >
      <TextInput
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Event title"
        required
        mb="md"
        data-autofocus
      />
      
      <Textarea
        label="Description"
        value={description || ''}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Event description"
        mb="md"
        minRows={2}
      />
      
      <Group grow mb="md">
        <Box>
          <DateTimePicker
            label="Start"
            value={startTime}
            onChange={(date) => setStartTime(date || new Date())}
            disabled={allDay}
            mb="md"
          />
          
          <DateTimePicker
            label="End"
            value={endTime}
            onChange={(date) => setEndTime(date || addHours(startTime, 1))}
            disabled={allDay}
            mb="md"
          />
        </Box>
        
        <Box>
          <Switch
            label="All-day event"
            checked={allDay}
            onChange={(e) => setAllDay(e.currentTarget.checked)}
            mb="md"
          />
          
          {allDay && (
            <Text size="sm" c="dimmed" mb="md">
              Start and end times are disabled for all-day events.
            </Text>
          )}
          
          <TextInput
            label="Location"
            value={location || ''}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Event location"
            mb="md"
          />
        </Box>
      </Group>
      
      <Select
        label="Calendar"
        data={sources.map(source => ({
          value: source.id,
          label: source.name,
          color: source.color
        }))}
        value={calendarId || ''}
        onChange={(value) => setCalendarId(value || '')}
        placeholder="Select calendar"
        mb="md"
        itemComponent={({ label, value }) => {
          const source = sources.find(s => s.id === value);
          return (
            <Group>
              <ColorSwatch color={source?.color || 'gray'} size={14} />
              <Text size="sm">{label}</Text>
            </Group>
          );
        }}
      />
      
      <Select
        label="Related Task"
        data={availableTasks.map(task => ({
          value: task.id,
          label: task.title
        }))}
        value={taskId || ''}
        onChange={(value) => setTaskId(value)}
        placeholder="Select a task (optional)"
        clearable
        mb="md"
      />
      
      {!event && taskId && (
        <Checkbox
          label="Create reminder for this task"
          checked={createReminder}
          onChange={(e) => setCreateReminder(e.currentTarget.checked)}
          mb="md"
        />
      )}
      
      <Group justify="space-between" mt="xl">
        {event && (
          <Button color="red" variant="outline" onClick={handleDelete}>
            Delete
          </Button>
        )}
        
        <Group ml="auto">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {event ? 'Update' : 'Create'}
          </Button>
        </Group>
      </Group>
    </Modal>
  );
} 