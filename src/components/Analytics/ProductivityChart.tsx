import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card, Title, useMantineTheme, Text } from '@mantine/core';
import { format, parseISO } from 'date-fns';
import { DailyActivity } from '../../stores/analyticsStore';
import { memo } from 'react';

interface ProductivityChartProps {
  dailyActivities: DailyActivity[];
}

export const ProductivityChart = memo(function ProductivityChartComponent({ dailyActivities }: ProductivityChartProps) {
  const theme = useMantineTheme();
  
  // Check if data is empty
  if (!dailyActivities || dailyActivities.length === 0) {
    return (
      <Card withBorder shadow="sm" p="lg" radius="md">
        <Title order={3} mb="md">Productivity Trends</Title>
        <Text c="dimmed" ta="center" py="xl">
          No productivity data available yet. Complete tasks to see your trends.
        </Text>
      </Card>
    );
  }
  
  // Format the data for the chart
  const chartData = dailyActivities.map(day => ({
    date: day.date,
    displayDate: format(new Date(day.date), 'MMM dd'),
    tasks: day.taskCount || 0,
    completed: day.completedCount || 0,
    hours: day.hoursSpent || 0,
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return (
    <Card withBorder shadow="sm" p="lg" radius="md">
      <Title order={3} mb="md">Productivity Trends</Title>
      
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.colors.blue[6]} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={theme.colors.blue[6]} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.colors.green[6]} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={theme.colors.green[6]} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.colors.violet[6]} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={theme.colors.violet[6]} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="displayDate" 
            tick={{ fontSize: 12 }}
          />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
          <Tooltip 
            formatter={(value, name) => {
              if (name === 'Hours') return [Number(value).toFixed(1), name];
              return [value, name];
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          <Area 
            yAxisId="left"
            type="monotone" 
            dataKey="tasks" 
            name="Tasks" 
            stroke={theme.colors.blue[6]} 
            fillOpacity={1} 
            fill="url(#colorTasks)" 
          />
          <Area 
            yAxisId="left"
            type="monotone" 
            dataKey="completed" 
            name="Completed" 
            stroke={theme.colors.green[6]} 
            fillOpacity={1} 
            fill="url(#colorCompleted)" 
          />
          <Area 
            yAxisId="right"
            type="monotone" 
            dataKey="hours" 
            name="Hours" 
            stroke={theme.colors.violet[6]} 
            fillOpacity={1} 
            fill="url(#colorHours)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}); 