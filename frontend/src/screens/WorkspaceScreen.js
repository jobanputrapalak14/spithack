import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function WorkspaceScreen({ route, navigation }) {
  const { date } = route.params;
  const { tasks, updateTask, deleteTask, notes, addNote } = useApp();
  const [noteContent, setNoteContent] = useState('');

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
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f97316';
      case 'low':
        return '#22c55e';
      default:
        return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Date Header */}
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>
            {workspaceDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Daily Progress</Text>
            <Text style={styles.progressText}>
              {completedTasks} / {dayTasks.length} completed
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        {/* Tasks */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitle}>
              <Icon name="check-square" size={24} color="#9333ea" />
              <Text style={styles.cardTitleText}>Tasks</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('SmartCapture')}>
              <Icon name="plus-circle" size={24} color="#9333ea" />
            </TouchableOpacity>
          </View>

          {dayTasks.length === 0 ? (
            <Text style={styles.emptyText}>No tasks for this day</Text>
          ) : (
            dayTasks.map((task) => (
              <View key={task.id} style={styles.taskItem}>
                <TouchableOpacity
                  onPress={() => updateTask(task.id, { completed: !task.completed })}
                >
                  <Icon
                    name={task.completed ? 'check-square' : 'square'}
                    size={24}
                    color={task.completed ? '#22c55e' : '#9ca3af'}
                  />
                </TouchableOpacity>

                <View style={styles.taskContent}>
                  <Text
                    style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}
                  >
                    {task.title}
                  </Text>
                  {task.description && (
                    <Text style={styles.taskDescription}>{task.description}</Text>
                  )}
                  <View style={styles.taskTags}>
                    <View
                      style={[
                        styles.priorityTag,
                        { backgroundColor: getPriorityColor(task.priority) },
                      ]}
                    >
                      <Text style={styles.tagText}>{task.priority}</Text>
                    </View>
                    <View style={styles.categoryTag}>
                      <Text style={styles.categoryText}>{task.category}</Text>
                    </View>
                  </View>
                </View>

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
                >
                  <Icon name="trash-2" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitle}>
              <Icon name="file-text" size={24} color="#9333ea" />
              <Text style={styles.cardTitleText}>Notes</Text>
            </View>
          </View>

          <TextInput
            style={styles.noteInput}
            placeholder="Add a note for this day..."
            value={noteContent}
            onChangeText={setNoteContent}
            multiline
            numberOfLines={4}
          />
          <TouchableOpacity style={styles.addNoteButton} onPress={handleAddNote}>
            <Text style={styles.addNoteButtonText}>Save Note</Text>
          </TouchableOpacity>

          {dayNotes.map((note) => (
            <View key={note.id} style={styles.noteCard}>
              <Text style={styles.noteText}>{note.content}</Text>
            </View>
          ))}
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
  dateHeader: {
    padding: 20,
    paddingTop: 10,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  progressCard: {
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#1f2937',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    paddingVertical: 30,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  taskContent: {
    flex: 1,
    marginLeft: 15,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 5,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  taskTags: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  categoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  categoryText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 15,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  addNoteButton: {
    backgroundColor: '#9333ea',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  addNoteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noteCard: {
    backgroundColor: '#fef3c7',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde047',
    marginBottom: 10,
  },
  noteText: {
    fontSize: 14,
    color: '#1f2937',
  },
});
