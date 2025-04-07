import { Stack, Title, Text, Button, Card } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { useNoteStore, Note } from '../../stores/noteStore';
import { NoteForm } from './NoteForm';

interface TaskNotesProps {
  taskId: string;
}

export function TaskNotes({ taskId }: TaskNotesProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const getNotesByTask = useNoteStore((state) => state.getNotesByTask);
  
  const taskNotes = getNotesByTask(taskId);
  
  const handleAddNote = () => {
    setCurrentNote(null);
    setIsFormOpen(true);
  };
  
  const handleEditNote = (note: Note) => {
    setCurrentNote(note);
    setIsFormOpen(true);
  };

  return (
    <>
      <Stack gap="md">
        <Title order={3}>Notes</Title>
        
        {taskNotes.length === 0 ? (
          <Text c="dimmed">No notes attached to this task yet.</Text>
        ) : (
          <Stack gap="sm">
            {taskNotes.map((note) => (
              <Card 
                key={note.id} 
                p="xs" 
                radius="md" 
                withBorder
                style={{ cursor: 'pointer' }}
                onClick={() => handleEditNote(note)}
              >
                <Title order={5} lineClamp={1}>{note.title}</Title>
                <Text size="sm" lineClamp={2}>
                  {note.content}
                </Text>
              </Card>
            ))}
          </Stack>
        )}
        
        <Button 
          variant="light" 
          leftSection={<IconPlus size={16} />}
          onClick={handleAddNote}
        >
          Add Note
        </Button>
      </Stack>
      
      <NoteForm
        opened={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setCurrentNote(null);
        }}
        note={currentNote}
      />
    </>
  );
} 