import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');
const TASK_ITEM_HEIGHT = 68;
const MAX_VISIBLE_ITEMS = 4;

export default function HomeScreen({ navigation }) {
  const { tasks, user, updateTask, theme, googleEmails, googleTokens, googleLoading } = useApp();
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const isDark = theme === 'dark';
  const colors = isDark
    ? {
      bg: ['#0f0a1e', '#1a1333', '#1a1333', '#251d3d'],
      card: 'rgba(37,29,61,0.9)',
      cardBorder: 'rgba(147,51,234,0.2)',
      text: '#f3e8ff',
      textSub: '#a78bca',
      textSecondary: '#c4b5fd',
      logoText: '#c4b5fd',
      sectionIcon: ['#2d2250', '#3d2e5c'],
      reminderIcon: ['#3d2e1c', '#4a3520'],
      taskItemBg: 'rgba(37,29,61,0.8)',
      taskItemBorder: 'rgba(147,51,234,0.15)',
      reminderItemBg: 'rgba(37,29,61,0.8)',
      reminderItemBorder: 'rgba(217,119,6,0.15)',
      progressBg: '#2d2250',
      emptyIcon: '#6b5b8a',
      modalBg: '#1a1333',
      modalText: '#f3e8ff',
      modalSubText: '#a78bca',
      suggestionBg: '#251d3d',
    }
    : {
      bg: ['#e8d5f5', '#f0e0f7', '#fce4ec', '#f8d7e8'],
      card: 'rgba(255,255,255,0.88)',
      cardBorder: 'rgba(147,51,234,0.08)',
      text: '#1f2937',
      textSub: '#7c6f8a',
      textSecondary: '#374151',
      logoText: '#4a1d8a',
      sectionIcon: ['#ede9fe', '#f3e8ff'],
      reminderIcon: ['#fef3c7', '#fde68a'],
      taskItemBg: 'rgba(255,255,255,0.75)',
      taskItemBorder: 'rgba(147,51,234,0.06)',
      reminderItemBg: 'rgba(255,255,255,0.75)',
      reminderItemBorder: 'rgba(217,119,6,0.08)',
      progressBg: '#e5e7eb',
      emptyIcon: '#c4b5d4',
      modalBg: '#fff',
      modalText: '#1f2937',
      modalSubText: '#6b7280',
      suggestionBg: '#f9fafb',
    };

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    cardAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 450,
        delay: 200 + i * 100,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const today = new Date();

  // All incomplete tasks
  const incompleteTasks = tasks.filter((t) => !t.completed);

  // Today's tasks (due today)
  const todayTasks = tasks.filter((t) => {
    const deadline = new Date(t.deadline);
    return (
      deadline.getDate() === today.getDate() &&
      deadline.getMonth() === today.getMonth() &&
      deadline.getFullYear() === today.getFullYear()
    );
  });

  // Upcoming tasks (within 7 days)
  const upcomingTasks = tasks.filter((t) => {
    const deadline = new Date(t.deadline);
    const daysUntil = (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return !t.completed && daysUntil >= 0 && daysUntil <= 7;
  });

  // Stats
  const completedCount = tasks.filter((t) => t.completed).length;
  const inProgressCount = incompleteTasks.length;
  const highPriorityCount = incompleteTasks.filter((t) => t.priority === 'high').length;

  // Focus Score (based on all tasks, not just today's)
  const totalTasks = tasks.length;
  const focusScore = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Burnout / AI
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
        id: 1, type: 'reschedule',
        title: 'Reschedule Low Priority Task',
        description: `Move "${task.title}" to next week to reduce current workload`,
        taskId: task.id, changes: { deadline: newDeadline },
      });
    }
    const highPriorityTasks = upcomingTasks.filter((t) => t.priority === 'high');
    if (highPriorityTasks.length >= 2) {
      newSuggestions.push({
        id: 2, type: 'prioritize',
        title: 'Focus on One High Priority Task',
        description: `You have ${highPriorityTasks.length} high-priority tasks. Focus on "${highPriorityTasks[0].title}" first`,
        taskId: highPriorityTasks[1].id, changes: { priority: 'medium' },
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
      case 'high': return '#ef4444';
      case 'medium': return '#f97316';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const animatedStyle = (index) => ({
    opacity: cardAnims[index],
    transform: [{ translateY: cardAnims[index].interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
  });

  const needsScheduleScroll = todayTasks.length > MAX_VISIBLE_ITEMS;
  const needsReminderScroll = upcomingTasks.length > 3;

  const totalEstMinutes = todayTasks.reduce((sum, t) => sum + (t.estimated_minutes || t.estimatedMinutes || 30), 0);
  const estHours = Math.floor(totalEstMinutes / 60);
  const estMins = totalEstMinutes % 60;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.bg}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

          {/* ─── Header ─── */}
          <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
            <View style={styles.headerLeft}>
              <View style={styles.logoRow}>
                <LinearGradient colors={colors.sectionIcon} style={styles.logoIcon}>
                  <Icon name="zap" size={18} color="#9333ea" />
                </LinearGradient>
                <Text style={[styles.logoText, { color: colors.logoText }]}>FocusFlow</Text>
              </View>
              <Text style={[styles.greeting, { color: colors.text }]}>
                Welcome back, {user?.name || 'there'}! 👋
              </Text>
              <Text style={[styles.date, { color: colors.textSub }]}>
                {today.toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })}
              </Text>
            </View>
            <TouchableOpacity style={styles.avatar} activeOpacity={0.8}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ─── Burnout Warning ─── */}
          {showBurnoutWarning && (
            <View style={[styles.warningCard, isDark && { backgroundColor: '#3b1a1a', borderColor: '#7f1d1d' }]}>
              <Icon name="alert-triangle" size={20} color="#dc2626" />
              <View style={styles.warningContent}>
                <Text style={[styles.warningTitle, isDark && { color: '#fca5a5' }]}>Workload Alert!</Text>
                <Text style={[styles.warningText, isDark && { color: '#fca5a5' }]}>
                  {upcomingTasks.length} tasks this week · {highPriorityCount} high priority
                </Text>
                <TouchableOpacity style={styles.aiButton} onPress={generateAISuggestions} activeOpacity={0.8}>
                  <Icon name="zap" size={13} color="#fff" />
                  <Text style={styles.aiButtonText}>Get AI Suggestions</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ─── Focus Score ─── */}
          <Animated.View style={[styles.focusCard, { backgroundColor: colors.card }, animatedStyle(0)]}>
            <Text style={[styles.focusCardTitle, { color: colors.textSecondary }]}>Today's Focus Score</Text>
            <View style={styles.focusScoreRow}>
              <Text style={styles.focusScore}>{focusScore}</Text>
              <Text style={[styles.focusScoreSub, { color: colors.textSub }]}>out of 100</Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.progressBg }]}>
              <LinearGradient
                colors={['#a855f7', '#7c3aed']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${Math.max(focusScore, 2)}%` }]}
              />
            </View>
            <Text style={[styles.focusTaskCount, { color: colors.textSub }]}>
              {completedCount} of {totalTasks} tasks completed
            </Text>
          </Animated.View>

          {/* ─── Today's Work ─── */}
          <Animated.View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }, animatedStyle(1)]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <LinearGradient colors={colors.sectionIcon} style={styles.sectionIcon}>
                  <Icon name="target" size={16} color="#9333ea" />
                </LinearGradient>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Work</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{todayTasks.length} tasks</Text>
              </View>
            </View>
            {todayTasks.length > 0 && (
              <View style={styles.estTimeRow}>
                <Icon name="clock" size={13} color={colors.textSub} />
                <Text style={[styles.estTimeText, { color: colors.textSub }]}>
                  Est. {estHours > 0 ? `${estHours}h ` : ''}{estMins}m total
                </Text>
              </View>
            )}

            {todayTasks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="check-circle" size={32} color={colors.emptyIcon} />
                <Text style={[styles.emptyText, { color: colors.textSub }]}>No tasks due today. You're all clear! 🎉</Text>
              </View>
            ) : (
              <View style={needsScheduleScroll ? { maxHeight: TASK_ITEM_HEIGHT * MAX_VISIBLE_ITEMS } : undefined}>
                <ScrollView
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={needsScheduleScroll}
                  scrollEnabled={needsScheduleScroll}
                >
                  {todayTasks.map((task) => (
                    <TouchableOpacity
                      key={task.id}
                      style={[styles.taskItem, { backgroundColor: colors.taskItemBg, borderColor: colors.taskItemBorder }]}
                      activeOpacity={0.7}
                      onPress={() => {
                        const taskDate = new Date(task.deadline);
                        navigation.navigate('Workspace', { date: taskDate.toISOString() });
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => updateTask(task.id, { completed: !task.completed })}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        activeOpacity={0.6}
                      >
                        <Icon
                          name={task.completed ? 'check-circle' : 'circle'}
                          size={22}
                          color={task.completed ? '#22c55e' : colors.emptyIcon}
                        />
                      </TouchableOpacity>
                      <View style={styles.taskContent}>
                        <Text
                          style={[styles.taskTitle, { color: colors.text }, task.completed && styles.taskTitleCompleted]}
                          numberOfLines={1}
                        >
                          {task.title}
                        </Text>
                        <View style={styles.taskMetaRow}>
                          <Icon name="clock" size={11} color={colors.textSub} />
                          <Text style={[styles.taskDate, { color: colors.textSub }]}>
                            {task.estimated_minutes || task.estimatedMinutes || 30} min
                          </Text>
                          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                            <Text style={styles.priorityText}>
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Icon name="chevron-right" size={16} color={colors.emptyIcon} style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {needsScheduleScroll && (
                  <View style={styles.scrollHint}>
                    <Icon name="chevrons-down" size={14} color="#9333ea" />
                    <Text style={styles.scrollHintText}>Scroll for more</Text>
                  </View>
                )}
              </View>
            )}
          </Animated.View>

          {/* ─── Reminders ─── */}
          <Animated.View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }, animatedStyle(2)]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <LinearGradient colors={colors.reminderIcon} style={styles.sectionIcon}>
                  <Icon name="bell" size={16} color="#d97706" />
                </LinearGradient>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Reminders</Text>
              </View>
            </View>

            {upcomingTasks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="bell-off" size={28} color={colors.emptyIcon} />
                <Text style={[styles.emptyText, { color: colors.textSub }]}>No upcoming reminders</Text>
              </View>
            ) : (
              <View style={needsReminderScroll ? { maxHeight: 52 * 3 } : undefined}>
                <ScrollView
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={needsReminderScroll}
                  scrollEnabled={needsReminderScroll}
                >
                  {upcomingTasks.map((task) => (
                    <TouchableOpacity
                      key={task.id}
                      style={[styles.reminderItem, { backgroundColor: colors.reminderItemBg, borderColor: colors.reminderItemBorder }]}
                      activeOpacity={0.7}
                      onPress={() => navigation.navigate('Workspace', { date: new Date(task.deadline).toISOString() })}
                    >
                      <Text style={[styles.reminderTitle, { color: colors.text }]} numberOfLines={1}>{task.title}</Text>
                      <Text style={[styles.reminderDate, { color: colors.textSub }]}>{formatDate(task.deadline)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {needsReminderScroll && (
                  <View style={styles.scrollHint}>
                    <Icon name="chevrons-down" size={14} color="#d97706" />
                    <Text style={[styles.scrollHintText, { color: '#d97706' }]}>Scroll for more</Text>
                  </View>
                )}
              </View>
            )}
          </Animated.View>

          {/* ─── Recent Emails (Google) ─── */}
          <Animated.View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }, animatedStyle(2)]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <LinearGradient colors={isDark ? ['#1a2744', '#1e3a5f'] : ['#e8f0fe', '#d2e3fc']} style={styles.sectionIcon}>
                  <Icon name="mail" size={16} color="#4285F4" />
                </LinearGradient>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Emails</Text>
              </View>
              {googleTokens && googleEmails.length > 0 && (
                <View style={[styles.badge, { backgroundColor: '#4285F4' }]}>
                  <Text style={styles.badgeText}>{googleEmails.filter(e => e.is_unread).length} new</Text>
                </View>
              )}
            </View>

            {!googleTokens ? (
              <View style={styles.emptyContainer}>
                <Icon name="link" size={28} color={colors.emptyIcon} />
                <Text style={[styles.emptyText, { color: colors.textSub }]}>
                  Connect Google in Settings to see your emails here
                </Text>
              </View>
            ) : googleLoading ? (
              <View style={styles.emptyContainer}>
                <Icon name="loader" size={24} color="#4285F4" />
                <Text style={[styles.emptyText, { color: colors.textSub }]}>Loading emails...</Text>
              </View>
            ) : googleEmails.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="inbox" size={28} color={colors.emptyIcon} />
                <Text style={[styles.emptyText, { color: colors.textSub }]}>No recent emails</Text>
              </View>
            ) : (
              <View>
                {googleEmails.slice(0, 5).map((email) => {
                  const senderName = email.sender.includes('<')
                    ? email.sender.split('<')[0].trim()
                    : email.sender;
                  return (
                    <View
                      key={email.id}
                      style={[styles.emailItem, {
                        backgroundColor: email.is_unread
                          ? (isDark ? 'rgba(66,133,244,0.1)' : 'rgba(66,133,244,0.06)')
                          : colors.taskItemBg,
                        borderColor: isDark ? 'rgba(66,133,244,0.15)' : 'rgba(66,133,244,0.08)',
                      }]}
                    >
                      <View style={[styles.emailDot, { backgroundColor: email.is_unread ? '#4285F4' : 'transparent' }]} />
                      <View style={styles.emailContent}>
                        <Text style={[styles.emailSender, { color: colors.text }]} numberOfLines={1}>
                          {senderName}
                        </Text>
                        <Text style={[styles.emailSubject, { color: colors.text }]} numberOfLines={1}>
                          {email.subject}
                        </Text>
                        <Text style={[styles.emailSnippet, { color: colors.textSub }]} numberOfLines={1}>
                          {email.snippet}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </Animated.View>

          {/* ─── Task Status ─── */}
          <Animated.View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }, animatedStyle(3)]}>
            <Text style={[styles.statusCardTitle, { color: colors.text }]}>Task Status</Text>
            {[
              { label: 'Completed', count: completedCount, color: '#22c55e' },
              { label: 'In Progress', count: inProgressCount, color: '#f97316' },
              { label: 'High Priority', count: highPriorityCount, color: '#ef4444' },
            ].map((item) => (
              <View key={item.label} style={styles.statusRow}>
                <View style={styles.statusLabelRow}>
                  <View style={[styles.statusDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.statusLabel, { color: colors.textSub }]}>{item.label}</Text>
                </View>
                <View style={[styles.statusCount, { backgroundColor: item.color }]}>
                  <Text style={styles.statusCountText}>{item.count}</Text>
                </View>
              </View>
            ))}
          </Animated.View>

          {/* ─── Open Project Space ─── */}
          <Animated.View style={animatedStyle(4)}>
            <TouchableOpacity
              style={[styles.projectSpaceCard, { backgroundColor: isDark ? 'rgba(147,51,234,0.12)' : 'rgba(147,51,234,0.08)', borderColor: isDark ? 'rgba(147,51,234,0.2)' : 'rgba(147,51,234,0.1)' }]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ProjectSpace')}
            >
              <View style={styles.projectSpaceDots}>
                <View style={[styles.psDot, { backgroundColor: '#22c55e' }]} />
                <View style={[styles.psDot, { backgroundColor: '#f97316' }]} />
                <View style={[styles.psDot, { backgroundColor: '#9333ea' }]} />
              </View>
              <Text style={[styles.projectSpaceText, { color: colors.text }]}>Open Project Space</Text>
              <Icon name="chevron-right" size={20} color={colors.textSub} />
            </TouchableOpacity>
          </Animated.View>


          <View style={{ height: 30 }} />
        </ScrollView>
      </LinearGradient>

      {/* ─── AI Suggestions Modal ─── */}
      <Modal
        visible={showAISuggestions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAISuggestions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
            <View style={styles.modalHeader}>
              <Icon name="zap" size={28} color="#9333ea" />
              <Text style={[styles.modalTitle, { color: colors.modalText }]}>AI-Powered Suggestions</Text>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.modalSubText }]}>
              Review and apply these suggestions to optimize your workflow
            </Text>
            <ScrollView style={styles.suggestionsScroll}>
              {suggestions.map((s) => (
                <View key={s.id} style={[styles.suggestionCard, { backgroundColor: colors.suggestionBg }]}>
                  <Text style={[styles.suggestionTitle, { color: colors.modalText }]}>{s.title}</Text>
                  <Text style={[styles.suggestionDescription, { color: colors.modalSubText }]}>{s.description}</Text>
                  <View style={styles.suggestionActions}>
                    <TouchableOpacity style={styles.acceptButton} onPress={() => handleAcceptSuggestion(s)}>
                      <Icon name="check" size={16} color="#fff" />
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.declineButton, isDark && { borderColor: '#3d2e5c' }]} onPress={() => setShowAISuggestions(false)}>
                      <Icon name="x" size={16} color={colors.modalSubText} />
                      <Text style={[styles.declineButtonText, { color: colors.modalSubText }]}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowAISuggestions(false)}>
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollView: { flex: 1 },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 22,
    paddingTop: 56,
    paddingBottom: 6,
  },
  headerLeft: { flex: 1, marginRight: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  logoIcon: {
    width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
  },
  logoText: {
    fontSize: 19, fontWeight: '800', marginLeft: 9,
    letterSpacing: 0.3,
  },
  greeting: { fontSize: 21, fontWeight: 'bold' },
  date: { fontSize: 13, marginTop: 3 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#9333ea',
    justifyContent: 'center', alignItems: 'center',
    marginTop: 6,
    shadowColor: '#9333ea', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 5, elevation: 4,
  },
  avatarText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },

  /* ── Warning ── */
  warningCard: {
    flexDirection: 'row', backgroundColor: '#fef2f2',
    marginHorizontal: 20, marginTop: 10, padding: 14,
    borderRadius: 14, borderWidth: 1, borderColor: '#fecaca',
  },
  warningContent: { flex: 1, marginLeft: 10 },
  warningTitle: { fontSize: 14, fontWeight: 'bold', color: '#991b1b', marginBottom: 2 },
  warningText: { fontSize: 12, color: '#7f1d1d', marginBottom: 8 },
  aiButton: {
    flexDirection: 'row', backgroundColor: '#9333ea',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    alignItems: 'center', alignSelf: 'flex-start',
  },
  aiButtonText: { color: '#fff', fontWeight: '600', fontSize: 12, marginLeft: 4 },

  /* ── Focus Score ── */
  focusCard: {
    marginHorizontal: 20, marginTop: 14, padding: 18,
    borderRadius: 18,
    shadowColor: '#9333ea', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  focusCardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  focusScoreRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 2 },
  focusScore: { fontSize: 46, fontWeight: '800', color: '#7c3aed' },
  focusScoreSub: { fontSize: 14, marginLeft: 8 },
  progressBarBg: {
    height: 7, borderRadius: 4,
    overflow: 'hidden', marginTop: 8, marginBottom: 8,
  },
  progressBarFill: { height: 7, borderRadius: 4 },
  focusTaskCount: { fontSize: 12 },

  /* ── Shared Section Card ── */
  sectionCard: {
    marginHorizontal: 20, marginTop: 14, padding: 16,
    borderRadius: 18, borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sectionIcon: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginLeft: 9 },
  badge: {
    backgroundColor: '#9333ea', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10,
  },
  badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },

  emptyContainer: { alignItems: 'center', paddingVertical: 20 },
  emptyText: { textAlign: 'center', paddingTop: 8, fontSize: 13 },

  /* ── Task Items ── */
  taskItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 12, marginBottom: 6,
    borderWidth: 1,
  },
  taskContent: { flex: 1, marginLeft: 10 },
  taskTitle: { fontSize: 14, fontWeight: '600' },
  taskTitleCompleted: { textDecorationLine: 'line-through', color: '#9ca3af' },
  taskDate: { fontSize: 11, marginTop: 1 },
  taskMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  estTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8, paddingLeft: 2 },
  estTimeText: { fontSize: 12, fontWeight: '500' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  priorityText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  scrollHint: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingTop: 6,
  },
  scrollHintText: { fontSize: 11, color: '#9333ea', marginLeft: 4, fontWeight: '500' },

  /* ── Reminders ── */
  reminderItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, marginBottom: 6,
    borderWidth: 1,
  },
  reminderTitle: { fontSize: 13, fontWeight: '500', flex: 1, marginRight: 10 },
  reminderDate: { fontSize: 12 },

  /* ── Task Status ── */
  statusCardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  statusRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  statusLabelRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusLabel: { fontSize: 14 },
  statusCount: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  statusCountText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  /* ── Quick Add ── */
  quickAddButton: {
    flexDirection: 'row', marginHorizontal: 20, marginTop: 16,
    padding: 16, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#9333ea', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  quickAddText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },

  /* ── Modal ── */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: 25, borderTopRightRadius: 25,
    padding: 25, maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginLeft: 10 },
  modalSubtitle: { fontSize: 14, marginBottom: 20 },
  suggestionsScroll: { maxHeight: 400 },
  suggestionCard: { padding: 15, borderRadius: 12, marginBottom: 15 },
  suggestionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  suggestionDescription: { fontSize: 14, marginBottom: 15 },
  suggestionActions: { flexDirection: 'row', gap: 10 },
  acceptButton: {
    flexDirection: 'row', backgroundColor: '#22c55e',
    paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
  },
  acceptButtonText: { color: '#fff', fontWeight: '600', marginLeft: 5 },
  declineButton: {
    flexDirection: 'row', borderWidth: 1, borderColor: '#d1d5db',
    paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
  },
  declineButtonText: { fontWeight: '600', marginLeft: 5 },
  closeButton: {
    backgroundColor: '#9333ea', padding: 15, borderRadius: 12,
    alignItems: 'center', marginTop: 10,
  },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  /* ── Email Items ── */
  emailItem: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 12, borderRadius: 12, marginBottom: 6,
    borderWidth: 1,
  },
  emailDot: {
    width: 8, height: 8, borderRadius: 4,
    marginTop: 6, marginRight: 10,
  },
  emailContent: { flex: 1 },
  emailSender: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  emailSubject: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  emailSnippet: { fontSize: 12 },

  /* ── Project Space Card ── */
  projectSpaceCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginTop: 14,
    padding: 16, borderRadius: 16, borderWidth: 1,
  },
  projectSpaceDots: {
    flexDirection: 'row', gap: 4, marginRight: 12,
  },
  psDot: {
    width: 10, height: 10, borderRadius: 5,
  },
  projectSpaceText: {
    flex: 1, fontSize: 16, fontWeight: '700',
  },
});
