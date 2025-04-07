import { useState, useEffect } from 'react';
import { Stack, Title, Card, Text, Group, ActionIcon, Badge, ScrollArea } from '@mantine/core';
import { IconCheck, IconTrash, IconBell } from '@tabler/icons-react';
import { useReminderStore, ReminderWithTask } from '../../stores/reminderStore';
import { formatDistanceToNow } from 'date-fns';

export function ReminderList() {
  const [upcomingReminders, setUpcomingReminders] = useState<ReminderWithTask[]>([]);
  const getUpcomingReminders = useReminderStore((state) => state.getUpcomingReminders);
  const markReminderAsCompleted = useReminderStore((state) => state.markReminderAsCompleted);
  const deleteReminder = useReminderStore((state) => state.deleteReminder);
  const allReminders = useReminderStore((state) => state.reminders);
  
  // Load upcoming reminders
  useEffect(() => {
    const loadReminders = () => {
      const reminders = getUpcomingReminders(30 * 24); // Get reminders for next 30 days
      setUpcomingReminders(reminders);
    };
    
    loadReminders();
    
    // Refresh reminders every minute
    const intervalId = setInterval(loadReminders, 60000);
    
    return () => clearInterval(intervalId);
  }, [getUpcomingReminders, allReminders]);
  
  const handleMarkCompleted = async (id: string) => {
    await markReminderAsCompleted(id);
    setUpcomingReminders(prev => prev.filter(reminder => reminder.id !== id));
  };
  
  const handleDelete = async (id: string) => {
    await deleteReminder(id);
    setUpcomingReminders(prev => prev.filter(reminder => reminder.id !== id));
  };
  
  return (
    <Stack gap="md">
      <Title order={2}>Upcoming Reminders (30 Days)</Title>
      
      {upcomingReminders.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No upcoming reminders. Create a task with a reminder to get started.
        </Text>
      ) : (
        <ScrollArea h={400}>
          <Stack gap="sm">
            {upcomingReminders.map((reminder) => (
              <Card key={reminder.id} withBorder shadow="sm" padding="sm" radius="md">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Group gap="xs" mb="xs">
                      <IconBell size={16} />
                      <Text fw={500}>{reminder.taskTitle}</Text>
                    </Group>
                    
                    <Group gap="xs">
                      <Badge>
                        {formatDistanceToNow(reminder.reminderTime, { addSuffix: true })}
                      </Badge>
                      <Text size="sm" c="dimmed">
                        {reminder.reminderTime.toLocaleString()}
                      </Text>
                    </Group>
                  </div>
                  
                  <Group gap="xs">
                    <ActionIcon
                      color="green"
                      variant="light"
                      onClick={() => handleMarkCompleted(reminder.id)}
                      title="Mark Completed"
                    >
                      <IconCheck size={16} />
                    </ActionIcon>
                    
                    <ActionIcon
                      color="red"
                      variant="light"
                      onClick={() => handleDelete(reminder.id)}
                      title="Delete Reminder"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        </ScrollArea>
      )}
    </Stack>
  );
} 