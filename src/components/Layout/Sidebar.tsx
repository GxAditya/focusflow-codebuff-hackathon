import { Stack, UnstyledButton, Text } from '@mantine/core';
import { IconCalendar, IconChecklist, IconClock, IconNotes, IconChartBar, IconBell } from '@tabler/icons-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const navItems = [
    { icon: IconChecklist, label: 'Tasks', value: 'tasks' },
    { icon: IconClock, label: 'Timer', value: 'timer' },
    { icon: IconCalendar, label: 'Calendar', value: 'calendar' },
    { icon: IconNotes, label: 'Notes', value: 'notes' },
    { icon: IconBell, label: 'Reminders', value: 'reminders' },
    { icon: IconChartBar, label: 'Analytics', value: 'analytics' },
  ];

  return (
    <Stack p="xs" gap="sm">
      {navItems.map(({ icon: Icon, label, value }) => (
        <UnstyledButton
          key={value}
          onClick={() => onViewChange(value)}
          p="sm"
          style={(theme) => ({
            borderRadius: theme.radius.sm,
            backgroundColor: currentView === value 
              ? theme.colors.gray[1]
              : 'transparent',
            '&:hover': {
              backgroundColor: theme.colors.gray[0],
            },
          })}
        >
          <Stack gap={4} align="center">
            <Icon size={24} />
            <Text size="sm">{label}</Text>
          </Stack>
        </UnstyledButton>
      ))}
    </Stack>
  );
}