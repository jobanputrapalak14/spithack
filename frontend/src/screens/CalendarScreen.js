import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function CalendarScreen({ navigation }) {
  const { tasks } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1)); // February 2026

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek };
  };

  const getTasksForDate = (date) => {
    return tasks.filter((task) => {
      const taskDate = new Date(task.deadline);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getWorkloadColor = (date) => {
    const dayTasks = getTasksForDate(date);
    const count = dayTasks.length;
    const highPriority = dayTasks.filter((t) => t.priority === 'high').length;

    if (count === 0) return '#f9fafb';
    if (highPriority >= 2 || count >= 4) return '#fee2e2'; // Heavy - Red
    if (highPriority >= 1 || count >= 2) return '#fed7aa'; // Medium - Orange
    return '#dcfce7'; // Light - Green
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderCalendarDay = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayTasks = getTasksForDate(date);
    const bgColor = getWorkloadColor(date);
    const isToday =
      date.getDate() === new Date().getDate() &&
      date.getMonth() === new Date().getMonth() &&
      date.getFullYear() === new Date().getFullYear();

    return (
      <TouchableOpacity
        key={day}
        style={[
          styles.dayCell,
          { backgroundColor: bgColor },
          isToday && styles.todayCell,
        ]}
        onPress={() => navigation.navigate('Workspace', { date: date.toISOString() })}
      >
        <Text style={[styles.dayNumber, isToday && styles.todayNumber]}>{day}</Text>
        {dayTasks.length > 0 && (
          <View style={styles.taskBadge}>
            <Text style={styles.taskCount}>{dayTasks.length}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Icon name="calendar" size={32} color="#9333ea" />
          <View style={styles.headerText}>
            <Text style={styles.title}>Calendar</Text>
            <Text style={styles.subtitle}>Visualize your workload</Text>
          </View>
        </View>

        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          {/* Month Navigation */}
          <View style={styles.monthHeader}>
            <Text style={styles.monthText}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            <View style={styles.navButtons}>
              <TouchableOpacity style={styles.navButton} onPress={previousMonth}>
                <Icon name="chevron-left" size={20} color="#6b7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButton} onPress={nextMonth}>
                <Icon name="chevron-right" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Legend */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.legendText}>Heavy</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f97316' }]} />
              <Text style={styles.legendText}>Medium</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
              <Text style={styles.legendText}>Light</Text>
            </View>
          </ScrollView>

          {/* Day Names */}
          <View style={styles.dayNamesRow}>
            {dayNames.map((name) => (
              <View key={name} style={styles.dayNameCell}>
                <Text style={styles.dayName}>{name}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {/* Empty cells before month starts */}
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <View key={`empty-${index}`} style={styles.dayCell} />
            ))}

            {/* Calendar days */}
            {Array.from({ length: daysInMonth }).map((_, index) =>
              renderCalendarDay(index + 1)
            )}
          </View>
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
  calendarCard: {
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
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  legend: {
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dayNameCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 5,
  },
  todayCell: {
    borderWidth: 2,
    borderColor: '#9333ea',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  todayNumber: {
    color: '#9333ea',
  },
  taskBadge: {
    backgroundColor: '#9333ea',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginTop: 2,
  },
  taskCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
