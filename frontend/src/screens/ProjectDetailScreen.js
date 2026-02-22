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
    Modal,
    Dimensions,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function ProjectDetailScreen({ route, navigation }) {
    const { projectId } = route.params;
    const { tasks, updateTask, deleteTask, projects, addTask, theme } = useApp();

    const [showAddModal, setShowAddModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newPriority, setNewPriority] = useState('medium');

    const isDark = theme === 'dark';
    const colors = isDark
        ? {
            bg: ['#0f0a1e', '#1a1333', '#1a1333', '#251d3d'],
            card: 'rgba(37,29,61,0.92)',
            cardBorder: 'rgba(147,51,234,0.18)',
            text: '#f3e8ff',
            textSub: '#a78bca',
            inputBg: 'rgba(37,29,61,0.8)',
            inputBorder: 'rgba(147,51,234,0.25)',
            modalBg: '#1a1333',
            progressBg: '#2d2250',
        }
        : {
            bg: ['#e8d5f5', '#f0e0f7', '#fce4ec', '#f8d7e8'],
            card: 'rgba(255,255,255,0.92)',
            cardBorder: 'rgba(147,51,234,0.08)',
            text: '#1f2937',
            textSub: '#7c6f8a',
            inputBg: 'rgba(255,255,255,0.8)',
            inputBorder: 'rgba(147,51,234,0.12)',
            modalBg: '#fff',
            progressBg: '#e5e7eb',
        };

    const project = projects.find((p) => p.id === projectId);
    const projectTasks = tasks.filter((t) => t.projectId === projectId);
    const doneCount = projectTasks.filter((t) => t.completed).length;
    const progress = projectTasks.length > 0 ? (doneCount / projectTasks.length) * 100 : 0;

    // Animation
    const fadeAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1, duration: 400, useNativeDriver: true,
        }).start();
    }, []);

    if (!project) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#999', fontSize: 16 }}>Project not found</Text>
            </View>
        );
    }

    const handleAddTask = () => {
        if (!newTitle.trim()) return;
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 7); // default 7 days from now
        addTask({
            title: newTitle.trim(),
            priority: newPriority,
            category: 'task',
            deadline: deadline.toISOString(),
            projectId: projectId,
        });
        setNewTitle('');
        setNewPriority('medium');
        setShowAddModal(false);
    };

    const handleDeleteTask = (id, title) => {
        Alert.alert('Delete Task', `Delete "${title}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteTask(id) },
        ]);
    };

    const getPriorityColor = (p) => {
        return p === 'high' ? '#ef4444' : p === 'medium' ? '#f97316' : '#22c55e';
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={colors.bg} locations={[0, 0.3, 0.7, 1]} style={styles.gradient}>
                <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

                        {/* ── Project Header ── */}
                        <View style={styles.header}>
                            <View style={[styles.headerStripe, { backgroundColor: project.color }]} />
                            <View style={styles.headerContent}>
                                <Text style={[styles.headerTitle, { color: colors.text }]}>{project.name}</Text>
                                <Text style={[styles.headerSub, { color: colors.textSub }]}>
                                    {projectTasks.length} tasks · {doneCount} completed
                                </Text>
                            </View>
                        </View>

                        {/* ── Progress ── */}
                        <View style={[styles.progressCard, { backgroundColor: colors.card }]}>
                            <View style={styles.progressRow}>
                                <Text style={[styles.progressLabel, { color: colors.text }]}>Progress</Text>
                                <Text style={[styles.progressPercent, { color: colors.textSub }]}>
                                    {Math.round(progress)}%
                                </Text>
                            </View>
                            <View style={[styles.progressBarBg, { backgroundColor: colors.progressBg }]}>
                                <LinearGradient
                                    colors={[project.color, '#7c3aed']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.progressBarFill, { width: `${Math.max(progress, 2)}%` }]}
                                />
                            </View>
                        </View>

                        {/* ── Task List ── */}
                        <View style={styles.taskSection}>
                            <View style={styles.taskSectionHeader}>
                                <Text style={[styles.taskSectionTitle, { color: colors.text }]}>Tasks</Text>
                                <TouchableOpacity
                                    onPress={() => setShowAddModal(true)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Icon name="plus-circle" size={24} color="#9333ea" />
                                </TouchableOpacity>
                            </View>

                            {projectTasks.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Icon name="clipboard" size={36} color={isDark ? '#6b5b8a' : '#c4b5d4'} />
                                    <Text style={[styles.emptyText, { color: colors.textSub }]}>
                                        No tasks in this project yet.{'\n'}Tap + to add one!
                                    </Text>
                                </View>
                            ) : (
                                projectTasks.map((task) => (
                                    <View
                                        key={task.id}
                                        style={[styles.taskCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                                    >
                                        <View style={styles.taskTopRow}>
                                            <TouchableOpacity
                                                onPress={() => updateTask(task.id, { completed: !task.completed })}
                                                activeOpacity={0.6}
                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                            >
                                                <Icon
                                                    name={task.completed ? 'check-square' : 'square'}
                                                    size={22}
                                                    color={task.completed ? '#22c55e' : isDark ? '#6b5b8a' : '#c4b5d4'}
                                                />
                                            </TouchableOpacity>
                                            <Text
                                                style={[styles.taskTitle, { color: colors.text }, task.completed && styles.taskDone]}
                                                numberOfLines={2}
                                            >
                                                {task.title}
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => handleDeleteTask(task.id, task.title)}
                                                activeOpacity={0.6}
                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                            >
                                                <Icon name="trash-2" size={18} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                        <View style={styles.taskTags}>
                                            <View style={[styles.priorityTag, { backgroundColor: getPriorityColor(task.priority) }]}>
                                                <Text style={styles.tagText}>
                                                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                                </Text>
                                            </View>
                                            {task.deadline && (
                                                <Text style={[styles.taskDate, { color: colors.textSub }]}>
                                                    Due: {new Date(task.deadline).toLocaleDateString()}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>

                        <View style={{ height: 30 }} />
                    </ScrollView>
                </Animated.View>
            </LinearGradient>

            {/* ── Add Task Modal ── */}
            <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Add Task to {project.name}</Text>
                        <TextInput
                            style={[styles.modalInput, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}
                            placeholder="Task title"
                            placeholderTextColor={colors.textSub}
                            value={newTitle}
                            onChangeText={setNewTitle}
                            autoFocus
                        />
                        <Text style={[styles.priorityLabel, { color: colors.textSub }]}>Priority</Text>
                        <View style={styles.priorityRow}>
                            {['low', 'medium', 'high'].map((p) => (
                                <TouchableOpacity
                                    key={p}
                                    style={[
                                        styles.priorityOption,
                                        {
                                            backgroundColor: newPriority === p ? getPriorityColor(p) : 'transparent',
                                            borderColor: getPriorityColor(p),
                                        },
                                    ]}
                                    onPress={() => setNewPriority(p)}
                                >
                                    <Text style={[styles.priorityOptionText, { color: newPriority === p ? '#fff' : getPriorityColor(p) }]}>
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancel}
                                onPress={() => { setShowAddModal(false); setNewTitle(''); }}
                            >
                                <Text style={[styles.modalCancelText, { color: colors.textSub }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={0.85} onPress={handleAddTask}>
                                <LinearGradient colors={['#a855f7', '#7c3aed']} style={styles.modalCreate}>
                                    <Text style={styles.modalCreateText}>Add Task</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
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
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8,
    },
    headerStripe: {
        width: 5, height: 44, borderRadius: 3, marginRight: 14,
    },
    headerContent: { flex: 1 },
    headerTitle: { fontSize: 24, fontWeight: '800' },
    headerSub: { fontSize: 13, marginTop: 2 },

    /* ── Progress ── */
    progressCard: {
        marginHorizontal: 20, marginTop: 10, padding: 16,
        borderRadius: 16,
    },
    progressRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 8,
    },
    progressLabel: { fontSize: 15, fontWeight: '600' },
    progressPercent: { fontSize: 14, fontWeight: '600' },
    progressBarBg: {
        height: 8, borderRadius: 4, overflow: 'hidden',
    },
    progressBarFill: { height: 8, borderRadius: 4 },

    /* ── Task Section ── */
    taskSection: { marginHorizontal: 20, marginTop: 16 },
    taskSectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 14,
    },
    taskSectionTitle: { fontSize: 18, fontWeight: '700' },

    /* ── Task Cards ── */
    taskCard: {
        padding: 14, borderRadius: 14, marginBottom: 10,
        borderWidth: 1,
    },
    taskTopRow: {
        flexDirection: 'row', alignItems: 'flex-start',
    },
    taskTitle: {
        flex: 1, fontSize: 16, fontWeight: '600',
        marginHorizontal: 12, marginTop: 1,
    },
    taskDone: {
        textDecorationLine: 'line-through', color: '#9ca3af',
    },
    taskTags: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        marginTop: 10, marginLeft: 34,
    },
    priorityTag: {
        paddingHorizontal: 10, paddingVertical: 3, borderRadius: 7,
    },
    tagText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    taskDate: { fontSize: 12 },

    /* ── Empty ── */
    emptyContainer: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { textAlign: 'center', marginTop: 10, fontSize: 14, lineHeight: 20 },

    /* ── Modal ── */
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center',
    },
    modalContent: {
        width: width - 60, borderRadius: 20, padding: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
    },
    modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
    modalInput: {
        borderWidth: 1, borderRadius: 12, padding: 14,
        fontSize: 16, marginBottom: 16,
    },
    priorityLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    priorityRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    priorityOption: {
        flex: 1, paddingVertical: 8, borderRadius: 10,
        borderWidth: 1.5, alignItems: 'center',
    },
    priorityOptionText: { fontSize: 13, fontWeight: '600' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    modalCancel: { paddingVertical: 10, paddingHorizontal: 16 },
    modalCancelText: { fontSize: 15, fontWeight: '600' },
    modalCreate: {
        paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12,
    },
    modalCreateText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
