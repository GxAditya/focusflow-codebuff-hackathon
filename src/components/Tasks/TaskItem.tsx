import { Card, Group, Text, Badge, ActionIcon, Menu, Modal, Button } from '@mantine/core';
import { IconDots, IconEdit, IconTrash, IconPlayerPlay, IconPlayerStop, IconCheck } from '@tabler/icons-react';
import { useState } from 'react';
import { Task, useTaskStore } from '../../stores/taskStore';
import { useTimerStore } from '../../stores/timerStore';
import { TaskForm } from './TaskForm';
import { TaskDetail } from './TaskDetail';
import { formatDurationWords } from '../Timer/utils';

interface TaskItemProps {
  task: Task;
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

export function TaskItem({ task }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const { startTimer, stopTimer, isRunning, activeTaskId, getTaskDuration } = useTimerStore();
  const isActive = activeTaskId === task.id;
  const duration = getTaskDuration(task.id);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open detail if clicking on action buttons
    if ((e.target as HTMLElement).closest('.action-button')) {
      return;
    }
    setIsDetailOpen(true);
  };

  const markComplete = () => {
    updateTask(task.id, { status: 'completed' });
  };

  return (
    <>
      <Card 
        shadow="sm" 
        padding="sm" 
        style={{ cursor: 'pointer' }}
        onClick={handleCardClick}
      >
        <Group justify="space-between" align="flex-start">
          <div>
            <Text fw={500}>{task.title}</Text>
            {task.description && (
              <Text size="sm" c="dimmed" lineClamp={2}>
                {task.description}
              </Text>
            )}
            <Group gap="xs" mt="xs">
              <Badge color={statusColors[task.status]}>{task.status}</Badge>
              <Badge color={priorityColors[task.priority]}>{task.priority}</Badge>
              {duration > 0 && (
                <Badge variant="dot">{formatDurationWords(duration)}</Badge>
              )}
            </Group>
          </div>

          <Group gap="xs" className="action-button">
            {task.status !== 'completed' && (
              <ActionIcon
                color="green"
                variant="light"
                onClick={markComplete}
                className="action-button"
                title="Mark Complete"
              >
                <IconCheck size={16} />
              </ActionIcon>
            )}
            
            <ActionIcon
              color={isActive ? 'red' : 'blue'}
              variant="light"
              onClick={() => isActive ? stopTimer() : startTimer(task.id)}
              disabled={isRunning && !isActive}
              className="action-button"
            >
              {isActive ? <IconPlayerStop size={16} /> : <IconPlayerPlay size={16} />}
            </ActionIcon>
            
            <Menu position="bottom-end">
              <Menu.Target>
                <ActionIcon className="action-button">
                  <IconDots size={16} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item 
                  leftSection={<IconEdit size={16} />}
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Menu.Item>
                <Menu.Item 
                  color="red" 
                  leftSection={<IconTrash size={16} />}
                  onClick={() => deleteTask(task.id)}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </Card>

      {/* Task Edit Form */}
      <TaskForm
        task={task}
        opened={isEditing}
        onClose={() => setIsEditing(false)}
      />

      {/* Task Detail Modal */}
      <Modal
        opened={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        size="lg"
        padding={0}
        title=""
        withCloseButton={false}
        overlayProps={{ blur: 3 }}
        centered
      >
        <TaskDetail task={task} onClose={() => setIsDetailOpen(false)} />
      </Modal>
    </>
  );
}