import { Card, Text, Group, ThemeIcon, Stack } from '@mantine/core';
import { IconClockHour4, IconTrophy } from '@tabler/icons-react';

interface AchievementCardProps {
  title: string;
  description: string;
  type: 'mostTimeSpent' | 'mostCompleted';
}

export function AchievementCard({ title, description, type }: AchievementCardProps) {
  return (
    <Card withBorder shadow="sm" p="lg" radius="md" h="100%">
      <Stack gap="md">
        <Group gap="sm">
          <ThemeIcon 
            size="lg" 
            radius="md" 
            color={type === 'mostTimeSpent' ? 'orange' : 'teal'}
            variant="light"
          >
            {type === 'mostTimeSpent' 
              ? <IconClockHour4 size={18} /> 
              : <IconTrophy size={18} />}
          </ThemeIcon>
          <Text fw={700} fz="lg">{title}</Text>
        </Group>
        
        <Text>{description}</Text>
      </Stack>
    </Card>
  );
} 