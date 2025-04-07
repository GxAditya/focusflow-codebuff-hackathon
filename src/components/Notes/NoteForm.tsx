import { useState, useEffect } from 'react';
import { Modal, Button, Group, TextInput, Box, TagsInput, Select, Stack, Textarea } from '@mantine/core';
import { useNoteStore, Note } from '../../stores/noteStore';
import { useTaskStore } from '../../stores/taskStore';

interface NoteFormProps {
  opened: boolean;
  onClose: () => void;
  note?: Note | null;
}

export function NoteForm({ opened, onClose, note }: NoteFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [taskId, setTaskId] = useState<string | null>(null);
  const tasks = useTaskStore((state) => state.tasks);
  const addNote = useNoteStore((state) => state.addNote);
  const updateNote = useNoteStore((state) => state.updateNote);

  // Reset form when opened or note changes
  useEffect(() => {
    if (opened) {
      if (note) {
        setTitle(note.title || '');
        setContent(note.content || '');
        setTags(note.tags || []);
        setTaskId(note.taskId || null);
      } else {
        setTitle('');
        setContent('');
        setTags([]);
        setTaskId(null);
      }
    }
  }, [opened, note]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    
    if (note) {
      updateNote(note.id, {
        title,
        content,
        taskId,
        tags,
      });
    } else {
      addNote({
        title,
        content,
        taskId,
        tags,
      });
    }
    
    onClose();
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={note ? 'Edit Note' : 'New Note'} 
      size="lg"
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <Stack gap="md">
          <TextInput
            label="Title"
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          
          <Select
            label="Link to Task (Optional)"
            placeholder="Select a task"
            clearable
            data={tasks.map(task => ({ value: task.id, label: task.title }))}
            value={taskId}
            onChange={setTaskId}
          />
          
          <TagsInput
            label="Tags"
            placeholder="Enter tags and press Enter"
            value={tags}
            onChange={setTags}
          />
          
          <Textarea
            label="Content"
            placeholder="Write your note here..."
            autosize
            minRows={5}
            maxRows={15}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          
          <Group justify="flex-end">
            <Button variant="light" onClick={onClose}>Cancel</Button>
            <Button type="submit">{note ? 'Update' : 'Create'}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
} 