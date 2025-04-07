import { Card, Text, Group, Badge, Menu, ActionIcon, Title } from '@mantine/core';
import { IconDots, IconEdit, IconTrash, IconLink } from '@tabler/icons-react';
import { useNoteStore, Note } from '../../stores/noteStore';
import { useTaskStore } from '../../stores/taskStore';

interface NoteItemProps {
  note: Note;
  onEdit: () => void;
}

export function NoteItem({ note, onEdit }: NoteItemProps) {
  const deleteNote = useNoteStore((state) => state.deleteNote);
  const tasks = useTaskStore((state) => state.tasks);
  
  // Find related task if exists
  const relatedTask = note.taskId ? tasks.find(task => task.id === note.taskId) : null;

  return (
    <Card p="md" radius="md" withBorder>
      <Group justify="space-between" mb="xs">
        <Title order={4}>{note.title}</Title>
        <Menu position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="subtle" radius="xl">
              <IconDots size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item 
              leftSection={<IconEdit size={16} />}
              onClick={onEdit}
            >
              Edit
            </Menu.Item>
            <Menu.Item 
              leftSection={<IconTrash size={16} />} 
              color="red"
              onClick={() => deleteNote(note.id)}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
      
      <Text size="sm" c="dimmed" mb="xs">
        Last updated: {note.updatedAt.toLocaleDateString()}
      </Text>
      
      {relatedTask && (
        <Group gap="xs" mb="sm">
          <IconLink size={14} />
          <Text size="sm">
            Linked to: <Text span fw={500}>{relatedTask.title}</Text>
          </Text>
        </Group>
      )}
      
      <Text lineClamp={3} mb="md">
        {note.content}
      </Text>
      
      {note.tags && note.tags.length > 0 && (
        <Group gap="xs" mt="xs">
          {note.tags.map(tag => (
            <Badge key={tag} size="sm" variant="light">
              {tag}
            </Badge>
          ))}
        </Group>
      )}
    </Card>
  );
} 