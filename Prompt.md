Create a Windows desktop productivity manager app called "FocusFlow" with the following specifications:

# Core Features
1. Task Management:
   - Create, edit, delete tasks
   - Add categories/labels
   - Set priority levels
   - Track completion status
   - Support for subtasks and checklists
   - Drag-and-drop task organization

2. Time Tracking:
   - Start/stop timer for active tasks
   - Beautiful, aesthetic timer display that can go full-screen
   - Animated timer transitions
   - Option to adjust tracked time manually
   - Idle detection and handling

3. Calendar Integration:
   - Monthly/weekly/daily views
   - Sync with external calendars (Google Calendar, Outlook)
   - Task scheduling and deadline visualization
   - Event reminders and notifications

4. Note Taking:
   - Rich text editor for notes
   - Attach notes to specific tasks
   - Quick capture feature for fleeting thoughts
   - Support for images and basic formatting
   - Search through notes

5. Reminders & Notifications:
   - Custom reminder settings
   - Desktop notifications
   - Due date alerts
   - Recurring reminders
   - Smart suggestions based on past behavior

6. Productivity Analytics:
   - Contribution tracking (GitHub-style activity heat map)
   - Monthly and yearly "Wrapped" reports showing user analytics
   - "Achievement of the Day" feature highlighting most time-spent or completed task
   - Charts and graphs for visualization of productivity patterns
   - Focus scores and productivity metrics

# Technical Requirements
1. Tech Stack:
   - Use a lightweight framework like Tauri (Rust + Web technologies) for better performance
   - Alternative: Electron with optimizations for reduced resource usage
   - Local SQLite database for data storage
   - Consider a reactive UI framework (React, Svelte, etc.)

2. UI/UX Design:
   - Clean, minimalist interface
   - Smooth animations and transitions
   - Dark and light theme options
   - Customizable color schemes
   - Responsive design that works well at different window sizes
   - Keyboard shortcuts for power users

3. Integrations:
   - Calendar services (Google Calendar, Outlook)
   - Cloud storage for backup (Google Drive, Dropbox)
   - Note-taking apps (optional sync with Notion, Evernote)
   - Optional Pomodoro technique integration
   - Export data options (CSV, JSON)

4. Performance Considerations:
   - Fast startup time
   - Low CPU/memory footprint
   - Efficient background processes
   - Offline-first approach with sync when connected

5. Security & Privacy:
   - Local-first data storage
   - Optional password protection
   - Data encryption for sensitive information
   - Privacy-focused design (no unnecessary data collection)

# Development Approach
1. Start with a minimum viable product (MVP) focusing on task management and time tracking
2. Implement the UI framework and basic navigation
3. Add core data models and storage
4. Develop the timer functionality with visualization
5. Build the calendar view and integration
6. Implement analytics and reporting features
7. Add additional integrations and exports
8. Polish the UI with animations and theme support

Please provide modular, well-commented code with appropriate error handling. Focus on creating a smooth user experience with performance optimization.