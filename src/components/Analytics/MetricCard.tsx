import { Card, Group, Text, ThemeIcon } from '@mantine/core';
import { IconClockHour4, IconListCheck, IconCheck } from '@tabler/icons-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: 'tasks' | 'check' | 'clock';
}

export function MetricCard({ title, value, subtitle, icon }: MetricCardProps) {
  // Select icon based on prop
  const IconComponent = icon === 'tasks' 
    ? IconListCheck 
    : icon === 'check' 
      ? IconCheck 
      : IconClockHour4;
  
  // Choose color based on icon type
  const iconColor = icon === 'tasks' 
    ? 'blue' 
    : icon === 'check' 
      ? 'green' 
      : 'violet';
  
  return (
    <Card withBorder shadow="sm" p="lg" radius="md">
      <Group gap="md" align="flex-start">
        <ThemeIcon size="xl" radius="md" color={iconColor} variant="light">
          <IconComponent size={24} />
        </ThemeIcon>
        
        <div>
          <Text fz="xs" tt="uppercase" fw={700} c="dimmed">
            {title}
          </Text>
          
          <Text fz="xl" fw={700}>
            {value}
          </Text>
          
          <Text fz="sm" c="dimmed">
            {subtitle}
          </Text>
        </div>
      </Group>
    </Card>
  );
} 