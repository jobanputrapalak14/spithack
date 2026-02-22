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

const TABS = ['All', 'Assignments', 'Habits', 'Projects'];

export default function ProjectSpaceScreen({ navigation }) {
    const {
        tasks, updateTask, deleteTask,
        projects, addProject, updateProject, deleteProject,
        theme,
    } = useApp();

    const [activeTab, setActiveTab] = useState('All');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');

    const isDark = theme === 'dark';
    const colors = isDark
        ? {
            bg: ['#0f0a1e', '#1a1333', '#1a1333', '#251d3d'],
            card: 'rgba(37,29,61,0.92)',
            cardBorder: 'rgba(147,51,234,0.18)',
            text: '#f3e8ff',
            textSub: '#a78bca',
            tabBg: 'rgba(37,29,61,0.8)',
            tabActive: '#9333ea',
            tabText: '#a78bca',
            tabActiveText: '#fff',
            inputBg: 'rgba(37,29,61,0.8)',
            inputBorder: 'rgba(147,51,234,0.25)',
            modalBg: '#1a1333',
            fabShadow: '#7c3aed',
        }
        : {
            bg: ['#e8d5f5', '#f0e0f7', '#fce4ec', '#f8d7e8'],
            card: 'rgba(255,255,255,0.92)',
            cardBorder: 'rgba(147,51,234,0.08)',
            text: '#1f2937',
            textSub: '#7c6f8a',
            tabBg: 'rgba(255,255,255,0.7)',
            tabActive: '#9333ea',
            tabText: '#6b7280',
            tabActiveText: '#fff',
            inputBg: 'rgba(255,255,255,0.8)',
            inputBorder: 'rgba(147,51,234,0.12)',
            modalBg: '#fff',
            fabShadow: '#9333ea',
        };

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1, duration: 400, useNativeDriver: true,
        }).start();
    }, []);

    // ── Filtered data ──
    const assignments = tasks.filter((t) => t.category === 'assignment');
    const habits = tasks.filter((t) => t.category === 'habit');

    const getProjectTasks = (projectId) => tasks.filter((t) => t.projectId === projectId);

    const totalProjectTasks = projects.reduce((sum, p) => sum + getProjectTasks(p.id).length, 0);
    const totalProjectDone = projects.reduce(
        (sum, p) => sum + getProjectTasks(p.id).filter((t) => t.completed).length,
        0
    );

    // ── Handlers ──
    const handleAddProject = () => {
        if (!newProjectName.trim()) return;
        addProject(newProjectName.trim());
        setNewProjectName('');
        setShowAddModal(false);
    };

    const handleDeleteProject = (id, name) => {
        Alert.alert('Delete Project', `Delete "${name}" and all its tasks?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteProject(id) },
        ]);
    };

    const handleStartEdit = (id, name) => {
        setEditingId(id);
        setEditName(name);
    };

    const handleSaveEdit = () => {
        if (editName.trim() && editingId) {
            updateProject(editingId, { name: editName.trim() });
        }
        setEditingId(null);
        setEditName('');
    };

    // ── Render helpers ──
    const renderTaskList = (taskList, emptyMsg) => {
        if (taskList.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Icon name="inbox" size={32} color={isDark ? '#6b5b8a' : '#c4b5d4'} />
                    <Text style={[styles.emptyText, { color: colors.textSub }]}>{emptyMsg}</Text>
                </View>
            );
        }
        return taskList.map((task) => (
            <View
                key={task.id}
                style={[styles.taskItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            >
                <TouchableOpacity
                    onPress={() => updateTask(task.id, { completed: !task.completed })}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Icon
                        name={task.completed ? 'check-circle' : 'circle'}
                        size={22}
                        color={task.completed ? '#22c55e' : isDark ? '#6b5b8a' : '#c4b5d4'}
                    />
                </TouchableOpacity>
                <View style={styles.taskContent}>
                    <Text
                        style={[styles.taskTitle, { color: colors.text }, task.completed && styles.taskDone]}
                        numberOfLines={1}
                    >
                        {task.title}
                    </Text>
                    {task.deadline && (
                        <Text style={[styles.taskSub, { color: colors.textSub }]}>
                            Due: {new Date(task.deadline).toLocaleDateString()}
                        </Text>
                    )}
                </View>
                <View style={[styles.priorityDot, { backgroundColor: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f97316' : '#22c55e' }]} />
                <TouchableOpacity
                    onPress={() => {
                        Alert.alert('Delete Task', `Delete "${task.title}"?`, [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => deleteTask(task.id) },
                        ]);
                    }}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={{ marginLeft: 10 }}
                >
                    <Icon name="trash-2" size={16} color="#ef4444" />
                </TouchableOpacity>
            </View>
        ));
    };

    const renderProjectCards = () => {
        if (projects.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Icon name="layers" size={32} color={isDark ? '#6b5b8a' : '#c4b5d4'} />
                    <Text style={[styles.emptyText, { color: colors.textSub }]}>No projects yet. Tap + to create one!</Text>
                </View>
            );
        }
        return projects.map((project) => {
            const pTasks = getProjectTasks(project.id);
            const doneCount = pTasks.filter((t) => t.completed).length;

            return (
                <View
                    key={project.id}
                    style={[styles.projectCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                >
                    <View style={[styles.projectStripe, { backgroundColor: project.color }]} />
                    <TouchableOpacity
                        style={styles.projectBody}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('ProjectDetail', { projectId: project.id })}
                    >
                        <View style={styles.projectTop}>
                            {editingId === project.id ? (
                                <TextInput
                                    style={[styles.editInput, { color: colors.text, borderColor: colors.inputBorder }]}
                                    value={editName}
                                    onChangeText={setEditName}
                                    onBlur={handleSaveEdit}
                                    onSubmitEditing={handleSaveEdit}
                                    autoFocus
                                />
                            ) : (
                                <View style={styles.projectNameRow}>
                                    <Text style={[styles.projectName, { color: colors.text }]}>{project.name}</Text>
                                    <TouchableOpacity
                                        onPress={() => handleStartEdit(project.id, project.name)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <Icon name="edit-2" size={14} color={colors.textSub} />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.projectSub, { color: colors.textSub }]}>
                            {pTasks.length === 0 ? 'No tasks yet' : `${doneCount} / ${pTasks.length} done`}
                        </Text>
                    </TouchableOpacity>
                    <View style={styles.projectActions}>
                        {pTasks.length > 0 && (
                            <View style={styles.countBadge}>
                                <Text style={styles.countBadgeText}>{pTasks.length}</Text>
                            </View>
                        )}
                        <TouchableOpacity
                            onPress={() => handleDeleteProject(project.id, project.name)}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                            <Icon name="trash-2" size={18} color="#ef4444" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('ProjectDetail', { projectId: project.id })}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Icon name="chevron-right" size={20} color={colors.textSub} />
                        </TouchableOpacity>
                    </View>
                </View>
            );
        });
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={colors.bg} locations={[0, 0.3, 0.7, 1]} style={styles.gradient}>
                <Animated.View style={{ flex: 1, opacity: fadeAnim }}>

                    {/* ── Header summary ── */}
                    <View style={styles.header}>
                        <View>
                            <Text style={[styles.headerTitle, { color: colors.text }]}>Project Space</Text>
                            <Text style={[styles.headerSub, { color: colors.textSub }]}>
                                {projects.length} projects · {totalProjectDone}/{totalProjectTasks + assignments.length + habits.length} tasks done
                            </Text>
                        </View>
                        <LinearGradient colors={['#a855f7', '#7c3aed']} style={styles.headerIcon}>
                            <Icon name="layers" size={22} color="#fff" />
                        </LinearGradient>
                    </View>

                    {/* ── Tabs ── */}
                    <View style={styles.tabBar}>
                        {TABS.map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[
                                    styles.tab,
                                    { backgroundColor: activeTab === tab ? colors.tabActive : colors.tabBg },
                                ]}
                                onPress={() => setActiveTab(tab)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.tabText,
                                    { color: activeTab === tab ? colors.tabActiveText : colors.tabText },
                                ]}>
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* ── Content ── */}
                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        {activeTab === 'All' && (
                            <>
                                {assignments.length > 0 && (
                                    <View style={styles.section}>
                                        <View style={styles.sectionHeader}>
                                            <Icon name="book-open" size={16} color="#3b82f6" />
                                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Assignments</Text>
                                            <View style={[styles.sectionBadge, { backgroundColor: '#3b82f6' }]}>
                                                <Text style={styles.sectionBadgeText}>{assignments.length}</Text>
                                            </View>
                                        </View>
                                        {renderTaskList(assignments, '')}
                                    </View>
                                )}
                                {habits.length > 0 && (
                                    <View style={styles.section}>
                                        <View style={styles.sectionHeader}>
                                            <Icon name="repeat" size={16} color="#22c55e" />
                                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Habits</Text>
                                            <View style={[styles.sectionBadge, { backgroundColor: '#22c55e' }]}>
                                                <Text style={styles.sectionBadgeText}>{habits.length}</Text>
                                            </View>
                                        </View>
                                        {renderTaskList(habits, '')}
                                    </View>
                                )}
                                {projects.length > 0 && (
                                    <View style={styles.section}>
                                        <View style={styles.sectionHeader}>
                                            <Icon name="folder" size={16} color="#9333ea" />
                                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Projects</Text>
                                            <View style={[styles.sectionBadge, { backgroundColor: '#9333ea' }]}>
                                                <Text style={styles.sectionBadgeText}>{projects.length}</Text>
                                            </View>
                                        </View>
                                        {renderProjectCards()}
                                    </View>
                                )}
                                {assignments.length === 0 && habits.length === 0 && projects.length === 0 && (
                                    <View style={styles.emptyContainer}>
                                        <Icon name="layers" size={40} color={isDark ? '#6b5b8a' : '#c4b5d4'} />
                                        <Text style={[styles.emptyText, { color: colors.textSub }]}>
                                            Your workspace is empty.{'\n'}Add tasks or create a project!
                                        </Text>
                                    </View>
                                )}
                            </>
                        )}

                        {activeTab === 'Assignments' && (
                            <View style={styles.section}>
                                {renderTaskList(assignments, 'No assignments yet.\nTasks with category "assignment" will appear here.')}
                            </View>
                        )}

                        {activeTab === 'Habits' && (
                            <View style={styles.section}>
                                {renderTaskList(habits, 'No habits yet.\nTasks with category "habit" will appear here.')}
                            </View>
                        )}

                        {activeTab === 'Projects' && (
                            <View style={styles.section}>
                                {renderProjectCards()}
                            </View>
                        )}

                        <View style={{ height: 100 }} />
                    </ScrollView>

                    {/* ── FAB ── */}
                    <TouchableOpacity
                        style={[styles.fab, { shadowColor: colors.fabShadow }]}
                        onPress={() => setShowAddModal(true)}
                        activeOpacity={0.8}
                    >
                        <LinearGradient colors={['#c084fc', '#9333ea', '#7c3aed']} style={styles.fabGradient}>
                            <Icon name="plus" size={26} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>

                </Animated.View>
            </LinearGradient>

            {/* ── Add Project Modal ── */}
            <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>New Project</Text>
                        <TextInput
                            style={[styles.modalInput, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}
                            placeholder="Project name"
                            placeholderTextColor={colors.textSub}
                            value={newProjectName}
                            onChangeText={setNewProjectName}
                            autoFocus
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancel}
                                onPress={() => { setShowAddModal(false); setNewProjectName(''); }}
                            >
                                <Text style={[styles.modalCancelText, { color: colors.textSub }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={0.85} onPress={handleAddProject}>
                                <LinearGradient colors={['#a855f7', '#7c3aed']} style={styles.modalCreate}>
                                    <Text style={styles.modalCreateText}>Create</Text>
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
    scrollView: { flex: 1, paddingHorizontal: 20 },

    /* ── Header ── */
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 22, paddingTop: 14, paddingBottom: 10,
    },
    headerTitle: { fontSize: 26, fontWeight: '800' },
    headerSub: { fontSize: 13, marginTop: 2 },
    headerIcon: {
        width: 46, height: 46, borderRadius: 23,
        justifyContent: 'center', alignItems: 'center',
    },

    /* ── Tabs ── */
    tabBar: {
        flexDirection: 'row', paddingHorizontal: 18, marginBottom: 10, gap: 8,
    },
    tab: {
        paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    },
    tabText: { fontSize: 13, fontWeight: '600' },

    /* ── Sections ── */
    section: { marginBottom: 8 },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 8, gap: 6,
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
    sectionBadge: {
        paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
    },
    sectionBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

    /* ── Task Items ── */
    taskItem: {
        flexDirection: 'row', alignItems: 'center',
        padding: 14, borderRadius: 14, marginBottom: 8,
        borderWidth: 1,
    },
    taskContent: { flex: 1, marginLeft: 12 },
    taskTitle: { fontSize: 15, fontWeight: '600' },
    taskDone: { textDecorationLine: 'line-through', color: '#9ca3af' },
    taskSub: { fontSize: 12, marginTop: 2 },
    priorityDot: {
        width: 10, height: 10, borderRadius: 5, marginLeft: 8,
    },

    /* ── Project Cards ── */
    projectCard: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 16, marginBottom: 10,
        borderWidth: 1, overflow: 'hidden',
    },
    projectStripe: {
        width: 5, alignSelf: 'stretch',
    },
    projectBody: { flex: 1, paddingVertical: 14, paddingHorizontal: 14 },
    projectTop: { marginBottom: 2 },
    projectNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    projectName: { fontSize: 17, fontWeight: '700' },
    projectSub: { fontSize: 13 },
    projectActions: { flexDirection: 'row', alignItems: 'center', paddingRight: 14, gap: 10 },
    countBadge: {
        backgroundColor: '#22c55e', width: 24, height: 24, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
    },
    countBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    editInput: {
        fontSize: 16, fontWeight: '600',
        borderBottomWidth: 1.5, paddingVertical: 2,
    },

    /* ── Empty ── */
    emptyContainer: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { textAlign: 'center', marginTop: 10, fontSize: 14, lineHeight: 20 },

    /* ── FAB ── */
    fab: {
        position: 'absolute', right: 22, bottom: 24,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35, shadowRadius: 8, elevation: 8,
    },
    fabGradient: {
        width: 56, height: 56, borderRadius: 28,
        justifyContent: 'center', alignItems: 'center',
    },

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
        fontSize: 16, marginBottom: 20,
    },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    modalCancel: { paddingVertical: 10, paddingHorizontal: 16 },
    modalCancelText: { fontSize: 15, fontWeight: '600' },
    modalCreate: {
        paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12,
    },
    modalCreateText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
