import { Stack, Title, Group, Button, TextInput } from '@mantine/core';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { TaskItem } from './TaskItem';
import { TaskForm } from './TaskForm';

export function TaskList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const tasks = useTaskStore((state) => state.tasks);

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2}>Tasks</Title>
          <Button 
            leftSection={<IconPlus size={16} />}
            onClick={() => setIsFormOpen(true)}
          >
            Add Task
          </Button>
        </Group>
        
        <TextInput
          placeholder="Search tasks..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <Stack gap="sm">
          {filteredTasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </Stack>
      </Stack>

      <TaskForm
        opened={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </>
  );
}