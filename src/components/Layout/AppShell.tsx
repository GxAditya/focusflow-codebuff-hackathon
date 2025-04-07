import { AppShell as MantineAppShell } from '@mantine/core';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { AppHeader } from './Header';
import { TaskList } from '../Tasks/TaskList';
import { Timer } from '../Timer/Timer';
import { NoteList } from '../Notes/NoteList';
import { ReminderList } from '../Reminders/ReminderList';
import { AnalyticsDashboard } from '../Analytics/AnalyticsDashboard';
import { Calendar } from '../Calendar/Calendar';

type View = 'tasks' | 'timer' | 'calendar' | 'notes' | 'reminders' | 'analytics';

export function AppShell() {
  const [currentView, setCurrentView] = useState<View>('tasks');

  const renderView = () => {
    switch (currentView) {
      case 'tasks':
        return <TaskList />;
      case 'timer':
        return <Timer />;
      case 'calendar':
        return <Calendar />;
      case 'notes':
        return <NoteList />;
      case 'reminders':
        return <ReminderList />;
      case 'analytics':
        return <AnalyticsDashboard />;
      default:
        return <div>Coming soon...</div>;
    }
  };

  return (
    <MantineAppShell
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: 'sm' }}
      padding="md"
      styles={{
        main: {
          backgroundColor: '#FFFFF0',
        },
        navbar: {
          backgroundColor: '#FFFFF0',
        }
      }}
    >
      <MantineAppShell.Header>
        <AppHeader />
      </MantineAppShell.Header>

      <MantineAppShell.Navbar>
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>
        {renderView()}
      </MantineAppShell.Main>
    </MantineAppShell>
  );
}