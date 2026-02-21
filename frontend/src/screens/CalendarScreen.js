import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';

export default function CalendarScreen({ navigation }) {
  const { tasks, theme, googleCalendarEvents, googleTokens, googleLoading } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());

  const isDark = theme === 'dark';
  const colors = isDark
    ? {
      bg: ['#0f0a1e', '#1a1333', '#1a1333', '#251d3d'],
      headerIcon: ['#2d2250', '#3d2e5c'],
      text: '#f3e8ff',
      textSub: '#a78bca',
      calendarCard: 'rgba(37,29,61,0.9)',
      monthText: '#f3e8ff',
      navBtnBorder: '#3d2e5c',
      navBtnIcon: '#a78bca',
      legendText: '#a78bca',
      dayName: '#6b5b8a',
      dayNumber: '#c4b5fd',
      todayBorder: '#9333ea',
      todayNumber: '#a855f7',
    }
    : {
      bg: ['#e8d5f5', '#f0e0f7', '#fce4ec', '#f8d7e8'],
      headerIcon: ['#f3e8ff', '#ede9fe'],
      text: '#1f2937',
      textSub: '#7c6f8a',
      calendarCard: 'rgba(255,255,255,0.88)',
      monthText: '#1f2937',
      navBtnBorder: '#e5e7eb',
      navBtnIcon: '#6b7280',
      legendText: '#6b7280',
      dayName: '#9ca3af',
      dayNumber: '#374151',
      todayBorder: '#9333ea',
      todayNumber: '#7c3aed',
    };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 450, useNativeDriver: true,
    }).start();
  }, []);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { daysInMonth: lastDay.getDate(), startingDayOfWeek: firstDay.getDay() };
  };

  const getTasksForDate = (date) =>
    tasks.filter((task) => {
      const td = new Date(task.deadline);
      return td.getDate() === date.getDate() && td.getMonth() === date.getMonth() && td.getFullYear() === date.getFullYear();
    });

  const getWorkloadLevel = (date) => {
    const dayTasks = getTasksForDate(date);
    const count = dayTasks.length;
    const high = dayTasks.filter((t) => t.priority === 'high').length;
    if (count === 0) return 'none';
    if (high >= 2 || count >= 4) return 'heavy';
    if (high >= 1 || count >= 2) return 'medium';
    return 'light';
  };

  const workloadColors = {
    none: 'transparent',
    heavy: '#ef4444',
    medium: '#f97316',
    light: '#22c55e',
  };

  const workloadBg = isDark
    ? { none: 'transparent', heavy: 'rgba(239,68,68,0.15)', medium: 'rgba(249,115,22,0.15)', light: 'rgba(34,197,94,0.15)' }
    : { none: 'transparent', heavy: '#fee2e2', medium: '#fff7ed', light: '#dcfce7' };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const previousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const now = new Date();
  const isToday = (day) =>
    day === now.getDate() && currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear();

  const renderDay = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayTasks = getTasksForDate(date);
    const level = getWorkloadLevel(date);
    const today = isToday(day);

    return (
      <TouchableOpacity
        key={day}
        style={[
          styles.dayCell,
          level !== 'none' && { backgroundColor: workloadBg[level] },
          today && [styles.todayCell, { borderColor: colors.todayBorder }],
        ]}
        activeOpacity={0.6}
        onPress={() => navigation.navigate('Workspace', { date: date.toISOString() })}
      >
        <Text style={[styles.dayNumber, { color: colors.dayNumber }, today && { color: colors.todayNumber, fontWeight: '800' }]}>{day}</Text>
        {dayTasks.length > 0 && (
          <View style={[styles.taskDot, { backgroundColor: workloadColors[level] }]}>
            <Text style={styles.taskDotText}>{dayTasks.length}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.bg}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>

            {/* ─── Header ─── */}
            <View style={styles.header}>
              <LinearGradient colors={colors.headerIcon} style={styles.headerIcon}>
                <Icon name="calendar" size={22} color="#9333ea" />
              </LinearGradient>
              <View style={styles.headerTextWrap}>
                <Text style={[styles.title, { color: colors.text }]}>Calendar</Text>
                <Text style={[styles.subtitle, { color: colors.textSub }]}>Visualize your workload</Text>
              </View>
            </View>

            {/* ─── Calendar Card ─── */}
            <View style={[styles.calendarCard, { backgroundColor: colors.calendarCard }]}>

              {/* Month Nav */}
              <View style={styles.monthHeader}>
                <Text style={[styles.monthText, { color: colors.monthText }]}>
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </Text>
                <View style={styles.navButtons}>
                  <TouchableOpacity style={[styles.navButton, { borderColor: colors.navBtnBorder }]} onPress={previousMonth} activeOpacity={0.7}>
                    <Icon name="chevron-left" size={18} color={colors.navBtnIcon} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.navButton, { borderColor: colors.navBtnBorder }]} onPress={nextMonth} activeOpacity={0.7}>
                    <Icon name="chevron-right" size={18} color={colors.navBtnIcon} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Legend */}
              <View style={styles.legend}>
                {[
                  { label: 'Heavy', color: '#ef4444' },
                  { label: 'Medium', color: '#f97316' },
                  { label: 'Light', color: '#22c55e' },
                ].map((item) => (
                  <View key={item.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={[styles.legendText, { color: colors.legendText }]}>{item.label}</Text>
                  </View>
                ))}
              </View>

              {/* Day Headers */}
              <View style={styles.dayNamesRow}>
                {dayNames.map((name) => (
                  <View key={name} style={styles.dayNameCell}>
                    <Text style={[styles.dayName, { color: colors.dayName }]}>{name}</Text>
                  </View>
                ))}
              </View>

              {/* Grid */}
              <View style={styles.calendarGrid}>
                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <View key={`e-${i}`} style={styles.dayCell} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => renderDay(i + 1))}
              </View>
            </View>

            {/* ─── Google Calendar Events ─── */}
            <View style={[styles.googleSection, { backgroundColor: colors.calendarCard }]}>
              <View style={styles.googleHeader}>
                <View style={styles.googleTitleRow}>
                  <View style={[styles.googleIconWrap, { backgroundColor: isDark ? '#1a2744' : '#e8f0fe' }]}>
                    <Text style={styles.googleIconText}>G</Text>
                  </View>
                  <Text style={[styles.googleTitle, { color: colors.monthText }]}>Google Calendar</Text>
                </View>
                {googleTokens && googleCalendarEvents.length > 0 && (
                  <View style={styles.googleBadge}>
                    <Text style={styles.googleBadgeText}>{googleCalendarEvents.length} events</Text>
                  </View>
                )}
              </View>

              {!googleTokens ? (
                <View style={styles.googleEmpty}>
                  <Icon name="link" size={24} color={isDark ? '#6b5b8a' : '#c4b5d4'} />
                  <Text style={[styles.googleEmptyText, { color: colors.legendText }]}>
                    Connect Google in Settings to see your calendar events here
                  </Text>
                </View>
              ) : googleLoading ? (
                <View style={styles.googleEmpty}>
                  <Icon name="loader" size={20} color="#4285F4" />
                  <Text style={[styles.googleEmptyText, { color: colors.legendText }]}>Loading events...</Text>
                </View>
              ) : googleCalendarEvents.length === 0 ? (
                <View style={styles.googleEmpty}>
                  <Icon name="check-circle" size={24} color="#22c55e" />
                  <Text style={[styles.googleEmptyText, { color: colors.legendText }]}>No upcoming events 🎉</Text>
                </View>
              ) : (
                <View>
                  {googleCalendarEvents.slice(0, 5).map((event) => {
                    const startDate = new Date(event.start);
                    const timeStr = event.is_all_day
                      ? 'All day'
                      : startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const dateStr = startDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
                    return (
                      <View key={event.id} style={[styles.googleEventItem, { borderBottomColor: isDark ? '#2d2250' : '#f3f0f8' }]}>
                        <View style={[styles.googleEventDot, { backgroundColor: '#4285F4' }]} />
                        <View style={styles.googleEventContent}>
                          <Text style={[styles.googleEventTitle, { color: colors.monthText }]} numberOfLines={1}>{event.title}</Text>
                          <Text style={[styles.googleEventTime, { color: colors.legendText }]}>
                            {dateStr} • {timeStr}
                            {event.location ? ` • ${event.location}` : ''}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                  {googleCalendarEvents.length > 5 && (
                    <Text style={[styles.googleMoreText, { color: '#4285F4' }]}>
                      +{googleCalendarEvents.length - 5} more events
                    </Text>
                  )}
                </View>
              )}
            </View>

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

  /* ── Calendar Card ── */
  calendarCard: {
    marginHorizontal: 20, marginTop: 14, padding: 20,
    borderRadius: 20,
    shadowColor: '#9333ea', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  monthHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  monthText: { fontSize: 20, fontWeight: '800' },
  navButtons: { flexDirection: 'row', gap: 8 },
  navButton: {
    width: 34, height: 34, borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
  },

  legend: { flexDirection: 'row', marginBottom: 18, gap: 18 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 5 },
  legendText: { fontSize: 12, fontWeight: '500' },

  dayNamesRow: { flexDirection: 'row', marginBottom: 6 },
  dayNameCell: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  dayName: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },

  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },

  dayCell: {
    width: '14.28%', aspectRatio: 1,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 10, marginBottom: 4,
  },
  todayCell: {
    borderWidth: 2,
  },
  dayNumber: { fontSize: 15, fontWeight: '600' },

  taskDot: {
    width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 1,
  },
  taskDotText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },

  /* ── Google Calendar Section ── */
  googleSection: {
    marginHorizontal: 20, marginTop: 14, padding: 20,
    borderRadius: 20,
    shadowColor: '#4285F4', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  googleHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  googleTitleRow: { flexDirection: 'row', alignItems: 'center' },
  googleIconWrap: {
    width: 30, height: 30, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 9,
  },
  googleIconText: { fontSize: 16, fontWeight: '800', color: '#4285F4' },
  googleTitle: { fontSize: 17, fontWeight: '700' },
  googleBadge: {
    backgroundColor: '#4285F4', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10,
  },
  googleBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
  googleEmpty: { alignItems: 'center', paddingVertical: 20 },
  googleEmptyText: { textAlign: 'center', paddingTop: 8, fontSize: 13, paddingHorizontal: 20 },
  googleEventItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1,
  },
  googleEventDot: {
    width: 8, height: 8, borderRadius: 4, marginRight: 12,
  },
  googleEventContent: { flex: 1 },
  googleEventTitle: { fontSize: 14, fontWeight: '600' },
  googleEventTime: { fontSize: 12, marginTop: 2 },
  googleMoreText: { fontSize: 12, fontWeight: '600', textAlign: 'center', paddingTop: 10 },
});
