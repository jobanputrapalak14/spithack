import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function InsightsScreen() {
  const { tasks } = useApp();

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Burnout calculation
  const upcomingTasks = tasks.filter((t) => {
    const deadline = new Date(t.deadline);
    const now = new Date();
    const daysUntil = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return !t.completed && daysUntil <= 7 && daysUntil >= 0;
  });

  const highPriorityCount = upcomingTasks.filter((t) => t.priority === 'high').length;
  const burnoutScore = Math.min(100, upcomingTasks.length * 10 + highPriorityCount * 15);

  const getBurnoutLevel = () => {
    if (burnoutScore < 30)
      return { level: 'Low', color: '#22c55e', bgColor: '#dcfce7' };
    if (burnoutScore < 60)
      return { level: 'Moderate', color: '#f97316', bgColor: '#fed7aa' };
    return { level: 'High', color: '#ef4444', bgColor: '#fee2e2' };
  };

  const burnoutLevel = getBurnoutLevel();

  // Mock habit streaks
  const habits = [
    { name: 'Morning Exercise', streak: 15, category: 'health' },
    { name: 'Daily Reading', streak: 8, category: 'learning' },
    { name: 'Meditation', streak: 22, category: 'wellness' },
  ];

  const categories = ['task', 'assignment', 'habit'];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Icon name="trending-up" size={32} color="#9333ea" />
          <View style={styles.headerText}>
            <Text style={styles.title}>Insights</Text>
            <Text style={styles.subtitle}>Track your productivity</Text>
          </View>
        </View>

        {/* Tasks Completed */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="target" size={24} color="#9333ea" />
            <Text style={styles.cardTitle}>Tasks Completed</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{completedTasks}</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Overall Completion Rate</Text>
              <Text style={styles.progressValue}>{completionRate.toFixed(0)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${completionRate}%` }]} />
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#9333ea' }]}>{totalTasks}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#22c55e' }]}>{completedTasks}</Text>
              <Text style={styles.statLabel}>Done</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#f97316' }]}>
                {totalTasks - completedTasks}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Burnout Risk */}
        <View style={[styles.card, { backgroundColor: burnoutLevel.bgColor }]}>
          <View style={styles.cardHeader}>
            <Icon name="alert-triangle" size={24} color={burnoutLevel.color} />
            <Text style={styles.cardTitle}>Burnout Risk</Text>
            <View style={[styles.badge, { backgroundColor: burnoutLevel.color }]}>
              <Text style={styles.badgeText}>{burnoutLevel.level}</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Risk Score</Text>
              <Text style={styles.progressValue}>{burnoutScore}/100</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${burnoutScore}%`, backgroundColor: burnoutLevel.color },
                ]}
              />
            </View>
          </View>

          <View style={styles.factorsSection}>
            <Text style={styles.factorsTitle}>Contributing Factors:</Text>
            <Text style={styles.factorText}>• {upcomingTasks.length} tasks due this week</Text>
            <Text style={styles.factorText}>• {highPriorityCount} high-priority items</Text>
            <Text style={styles.factorText}>
              • {tasks.filter((t) => !t.completed && t.priority === 'high').length} urgent
              deadlines
            </Text>
          </View>
        </View>

        {/* Habit Streaks */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="zap" size={24} color="#f97316" />
            <Text style={styles.cardTitle}>Habit Streaks</Text>
          </View>

          {habits.map((habit, index) => (
            <View key={index} style={styles.habitCard}>
              <View style={styles.habitHeader}>
                <Text style={styles.habitName}>{habit.name}</Text>
                <Icon name="zap" size={20} color="#f97316" />
              </View>
              <View style={styles.habitStreak}>
                <Text style={styles.streakNumber}>{habit.streak}</Text>
                <Text style={styles.streakLabel}>days</Text>
              </View>
              <View style={styles.habitCategory}>
                <Text style={styles.categoryLabel}>{habit.category}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Task Categories */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Task Categories</Text>

          {categories.map((category) => {
            const categoryTasks = tasks.filter((t) => t.category === category);
            const categoryCompleted = categoryTasks.filter((t) => t.completed).length;
            const categoryRate =
              categoryTasks.length > 0 ? (categoryCompleted / categoryTasks.length) * 100 : 0;

            return (
              <View key={category} style={styles.categoryCard}>
                <Text style={styles.categoryName}>{category}s</Text>
                <View style={styles.categoryProgress}>
                  <View style={styles.categoryStats}>
                    <Text style={styles.categoryStatsText}>Completed</Text>
                    <Text style={styles.categoryStatsValue}>
                      {categoryCompleted}/{categoryTasks.length}
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${categoryRate}%` }]} />
                  </View>
                  <Text style={styles.categoryRate}>{categoryRate.toFixed(0)}%</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eff6ff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  headerText: {
    marginLeft: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    flex: 1,
    color: '#1f2937',
  },
  badge: {
    backgroundColor: '#9333ea',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9333ea',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  factorsSection: {
    marginTop: 15,
  },
  factorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1f2937',
  },
  factorText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  habitCard: {
    backgroundColor: '#fff7ed',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    marginBottom: 10,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  habitStreak: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f97316',
  },
  streakLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  habitCategory: {
    alignSelf: 'flex-start',
  },
  categoryLabel: {
    fontSize: 12,
    color: '#6b7280',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1f2937',
  },
  categoryCard: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  categoryProgress: {
    gap: 8,
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryStatsText: {
    fontSize: 12,
    color: '#6b7280',
  },
  categoryStatsValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  categoryRate: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
});
