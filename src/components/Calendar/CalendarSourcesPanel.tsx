import { useState } from 'react';
import { Paper, Stack, Text, Group, Switch, Button, ColorSwatch, Modal, TextInput, ColorPicker, Select, Box } from '@mantine/core';
import { IconPlus, IconTrash, IconEdit, IconRefresh, IconBrowser, IconMail } from '@tabler/icons-react';
import { useCalendarStore, CalendarSource } from '../../stores/calendarStore';
import { googleCalendarService, outlookCalendarService } from '../../services/calendarService';

export function CalendarSourcesPanel() {
  const { sources, addSource, updateSource, deleteSource, syncWithGoogleCalendar, syncWithOutlookCalendar } = useCalendarStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<CalendarSource | null>(null);
  
  // Form state
  const [sourceName, setSourceName] = useState('');
  const [sourceType, setSourceType] = useState<'google' | 'outlook' | 'local'>('local');
  const [sourceColor, setSourceColor] = useState('#4285F4');
  
  // Open modal to add new calendar source
  const handleAddSource = () => {
    setEditingSource(null);
    setSourceName('');
    setSourceType('local');
    setSourceColor('#4285F4');
    setIsModalOpen(true);
  };
  
  // Open modal to edit existing calendar source
  const handleEditSource = (source: CalendarSource) => {
    setEditingSource(source);
    setSourceName(source.name);
    setSourceType(source.type);
    setSourceColor(source.color);
    setIsModalOpen(true);
  };
  
  // Handle form submission for adding/editing calendar source
  const handleSubmit = async () => {
    try {
      if (!sourceName.trim()) {
        alert('Please enter a name for the calendar');
        return;
      }
      
      // If editing, update the source
      if (editingSource) {
        await updateSource(editingSource.id, {
          name: sourceName,
          color: sourceColor
        });
      } else {
        // Adding a new source
        let authData = null;
        
        // If external calendar, get authentication
        if (sourceType === 'google') {
          authData = await googleCalendarService.authenticate();
        } else if (sourceType === 'outlook') {
          authData = await outlookCalendarService.authenticate();
        }
        
        // Add the new source
        await addSource({
          name: sourceName,
          type: sourceType,
          color: sourceColor,
          authData
        });
        
        // Sync with external calendar if applicable
        if (sourceType === 'google' && authData) {
          await syncWithGoogleCalendar(authData);
        } else if (sourceType === 'outlook' && authData) {
          await syncWithOutlookCalendar(authData);
        }
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving calendar source:', error);
      alert('Error saving calendar source. Please try again.');
    }
  };
  
  // Handle toggling calendar visibility
  const handleToggleSource = async (sourceId: string, isEnabled: boolean) => {
    try {
      await updateSource(sourceId, { isEnabled: !isEnabled });
    } catch (error) {
      console.error('Error toggling calendar visibility:', error);
    }
  };
  
  // Handle syncing with external calendars
  const handleSyncSource = async (source: CalendarSource) => {
    try {
      if (source.type === 'google') {
        // Check if authenticated
        if (!source.authData || !(await googleCalendarService.isAuthenticated(source.authData))) {
          const authData = await googleCalendarService.authenticate();
          await syncWithGoogleCalendar(authData);
        } else {
          await syncWithGoogleCalendar(source.authData);
        }
      } else if (source.type === 'outlook') {
        // Check if authenticated
        if (!source.authData || !(await outlookCalendarService.isAuthenticated(source.authData))) {
          const authData = await outlookCalendarService.authenticate();
          await syncWithOutlookCalendar(authData);
        } else {
          await syncWithOutlookCalendar(source.authData);
        }
      }
      
      alert('Calendar synced successfully!');
    } catch (error) {
      console.error('Error syncing calendar:', error);
      alert('Error syncing calendar. Please try again.');
    }
  };
  
  // Get icon for calendar type
  const getCalendarTypeIcon = (type: string) => {
    switch (type) {
      case 'google':
        return <IconBrowser size={16} color="#4285F4" />;
      case 'outlook':
        return <IconMail size={16} color="#0078D4" />;
      default:
        return null;
    }
  };
  
  return (
    <Paper withBorder w={250} p="xs" style={{ height: '100%' }}>
      <Stack>
        <Group justify="space-between" mb="md">
          <Text fw={500}>Calendars</Text>
          <Button
            size="compact-sm"
            variant="subtle"
            p={4}
            onClick={handleAddSource}
          >
            <IconPlus size={16} />
          </Button>
        </Group>
        
        {sources.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" p="md">
            No calendars yet. Click + to add one.
          </Text>
        ) : (
          <Stack gap="xs">
            {sources.map(source => (
              <Group key={source.id} justify="space-between" wrap="nowrap">
                <Group wrap="nowrap" gap={8}>
                  <ColorSwatch color={source.color} size={14} />
                  <Stack gap={2}>
                    <Group gap={4}>
                      {getCalendarTypeIcon(source.type)}
                      <Text size="sm" lineClamp={1} style={{ maxWidth: 120 }}>
                        {source.name}
                      </Text>
                    </Group>
                    {source.lastSynced && (
                      <Text size="xs" c="dimmed">
                        Last sync: {new Date(source.lastSynced).toLocaleString()}
                      </Text>
                    )}
                  </Stack>
                </Group>
                
                <Group gap={4}>
                  <Switch
                    size="xs"
                    checked={source.isEnabled}
                    onChange={() => handleToggleSource(source.id, source.isEnabled)}
                  />
                  
                  <Button
                    size="compact-sm"
                    variant="subtle"
                    p={4}
                    onClick={() => handleEditSource(source)}
                  >
                    <IconEdit size={14} />
                  </Button>
                  
                  {source.type !== 'local' && (
                    <Button
                      size="compact-sm"
                      variant="subtle"
                      p={4}
                      onClick={() => handleSyncSource(source)}
                    >
                      <IconRefresh size={14} />
                    </Button>
                  )}
                </Group>
              </Group>
            ))}
          </Stack>
        )}
      </Stack>
      
      {/* Modal for adding/editing calendar source */}
      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSource ? 'Edit Calendar' : 'Add Calendar'}
      >
        <Stack>
          <TextInput
            label="Calendar Name"
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            placeholder="My Calendar"
            required
          />
          
          {!editingSource && ( // Only show type selection when adding new calendar
            <Select
              label="Calendar Type"
              value={sourceType}
              onChange={(value) => setSourceType(value as 'google' | 'outlook' | 'local')}
              data={[
                { label: 'Local Calendar', value: 'local' },
                { label: 'Google Calendar', value: 'google' },
                { label: 'Outlook Calendar', value: 'outlook' }
              ]}
            />
          )}
          
          <Stack gap={4}>
            <Text size="sm">Calendar Color</Text>
            <ColorPicker
              format="hex"
              value={sourceColor}
              onChange={setSourceColor}
              swatches={[
                '#25262b', '#868e96', '#fa5252', '#e64980', '#be4bdb', '#7950f2',
                '#4c6ef5', '#228be6', '#15aabf', '#12b886', '#40c057', '#82c91e',
                '#fab005', '#fd7e14'
              ]}
            />
          </Stack>
          
          {sourceType !== 'local' && (
            <Text size="sm" c="dimmed" mt="xs">
              You'll be prompted to authenticate with {sourceType === 'google' ? 'Google' : 'Microsoft'} when you save.
            </Text>
          )}
          
          <Group justify="space-between" mt="xl">
            {editingSource && (
              <Button
                color="red"
                variant="outline"
                onClick={async () => {
                  if (window.confirm('Are you sure you want to delete this calendar?')) {
                    await deleteSource(editingSource.id);
                    setIsModalOpen(false);
                  }
                }}
                leftSection={<IconTrash size={16} />}
              >
                Delete
              </Button>
            )}
            
            <Group ml="auto">
              <Button variant="subtle" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingSource ? 'Update' : 'Save'}
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
} 