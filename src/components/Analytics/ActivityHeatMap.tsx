import { Card, Title, Group, Text, Box, Stack, useMantineTheme, Grid, Flex } from '@mantine/core';
import { subWeeks, eachDayOfInterval, format, parseISO, addDays, startOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, getDay, getMonth, isSameMonth } from 'date-fns';
import { HeatmapData } from '../../stores/analyticsStore';
import { memo } from 'react';

interface ActivityHeatMapProps {
  data: HeatmapData[];
  timePeriod: 'week' | 'month' | 'year';
  currentMonth?: Date;
}

// Wrap in memo to prevent unnecessary re-renders
export const ActivityHeatMap = memo(function ActivityHeatMapComponent({ data, timePeriod, currentMonth = new Date() }: ActivityHeatMapProps) {
  const theme = useMantineTheme();
  
  // Handle empty data case
  if (!data || data.length === 0) {
    return (
      <Card withBorder shadow="sm" p="lg" radius="md">
        <Title order={3}>Activity Contributions</Title>
        <Text c="dimmed" ta="center" py="xl">
          No activity data available yet. Complete tasks to see your contributions.
        </Text>
      </Card>
    );
  }

  // Generate date range based on selected time period
  const today = new Date();
  let startDate: Date;
  let endDate: Date;
  let numCols: number;
  
  switch(timePeriod) {
    case 'week':
      startDate = startOfWeek(today, { weekStartsOn: 1 }); // Start on Monday
      endDate = today;
      numCols = 7; // One week
      break;
    case 'month':
      startDate = startOfMonth(currentMonth);
      endDate = endOfMonth(currentMonth);
      // Calculate number of weeks in month for columns
      numCols = Math.ceil((endDate.getDate() - startDate.getDate() + 1) / 7) + 1;
      break;
    case 'year':
      startDate = startOfYear(today);
      endDate = today;
      numCols = 52; // Approximately one year in weeks
      break;
    default:
      // Fallback to default 12 weeks
      startDate = subWeeks(today, 12);
      endDate = today;
      numCols = 12;
  }
  
  // Get the first day of the week (Monday)
  const firstDayOfGrid = startOfWeek(startDate, { weekStartsOn: 1 });
  
  // Create a 7×numCols grid (7 days × numCols weeks/months)
  const dayGrid: { date: Date; count: number }[][] = [];
  
  // Initialize the grid with empty rows for each day of the week
  for (let i = 0; i < 7; i++) {
    dayGrid.push([]);
  }
  
  // Fill the grid with dates and activity counts
  for (let col = 0; col < numCols; col++) {
    for (let row = 0; row < 7; row++) {
      const currentDate = addDays(firstDayOfGrid, (col * 7) + row);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      
      // Find data for this date
      const activityData = data.find(d => {
        try {
          return format(parseISO(d.date), 'yyyy-MM-dd') === dateStr;
        } catch (err) {
          return false;
        }
      });
      
      // Add to the appropriate row (day of week)
      dayGrid[row].push({
        date: currentDate,
        count: activityData ? activityData.count : 0
      });
    }
  }
  
  // Function to get color based on contribution count
  const getColorForCount = (count: number): string => {
    if (count === 0) return theme.colors.gray[1];
    if (count <= 2) return theme.colors.green[2];
    if (count <= 5) return theme.colors.green[5];
    if (count <= 10) return theme.colors.green[7];
    return theme.colors.green[9];
  };

  // Prepare the day labels
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  
  // Generate month labels for year view
  const monthLabels = timePeriod === 'year' ? generateMonthLabels(dayGrid[0]) : null;
  
  return (
    <Card withBorder shadow="sm" p="lg" radius="md">
      <Stack>
        <Title order={3}>Activity Contributions</Title>
        
        {/* Month labels for year view */}
        {timePeriod === 'year' && monthLabels && (
          <Flex gap={2} ml={16}>
            {monthLabels.map((month, index) => (
              <Text key={index} size="xs" c="dimmed" style={{ 
                width: month.weeks * 16 + (month.weeks - 1) * 2, 
                textAlign: 'center',
                overflow: 'hidden'
              }}>
                {month.label}
              </Text>
            ))}
          </Flex>
        )}
        
        <Box>
          <Stack gap={2}>
            {/* Map through each day of the week */}
            {dayGrid.map((weekRow, dayIndex) => (
              <Flex key={dayIndex} gap={2} align="center">
                {/* Day label */}
                <Box w={16} style={{ textAlign: 'center' }}>
                  <Text size="xs" c="dimmed">{dayLabels[dayIndex]}</Text>
                </Box>
                
                {/* Map through each column */}
                {weekRow.map((day, colIndex) => (
                  <Box
                    key={`${dayIndex}-${colIndex}`}
                    w={16}
                    h={16}
                    style={{
                      backgroundColor: getColorForCount(day.count),
                      borderRadius: 2
                    }}
                    title={`${format(day.date, 'MMM d')}: ${day.count} contributions`}
                  />
                ))}
              </Flex>
            ))}
          </Stack>
        </Box>
        
        <Group gap="xs" justify="flex-end" mt="md">
          <Text size="xs" c="dimmed">Less</Text>
          {[0, 2, 5, 10].map(count => (
            <Box
              key={count}
              w={12}
              h={12}
              style={{
                backgroundColor: getColorForCount(count),
                borderRadius: 2
              }}
            />
          ))}
          <Text size="xs" c="dimmed">More</Text>
        </Group>
      </Stack>
    </Card>
  );
});

// Helper function to generate month labels for year view
function generateMonthLabels(firstRow: { date: Date; count: number }[]): { label: string; weeks: number }[] {
  const months: { label: string; weeks: number }[] = [];
  
  let currentMonth = -1;
  let monthStartIndex = 0;
  
  firstRow.forEach((day, index) => {
    const month = day.date.getMonth();
    
    if (month !== currentMonth) {
      // If this isn't the first month, push the previous month
      if (currentMonth !== -1) {
        months.push({
          label: format(firstRow[monthStartIndex].date, 'MMM'),
          weeks: index - monthStartIndex
        });
      }
      
      // Start tracking new month
      currentMonth = month;
      monthStartIndex = index;
    }
  });
  
  // Add the last month
  if (monthStartIndex < firstRow.length) {
    months.push({
      label: format(firstRow[monthStartIndex].date, 'MMM'),
      weeks: firstRow.length - monthStartIndex
    });
  }
  
  return months;
} 