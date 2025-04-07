import { create } from 'zustand';
import { startOfDay, format, isToday, isThisWeek, isThisMonth, isThisYear, subDays, eachDayOfInterval, addDays, endOfDay, isWithinInterval, subMonths, subWeeks, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { useTaskStore } from './taskStore';
import { useTimerStore } from './timerStore';

export interface DailyActivity {
  date: string;
  taskCount: number;
  completedCount: number;
  hoursSpent: number;
}

export interface HeatmapData {
  date: string;
  count: number;
}

export interface ProductivityMetric {
  label: string;
  value: number;
  change: number; // percentage change from previous period
}

export interface AchievementOfDay {
  type: 'mostTimeSpent' | 'mostCompleted';
  taskId: string;
  taskTitle: string;
  value: number; // time in ms or count
}

export interface TaskAchievement {
  taskName: string;
  hours: number;
  count: number;
}

interface AnalyticsStore {
  // Data
  dailyActivity: DailyActivity[];
  heatmapData: HeatmapData[];
  productivityMetrics: {
    tasksCompleted: ProductivityMetric;
    timeTracked: ProductivityMetric;
    focusScore: ProductivityMetric;
  };
  achievementOfDay: AchievementOfDay | null;
  
  // Actions
  calculateAnalytics: () => void;
  getTaskCompletionRate: (period: 'day' | 'week' | 'month' | 'year') => number;
  getAverageTimePerTask: (period: 'day' | 'week' | 'month' | 'year') => number;
  getFocusScore: (period: 'day' | 'week' | 'month' | 'year') => number;
  
  // Methods for analytics data retrieval
  getDailyActivities: (period: 'week' | 'month' | 'year', currentDate?: Date) => DailyActivity[];
  getHeatmapData: (period?: 'week' | 'month' | 'year', currentDate?: Date) => HeatmapData[];
  getMostTimeSpentTask: (period: 'week' | 'month' | 'year', currentDate?: Date) => TaskAchievement | null;
  getMostCompletedTask: (period: 'week' | 'month' | 'year', currentDate?: Date) => TaskAchievement | null;
}

export const useAnalyticsStore = create<AnalyticsStore>((set, get) => ({
  dailyActivity: [],
  heatmapData: [],
  productivityMetrics: {
    tasksCompleted: { label: 'Tasks Completed', value: 0, change: 0 },
    timeTracked: { label: 'Time Tracked', value: 0, change: 0 },
    focusScore: { label: 'Focus Score', value: 0, change: 0 }
  },
  achievementOfDay: null,
  
  calculateAnalytics: () => {
    try {
      const tasks = useTaskStore.getState().tasks || [];
      const timeEntries = useTimerStore.getState().timeEntries || [];
      
      // Generate daily activity for the last 90 days
      const endDate = new Date();
      const startDate = subDays(endDate, 90);
      
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const dailyActivity: DailyActivity[] = days.map(day => {
        try {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayStart = startOfDay(day);
          const nextDay = addDays(dayStart, 1);
          
          // Count tasks created on this day
          const tasksCreatedToday = tasks.filter(task => {
            try {
              if (!task.createdAt) return false;
              const taskDate = new Date(task.createdAt);
              return taskDate >= dayStart && taskDate < nextDay;
            } catch (e) {
              console.error('Error processing task date:', e);
              return false;
            }
          }).length;
          
          // Count tasks completed on this day
          const tasksCompletedToday = tasks.filter(task => {
            try {
              if (!task.createdAt) return false;
              return task.status === 'completed' && 
                   new Date(task.createdAt) >= dayStart && 
                   new Date(task.createdAt) < nextDay;
            } catch (e) {
              console.error('Error processing task completion date:', e);
              return false;
            }
          }).length;
          
          // Calculate time spent on this day
          const timeSpentToday = timeEntries.reduce((total, entry) => {
            try {
              if (!entry.startTime) return total;
              const startTime = new Date(entry.startTime);
              if (startTime >= dayStart && startTime < nextDay) {
                const endTime = entry.endTime ? new Date(entry.endTime) : new Date();
                return total + (endTime.getTime() - startTime.getTime());
              }
              return total;
            } catch (e) {
              console.error('Error calculating time entry duration:', e);
              return total;
            }
          }, 0);
          
          return {
            date: dateStr,
            taskCount: tasksCreatedToday,
            completedCount: tasksCompletedToday,
            hoursSpent: timeSpentToday / (1000 * 60 * 60)
          };
        } catch (e) {
          console.error('Error processing activity for day:', day, e);
          return {
            date: format(day, 'yyyy-MM-dd'),
            taskCount: 0,
            completedCount: 0,
            hoursSpent: 0
          };
        }
      });
      
      // Generate heatmap data from daily activity
      const heatmapData: HeatmapData[] = dailyActivity.map(day => ({
        date: day.date,
        count: day.completedCount + Math.floor(day.hoursSpent)
      }));
      
      // Calculate today's metrics
      const todayActivity = dailyActivity.find(day => 
        day.date === format(new Date(), 'yyyy-MM-dd')
      ) || { taskCount: 0, completedCount: 0, hoursSpent: 0 };
      
      // Calculate weekly metrics 
      const thisWeekActivity = dailyActivity.filter(day => 
        isThisWeek(new Date(day.date))
      );
      
      const weeklyTasksCompleted = thisWeekActivity.reduce((sum, day) => sum + day.completedCount, 0);
      const weeklyTimeTracked = thisWeekActivity.reduce((sum, day) => sum + day.hoursSpent, 0);
      
      // Calculate previous week metrics
      const previousWeekActivity = dailyActivity.filter(day => {
        const date = new Date(day.date);
        const sevenDaysAgo = subDays(new Date(), 7);
        const fourteenDaysAgo = subDays(new Date(), 14);
        return date >= fourteenDaysAgo && date < sevenDaysAgo;
      });
      
      const prevWeekTasksCompleted = previousWeekActivity.reduce((sum, day) => sum + day.completedCount, 0);
      const prevWeekTimeTracked = previousWeekActivity.reduce((sum, day) => sum + day.hoursSpent, 0);
      
      // Calculate change percentages
      const tasksCompletedChange = prevWeekTasksCompleted === 0 
        ? 100 
        : Math.round(((weeklyTasksCompleted - prevWeekTasksCompleted) / prevWeekTasksCompleted) * 100);
        
      const timeTrackedChange = prevWeekTimeTracked === 0 
        ? 100 
        : Math.round(((weeklyTimeTracked - prevWeekTimeTracked) / prevWeekTimeTracked) * 100);
      
      // Calculate focus score (0-100)
      // Based on: completion rate and time tracked consistency
      const completionRate = tasks.length > 0 
        ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 
        : 0;
      
      const timeTrackedConsistency = days.length > 0
        ? (dailyActivity.filter(day => day.hoursSpent > 0).length / days.length) * 100
        : 0;
        
      const focusScore = Math.round((completionRate + timeTrackedConsistency) / 2);
      const prevFocusScore = 50; // Placeholder, we'll calculate this properly in a future update
      const focusScoreChange = Math.round(focusScore - prevFocusScore);
      
      // Find achievement of the day
      const todaysTasks = tasks.filter(task => isToday(new Date(task.createdAt)));
      
      let mostTimeSpentTask = { id: '', title: '', hours: 0 };
      let mostCompletedCategoryTask = { id: '', title: '', count: 0 };
      
      if (todaysTasks.length > 0) {
        // Find task with most time spent today
        todaysTasks.forEach(task => {
          const taskTimeSpent = timeEntries
            .filter(entry => entry.taskId === task.id && isToday(new Date(entry.startTime)))
            .reduce((total, entry) => {
              const startTime = new Date(entry.startTime);
              const endTime = entry.endTime ? new Date(entry.endTime) : new Date();
              return total + (endTime.getTime() - startTime.getTime());
            }, 0);
          
          if (taskTimeSpent > mostTimeSpentTask.hours) {
            mostTimeSpentTask = {
              id: task.id,
              title: task.title,
              hours: taskTimeSpent
            };
          }
        });
      }
      
      const achievementOfDay = mostTimeSpentTask.hours > 0 
        ? {
            type: 'mostTimeSpent' as const,
            taskId: mostTimeSpentTask.id,
            taskTitle: mostTimeSpentTask.title,
            value: mostTimeSpentTask.hours
          }
        : null;
      
      set({
        dailyActivity,
        heatmapData,
        productivityMetrics: {
          tasksCompleted: { 
            label: 'Tasks Completed', 
            value: weeklyTasksCompleted, 
            change: tasksCompletedChange 
          },
          timeTracked: { 
            label: 'Time Tracked (hrs)', 
            value: Math.round(weeklyTimeTracked), 
            change: timeTrackedChange 
          },
          focusScore: { 
            label: 'Focus Score', 
            value: focusScore, 
            change: focusScoreChange 
          }
        },
        achievementOfDay
      });
    } catch (e) {
      console.error('Error in calculateAnalytics:', e);
      // Set default empty state values to prevent UI from breaking
      set({
        dailyActivity: [],
        heatmapData: [],
        productivityMetrics: {
          tasksCompleted: { label: 'Tasks Completed', value: 0, change: 0 },
          timeTracked: { label: 'Time Tracked (hrs)', value: 0, change: 0 },
          focusScore: { label: 'Focus Score', value: 0, change: 0 },
        },
        achievementOfDay: null,
      });
    }
  },
  
  getTaskCompletionRate: (period: 'day' | 'week' | 'month' | 'year') => {
    const tasks = useTaskStore.getState().tasks;
    let filteredTasks = [];
    
    switch (period) {
      case 'day':
        filteredTasks = tasks.filter(task => isToday(new Date(task.createdAt)));
        break;
      case 'week':
        filteredTasks = tasks.filter(task => isThisWeek(new Date(task.createdAt)));
        break;
      case 'month':
        filteredTasks = tasks.filter(task => isThisMonth(new Date(task.createdAt)));
        break;
      case 'year':
        filteredTasks = tasks.filter(task => isThisYear(new Date(task.createdAt)));
        break;
    }
    
    if (filteredTasks.length === 0) return 0;
    
    return (filteredTasks.filter(task => task.status === 'completed').length / filteredTasks.length) * 100;
  },
  
  getAverageTimePerTask: (period: 'day' | 'week' | 'month' | 'year') => {
    const tasks = useTaskStore.getState().tasks;
    const timeEntries = useTimerStore.getState().timeEntries;
    let filteredTimeEntries = [];
    
    switch (period) {
      case 'day':
        filteredTimeEntries = timeEntries.filter(entry => isToday(new Date(entry.startTime)));
        break;
      case 'week':
        filteredTimeEntries = timeEntries.filter(entry => isThisWeek(new Date(entry.startTime)));
        break;
      case 'month':
        filteredTimeEntries = timeEntries.filter(entry => isThisMonth(new Date(entry.startTime)));
        break;
      case 'year':
        filteredTimeEntries = timeEntries.filter(entry => isThisYear(new Date(entry.startTime)));
        break;
    }
    
    if (filteredTimeEntries.length === 0) return 0;
    
    // Get unique task IDs from time entries
    const taskIds = [...new Set(filteredTimeEntries.map(entry => entry.taskId))];
    
    // Total time spent on all tasks
    const totalTimeSpent = filteredTimeEntries.reduce((sum, entry) => {
      const startTime = new Date(entry.startTime);
      const endTime = entry.endTime ? new Date(entry.endTime) : new Date();
      return sum + (endTime.getTime() - startTime.getTime());
    }, 0);
    
    // Average time per task in milliseconds
    return taskIds.length > 0 ? totalTimeSpent / taskIds.length : 0;
  },
  
  getFocusScore: (period: 'day' | 'week' | 'month' | 'year') => {
    // A simplified focus score calculation
    const completionRate = get().getTaskCompletionRate(period);
    const avgTimePerTask = get().getAverageTimePerTask(period);
    
    // More time doesn't always mean better focus, so we use a bell curve
    // with optimal time around 30 minutes per task
    const timeScore = avgTimePerTask === 0 
      ? 0 
      : Math.min(100, 100 * Math.exp(-Math.pow((avgTimePerTask - 1800000) / 1800000, 2)));
    
    return Math.round((completionRate + timeScore) / 2);
  },
  
  // Methods for analytics data retrieval
  getDailyActivities: (period: 'week' | 'month' | 'year', currentDate?: Date) => {
    const tasks = useTaskStore.getState().tasks;
    const timeEntries = useTimerStore.getState().timeEntries;
    
    // Determine date range based on period
    let startDate: Date;
    let endDate: Date = endOfDay(currentDate);
    
    switch (period) {
      case 'week':
        startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday
        endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
        break;
      case 'year':
        startDate = startOfYear(currentDate);
        endDate = endOfYear(currentDate);
        break;
      default:
        startDate = subDays(currentDate, 7);
    }
    
    // Map of dates to activity
    const activityMap = new Map<string, DailyActivity>();
    
    // Initialize the map with all dates in the period
    let currentDateIterator = new Date(startDate);
    while (currentDateIterator <= endDate) {
      const dateKey = format(currentDateIterator, 'yyyy-MM-dd');
      activityMap.set(dateKey, {
        date: dateKey,
        taskCount: 0,
        completedCount: 0,
        hoursSpent: 0
      });
      currentDateIterator = new Date(currentDateIterator.setDate(currentDateIterator.getDate() + 1));
    }
    
    // Process tasks for task counts
    tasks.forEach(task => {
      if (task.createdAt) {
        const taskDate = new Date(task.createdAt);
        if (isWithinInterval(taskDate, { start: startDate, end: endDate })) {
          const dateKey = format(taskDate, 'yyyy-MM-dd');
          const daily = activityMap.get(dateKey);
          if (daily) {
            daily.taskCount += 1;
            if (task.status === 'completed') {
              daily.completedCount += 1;
            }
          }
        }
      }
      
      // Also count completed tasks by completion date if available, otherwise by creation date
      if (task.status === 'completed') {
        const completionDate = task.completedAt ? new Date(task.completedAt) : task.createdAt ? new Date(task.createdAt) : null;
        if (completionDate && isWithinInterval(completionDate, { start: startDate, end: endDate })) {
          const dateKey = format(completionDate, 'yyyy-MM-dd');
          const daily = activityMap.get(dateKey);
          if (daily) {
            // If the completion date is different from the creation date, add to completion count
            if (!task.createdAt || format(new Date(task.createdAt), 'yyyy-MM-dd') !== dateKey) {
              daily.completedCount += 1;
            }
          }
        }
      }
    });
    
    // Process time records for hours spent
    timeEntries.forEach(record => {
      if (record.startTime && record.endTime) {
        const recordDate = new Date(record.startTime);
        if (isWithinInterval(recordDate, { start: startDate, end: endDate })) {
          const dateKey = format(recordDate, 'yyyy-MM-dd');
          const daily = activityMap.get(dateKey);
          if (daily) {
            // Calculate hours spent
            const durationMs = new Date(record.endTime).getTime() - new Date(record.startTime).getTime();
            const durationHours = durationMs / (1000 * 60 * 60);
            daily.hoursSpent += durationHours;
          }
        }
      }
    });
    
    // Convert map to array
    return Array.from(activityMap.values());
  },
  
  // Generate heatmap data for GitHub-style activity visualization
  getHeatmapData: (period = 'year', currentDate = new Date()) => {
    try {
      const tasks = useTaskStore.getState().tasks || [];
      const timeEntries = useTimerStore.getState().timeEntries || [];
      
      console.log(`Generating heatmap data for ${period}...`);
      
      // Get daily activities for the requested period
      const dailyActivities = get().getDailyActivities(period, currentDate);
      console.log(`Fetched ${dailyActivities.length} days of activity data for period: ${period}`);
      
      // For debugging
      const tasksWithActivity = dailyActivities.filter(day => day.completedCount > 0 || day.taskCount > 0);
      if (tasksWithActivity.length > 0) {
        console.log("Days with activity:", tasksWithActivity.map(day => `${day.date}: ${day.completedCount} completed, ${day.taskCount} created`));
      } else {
        console.log("No days with activity found in selected period");
      }
      
      // Map activities to heatmap data, ensuring completions are reflected
      const heatmapData = dailyActivities.map(day => {
        const date = day.date;
        // Count both task creation and completion as contributions
        // Prioritize completed tasks for the visual
        const count = Math.max(day.completedCount * 2, day.taskCount);
        return { date, count };
      });
      
      const daysWithContributions = heatmapData.filter(day => day.count > 0);
      console.log(`Heatmap data generated with ${daysWithContributions.length} days containing contributions`);
      
      return heatmapData;
    } catch (error) {
      console.error('Error generating heatmap data:', error);
      return [];
    }
  },
  
  // Find the task with the most time spent
  getMostTimeSpentTask: (period, currentDate = new Date()) => {
    const tasks = useTaskStore.getState().tasks;
    const timeEntries = useTimerStore.getState().timeEntries;
    
    // Define the date range
    let startDate: Date;
    let endDate: Date = endOfDay(currentDate);
    
    switch (period) {
      case 'week':
        startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
        endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
        break;
      case 'year':
        startDate = startOfYear(currentDate);
        endDate = endOfYear(currentDate);
        break;
      default:
        startDate = subDays(currentDate, 7);
    }
    
    // Create a map to store time spent per task
    const taskTimeMap = new Map<string, { taskId: string, hours: number }>();
    
    // Calculate time spent per task
    timeEntries.forEach(record => {
      if (record.startTime && record.endTime && record.taskId) {
        const recordDate = new Date(record.startTime);
        if (isWithinInterval(recordDate, { start: startDate, end: endDate })) {
          const durationMs = new Date(record.endTime).getTime() - new Date(record.startTime).getTime();
          const durationHours = durationMs / (1000 * 60 * 60);
          
          if (taskTimeMap.has(record.taskId)) {
            const existing = taskTimeMap.get(record.taskId)!;
            existing.hours += durationHours;
          } else {
            taskTimeMap.set(record.taskId, { taskId: record.taskId, hours: durationHours });
          }
        }
      }
    });
    
    // Find the task with the most time spent
    let mostTimeTaskId: string | null = null;
    let maxHours = 0;
    
    taskTimeMap.forEach((data, taskId) => {
      if (data.hours > maxHours) {
        mostTimeTaskId = taskId;
        maxHours = data.hours;
      }
    });
    
    if (!mostTimeTaskId) return null;
    
    // Find the task name
    const task = tasks.find(t => t.id === mostTimeTaskId);
    if (!task) return null;
    
    return {
      taskName: task.title,
      hours: maxHours,
      count: 1
    };
  },
  
  // Find the most completed task
  getMostCompletedTask: (period, currentDate = new Date()) => {
    const tasks = useTaskStore.getState().tasks;
    
    // Define the date range
    let startDate: Date;
    let endDate: Date = endOfDay(currentDate);
    
    switch (period) {
      case 'week':
        startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
        endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
        break;
      case 'year':
        startDate = startOfYear(currentDate);
        endDate = endOfYear(currentDate);
        break;
      default:
        startDate = subDays(currentDate, 7);
    }
    
    // Group tasks by title
    const taskCompletionCount = new Map<string, number>();
    
    // Count completed tasks
    tasks.forEach(task => {
      if (task.status === 'completed') {
        const completedDate = task.completedAt ? new Date(task.completedAt) : new Date(task.createdAt);
        if (completedDate && isWithinInterval(completedDate, { start: startDate, end: endDate })) {
          const count = taskCompletionCount.get(task.title) || 0;
          taskCompletionCount.set(task.title, count + 1);
        }
      }
    });
    
    // Find most completed task
    let mostCompletedTaskTitle: string | null = null;
    let maxCount = 0;
    
    taskCompletionCount.forEach((count, title) => {
      if (count > maxCount) {
        mostCompletedTaskTitle = title;
        maxCount = count;
      }
    });
    
    if (!mostCompletedTaskTitle || maxCount === 0) return null;
    
    return {
      taskName: mostCompletedTaskTitle,
      count: maxCount,
      hours: 0
    };
  }
})); 