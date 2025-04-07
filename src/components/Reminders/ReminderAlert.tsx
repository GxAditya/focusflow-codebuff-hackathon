import { useState, useEffect } from 'react';
import { Notification, Stack } from '@mantine/core';
import { IconBell } from '@tabler/icons-react';
import { useReminderStore, ReminderWithTask } from '../../stores/reminderStore';

// Define fallback functions by default for browsers
const useTauriNotifications = () => {
  // Default implementations for browser environments
  const defaultFunctions = {
    isPermissionGranted: async () => false,
    requestPermission: async () => false,
    sendNotification: async ({ title, body }: { title: string; body: string }) => {
      console.log('Browser notification fallback:', title, body);
    }
  };

  const [notificationFunctions, setNotificationFunctions] = 
    useState(defaultFunctions);
  
  // Attempt to load Tauri APIs on component mount
  useEffect(() => {
    const loadTauriAPI = async () => {
      if (window.__TAURI__) {
        try {
          // Use the relative import approach for Tauri v2
          const { notification } = await import('@tauri-apps/api');
          setNotificationFunctions({
            isPermissionGranted: notification.isPermissionGranted,
            requestPermission: notification.requestPermission,
            sendNotification: notification.sendNotification
          });
          console.log('Tauri notification API loaded successfully');
        } catch (error) {
          console.warn('Failed to load Tauri notification API:', error);
          // Keep using default functions
        }
      }
    };
    
    loadTauriAPI();
  }, []);
  
  return notificationFunctions;
};

export function ReminderAlert() {
  const [activeReminders, setActiveReminders] = useState<ReminderWithTask[]>([]);
  const checkReminders = useReminderStore((state) => state.checkReminders);
  const markReminderAsCompleted = useReminderStore((state) => state.markReminderAsCompleted);
  const { isPermissionGranted, requestPermission, sendNotification } = useTauriNotifications();
  
  // Check for due reminders every minute
  useEffect(() => {
    const checkForReminders = async () => {
      const dueReminders = checkReminders();
      if (dueReminders.length > 0) {
        // Show a system notification if supported
        try {
          // Check if we have permission for notifications
          let permissionGranted = false;
          try {
            permissionGranted = await isPermissionGranted();
            if (!permissionGranted) {
              // Request permission
              const permission = await requestPermission();
              permissionGranted = permission === 'granted';
            }
            
            // Send Tauri notifications
            if (permissionGranted) {
              dueReminders.forEach(reminder => {
                try {
                  sendNotification({
                    title: 'FocusFlow Reminder',
                    body: `Task: ${reminder.taskTitle}`,
                  });
                } catch (err) {
                  console.warn('Failed to send notification:', err);
                }
              });
            }
          } catch (err) {
            console.warn('Notification permission error:', err);
          }
        } catch (error) {
          console.error('Error showing notification:', error);
        }
        
        // Always update the in-app notifications regardless of system notification status
        setActiveReminders(prev => {
          // Only add reminders that aren't already being shown
          const newReminders = dueReminders.filter(
            r => !prev.some(p => p.id === r.id)
          );
          return [...prev, ...newReminders];
        });
      }
    };
    
    // Check immediately and then every minute
    checkForReminders();
    const intervalId = setInterval(checkForReminders, 60000);
    
    return () => clearInterval(intervalId);
  }, [checkReminders]);
  
  const handleDismiss = async (id: string) => {
    await markReminderAsCompleted(id);
    setActiveReminders(prev => prev.filter(r => r.id !== id));
  };
  
  if (activeReminders.length === 0) {
    return null;
  }
  
  return (
    <Stack
      gap="xs"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
        maxWidth: 350
      }}
    >
      {activeReminders.map(reminder => (
        <Notification
          key={reminder.id}
          icon={<IconBell size={20} />}
          title={`Reminder: ${reminder.taskTitle}`}
          color="blue"
          onClose={() => handleDismiss(reminder.id)}
          withCloseButton
          withBorder
        >
          It's time for your scheduled task!
        </Notification>
      ))}
    </Stack>
  );
} 