import { useState, useEffect } from 'react';
import { Container, Title, Group, Select, SimpleGrid, Stack, Tabs, Text, Alert, Loader } from '@mantine/core';
import { format, startOfMonth, subMonths, endOfMonth } from 'date-fns';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import { ProductivityChart } from './ProductivityChart';
import { ActivityHeatMap } from './ActivityHeatMap';
import { AchievementCard } from './AchievementCard';
import { MetricCard } from './MetricCard';
import { TaskCompletionStats } from './TaskCompletionStats';
import { FocusScoreCard } from './FocusScoreCard';
import { IconAlertCircle } from '@tabler/icons-react';

type TimePeriod = 'week' | 'month' | 'year';

// Safe wrapper to call analytics functions
function safeCall<T>(fn: Function, fallback: T, ...args: any[]): T {
  try {
    const result = fn(...args);
    return result === undefined || result === null ? fallback : result;
  } catch (err) {
    console.error('Error in analytics function call:', err);
    return fallback;
  }
}

export function AnalyticsDashboard() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>('overview');
  const [isRecalculating, setIsRecalculating] = useState(false);
  
  // Initialize state for all data
  const [dailyActivities, setDailyActivities] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [mostTimeSpentTask, setMostTimeSpentTask] = useState(null);
  const [mostCompletedTask, setMostCompletedTask] = useState(null);
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  
  // Access store methods
  const analyticsStore = useAnalyticsStore();
  
  // One-time effect to handle tab change to trends
  // This will only run when activeTab changes, not when data changes
  useEffect(() => {
    if (activeTab === 'trends' && !isRecalculating) {
      console.log('Trends tab activated - recalculating analytics data');
      setIsRecalculating(true); // Set flag to prevent recurring calls
      
      // Use setTimeout to ensure UI is responsive
      setTimeout(() => {
        try {
          // First recalculate analytics in the store
          analyticsStore.calculateAnalytics();
          
          // Then refresh our component data
          const heatmap = safeCall(
            () => analyticsStore.getHeatmapData(timePeriod, currentMonth),
            [],
            timePeriod,
            currentMonth
          );
          setHeatmapData(heatmap);
          
          // Get updated activities data
          const activities = safeCall(
            () => analyticsStore.getDailyActivities(timePeriod, currentMonth),
            [],
            timePeriod, 
            currentMonth
          );
          setDailyActivities(activities);
          
          console.log('Analytics data refreshed for trends tab');
        } catch (err) {
          console.error('Error during analytics recalculation:', err);
        } finally {
          // Reset the flag after a slight delay to prevent immediate re-runs
          setTimeout(() => {
            setIsRecalculating(false);
          }, 500);
        }
      }, 100);
    }
  }, [activeTab, timePeriod, currentMonth]); // Add dependencies to ensure it updates when period changes

  // Load data whenever period or month changes
  useEffect(() => {
    // Skip loading if we're already recalculating from the tab change effect
    if (isRecalculating) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Wrap in a setTimeout to ensure UI updates before potentially heavy calculations
      setTimeout(() => {
        try {
          // Get data using safe wrapper
          const activities = safeCall(
            () => analyticsStore.getDailyActivities(timePeriod, currentMonth),
            [],
            timePeriod, 
            currentMonth
          );
          setDailyActivities(activities);
          
          // Get heatmap data with the right time period
          const heatmap = safeCall(
            () => analyticsStore.getHeatmapData(timePeriod, currentMonth),
            [],
            timePeriod,
            currentMonth
          );
          setHeatmapData(heatmap);
          
          const timeSpentTask = safeCall(
            () => analyticsStore.getMostTimeSpentTask(timePeriod, currentMonth),
            null,
            timePeriod,
            currentMonth
          );
          setMostTimeSpentTask(timeSpentTask);
          
          const completedTask = safeCall(
            () => analyticsStore.getMostCompletedTask(timePeriod, currentMonth),
            null,
            timePeriod,
            currentMonth
          );
          setMostCompletedTask(completedTask);
          
          // Calculate metrics
          const tasks = safeCall(
            () => activities.reduce((acc, day) => acc + (day.taskCount || 0), 0),
            0,
            activities
          );
          setTotalTasks(tasks);
          
          const completed = safeCall(
            () => activities.reduce((acc, day) => acc + (day.completedCount || 0), 0),
            0,
            activities
          );
          setCompletedTasks(completed);
          
          const hours = safeCall(
            () => activities.reduce((acc, day) => acc + (day.hoursSpent || 0), 0),
            0,
            activities
          );
          setTotalHours(hours);
          
          setIsLoading(false);
        } catch (err) {
          console.error('Error loading analytics data:', err);
          setError('Failed to load analytics data. Please try again later.');
          setIsLoading(false);
        }
      }, 0);
    } catch (err) {
      console.error('Error in analytics effect:', err);
      setError('Failed to load analytics data. Please try again later.');
      setIsLoading(false);
    }
  }, [timePeriod, currentMonth, analyticsStore, isRecalculating]);
  
  // Generate month options for the dropdown
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      label: format(date, 'MMMM yyyy'),
      value: format(date, 'yyyy-MM-dd'),
    };
  });

  // Handle tab changes
  const handleTabChange = (value: string | null) => {
    // Only update if the tab actually changed
    if (value !== activeTab) {
      setActiveTab(value);
    }
  };

  return (
    <Container size="xl" px="xs">
      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <Title order={2}>Productivity Analytics</Title>
          
          <Group>
            <Select
              label="Time Period"
              value={timePeriod}
              onChange={(value) => {
                if (value) setTimePeriod(value as TimePeriod);
              }}
              data={[
                { label: 'This Week', value: 'week' },
                { label: 'This Month', value: 'month' },
                { label: 'This Year', value: 'year' },
              ]}
              style={{ width: 150 }}
              disabled={isLoading}
            />
            
            {timePeriod === 'month' && (
              <Select
                label="Month"
                value={format(currentMonth, 'yyyy-MM-dd')}
                onChange={(value) => {
                  if (value) setCurrentMonth(new Date(value));
                }}
                data={monthOptions}
                style={{ width: 180 }}
                disabled={isLoading}
              />
            )}
          </Group>
        </Group>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '50px 0' }}>
            <Loader size="xl" />
          </div>
        ) : error ? (
          <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
            {error}
          </Alert>
        ) : (
          <>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <MetricCard
                title="Total Tasks"
                value={totalTasks.toString()}
                subtitle={`in ${timePeriod === 'week' ? 'this week' : timePeriod === 'month' ? 'this month' : 'this year'}`}
                icon="tasks"
              />
              <MetricCard
                title="Completed Tasks"
                value={completedTasks.toString()}
                subtitle={`${Math.round((completedTasks / (totalTasks || 1)) * 100)}% completion rate`}
                icon="check"
              />
              <MetricCard
                title="Hours Spent"
                value={totalHours.toFixed(1)}
                subtitle="on focused work"
                icon="clock"
              />
            </SimpleGrid>
            
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tabs.List>
                <Tabs.Tab value="overview">Overview</Tabs.Tab>
                <Tabs.Tab value="trends">Trends</Tabs.Tab>
                <Tabs.Tab value="achievements">Achievements</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="overview" pt="md">
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                  <TaskCompletionStats dailyActivities={dailyActivities} />
                  <FocusScoreCard dailyActivities={dailyActivities} />
                </SimpleGrid>
              </Tabs.Panel>

              <Tabs.Panel value="trends" pt="md">
                <Stack gap="md">
                  <Title order={3}>Productivity Trends</Title>
                  <ProductivityChart dailyActivities={dailyActivities} />
                  
                  <Title order={3} mt="md">Activity Overview</Title>
                  <ActivityHeatMap 
                    data={heatmapData} 
                    timePeriod={timePeriod}
                    currentMonth={currentMonth}
                  />
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="achievements" pt="md">
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                  {mostTimeSpentTask && (
                    <AchievementCard
                      title="Most Time Spent"
                      description={`You spent ${mostTimeSpentTask.hours.toFixed(1)} hours on "${mostTimeSpentTask.taskName}"`}
                      type="mostTimeSpent"
                    />
                  )}
                  
                  {mostCompletedTask && (
                    <AchievementCard
                      title="Most Completed Task"
                      description={`You completed "${mostCompletedTask.taskName}" ${mostCompletedTask.count} times`}
                      type="mostCompleted"
                    />
                  )}
                  
                  {!mostTimeSpentTask && !mostCompletedTask && (
                    <Text c="dimmed" ta="center" py="xl" w="100%">
                      Complete tasks and track time to earn achievements!
                    </Text>
                  )}
                </SimpleGrid>
              </Tabs.Panel>
            </Tabs>
          </>
        )}
      </Stack>
    </Container>
  );
} 