import { Tabs, Card, Group, Text, Badge, Button, Divider, ActionIcon, Menu, Modal, Stack } from '@mantine/core';
import { IconDots, IconEdit, IconTrash, IconClock, IconNotes, IconCheck, IconBell, IconCalendarTime } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { DateTimePicker } from '@mantine/dates';
import { Task, useTaskStore } from '../../stores/taskStore';
import { useTimerStore } from '../../stores/timerStore';
import { useReminderStore } from '../../stores/reminderStore';
import { TaskForm } from './TaskForm';
import { formatDurationWords } from '../Timer/utils';
import { TaskNotes } from '../Notes/TaskNotes';
import { formatDistanceToNow } from 'date-fns';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

const priorityColors = {
  low: 'blue',
  medium: 'yellow',
  high: 'red',
};

const statusColors = {
  todo: 'gray',
  in_progress: 'blue',
  completed: 'green',
};

export function TaskDetail({ task, onClose }: TaskDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderDateTime, setReminderDateTime] = useState<Date | null>(null);
  const [activeReminder, setActiveReminder] = useState<{ id: string; time: Date } | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('details');
  
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const { getTaskDuration } = useTimerStore();
  const duration = getTaskDuration(task.id);
  
  const addReminder = useReminderStore(state => state.addReminder);
  const deleteReminder = useReminderStore(state => state.deleteReminder);
  const reminders = useReminderStore(state => state.reminders);
  
  // Check for existing reminders
  useEffect(() => {
    const taskReminders = reminders.filter(
      reminder => reminder.taskId === task.id && !reminder.isCompleted
    );
    
    if (taskReminders.length > 0) {
      setActiveReminder({
        id: taskReminders[0].id,
        time: taskReminders[0].reminderTime
      });
    } else {
      setActiveReminder(null);
    }
  }, [task.id, reminders]);

  const handleDelete = () => {
    deleteTask(task.id);
    onClose();
  };

  const markComplete = () => {
    updateTask(task.id, { status: 'completed' });
  };
  
  const handleAddReminder = () => {
    if (reminderDateTime) {
      addReminder(task.id, reminderDateTime);
      updateTask(task.id, { hasReminder: true });
      setIsReminderModalOpen(false);
      setReminderDateTime(null);
    }
  };
  
  const handleDeleteReminder = () => {
    if (activeReminder) {
      deleteReminder(activeReminder.id);
      updateTask(task.id, { hasReminder: false });
      setActiveReminder(null);
    }
  };

  return (
    <>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Text size="xl" fw={700}>{task.title}</Text>
          <Group gap="xs">
            {task.status !== 'completed' && (
              <Button 
                variant="light" 
                color="green" 
                leftSection={<IconCheck size={16} />}
                onClick={markComplete}
              >
                Mark Complete
              </Button>
            )}
            {activeReminder ? (
              <Button 
                variant="light" 
                color="orange" 
                leftSection={<IconBell size={16} />}
                onClick={() => handleDeleteReminder()}
                title={`Reminder set for ${activeReminder.time.toLocaleString()}`}
              >
                Remove Reminder
              </Button>
            ) : (
              <Button 
                variant="light" 
                color="blue" 
                leftSection={<IconCalendarTime size={16} />}
                onClick={() => setIsReminderModalOpen(true)}
              >
                Set Reminder
              </Button>
            )}
            <Button variant="light" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            <Menu position="bottom-end">
              <Menu.Target>
                <ActionIcon variant="light">
                  <IconDots size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item 
                  color="red" 
                  leftSection={<IconTrash size={16} />}
                  onClick={handleDelete}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="details" leftSection={<IconClock size={16} />}>
              Details
            </Tabs.Tab>
            <Tabs.Tab value="notes" leftSection={<IconNotes size={16} />}>
              Notes
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="details" pt="md">
            <Group gap="xs" mb="md">
              <Badge color={statusColors[task.status]} size="lg">{task.status}</Badge>
              <Badge color={priorityColors[task.priority]} size="lg">{task.priority}</Badge>
              {task.dueDate && (
                <Badge variant="light" size="lg">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </Badge>
              )}
              {activeReminder && (
                <Badge color="orange" size="lg">
                  Reminder: {formatDistanceToNow(activeReminder.time, { addSuffix: true })}
                </Badge>
              )}
            </Group>

            {task.description && (
              <Text mb="md">{task.description}</Text>
            )}

            <Divider my="sm" />
            
            <Group>
              <Text fw={500}>Time Tracked:</Text>
              <Text>{duration > 0 ? formatDurationWords(duration) : 'None'}</Text>
            </Group>
          </Tabs.Panel>

          <Tabs.Panel value="notes" pt="md">
            <TaskNotes taskId={task.id} />
          </Tabs.Panel>
        </Tabs>
      </Card>

      <TaskForm
        task={task}
        opened={isEditing}
        onClose={() => setIsEditing(false)}
      />
      
      <Modal
        opened={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        title="Set Reminder"
      >
        <Stack>
          <DateTimePicker
            label="Reminder Time"
            placeholder="Select date and time"
            value={reminderDateTime}
            onChange={setReminderDateTime}
            minDate={new Date()}
            required
            mb="md"
          />
          
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setIsReminderModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color="blue"
              onClick={handleAddReminder}
              disabled={!reminderDateTime}
            >
              Set Reminder
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
} 