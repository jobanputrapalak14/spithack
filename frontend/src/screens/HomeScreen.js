import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';

export default function HomeScreen({ navigation }) {
  const { tasks, user, updateTask } = useApp();
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const today = new Date();
  const upcomingTasks = tasks.filter((t) => {
    const deadline = new Date(t.deadline);
    const daysUntil = (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return !t.completed && daysUntil >= 0 && daysUntil <= 7;
  });

  const highPriorityCount = upcomingTasks.filter((t) => t.priority === 'high').length;
  const workloadScore = upcomingTasks.length * 10 + highPriorityCount * 15;
  const showBurnoutWarning = workloadScore > 50;

  const generateAISuggestions = () => {
    const newSuggestions = [];

    const lowPriorityTasks = upcomingTasks.filter((t) => t.priority === 'low');
    if (lowPriorityTasks.length > 0) {
      const task = lowPriorityTasks[0];
      const newDeadline = new Date(task.deadline);
      newDeadline.setDate(newDeadline.getDate() + 7);
      newSuggestions.push({
        id: 1,
        type: 'reschedule',
        title: 'Reschedule Low Priority Task',
        description: `Move "${task.title}" to next week to reduce current workload`,
        taskId: task.id,
        changes: { deadline: newDeadline },
      });
    }

    const highPriorityTasks = upcomingTasks.filter((t) => t.priority === 'high');
    if (highPriorityTasks.length >= 2) {
      newSuggestions.push({
        id: 2,
        type: 'prioritize',
        title: 'Focus on One High Priority Task',
        description: `You have ${highPriorityTasks.length} high-priority tasks. Focus on "${highPriorityTasks[0].title}" first`,
        taskId: highPriorityTasks[1].id,
        changes: { priority: 'medium' },
      });
    }

    setSuggestions(newSuggestions);
    setShowAISuggestions(true);
  };

  const handleAcceptSuggestion = (suggestion) => {
    if (suggestion.taskId) {
      updateTask(suggestion.taskId, suggestion.changes);
      Alert.alert('Success', 'Task updated successfully!');
    }
    setShowAISuggestions(false);
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
      <LinearGradient colors={['#eff6ff', '#f3e8ff']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Welcome back, {user?.name || 'there'}! 👋</Text>
              <Text style={styles.date}>
                {today.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <TouchableOpacity style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
            </TouchableOpacity>
          </View>

          {/* Burnout Warning */}
          {showBurnoutWarning && (
            <View style={styles.warningCard}>
              <Icon name="alert-triangle" size={24} color="#dc2626" />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Workload Alert!</Text>
                <Text style={styles.warningText}>
                  You have {upcomingTasks.length} tasks coming up this week with {highPriorityCount} high-priority
                  items.
                </Text>
                <TouchableOpacity style={styles.aiButton} onPress={generateAISuggestions}>
                  <Icon name="zap" size={16} color="#fff" />
                  <Text style={styles.aiButtonText}>Get AI Suggestions</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Today's Tasks */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <Icon name="target" size={24} color="#9333ea" />
                <Text style={styles.cardTitleText}>Today's Tasks</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{upcomingTasks.length}</Text>
              </View>
            </View>

            {upcomingTasks.length === 0 ? (
              <Text style={styles.emptyText}>No tasks for today. You're all clear! 🎉</Text>
            ) : (
              upcomingTasks.slice(0, 5).map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={styles.taskItem}
                  onPress={() => {
                    const taskDate = new Date(task.deadline);
                    navigation.navigate('Workspace', { date: taskDate.toISOString() });
                  }}
                >
                  <TouchableOpacity
                    onPress={() => updateTask(task.id, { completed: !task.completed })}
                  >
                    <Icon
                      name={task.completed ? 'check-circle' : 'circle'}
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
                    <Text style={styles.taskDate}>
                      Due: {new Date(task.deadline).toLocaleDateString()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityColor(task.priority) },
                    ]}
                  >
                    <Text style={styles.priorityText}>{task.priority}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Quick Add Button */}
          <TouchableOpacity
            style={styles.quickAddButton}
            onPress={() => navigation.navigate('SmartCapture')}
          >
            <Icon name="plus" size={24} color="#fff" />
            <Text style={styles.quickAddText}>Quick Add Task</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>

      {/* AI Suggestions Modal */}
      <Modal
        visible={showAISuggestions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAISuggestions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Icon name="zap" size={28} color="#9333ea" />
              <Text style={styles.modalTitle}>AI-Powered Suggestions</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              Review and apply these suggestions to optimize your workflow
            </Text>

            <ScrollView style={styles.suggestionsScroll}>
              {suggestions.map((suggestion) => (
                <View key={suggestion.id} style={styles.suggestionCard}>
                  <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                  <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                  <View style={styles.suggestionActions}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAcceptSuggestion(suggestion)}
                    >
                      <Icon name="check" size={16} color="#fff" />
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.declineButton}
                      onPress={() => setShowAISuggestions(false)}
                    >
                      <Icon name="x" size={16} color="#6b7280" />
                      <Text style={styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAISuggestions(false)}
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 5,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#9333ea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#fee2e2',
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  warningContent: {
    flex: 1,
    marginLeft: 15,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 5,
  },
  warningText: {
    fontSize: 14,
    color: '#7f1d1d',
    marginBottom: 10,
  },
  aiButton: {
    flexDirection: 'row',
    backgroundColor: '#9333ea',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  aiButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 5,
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
  badge: {
    backgroundColor: '#9333ea',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    paddingVertical: 30,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  taskDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickAddButton: {
    flexDirection: 'row',
    backgroundColor: '#9333ea',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  quickAddText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#1f2937',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  suggestionsScroll: {
    maxHeight: 400,
  },
  suggestionCard: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1f2937',
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 15,
  },
  suggestionActions: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptButton: {
    flexDirection: 'row',
    backgroundColor: '#22c55e',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 5,
  },
  declineButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButtonText: {
    color: '#6b7280',
    fontWeight: '600',
    marginLeft: 5,
  },
  closeButton: {
    backgroundColor: '#9333ea',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
