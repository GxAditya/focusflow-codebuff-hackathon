import { Card, Title, Text, RingProgress, Group, Stack } from '@mantine/core';
import { DailyActivity } from '../../stores/analyticsStore';

interface FocusScoreCardProps {
  dailyActivities: DailyActivity[];
}

export function FocusScoreCard({ dailyActivities }: FocusScoreCardProps) {
  // Handle empty data case gracefully
  if (!dailyActivities || dailyActivities.length === 0) {
    return (
      <Card withBorder shadow="sm" p="lg" radius="md" h="100%">
        <Stack align="center" gap="md">
          <Title order={3}>Focus Score</Title>
          
          <RingProgress
            size={180}
            thickness={16}
            roundCaps
            label={
              <Text ta="center" fw={700} fz="xl">
                0
              </Text>
            }
            sections={[
              { value: 0, color: 'gray' },
            ]}
          />
          
          <Text ta="center" fz="sm" c="dimmed">
            Start tracking your productivity to see your focus score
          </Text>
        </Stack>
      </Card>
    );
  }
  
  // Calculate focus score based on task completion, consistency, and time spent
  const calculateFocusScore = (): { score: number; message: string } => {
    try {
      // Completion rate component (30% of score)
      const totalTasks = dailyActivities.reduce((acc, day) => acc + (day.taskCount || 0), 0);
      const completedTasks = dailyActivities.reduce((acc, day) => acc + (day.completedCount || 0), 0);
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) : 0;
      const completionScore = Math.min(completionRate * 30, 30);

      // Consistency component (40% of score)
      const daysActive = dailyActivities.length;
      // Calculate over last 30 days
      const consistencyScore = Math.min((daysActive / 30) * 40, 40);

      // Productivity component (30% of score)
      const avgHoursPerDay = dailyActivities.reduce((acc, day) => acc + (day.hoursSpent || 0), 0) / daysActive;
      // Optimal is considered 4-6 hours of focused work
      const productivityScore = avgHoursPerDay >= 4 && avgHoursPerDay <= 6 
        ? 30 
        : avgHoursPerDay > 0 && avgHoursPerDay < 4
          ? (avgHoursPerDay / 4) * 30
          : avgHoursPerDay > 6
            ? Math.max(30 - ((avgHoursPerDay - 6) * 5), 0)
            : 0;

      const totalScore = Math.round(completionScore + consistencyScore + productivityScore);

      // Generate feedback message
      let message = "";
      if (totalScore >= 85) {
        message = "Exceptional focus! You're in the productivity zone.";
      } else if (totalScore >= 70) {
        message = "Great focus habits forming. Keep it up!";
      } else if (totalScore >= 50) {
        message = "Good progress. Try to improve consistency.";
      } else {
        message = "Building focus takes time. Set small, achievable goals.";
      }

      return { score: totalScore, message };
    } catch (err) {
      console.error('Error calculating focus score:', err);
      return { score: 0, message: "Unable to calculate focus score. Please try again later." };
    }
  };

  const { score, message } = calculateFocusScore();

  // Determine color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'green';
    if (score >= 70) return 'teal';
    if (score >= 50) return 'yellow';
    return 'red';
  };

  return (
    <Card withBorder shadow="sm" p="lg" radius="md" h="100%">
      <Stack align="center" gap="md">
        <Title order={3}>Focus Score</Title>
        
        <RingProgress
          size={180}
          thickness={16}
          roundCaps
          label={
            <Text ta="center" fw={700} fz="xl">
              {score}
            </Text>
          }
          sections={[
            { value: score, color: getScoreColor(score) },
          ]}
        />
        
        <Text ta="center" fz="sm" c="dimmed">
          {message}
        </Text>
      </Stack>
    </Card>
  );
} 