import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';

export default function WorkspaceScreen({ route, navigation }) {
  const { date } = route.params;
  const { tasks, updateTask, deleteTask, notes, addNote, theme } = useApp();
  const [noteContent, setNoteContent] = useState('');

  const isDark = theme === 'dark';
  const colors = isDark
    ? {
      bg: ['#0f0a1e', '#1a1333', '#1a1333', '#251d3d'],
      text: '#f3e8ff',
      textSub: '#a78bca',
      card: 'rgba(37,29,61,0.9)',
      cardBorder: 'rgba(147,51,234,0.2)',
      progressCard: 'rgba(37,29,61,0.9)',
      progressBg: '#2d2250',
      taskCard: 'rgba(37,29,61,0.8)',
      taskBorder: 'rgba(147,51,234,0.15)',
      sectionIcon: ['#2d2250', '#3d2e5c'],
      noteIcon: ['#3d2e1c', '#4a3520'],
      inputBg: 'rgba(37,29,61,0.8)',
      inputBorder: 'rgba(147,51,234,0.2)',
      inputText: '#f3e8ff',
      placeholder: '#6b5b8a',
      noteCard: 'rgba(55,40,30,0.6)',
      noteBorder: '#4a3520',
      categoryTag: { borderColor: '#3d2e5c', backgroundColor: 'rgba(37,29,61,0.9)' },
      categoryText: '#c4b5fd',
    }
    : {
      bg: ['#e8d5f5', '#f0e0f7', '#fce4ec', '#f8d7e8'],
      text: '#1f2937',
      textSub: '#7c6f8a',
      card: 'rgba(255,255,255,0.5)',
      cardBorder: 'rgba(147,51,234,0.08)',
      progressCard: 'rgba(255,255,255,0.88)',
      progressBg: '#e5e7eb',
      taskCard: 'rgba(255,255,255,0.8)',
      taskBorder: 'rgba(147,51,234,0.06)',
      sectionIcon: ['#f3e8ff', '#ede9fe'],
      noteIcon: ['#fef3c7', '#fde68a'],
      inputBg: 'rgba(255,255,255,0.75)',
      inputBorder: 'rgba(147,51,234,0.1)',
      inputText: '#1f2937',
      placeholder: '#a1a1aa',
      noteCard: '#fef9ee',
      noteBorder: '#fde68a',
      categoryTag: { borderColor: '#d1d5db', backgroundColor: 'rgba(255,255,255,0.9)' },
      categoryText: '#4b5563',
    };

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 400, useNativeDriver: true,
    }).start();
  }, []);

  const workspaceDate = date ? new Date(date) : new Date();
  const dayTasks = tasks.filter((task) => {
    const taskDate = new Date(task.deadline);
    return (
      taskDate.getDate() === workspaceDate.getDate() &&
      taskDate.getMonth() === workspaceDate.getMonth() &&
      taskDate.getFullYear() === workspaceDate.getFullYear()
    );
  });

  const dayNotes = notes.filter(
    (note) => note.date === workspaceDate.toISOString().split('T')[0]
  );

  const completedTasks = dayTasks.filter((t) => t.completed).length;
  const progress = dayTasks.length > 0 ? (completedTasks / dayTasks.length) * 100 : 0;

  const handleAddNote = () => {
    if (noteContent.trim()) {
      addNote({
        date: workspaceDate.toISOString().split('T')[0],
        content: noteContent,
      });
      setNoteContent('');
      Alert.alert('Success', 'Note added successfully!');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f97316';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.bg}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim }}>

            {/* ─── Date Header ─── */}
            <View style={styles.dateHeader}>
              <Text style={[styles.dateText, { color: colors.text }]}>
                {workspaceDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>

            {/* ─── Daily Progress ─── */}
            <View style={[styles.progressCard, { backgroundColor: colors.progressCard }]}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressTitle, { color: colors.text }]}>Daily Progress</Text>
                <Text style={[styles.progressText, { color: colors.textSub }]}>
                  {completedTasks} / {dayTasks.length} completed
                </Text>
              </View>
              <View style={[styles.progressBarBg, { backgroundColor: colors.progressBg }]}>
                <LinearGradient
                  colors={['#a855f7', '#7c3aed']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: `${Math.max(progress, 2)}%` }]}
                />
              </View>
            </View>

            {/* ─── Tasks ─── */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <LinearGradient colors={colors.sectionIcon} style={styles.sectionIcon}>
                    <Icon name="check-square" size={16} color="#9333ea" />
                  </LinearGradient>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Tasks</Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('SmartCapture')}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="plus-circle" size={24} color="#9333ea" />
                </TouchableOpacity>
              </View>

              {dayTasks.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Icon name="inbox" size={32} color={isDark ? '#6b5b8a' : '#c4b5d4'} />
                  <Text style={[styles.emptyText, { color: colors.textSub }]}>No tasks for this day</Text>
                </View>
              ) : (
                dayTasks.map((task) => (
                  <View key={task.id} style={[styles.taskCard, { backgroundColor: colors.taskCard, borderColor: colors.taskBorder }]}>
                    <View style={styles.taskTopRow}>
                      <TouchableOpacity
                        onPress={() => updateTask(task.id, { completed: !task.completed })}
                        activeOpacity={0.6}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Icon
                          name={task.completed ? 'check-square' : 'square'}
                          size={24}
                          color={task.completed ? '#22c55e' : isDark ? '#6b5b8a' : '#c4b5d4'}
                        />
                      </TouchableOpacity>

                      <Text
                        style={[
                          styles.taskTitle,
                          { color: colors.text },
                          task.completed && styles.taskTitleCompleted,
                        ]}
                        numberOfLines={2}
                      >
                        {task.title}
                      </Text>

                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert(
                            'Delete Task',
                            'Are you sure you want to delete this task?',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Delete', onPress: () => deleteTask(task.id), style: 'destructive' },
                            ]
                          );
                        }}
                        activeOpacity={0.6}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Icon name="trash-2" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.taskTags}>
                      <View style={[styles.priorityTag, { backgroundColor: getPriorityColor(task.priority) }]}>
                        <Text style={styles.tagText}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </Text>
                      </View>
                      <View style={[styles.categoryTag, colors.categoryTag]}>
                        <Text style={[styles.categoryText, { color: colors.categoryText }]}>
                          {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* ─── Notes ─── */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <LinearGradient colors={colors.noteIcon} style={styles.sectionIcon}>
                    <Icon name="file-text" size={16} color="#d97706" />
                  </LinearGradient>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
                </View>
              </View>

              <TextInput
                style={[styles.noteInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                placeholder="Add a note for this day..."
                placeholderTextColor={colors.placeholder}
                value={noteContent}
                onChangeText={setNoteContent}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity activeOpacity={0.85} onPress={handleAddNote}>
                <LinearGradient
                  colors={['#c084fc', '#9333ea', '#7c3aed']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveNoteButton}
                >
                  <Text style={styles.saveNoteButtonText}>Save Note</Text>
                </LinearGradient>
              </TouchableOpacity>

              {dayNotes.map((note) => (
                <View key={note.id} style={[styles.noteCard, { backgroundColor: colors.noteCard, borderColor: colors.noteBorder }]}>
                  <Icon name="bookmark" size={14} color="#d97706" style={{ marginRight: 8, marginTop: 2 }} />
                  <Text style={[styles.noteText, { color: colors.text }]}>{note.content}</Text>
                </View>
              ))}
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

  /* ── Date Header ── */
  dateHeader: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 6 },
  dateText: { fontSize: 18, fontWeight: 'bold' },

  /* ── Progress ── */
  progressCard: {
    marginHorizontal: 20, marginTop: 12, padding: 18,
    borderRadius: 16,
    shadowColor: '#9333ea', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  progressTitle: { fontSize: 16, fontWeight: '700' },
  progressText: { fontSize: 13 },
  progressBarBg: {
    height: 10, borderRadius: 5, overflow: 'hidden',
  },
  progressBarFill: { height: 10, borderRadius: 5 },

  /* ── Section Card ── */
  sectionCard: {
    marginHorizontal: 20, marginTop: 14, padding: 16,
    borderRadius: 18, borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sectionIcon: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginLeft: 9 },

  emptyContainer: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { textAlign: 'center', paddingTop: 8, fontSize: 14 },

  /* ── Task Cards ── */
  taskCard: {
    padding: 14, borderRadius: 14, marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  taskTopRow: {
    flexDirection: 'row', alignItems: 'flex-start',
  },
  taskTitle: {
    flex: 1, fontSize: 16, fontWeight: '600',
    marginHorizontal: 12, marginTop: 2,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through', color: '#9ca3af',
  },
  taskTags: {
    flexDirection: 'row', gap: 8, marginTop: 10, marginLeft: 36,
  },
  priorityTag: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8,
  },
  tagText: {
    color: '#fff', fontSize: 12, fontWeight: 'bold',
  },
  categoryTag: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1.5,
  },
  categoryText: {
    fontSize: 12, fontWeight: '600',
  },

  /* ── Notes ── */
  noteInput: {
    borderWidth: 1,
    borderRadius: 12, padding: 14, fontSize: 14,
    minHeight: 90, textAlignVertical: 'top',
    marginBottom: 12,
  },
  saveNoteButton: {
    padding: 14, borderRadius: 14, alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#9333ea', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  saveNoteButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  noteCard: {
    flexDirection: 'row',
    padding: 14, borderRadius: 10,
    borderWidth: 1, marginBottom: 8,
  },
  noteText: { flex: 1, fontSize: 14, lineHeight: 20 },
});
