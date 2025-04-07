import { Modal, TextInput, Textarea, Select, Group, Button, Checkbox, Stack } from '@mantine/core';
import { DatePickerInput, DateTimePicker } from '@mantine/dates';
import { useState, useEffect } from 'react';
import { Task, useTaskStore } from '../../stores/taskStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useReminderStore } from '../../stores/reminderStore';

interface TaskFormProps {
  task?: Task;
  opened: boolean;
  onClose: () => void;
}

export function TaskForm({ task, opened, onClose }: TaskFormProps) {
  const addTask = useTaskStore((state) => state.addTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const categories = useCategoryStore((state) => state.categories);
  const addReminder = useReminderStore((state) => state.addReminder);
  const deleteRemindersByTask = useReminderStore((state) => state.deleteRemindersByTask);
  const reminders = useReminderStore((state) => state.reminders);
  
  const [enableReminder, setEnableReminder] = useState<boolean>(task?.hasReminder || false);
  const [reminderDateTime, setReminderDateTime] = useState<Date | null>(null);

  // Load existing reminder when editing a task
  useEffect(() => {
    if (task?.id && opened) {
      // Check if there are any active reminders for this task
      const taskReminders = reminders.filter(
        reminder => reminder.taskId === task.id && !reminder.isCompleted
      );
      
      if (taskReminders.length > 0) {
        // Use the first active reminder
        setEnableReminder(true);
        setReminderDateTime(taskReminders[0].reminderTime);
      } else {
        setEnableReminder(Boolean(task.hasReminder));
        setReminderDateTime(null);
      }
    } else {
      // Reset for new tasks
      setEnableReminder(false);
      setReminderDateTime(null);
    }
  }, [task, opened, reminders]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const taskData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      status: formData.get('status') as Task['status'],
      priority: formData.get('priority') as Task['priority'],
      categoryId: formData.get('categoryId') as string,
      dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : undefined,
      hasReminder: enableReminder
    };

    if (task) {
      updateTask(task.id, taskData);
      
      // Handle reminder updates for existing task
      if (enableReminder && reminderDateTime) {
        // First delete any existing reminders
        deleteRemindersByTask(task.id).then(() => {
          // Then add the new reminder
          addReminder(task.id, reminderDateTime);
        });
      } else if (!enableReminder) {
        // Remove all reminders if disabled
        deleteRemindersByTask(task.id);
      }
    } else {
      // For new tasks, we need to add the reminder after the task is created
      addTask(taskData).then((newTask) => {
        if (enableReminder && reminderDateTime && newTask?.id) {
          addReminder(newTask.id, reminderDateTime);
        }
      });
    }
    
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={task ? 'Edit Task' : 'New Task'}
    >
      <form onSubmit={handleSubmit}>
        <TextInput
          required
          label="Title"
          name="title"
          defaultValue={task?.title}
          mb="sm"
        />

        <Textarea
          label="Description"
          name="description"
          defaultValue={task?.description}
          mb="sm"
        />

        <Select
          required
          label="Status"
          name="status"
          defaultValue={task?.status || 'todo'}
          data={[
            { value: 'todo', label: 'To Do' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
          ]}
          mb="sm"
        />

        <Select
          required
          label="Priority"
          name="priority"
          defaultValue={task?.priority || 'medium'}
          data={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
          ]}
          mb="sm"
        />

        <Select
          label="Category"
          name="categoryId"
          defaultValue={task?.categoryId}
          data={categories.map((cat) => ({
            value: cat.id,
            label: cat.name,
          }))}
          mb="sm"
        />

        <DatePickerInput
          label="Due Date"
          name="dueDate"
          defaultValue={task?.dueDate}
          mb="sm"
        />
        
        <Stack mb="lg">
          <Checkbox
            label="Set Reminder"
            checked={enableReminder}
            onChange={(e) => setEnableReminder(e.currentTarget.checked)}
          />
          
          {enableReminder && (
            <DateTimePicker
              label="Reminder Time"
              placeholder="Select date and time"
              value={reminderDateTime}
              onChange={setReminderDateTime}
              minDate={new Date()}
              required={enableReminder}
            />
          )}
        </Stack>

        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>Cancel</Button>
          <Button 
            type="submit"
            disabled={enableReminder && !reminderDateTime}
          >
            {task ? 'Save' : 'Create'}
          </Button>
        </Group>
      </form>
    </Modal>
  );
}