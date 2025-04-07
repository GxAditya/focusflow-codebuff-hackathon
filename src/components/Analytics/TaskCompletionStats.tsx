import { Card, Title, Group, Text, Stack, Progress } from '@mantine/core';
import { DailyActivity } from '../../stores/analyticsStore';

interface TaskCompletionStatsProps {
  dailyActivities: DailyActivity[];
}

export function TaskCompletionStats({ dailyActivities }: TaskCompletionStatsProps) {
  // Handle empty data case
  if (!dailyActivities || dailyActivities.length === 0) {
    return (
      <Card withBorder shadow="sm" p="lg" radius="md" h="100%">
        <Stack gap="md">
          <Title order={3}>Task Completion Stats</Title>
          <Text c="dimmed" ta="center" py="xl">
            No task data available yet. Complete tasks to see your stats.
          </Text>
        </Stack>
      </Card>
    );
  }
  
  // Calculate completion rate
  const totalTasks = dailyActivities.reduce((acc, day) => acc + (day.taskCount || 0), 0);
  const completedTasks = dailyActivities.reduce((acc, day) => acc + (day.completedCount || 0), 0);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Calculate average time per task
  const totalHours = dailyActivities.reduce((acc, day) => acc + (day.hoursSpent || 0), 0);
  const avgTimePerTask = totalTasks > 0 ? (totalHours / totalTasks).toFixed(1) : '0';
  
  // Calculate average tasks per day
  const avgTasksPerDay = dailyActivities.length > 0 
    ? (totalTasks / dailyActivities.length).toFixed(1) 
    : '0';

  return (
    <Card withBorder shadow="sm" p="lg" radius="md" h="100%">
      <Stack gap="md">
        <Title order={3}>Task Completion Stats</Title>
        
        <Stack gap="xs">
          <Group justify="space-between">
            <Text>Completion Rate</Text>
            <Text fw={600}>{completionRate}%</Text>
          </Group>
          <Progress value={completionRate} color={completionRate > 70 ? "green" : completionRate > 40 ? "yellow" : "red"} />
        </Stack>
        
        <Group grow>
          <Card withBorder p="md" radius="md">
            <Text ta="center" fz="sm" c="dimmed">Tasks Completed</Text>
            <Text ta="center" fw={700} fz="xl">{completedTasks}/{totalTasks}</Text>
          </Card>
          <Card withBorder p="md" radius="md">
            <Text ta="center" fz="sm" c="dimmed">Avg. Hours/Task</Text>
            <Text ta="center" fw={700} fz="xl">{avgTimePerTask}</Text>
          </Card>
          <Card withBorder p="md" radius="md">
            <Text ta="center" fz="sm" c="dimmed">Avg. Tasks/Day</Text>
            <Text ta="center" fw={700} fz="xl">{avgTasksPerDay}</Text>
          </Card>
        </Group>
      </Stack>
    </Card>
  );
} 