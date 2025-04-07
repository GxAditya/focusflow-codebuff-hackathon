import { useState } from 'react';
import { Stack, Title, Group, Button, TextInput, Badge, Text } from '@mantine/core';
import { IconPlus, IconSearch, IconHash } from '@tabler/icons-react';
import { useNoteStore, Note } from '../../stores/noteStore';
import { NoteItem } from './NoteItem';
import { NoteForm } from './NoteForm';

export function NoteList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const notes = useNoteStore((state) => state.notes);
  const searchNotes = useNoteStore((state) => state.searchNotes);

  // Extract all unique tags from notes, handling empty/undefined tags
  const allTags = [...new Set(
    notes
      .filter(note => note.tags && Array.isArray(note.tags))
      .flatMap(note => note.tags)
  )].sort();

  // Filter notes based on search query and selected tag
  const filteredNotes = searchQuery
    ? searchNotes(searchQuery)
    : notes.filter(note => 
        !selectedTag || (note.tags && note.tags.includes(selectedTag))
      );

  const handleEditNote = (note: Note) => {
    setCurrentNote(note);
    setIsFormOpen(true);
  };

  const handleAddNote = () => {
    setCurrentNote(null);
    setIsFormOpen(true);
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2}>Notes</Title>
          <Button 
            leftSection={<IconPlus size={16} />}
            onClick={handleAddNote}
          >
            Add Note
          </Button>
        </Group>
        
        <TextInput
          placeholder="Search notes..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedTag(null); // Clear tag filter when searching
          }}
        />

        {/* Tags filter */}
        {allTags.length > 0 && (
          <Group gap="xs" style={{ flexWrap: 'wrap' }}>
            <IconHash size={16} />
            {allTags.map(tag => (
              <Badge 
                key={tag}
                onClick={() => {
                  if (selectedTag === tag) {
                    setSelectedTag(null);
                  } else {
                    setSelectedTag(tag);
                    setSearchQuery(''); // Clear search when selecting tag
                  }
                }}
                style={{ 
                  cursor: 'pointer',
                  opacity: selectedTag && selectedTag !== tag ? 0.5 : 1,
                }}
                variant={selectedTag === tag ? 'filled' : 'light'}
              >
                {tag}
              </Badge>
            ))}
          </Group>
        )}

        {filteredNotes.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            No notes found. Create your first note to get started.
          </Text>
        ) : (
          <Stack gap="sm">
            {filteredNotes.map((note) => (
              <NoteItem 
                key={note.id} 
                note={note} 
                onEdit={() => handleEditNote(note)}
              />
            ))}
          </Stack>
        )}
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