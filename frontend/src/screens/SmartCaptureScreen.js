import React, { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { useApp } from '../context/AppContext';
import { API_URL } from '../config/api';

export default function SmartCaptureScreen({ navigation }) {
  const { addTask, theme } = useApp();
  const [inputText, setInputText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioRecording, setAudioRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);

  const isDark = theme === 'dark';
  const colors = isDark
    ? {
      bg: ['#0f0a1e', '#1a1333', '#1a1333', '#251d3d'],
      card: 'rgba(37,29,61,0.9)',
      cardBorder: 'rgba(147,51,234,0.2)',
      text: '#f3e8ff',
      textSub: '#a78bca',
      inputBg: 'rgba(37,29,61,0.8)',
      inputBorder: 'rgba(147,51,234,0.2)',
      inputText: '#f3e8ff',
      placeholder: '#6b5b8a',
      iconBtn: '#2d2250',
      fileChip: '#2d2250',
      fileChipText: '#c4b5fd',
      aiBubble: 'rgba(37,29,61,0.9)',
      chipBg: 'rgba(37,29,61,0.9)',
      chipBorder: '#3d2e5c',
      chipText: '#a78bca',
      resetBg: 'rgba(37,29,61,0.9)',
      resetBorder: '#3d2e5c',
      resetText: '#a78bca',
      sectionIcon: ['#2d2250', '#3d2e5c'],
    }
    : {
      bg: ['#e8d5f5', '#f0e0f7', '#fce4ec', '#f8d7e8'],
      card: 'rgba(255,255,255,0.6)',
      cardBorder: 'rgba(147,51,234,0.08)',
      text: '#1f2937',
      textSub: '#7c6f8a',
      inputBg: 'rgba(255,255,255,0.8)',
      inputBorder: 'rgba(147,51,234,0.1)',
      inputText: '#1f2937',
      placeholder: '#a1a1aa',
      iconBtn: '#f3e8ff',
      fileChip: '#ede9fe',
      fileChipText: '#7c3aed',
      aiBubble: 'rgba(255,255,255,0.8)',
      chipBg: 'rgba(255,255,255,0.8)',
      chipBorder: '#d1d5db',
      chipText: '#6b7280',
      resetBg: 'rgba(255,255,255,0.8)',
      resetBorder: '#d1d5db',
      resetText: '#6b7280',
      sectionIcon: ['#f3e8ff', '#ede9fe'],
    };

  const [aiPreview, setAiPreview] = useState({
    title: '', deadline: '', category: 'task', priority: 'medium',
  });
  const scrollViewRef = useRef(null);

  // Voice input — real audio recording via expo-av
  const handleVoiceInput = async () => {
    if (isRecording) {
      // Stop recording
      try {
        await audioRecording.stopAndUnloadAsync();
        const uri = audioRecording.getURI();
        setAudioUri(uri);
        setIsRecording(false);
        setInputText((prev) => prev ? `${prev} [Voice recorded]` : '[Voice recorded]');
      } catch (err) {
        console.error('Stop recording error:', err);
        setIsRecording(false);
      }
    } else {
      // Start recording
      try {
        const permission = await Audio.requestPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Please grant microphone access to record audio.');
          return;
        }
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setAudioRecording(recording);
        setIsRecording(true);
      } catch (err) {
        console.error('Start recording error:', err);
        Alert.alert('Error', 'Could not start audio recording.');
      }
    }
  };

  // File attachment
  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setAttachedFiles((prev) => [...prev, { name: file.name, size: file.size, uri: file.uri, mimeType: file.mimeType }]);
        setInputText((prev) => prev ? `${prev} [File: ${file.name}]` : `[File: ${file.name}]`);
      }
    } catch (err) {
      console.error('File pick error:', err);
    }
  };

  const removeFile = (index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // AI Analysis via FastAPI backend — sends text + audio + files as FormData
  const handleAnalyze = async () => {
    if (!inputText.trim() && !audioUri && attachedFiles.length === 0) return;
    setIsAnalyzing(true);
    setChatMessages([
      { role: 'user', content: inputText || '[Audio/File input]' },
      { role: 'ai', content: 'Let me analyze your task with AI...' },
    ]);

    try {
      // Build FormData with text, audio, and files
      const formData = new FormData();
      formData.append('text', inputText || '');

      // Attach audio recording if available
      if (audioUri) {
        formData.append('audio', {
          uri: audioUri,
          name: 'voice_recording.m4a',
          type: 'audio/m4a',
        });
      }

      // Attach picked files
      for (const file of attachedFiles) {
        formData.append('files', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
        });
      }

      const response = await fetch(`${API_URL}/capture/`, {
        method: 'POST',
        body: formData,
        // Do NOT set Content-Type header — fetch sets it with the multipart boundary
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const parsedData = await response.json();

      const dateObj = new Date(parsedData.deadline);
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const yyyy = dateObj.getFullYear();

      setAiPreview({
        title: parsedData.title,
        deadline: `${mm}/${dd}/${yyyy}`,
        category: parsedData.category,
        priority: parsedData.priority,
      });

      setChatMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: 'ai',
          content: `I've analyzed your task! I detected this as a ${parsedData.category} with ${parsedData.priority} priority. The deadline is set for ${dd}/${mm}/${yyyy}. Would you like to make any changes?`,
        },
      ]);
      setShowPreview(true);
    } catch (error) {
      console.error('AI Capture Error:', error);
      Alert.alert('Error', 'Could not reach the AI Engine. Please check if your FastAPI backend is running.');
      setChatMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'ai', content: 'Sorry, I had trouble connecting to the brain. Let me know if you want to try again.' },
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    const userMessage = chatInput;
    setChatMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');

    setTimeout(() => {
      let aiResponse = '';
      const text = userMessage.toLowerCase();
      if (text.includes('high') || text.includes('medium') || text.includes('low')) {
        const priority = text.includes('high') ? 'high' : text.includes('medium') ? 'medium' : 'low';
        setAiPreview((prev) => ({ ...prev, priority }));
        aiResponse = `Priority updated to ${priority}! Anything else?`;
      } else if (text.includes('task') || text.includes('assignment') || text.includes('habit')) {
        const category = text.includes('assignment') ? 'assignment' : text.includes('habit') ? 'habit' : 'task';
        setAiPreview((prev) => ({ ...prev, category }));
        aiResponse = `Category changed to ${category}! Is there anything else?`;
      } else if (text.includes('change') || text.includes('update')) {
        aiResponse = 'I can help you update the priority, deadline, or category. What would you like to change?';
      } else {
        aiResponse = "I'm here to help! You can ask me to change the priority, deadline, or category of your task.";
      }
      setChatMessages((prev) => [...prev, { role: 'ai', content: aiResponse }]);
    }, 800);
  };

  const handleSave = () => {
    // Parse the deadline back to a Date object
    const parts = aiPreview.deadline.split('/');
    let deadlineDate;
    if (parts.length === 3) {
      deadlineDate = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
    } else {
      deadlineDate = new Date(aiPreview.deadline);
    }

    addTask({
      title: aiPreview.title,
      deadline: deadlineDate,
      category: aiPreview.category,
      priority: aiPreview.priority,
      completed: false,
    });
    navigation.goBack();
  };

  const handleStartOver = () => {
    setShowPreview(false);
    setChatMessages([]);
    setInputText('');
    setAttachedFiles([]);
    setAudioUri(null);
    setAudioRecording(null);
    setIsRecording(false);
    setAiPreview({ title: '', deadline: '', category: 'task', priority: 'medium' });
  };

  const getPriorityColor = (p) => {
    if (p === 'high') return '#ef4444';
    if (p === 'medium') return '#f97316';
    return '#22c55e';
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <LinearGradient
        colors={colors.bg}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.gradient}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {!showPreview ? (
            /* ─── Input Phase ─── */
            <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.inputHeader}>
                <LinearGradient colors={colors.sectionIcon} style={styles.inputIcon}>
                  <Icon name="edit-2" size={16} color="#9333ea" />
                </LinearGradient>
                <Text style={[styles.inputTitle, { color: colors.text }]}>Describe your task</Text>
              </View>

              <TextInput
                style={[styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                placeholder="Example: Submit math assignment tomorrow, it's urgent..."
                placeholderTextColor={colors.placeholder}
                value={inputText}
                onChangeText={setInputText}
                multiline
                numberOfLines={5}
              />

              {/* Action Buttons: Voice & Attach */}
              <View style={styles.inputActions}>
                <TouchableOpacity style={[styles.iconBtn, { backgroundColor: isRecording ? '#9333ea' : colors.iconBtn }]} onPress={handleVoiceInput} activeOpacity={0.7}>
                  <Icon name={isRecording ? 'stop-circle' : 'mic'} size={18} color={isRecording ? '#fff' : '#9333ea'} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.iconBtn }]} onPress={handleFilePick} activeOpacity={0.7}>
                  <Icon name="paperclip" size={18} color="#9333ea" />
                </TouchableOpacity>
              </View>

              {/* Attached Files */}
              {attachedFiles.length > 0 && (
                <View style={styles.filesSection}>
                  {attachedFiles.map((file, i) => (
                    <View key={i} style={[styles.fileChip, { backgroundColor: colors.fileChip }]}>
                      <Icon name="file" size={12} color={colors.fileChipText} />
                      <Text style={[styles.fileChipText, { color: colors.fileChipText }]} numberOfLines={1}>{file.name}</Text>
                      <TouchableOpacity onPress={() => removeFile(i)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                        <Icon name="x" size={14} color={colors.textSub} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Analyze Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleAnalyze}
                disabled={!inputText.trim() || isAnalyzing}
              >
                <LinearGradient
                  colors={!inputText.trim() ? ['#d8b4fe', '#c4b5fd'] : ['#c084fc', '#9333ea', '#7c3aed']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.analyzeButton, !inputText.trim() && { opacity: 0.5 }]}
                >
                  {isAnalyzing ? (
                    <>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={styles.analyzeButtonText}>Analyzing with AI...</Text>
                    </>
                  ) : (
                    <>
                      <Icon name="zap" size={18} color="#fff" />
                      <Text style={styles.analyzeButtonText}>Analyze with AI</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* ─── AI Chat ─── */}
              <View style={[styles.chatCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={styles.chatHeader}>
                  <LinearGradient colors={colors.sectionIcon} style={styles.inputIcon}>
                    <Icon name="zap" size={16} color="#9333ea" />
                  </LinearGradient>
                  <Text style={[styles.chatTitle, { color: colors.text }]}>AI Assistant</Text>
                </View>

                <View style={styles.messagesContainer}>
                  {chatMessages.map((msg, i) => (
                    <View
                      key={i}
                      style={[styles.bubble, msg.role === 'user' ? styles.userBubble : [styles.aiBubble, { backgroundColor: colors.aiBubble }]]}
                    >
                      <Text style={[styles.bubbleText, { color: colors.text }, msg.role === 'user' && styles.userBubbleText]}>
                        {msg.content}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.chatInputRow}>
                  <TextInput
                    style={[styles.chatInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                    placeholder="Ask AI to adjust..."
                    placeholderTextColor={colors.placeholder}
                    value={chatInput}
                    onChangeText={setChatInput}
                    onSubmitEditing={handleChatSend}
                  />
                  <TouchableOpacity onPress={handleChatSend} activeOpacity={0.8}>
                    <LinearGradient colors={['#a855f7', '#7c3aed']} style={styles.sendBtn}>
                      <Icon name="send" size={16} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ─── Task Preview ─── */}
              <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={styles.chatHeader}>
                  <LinearGradient colors={colors.sectionIcon} style={styles.inputIcon}>
                    <Icon name="check-square" size={16} color="#9333ea" />
                  </LinearGradient>
                  <Text style={[styles.chatTitle, { color: colors.text }]}>Task Preview</Text>
                </View>

                {/* Title */}
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Task</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                  value={aiPreview.title}
                  onChangeText={(t) => setAiPreview({ ...aiPreview, title: t })}
                />

                {/* Deadline */}
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Deadline</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                  value={aiPreview.deadline}
                  onChangeText={(t) => setAiPreview({ ...aiPreview, deadline: t })}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor={colors.placeholder}
                />

                {/* Category */}
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Category</Text>
                <View style={styles.chipsRow}>
                  {['task', 'assignment', 'habit'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.chip, { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }, aiPreview.category === cat && styles.chipActive]}
                      onPress={() => setAiPreview({ ...aiPreview, category: cat })}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, { color: colors.chipText }, aiPreview.category === cat && styles.chipTextActive]}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Priority */}
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Priority</Text>
                <View style={styles.chipsRow}>
                  {['high', 'medium', 'low'].map((pri) => (
                    <TouchableOpacity
                      key={pri}
                      style={[
                        styles.chip,
                        { backgroundColor: colors.chipBg, borderColor: colors.chipBorder },
                        aiPreview.priority === pri && { backgroundColor: getPriorityColor(pri), borderColor: getPriorityColor(pri) },
                      ]}
                      onPress={() => setAiPreview({ ...aiPreview, priority: pri })}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, { color: colors.chipText }, aiPreview.priority === pri && styles.chipTextActive]}>
                        {pri.charAt(0).toUpperCase() + pri.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity activeOpacity={0.85} onPress={handleSave} style={{ flex: 1 }}>
                    <LinearGradient
                      colors={['#c084fc', '#9333ea', '#7c3aed']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.saveBtn}
                    >
                      <Text style={styles.saveBtnText}>Save Task</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.resetBtn, { backgroundColor: colors.resetBg, borderColor: colors.resetBorder }]} onPress={handleStartOver} activeOpacity={0.7}>
                    <Text style={[styles.resetBtnText, { color: colors.resetText }]}>Start Over</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
          <View style={{ height: 30 }} />
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 10 },

  /* ── Input Card ── */
  inputCard: {
    padding: 18, borderRadius: 18,
    borderWidth: 1,
  },
  inputHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  inputIcon: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  inputTitle: { fontSize: 17, fontWeight: '700' },
  textArea: {
    borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15,
    minHeight: 100, textAlignVertical: 'top',
    marginBottom: 10,
  },
  inputActions: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
  filesSection: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  fileChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  fileChipText: { fontSize: 11, maxWidth: 120 },
  analyzeButton: {
    flexDirection: 'row', padding: 14, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#9333ea', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  analyzeButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginLeft: 8 },

  /* ── Chat Card ── */
  chatCard: {
    padding: 18,
    borderRadius: 18, marginBottom: 14,
    borderWidth: 1,
  },
  chatHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  chatTitle: { fontSize: 17, fontWeight: '700' },
  messagesContainer: { marginBottom: 12 },
  bubble: { maxWidth: '82%', padding: 12, borderRadius: 14, marginBottom: 8 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#9333ea' },
  aiBubble: { alignSelf: 'flex-start' },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  userBubbleText: { color: '#fff' },
  chatInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  chatInput: {
    flex: 1,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },

  /* ── Preview Card ── */
  previewCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
  },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 6, marginTop: 10 },
  fieldInput: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15,
  },
  chipsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  chip: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10,
    borderWidth: 1.5,
  },
  chipActive: { backgroundColor: '#9333ea', borderColor: '#9333ea' },
  chipText: { fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  saveBtn: {
    padding: 14, borderRadius: 14, alignItems: 'center',
    shadowColor: '#9333ea', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  resetBtn: {
    flex: 1, padding: 14, borderRadius: 14, alignItems: 'center',
    borderWidth: 1.5,
  },
  resetBtnText: { fontSize: 15, fontWeight: '600' },
});