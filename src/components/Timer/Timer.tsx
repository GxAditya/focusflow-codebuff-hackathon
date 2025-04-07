import { Stack, Title, Paper, Text, Group, Button, Progress } from '@mantine/core';
import { IconPlayerPause, IconPlayerStop, IconPlayerPlay } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useTimerStore } from '../../stores/timerStore';
import { useTaskStore } from '../../stores/taskStore';
import { formatDuration } from './utils';

export function Timer() {
  const [elapsed, setElapsed] = useState(0);
  const { activeTaskId, isRunning, startTimer, stopTimer } = useTimerStore();
  const tasks = useTaskStore((state) => state.tasks);
  const activeTask = tasks.find(t => t.id === activeTaskId);

  useEffect(() => {
    let interval: number;
    
    if (isRunning) {
      interval = window.setInterval(() => {
        setElapsed(e => e + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const handleStop = () => {
    stopTimer();
    setElapsed(0);
  };

  return (
    <Stack gap="md">
      <Title order={2}>Timer</Title>

      <Paper p="xl" radius="md" withBorder>
        <Stack align="center" gap="xl">
          <Text size="sm" c="dimmed">
            {activeTask ? activeTask.title : 'No task selected'}
          </Text>

          <Text size="48px" fw={700} style={{ fontFamily: 'monospace' }}>
            {formatDuration(elapsed * 1000)}
          </Text>

          <Progress 
            value={(elapsed % 60) * (100/60)} 
            size="xl" 
            radius="xl" 
            animated
            w="100%"
          />

          <Group>
            {isRunning ? (
              <>
                <Button
                  variant="light"
                  color="blue"
                  onClick={() => stopTimer()}
                  leftSection={<IconPlayerPause size={16} />}
                >
                  Pause
                </Button>
                <Button
                  variant="light"
                  color="red"
                  onClick={handleStop}
                  leftSection={<IconPlayerStop size={16} />}
                >
                  Stop
                </Button>
              </>
            ) : (
              <Button
                variant="light"
                color="blue"
                onClick={() => activeTaskId && startTimer(activeTaskId)}
                leftSection={<IconPlayerPlay size={16} />}
                disabled={!activeTaskId}
              >
                Start
              </Button>
            )}
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
}