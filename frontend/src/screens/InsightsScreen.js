import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated } from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';

export default function InsightsScreen() {
  const { tasks, theme } = useApp();

  const isDark = theme === 'dark';
  const colors = isDark
    ? {
      bg: ['#0f0a1e', '#1a1333', '#1a1333', '#251d3d'],
      headerIcon: ['#2d2250', '#3d2e5c'],
      sectionIcon: ['#2d2250', '#3d2e5c'],
      card: 'rgba(37,29,61,0.9)',
      cardBorder: 'rgba(147,51,234,0.2)',
      text: '#f3e8ff',
      textSub: '#a78bca',
      progressBg: '#2d2250',
      habitCard: 'rgba(37,29,61,0.8)',
      habitBorder: 'rgba(147,51,234,0.15)',
      categoryCard: 'rgba(37,29,61,0.8)',
      categoryBorder: 'rgba(147,51,234,0.15)',
      categoryTag: { borderColor: '#3d2e5c', backgroundColor: 'rgba(37,29,61,0.9)' },
      categoryText: '#c4b5fd',
    }
    : {
      bg: ['#e8d5f5', '#f0e0f7', '#fce4ec', '#f8d7e8'],
      headerIcon: ['#f3e8ff', '#ede9fe'],
      sectionIcon: ['#ede9fe', '#f3e8ff'],
      card: 'rgba(255,255,255,0.5)',
      cardBorder: 'rgba(147,51,234,0.08)',
      text: '#1f2937',
      textSub: '#7c6f8a',
      progressBg: '#e5e7eb',
      habitCard: 'rgba(255,255,255,0.75)',
      habitBorder: 'rgba(147,51,234,0.06)',
      categoryCard: 'rgba(255,255,255,0.75)',
      categoryBorder: 'rgba(147,51,234,0.06)',
      categoryTag: { borderColor: '#d1d5db', backgroundColor: 'rgba(255,255,255,0.9)' },
      categoryText: '#4b5563',
    };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef([
    new Animated.Value(0), new Animated.Value(0),
    new Animated.Value(0), new Animated.Value(0),
  ]).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    cardAnims.forEach((a, i) =>
      Animated.timing(a, { toValue: 1, duration: 400, delay: 150 + i * 100, useNativeDriver: true }).start()
    );
  }, []);

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Burnout
  const now = new Date();
  const upcomingTasks = tasks.filter((t) => {
    const deadline = new Date(t.deadline);
    const daysUntil = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return !t.completed && daysUntil <= 7 && daysUntil >= 0;
  });
  const highPriorityCount = upcomingTasks.filter((t) => t.priority === 'high').length;
  const urgentCount = tasks.filter((t) => !t.completed && t.priority === 'high').length;
  const burnoutScore = Math.min(80, upcomingTasks.length * 10 + highPriorityCount * 15);

  const getBurnoutLevel = () => {
    if (burnoutScore < 30) return { level: 'Low', color: '#22c55e' };
    if (burnoutScore < 60) return { level: 'Moderate', color: '#f97316' };
    return { level: 'High', color: '#ef4444' };
  };
  const burnout = getBurnoutLevel();

  // Habits (dynamic — group daily habit tasks by title)
  const habitTasks = tasks.filter((t) => t.category === 'habit');
  const habitGroups = {};
  habitTasks.forEach((h) => {
    const key = h.title;
    if (!habitGroups[key]) habitGroups[key] = [];
    habitGroups[key].push(h);
  });

  const habits = Object.entries(habitGroups).map(([title, group]) => {
    // Sort by deadline date ascending
    const sorted = [...group].sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );
    // Streak = consecutive completed days from day 1
    let streak = 0;
    for (const t of sorted) {
      if (t.completed) streak++;
      else break;
    }
    const totalDays = sorted.length;
    const completedDays = sorted.filter((t) => t.completed).length;
    const progress = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;
    return {
      id: sorted[0].id,
      name: title,
      streak,
      goalDays: totalDays,
      completedDays,
      progress,
      allDone: completedDays === totalDays,
    };
  });

  // Categories
  const categories = ['task', 'assignment', 'habit'];

  const animStyle = (i) => ({
    opacity: cardAnims[i],
    transform: [{ translateY: cardAnims[i].interpolate({ inputRange: [0, 1], outputRange: [25, 0] }) }],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.bg}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim }}>

            {/* ─── Header ─── */}
            <View style={styles.header}>
              <LinearGradient colors={colors.headerIcon} style={styles.headerIcon}>
                <Icon name="trending-up" size={22} color="#9333ea" />
              </LinearGradient>
              <View style={styles.headerTextWrap}>
                <Text style={[styles.title, { color: colors.text }]}>Insights</Text>
                <Text style={[styles.subtitle, { color: colors.textSub }]}>Track your productivity</Text>
              </View>
            </View>

            {/* ─── Tasks Completed ─── */}
            <Animated.View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }, animStyle(0)]}>
              <View style={styles.cardHeader}>
                <LinearGradient colors={colors.sectionIcon} style={styles.smallIcon}>
                  <Icon name="target" size={15} color="#9333ea" />
                </LinearGradient>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Tasks Completed</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{completedTasks}</Text>
                </View>
              </View>

              <View style={styles.progressRow}>
                <Text style={[styles.progressLabel, { color: colors.textSub }]}>Overall Completion Rate</Text>
                <Text style={[styles.progressValue, { color: colors.text }]}>{completionRate.toFixed(0)}%</Text>
              </View>
              <View style={[styles.progressBarBg, { backgroundColor: colors.progressBg }]}>
                <LinearGradient
                  colors={['#a855f7', '#7c3aed']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: `${Math.max(completionRate, 2)}%` }]}
                />
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#22c55e' }]}>{totalTasks}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSub }]}>Total</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#7c3aed' }]}>{completedTasks}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSub }]}>Done</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#f97316' }]}>{pendingTasks}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSub }]}>Pending</Text>
                </View>
              </View>
            </Animated.View>

            {/* ─── Burnout Risk ─── */}
            <Animated.View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }, animStyle(1)]}>
              <View style={styles.cardHeader}>
                <Icon name="alert-triangle" size={20} color={burnout.color} />
                <Text style={[styles.cardTitle, { marginLeft: 8, color: colors.text }]}>Burnout Risk</Text>
                <View style={[styles.badge, { backgroundColor: burnout.color }]}>
                  <Text style={styles.badgeText}>{burnout.level}</Text>
                </View>
              </View>

              <View style={styles.progressRow}>
                <Text style={[styles.progressLabel, { color: colors.textSub }]}>Risk Score</Text>
                <Text style={[styles.progressValue, { color: colors.text }]}>{burnoutScore}/100</Text>
              </View>

              <View style={styles.factorsSection}>
                <Text style={[styles.factorsTitle, { color: colors.text }]}>Contributing Factors:</Text>
                <Text style={[styles.factorText, { color: colors.textSub }]}>• {upcomingTasks.length} tasks due this week</Text>
                <Text style={[styles.factorText, { color: colors.textSub }]}>• {highPriorityCount} high-priority items</Text>
                <Text style={[styles.factorText, { color: colors.textSub }]}>• {urgentCount} urgent deadlines</Text>
              </View>
            </Animated.View>

            {/* ─── Habit Streaks ─── */}
            <Animated.View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }, animStyle(2)]}>
              <View style={styles.cardHeader}>
                <Icon name="zap" size={20} color="#f97316" />
                <Text style={[styles.cardTitle, { marginLeft: 8, color: colors.text }]}>Habit Streaks</Text>
                {habits.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{habits.length}</Text>
                  </View>
                )}
              </View>

              {habits.length === 0 ? (
                <View style={styles.emptyHabits}>
                  <Icon name="repeat" size={28} color={isDark ? '#6b5b8a' : '#c4b5d4'} />
                  <Text style={[styles.emptyHabitText, { color: colors.textSub }]}>
                    No habits yet. Add a task with category "habit" to start tracking!
                  </Text>
                </View>
              ) : (
                habits.map((habit) => (
                  <View key={habit.id} style={[styles.habitCard, { backgroundColor: colors.habitCard, borderColor: colors.habitBorder }]}>
                    <View style={styles.habitTopRow}>
                      <Text style={[styles.habitName, { color: colors.text }]} numberOfLines={1}>{habit.name}</Text>
                      {habit.allDone ? (
                        <View style={styles.habitDoneBadge}>
                          <Icon name="check" size={12} color="#fff" />
                          <Text style={styles.habitDoneText}>Done!</Text>
                        </View>
                      ) : (
                        <Icon name="zap" size={18} color="#f97316" />
                      )}
                    </View>
                    <View style={styles.habitStreakRow}>
                      <Text style={styles.streakNumber}>{habit.streak}</Text>
                      <Text style={[styles.streakDays, { color: colors.textSub }]}>day streak · {habit.completedDays}/{habit.goalDays} done</Text>
                    </View>
                    <View style={[styles.progressBarBg, { backgroundColor: colors.progressBg, marginTop: 4 }]}>
                      <LinearGradient
                        colors={habit.allDone ? ['#22c55e', '#16a34a'] : ['#f97316', '#ea580c']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={[styles.progressBarFill, { width: `${Math.max(habit.progress, 2)}%` }]}
                      />
                    </View>
                    <Text style={[styles.habitProgressText, { color: colors.textSub }]}>
                      {habit.allDone ? '🎉 21-day habit goal complete!' : `${Math.round(habit.progress)}% to goal`}
                    </Text>
                  </View>
                ))
              )}
            </Animated.View>

            {/* ─── Task Categories ─── */}
            <Animated.View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }, animStyle(3)]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Task Categories</Text>

              {categories.map((cat) => {
                const catTasks = tasks.filter((t) => t.category === cat);
                const catDone = catTasks.filter((t) => t.completed).length;
                const catRate = catTasks.length > 0 ? (catDone / catTasks.length) * 100 : 0;

                return (
                  <View key={cat} style={[styles.categoryCard, { backgroundColor: colors.categoryCard, borderColor: colors.categoryBorder }]}>
                    <Text style={[styles.categoryName, { color: colors.text }]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}s
                    </Text>
                    <View style={styles.categoryStatsRow}>
                      <Text style={[styles.categoryStatsLabel, { color: colors.textSub }]}>Completed</Text>
                      <Text style={[styles.categoryStatsValue, { color: colors.text }]}>{catDone}/{catTasks.length}</Text>
                    </View>
                    <View style={[styles.progressBarBg, { backgroundColor: colors.progressBg }]}>
                      <LinearGradient
                        colors={['#a855f7', '#7c3aed']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={[styles.progressBarFill, { width: `${Math.max(catRate, 2)}%` }]}
                      />
                    </View>
                    <Text style={[styles.categoryRate, { color: colors.textSub }]}>{catRate.toFixed(0)}%</Text>
                  </View>
                );
              })}
            </Animated.View>

            <View style={{ height: 30 }} />
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollView: { flex: 1 },

  /* ── Header ── */
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 22, paddingTop: 56, paddingBottom: 10,
  },
  headerIcon: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTextWrap: { marginLeft: 14 },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },

  /* ── Section Card ── */
  sectionCard: {
    marginHorizontal: 20, marginTop: 14, padding: 18,
    borderRadius: 18, borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 14,
  },
  smallIcon: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', flex: 1 },
  badge: {
    backgroundColor: '#9333ea', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
  },
  badgeText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },

  /* ── Progress ── */
  progressRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  progressLabel: { fontSize: 13 },
  progressValue: { fontSize: 14, fontWeight: '700' },
  progressBarBg: {
    height: 9, borderRadius: 5, overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: { height: 9, borderRadius: 5 },

  /* ── Stats ── */
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12,
  },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 2 },

  /* ── Burnout ── */
  factorsSection: { marginTop: 10 },
  factorsTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  factorText: { fontSize: 13, marginBottom: 3, lineHeight: 20 },

  /* ── Habits ── */
  habitCard: {
    padding: 14, borderRadius: 14, marginBottom: 10,
    borderWidth: 1,
  },
  habitTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  habitName: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  habitStreakRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  streakNumber: { fontSize: 32, fontWeight: '800', color: '#f97316' },
  streakDays: { fontSize: 14, marginLeft: 6 },
  habitProgressText: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  habitDoneBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#22c55e', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  habitDoneText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emptyHabits: { alignItems: 'center', paddingVertical: 20 },
  emptyHabitText: { textAlign: 'center', marginTop: 8, fontSize: 13, lineHeight: 19 },

  /* ── Categories ── */
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 14 },
  categoryCard: {
    padding: 14, borderRadius: 14, marginBottom: 10,
    borderWidth: 1,
  },
  categoryName: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  categoryStatsRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6,
  },
  categoryStatsLabel: { fontSize: 13 },
  categoryStatsValue: { fontSize: 13, fontWeight: '700' },
  categoryRate: { fontSize: 12, textAlign: 'right', marginTop: 2 },
});

