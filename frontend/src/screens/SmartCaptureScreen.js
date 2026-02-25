import React, { useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  Animated, Dimensions,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import { API_URL } from '../config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SmartCaptureScreen({ navigation }) {
  const { addTask, theme } = useApp();

  // ─── Mode state ───
  const [activeMode, setActiveMode] = useState('text'); // 'text' | 'audio' | 'file'

  // ─── Shared state ───
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [aiPreview, setAiPreview] = useState({
    title: '', deadline: '', category: 'task', priority: 'medium',
  });

  // ─── Text mode state ───
  const [inputText, setInputText] = useState('');

  // ─── Audio mode state ───
  const [isRecording, setIsRecording] = useState(false);
  const [audioRecording, setAudioRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [isPlayingResponse, setIsPlayingResponse] = useState(false);
  const [responseSound, setResponseSound] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ─── File mode state ───
  const [attachedFiles, setAttachedFiles] = useState([]);

  const scrollViewRef = useRef(null);

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
      modeActive: '#9333ea',
      modeInactive: '#2d2250',
      modeTextActive: '#fff',
      modeTextInactive: '#a78bca',
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
      modeActive: '#9333ea',
      modeInactive: '#f3e8ff',
      modeTextActive: '#fff',
      modeTextInactive: '#6b7280',
    };

  // ─── Cleanup audio on unmount ───
  useEffect(() => {
    return () => {
      if (responseSound) {
        responseSound.unloadAsync().catch(() => { });
      }
    };
  }, [responseSound]);

  // ─── Pulse animation for recording ───
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);


  // ─── Platform-aware file reading helper ───
  const readFileAsBase64 = async (uri) => {
    if (Platform.OS === 'web') {
      // On web, FileSystem.readAsStringAsync is NOT supported.
      // Use fetch to get a blob, then convert to base64 via FileReader.
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            // result is "data:audio/...;base64,XXXX" — strip prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        console.error('Web base64 read error:', err);
        throw err;
      }
    } else {
      // On mobile (iOS/Android), use expo-file-system
      return await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }
  };

  // ═══════════════════════════════════════
  //  TEXT MODE HANDLER
  // ═══════════════════════════════════════
  const handleTextAnalyze = async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    setChatMessages([
      { role: 'user', content: inputText },
      { role: 'ai', content: 'Analyzing your task...' },
    ]);

    try {
      const response = await fetch(`${API_URL}/capture/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const parsedData = await response.json();
      _applyParsedData(parsedData);
    } catch (error) {
      console.error('Text capture error:', error);
      _showError();
    } finally {
      setIsAnalyzing(false);
    }
  };


  // ═══════════════════════════════════════
  //  AUDIO MODE HANDLERS
  // ═══════════════════════════════════════
  const handleStartRecording = async () => {
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
      // HIGH_QUALITY preset already records M4A with AAC — perfect for Whisper
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setAudioRecording(recording);
      setIsRecording(true);
      setTranscription('');
    } catch (err) {
      console.error('Start recording error:', err);
      Alert.alert('Error', 'Could not start audio recording.');
    }
  };

  const handleStopRecording = async () => {
    if (!audioRecording) return;
    try {
      await audioRecording.stopAndUnloadAsync();
      const uri = audioRecording.getURI();
      setAudioUri(uri);
      setIsRecording(false);
      console.log('Recording saved to:', uri);

      // Auto-send to backend
      await handleAudioAnalyze(uri);
    } catch (err) {
      console.error('Stop recording error:', err);
      setIsRecording(false);
    }
  };

  const handleAudioAnalyze = async (uri) => {
    if (!uri) return;
    setIsAnalyzing(true);
    setChatMessages([
      { role: 'user', content: '🎤 Voice message sent...' },
      { role: 'ai', content: 'Listening and analyzing...' },
    ]);

    try {
      // Read audio file as base64 (works on both web and mobile)
      const base64Audio = await readFileAsBase64(uri);
      console.log(`Audio base64 length: ${base64Audio.length}`);

      const response = await fetch(`${API_URL}/capture/audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio_base64: base64Audio,
          filename: 'voice_recording.m4a',
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const parsedData = await response.json();

      if (parsedData.error) {
        setChatMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'ai', content: `❌ ${parsedData.error}` },
        ]);
        setIsAnalyzing(false);
        return;
      }

      // Show transcription
      if (parsedData.transcription) {
        setTranscription(parsedData.transcription);
        setChatMessages(prev => {
          const updated = [...prev];
          updated[0] = { role: 'user', content: `🎤 "${parsedData.transcription}"` };
          return updated;
        });
      }

      // Play audio response
      if (parsedData.audio_response) {
        await playAudioResponse(parsedData.audio_response);
      }

      _applyParsedData(parsedData, 'audio');
    } catch (error) {
      console.error('Audio capture error:', error);
      _showError();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const playAudioResponse = async (base64Audio) => {
    try {
      let fileUri;

      if (Platform.OS === 'web') {
        // On web, use a data URI directly — no FileSystem needed
        fileUri = `data:audio/mp3;base64,${base64Audio}`;
      } else {
        // On mobile, write to cache and play from file
        fileUri = FileSystem.cacheDirectory + 'ai_response.mp3';
        await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { shouldPlay: true }
      );
      setResponseSound(sound);
      setIsPlayingResponse(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlayingResponse(false);
        }
      });
    } catch (err) {
      console.error('Audio playback error:', err);
      setIsPlayingResponse(false);
    }
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };


  // ═══════════════════════════════════════
  //  FILE/IMAGE MODE HANDLERS
  // ═══════════════════════════════════════
  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please grant photo library access.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `image_${Date.now()}.jpg`;
        setAttachedFiles(prev => [...prev, {
          name: fileName,
          uri: asset.uri,
          mimeType: asset.mimeType || 'image/jpeg',
          type: 'image',
        }]);
      }
    } catch (err) {
      console.error('Image picker error:', err);
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/*', 'image/*'],
        multiple: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setAttachedFiles(prev => [...prev, {
          name: file.name,
          uri: file.uri,
          mimeType: file.mimeType || 'application/octet-stream',
          type: file.mimeType?.startsWith('image/') ? 'image' : 'file',
        }]);
      }
    } catch (err) {
      console.error('File picker error:', err);
    }
  };

  const handleFileAnalyze = async () => {
    if (attachedFiles.length === 0) return;
    setIsAnalyzing(true);
    const fileNames = attachedFiles.map(f => f.name).join(', ');
    setChatMessages([
      { role: 'user', content: `📎 Sent: ${fileNames}` },
      { role: 'ai', content: 'Extracting content and analyzing...' },
    ]);

    try {
      // Read each file as base64 (works on both web and mobile)
      const filesPayload = [];
      for (const file of attachedFiles) {
        try {
          const base64Data = await readFileAsBase64(file.uri);
          filesPayload.push({
            base64: base64Data,
            filename: file.name,
            mimeType: file.mimeType || 'application/octet-stream',
          });
          console.log(`File ${file.name}: base64 length ${base64Data.length}`);
        } catch (readErr) {
          console.error(`Failed to read file ${file.name}:`, readErr);
        }
      }

      if (filesPayload.length === 0) {
        setChatMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'ai', content: '❌ Could not read the selected files. Please try again.' },
        ]);
        setIsAnalyzing(false);
        return;
      }

      const response = await fetch(`${API_URL}/capture/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: filesPayload }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const parsedData = await response.json();

      if (parsedData.error) {
        setChatMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'ai', content: `❌ ${parsedData.error}` },
        ]);
        setIsAnalyzing(false);
        return;
      }

      _applyParsedData(parsedData, 'file');
    } catch (error) {
      console.error('File capture error:', error);
      _showError();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };


  // ═══════════════════════════════════════
  //  SHARED HELPERS
  // ═══════════════════════════════════════
  const _applyParsedData = (parsedData, mode = 'text') => {
    const dateObj = new Date(parsedData.deadline);
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yyyy = dateObj.getFullYear();

    setAiPreview({
      title: parsedData.title || 'Untitled Task',
      deadline: `${mm}/${dd}/${yyyy}`,
      category: parsedData.category || 'task',
      priority: parsedData.priority || 'medium',
    });

    const modeLabel = mode === 'audio' ? 'voice' : mode === 'file' ? 'file' : 'text';
    setChatMessages(prev => [
      ...prev.slice(0, -1),
      {
        role: 'ai',
        content: `✅ Analyzed your ${modeLabel} input! Detected a ${parsedData.category} with ${parsedData.priority} priority. Deadline: ${mm}/${dd}/${yyyy}. You can save it or make changes below.`,
      },
    ]);
    setShowPreview(true);
  };

  const _showError = () => {
    setChatMessages(prev => [
      ...prev.slice(0, -1),
      { role: 'ai', content: '❌ Could not reach the AI engine. Please check your backend.' },
    ]);
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');

    setTimeout(() => {
      let aiResponse = '';
      const text = userMessage.toLowerCase();
      if (text.includes('high') || text.includes('medium') || text.includes('low')) {
        const priority = text.includes('high') ? 'high' : text.includes('medium') ? 'medium' : 'low';
        setAiPreview(prev => ({ ...prev, priority }));
        aiResponse = `Priority updated to ${priority}! Anything else?`;
      } else if (text.includes('task') || text.includes('assignment') || text.includes('habit')) {
        const category = text.includes('assignment') ? 'assignment' : text.includes('habit') ? 'habit' : 'task';
        setAiPreview(prev => ({ ...prev, category }));
        aiResponse = `Category changed to ${category}! Anything else?`;
      } else {
        aiResponse = "I can update the priority, deadline, or category. Just tell me what to change!";
      }
      setChatMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    }, 600);
  };

  const handleSave = async () => {
    if (aiPreview.category === 'habit') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = 0; i < 21; i++) {
        const day = new Date(today);
        day.setDate(today.getDate() + i);
        await addTask({
          title: aiPreview.title,
          deadline: day,
          category: 'habit',
          priority: aiPreview.priority,
          completed: false,
        });
      }
      Alert.alert('Habit Created!', `"${aiPreview.title}" added for the next 21 days.`);
      navigation.goBack();
      return;
    }

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
    setTranscription('');
    setIsPlayingResponse(false);
    if (responseSound) {
      responseSound.unloadAsync().catch(() => { });
      setResponseSound(null);
    }
    setAiPreview({ title: '', deadline: '', category: 'task', priority: 'medium' });
  };

  const getPriorityColor = (p) => {
    if (p === 'high') return '#ef4444';
    if (p === 'medium') return '#f97316';
    return '#22c55e';
  };

  const modes = [
    { key: 'text', icon: 'edit-2', label: 'Text' },
    { key: 'audio', icon: 'mic', label: 'Audio' },
    { key: 'file', icon: 'paperclip', label: 'Files' },
  ];

  // ═══════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <LinearGradient colors={colors.bg} locations={[0, 0.3, 0.7, 1]} style={styles.gradient}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {/* ─── Mode Selector Tabs ─── */}
          {!showPreview && (
            <View style={[styles.modeTabs, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              {modes.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={[
                    styles.modeTab,
                    activeMode === m.key && { backgroundColor: colors.modeActive },
                  ]}
                  onPress={() => setActiveMode(m.key)}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={m.icon}
                    size={16}
                    color={activeMode === m.key ? colors.modeTextActive : colors.modeTextInactive}
                  />
                  <Text style={[
                    styles.modeTabText,
                    { color: activeMode === m.key ? colors.modeTextActive : colors.modeTextInactive },
                  ]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!showPreview ? (
            <>
              {/* ═══ TEXT MODE ═══ */}
              {activeMode === 'text' && (
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

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleTextAnalyze}
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
                          <Text style={styles.analyzeButtonText}>Analyzing...</Text>
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
              )}

              {/* ═══ AUDIO MODE ═══ */}
              {activeMode === 'audio' && (
                <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.inputHeader}>
                    <LinearGradient colors={colors.sectionIcon} style={styles.inputIcon}>
                      <Icon name="mic" size={16} color="#9333ea" />
                    </LinearGradient>
                    <Text style={[styles.inputTitle, { color: colors.text }]}>Voice Conversation</Text>
                  </View>

                  <Text style={[styles.audioHint, { color: colors.textSub }]}>
                    {isRecording
                      ? '🔴 Recording... Tap to stop'
                      : isAnalyzing
                        ? '🧠 Processing your voice...'
                        : isPlayingResponse
                          ? '🔊 AI is speaking...'
                          : 'Tap the mic to speak your task'}
                  </Text>

                  {/* Big Mic Button */}
                  <View style={styles.micContainer}>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                      <TouchableOpacity
                        onPress={handleVoiceToggle}
                        disabled={isAnalyzing || isPlayingResponse}
                        activeOpacity={0.7}
                      >
                        <LinearGradient
                          colors={isRecording ? ['#ef4444', '#dc2626'] : ['#c084fc', '#9333ea', '#7c3aed']}
                          style={styles.micButton}
                        >
                          <Icon
                            name={isRecording ? 'stop-circle' : 'mic'}
                            size={36}
                            color="#fff"
                          />
                        </LinearGradient>
                      </TouchableOpacity>
                    </Animated.View>
                  </View>

                  {/* Transcription Display */}
                  {transcription !== '' && (
                    <View style={[styles.transcriptionBox, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                      <Text style={[styles.transcriptionLabel, { color: colors.textSub }]}>Your words:</Text>
                      <Text style={[styles.transcriptionText, { color: colors.text }]}>"{transcription}"</Text>
                    </View>
                  )}

                  {/* Playback indicator */}
                  {isPlayingResponse && (
                    <View style={styles.playbackRow}>
                      <ActivityIndicator color="#9333ea" size="small" />
                      <Text style={[styles.playbackText, { color: colors.textSub }]}>AI is speaking...</Text>
                    </View>
                  )}
                </View>
              )}

              {/* ═══ FILE/IMAGE MODE ═══ */}
              {activeMode === 'file' && (
                <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.inputHeader}>
                    <LinearGradient colors={colors.sectionIcon} style={styles.inputIcon}>
                      <Icon name="paperclip" size={16} color="#9333ea" />
                    </LinearGradient>
                    <Text style={[styles.inputTitle, { color: colors.text }]}>Upload Files or Images</Text>
                  </View>

                  <Text style={[styles.audioHint, { color: colors.textSub }]}>
                    Upload images, PDFs, or text files. AI will extract task details automatically.
                  </Text>

                  {/* Pick Buttons */}
                  <View style={styles.filePickRow}>
                    <TouchableOpacity
                      style={[styles.filePickBtn, { backgroundColor: colors.iconBtn }]}
                      onPress={handlePickImage}
                      activeOpacity={0.7}
                    >
                      <Icon name="image" size={20} color="#9333ea" />
                      <Text style={[styles.filePickBtnText, { color: colors.text }]}>Pick Image</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.filePickBtn, { backgroundColor: colors.iconBtn }]}
                      onPress={handlePickFile}
                      activeOpacity={0.7}
                    >
                      <Icon name="file-text" size={20} color="#9333ea" />
                      <Text style={[styles.filePickBtnText, { color: colors.text }]}>Pick File</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Attached Files List */}
                  {attachedFiles.length > 0 && (
                    <View style={styles.filesSection}>
                      {attachedFiles.map((file, i) => (
                        <View key={i} style={[styles.fileChip, { backgroundColor: colors.fileChip }]}>
                          <Icon
                            name={file.type === 'image' ? 'image' : 'file'}
                            size={12}
                            color={colors.fileChipText}
                          />
                          <Text style={[styles.fileChipText, { color: colors.fileChipText }]} numberOfLines={1}>
                            {file.name}
                          </Text>
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
                    onPress={handleFileAnalyze}
                    disabled={attachedFiles.length === 0 || isAnalyzing}
                  >
                    <LinearGradient
                      colors={attachedFiles.length === 0 ? ['#d8b4fe', '#c4b5fd'] : ['#c084fc', '#9333ea', '#7c3aed']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={[styles.analyzeButton, attachedFiles.length === 0 && { opacity: 0.5 }]}
                    >
                      {isAnalyzing ? (
                        <>
                          <ActivityIndicator color="#fff" size="small" />
                          <Text style={styles.analyzeButtonText}>Extracting & Analyzing...</Text>
                        </>
                      ) : (
                        <>
                          <Icon name="zap" size={18} color="#fff" />
                          <Text style={styles.analyzeButtonText}>Analyze Files with AI</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </>
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

                <Text style={[styles.fieldLabel, { color: colors.text }]}>Task</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                  value={aiPreview.title}
                  onChangeText={(t) => setAiPreview({ ...aiPreview, title: t })}
                />

                <Text style={[styles.fieldLabel, { color: colors.text }]}>Deadline</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                  value={aiPreview.deadline}
                  onChangeText={(t) => setAiPreview({ ...aiPreview, deadline: t })}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor={colors.placeholder}
                />

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

  /* ── Mode Tabs ── */
  modeTabs: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 14,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* ── Input Card ── */
  inputCard: {
    padding: 18, borderRadius: 18, borderWidth: 1,
  },
  inputHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  inputIcon: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  inputTitle: { fontSize: 17, fontWeight: '700' },
  textArea: {
    borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15,
    minHeight: 100, textAlignVertical: 'top', marginBottom: 14,
  },

  /* ── Audio Mode ── */
  audioHint: {
    fontSize: 14, textAlign: 'center', marginBottom: 20, lineHeight: 20,
  },
  micContainer: {
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  micButton: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#9333ea', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  transcriptionBox: {
    borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 14,
  },
  transcriptionLabel: {
    fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  transcriptionText: {
    fontSize: 15, lineHeight: 22, fontStyle: 'italic',
  },
  playbackRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12,
  },
  playbackText: {
    fontSize: 13, fontWeight: '600',
  },

  /* ── File Mode ── */
  filePickRow: {
    flexDirection: 'row', gap: 12, marginBottom: 16,
  },
  filePickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12,
  },
  filePickBtnText: {
    fontSize: 14, fontWeight: '600',
  },
  filesSection: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14,
  },
  fileChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  fileChipText: { fontSize: 11, maxWidth: 120 },

  /* ── Analyze Button ── */
  analyzeButton: {
    flexDirection: 'row', padding: 14, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#9333ea', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  analyzeButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginLeft: 8 },

  /* ── Chat Card ── */
  chatCard: {
    padding: 18, borderRadius: 18, marginBottom: 14, borderWidth: 1,
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
    flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },

  /* ── Preview Card ── */
  previewCard: {
    padding: 18, borderRadius: 18, borderWidth: 1,
  },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 6, marginTop: 10 },
  fieldInput: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15,
  },
  chipsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  chip: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1.5,
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
    flex: 1, padding: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1.5,
  },
  resetBtnText: { fontSize: 15, fontWeight: '600' },
});