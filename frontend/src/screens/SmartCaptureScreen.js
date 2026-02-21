import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import axios from 'axios';

// ⚠️ Ensure this matches the URL in your AppContext.js
const API_URL = 'http://10.10.53.72:8000/api';

export default function SmartCaptureScreen({ navigation }) {
  const { addTask } = useApp();
  const [inputText, setInputText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  // Updated state to use "title" matching the backend Task schema
  const [aiPreview, setAiPreview] = useState({
    title: '',
    deadline: '',
    category: 'task',
    priority: 'medium',
  });
  const scrollViewRef = useRef(null);

  // Updated to connect to FastAPI Backend
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setChatMessages([
      { role: 'user', content: inputText },
      { role: 'ai', content: 'Let me analyze your task with AI...' },
    ]);

    try {
      // 🚀 Call your FastAPI AI Engine
      const response = await axios.post(`${API_URL}/capture/`, {
        text: inputText
      });

      const parsedData = response.data;

      // Format the date for the input field preview (YYYY-MM-DD)
      const dateObj = new Date(parsedData.deadline);
      const formattedDate = dateObj.toISOString().split('T')[0];

      setAiPreview({
        title: parsedData.title,
        deadline: formattedDate,
        category: parsedData.category,
        priority: parsedData.priority,
      });

      setChatMessages((prev) => [
        ...prev.slice(0, -1), // Remove the loading message
        {
          role: 'ai',
          content: `I've analyzed your input! I detected this as a ${parsedData.category} with ${parsedData.priority} priority. The deadline is set for ${dateObj.toLocaleDateString()}. Would you like to make any changes?`,
        },
      ]);
      setShowPreview(true);
    } catch (error) {
      console.error("AI Capture Error:", error);
      Alert.alert("Error", "Could not reach the AI Engine. Please check if your FastAPI backend is running.");
      setChatMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'ai', content: 'Sorry, I had trouble connecting to the brain. Let me know if you want to try again.' }
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
        const category = text.includes('assignment')
          ? 'assignment'
          : text.includes('habit')
            ? 'habit'
            : 'task';
        setAiPreview((prev) => ({ ...prev, category }));
        aiResponse = `Category changed to ${category}! Is there anything else?`;
      } else if (text.includes('change') || text.includes('update')) {
        aiResponse = 'I can help you update the priority, deadline, or category. What would you like to change?';
      } else {
        aiResponse =
          "I'm here to help! You can ask me to change the priority, deadline, or category of your task.";
      }

      setChatMessages((prev) => [...prev, { role: 'ai', content: aiResponse }]);
    }, 800);
  };

  const handleSave = () => {
    addTask({
      title: aiPreview.title, // Changed from task to title
      deadline: new Date(aiPreview.deadline),
      category: aiPreview.category,
      priority: aiPreview.priority,
      completed: false,
    });
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {!showPreview ? (
          <View style={styles.inputSection}>
            <View style={styles.inputCard}>
              <Text style={styles.label}>Describe your task</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Example: Submit math assignment tomorrow, it's urgent and important..."
                value={inputText}
                onChangeText={setInputText}
                multiline
                numberOfLines={6}
              />
              <TouchableOpacity
                style={[styles.analyzeButton, !inputText.trim() && styles.disabledButton]}
                onPress={handleAnalyze}
                disabled={!inputText.trim() || isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <ActivityIndicator color="#fff" />
                    <Text style={styles.analyzeButtonText}>Analyzing with AI...</Text>
                  </>
                ) : (
                  <>
                    <Icon name="zap" size={20} color="#fff" />
                    <Text style={styles.analyzeButtonText}>Analyze with AI</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* AI Chat */}
            <View style={styles.chatSection}>
              <View style={styles.chatHeader}>
                <Icon name="zap" size={24} color="#9333ea" />
                <Text style={styles.chatTitle}>AI Assistant</Text>
              </View>

              <View style={styles.messagesContainer}>
                {chatMessages.map((msg, index) => (
                  <View
                    key={index}
                    style={[
                      styles.messageBubble,
                      msg.role === 'user' ? styles.userMessage : styles.aiMessage,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        msg.role === 'user' && styles.userMessageText,
                      ]}
                    >
                      {msg.content}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.chatInputContainer}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Ask AI to adjust your task..."
                  value={chatInput}
                  onChangeText={setChatInput}
                  onSubmitEditing={handleChatSend}
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleChatSend}>
                  <Icon name="send" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Task Preview */}
            <View style={styles.previewSection}>
              <View style={styles.previewHeader}>
                <Icon name="zap" size={24} color="#9333ea" />
                <Text style={styles.previewTitle}>Task Preview</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Task</Text>
                <TextInput
                  style={styles.formInput}
                  value={aiPreview.title} // Changed from task to title
                  onChangeText={(text) => setAiPreview({ ...aiPreview, title: text })} // Changed
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Deadline</Text>
                <TextInput
                  style={styles.formInput}
                  value={aiPreview.deadline}
                  onChangeText={(text) => setAiPreview({ ...aiPreview, deadline: text })}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <View style={styles.optionsRow}>
                  {['task', 'assignment', 'habit'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.optionButton,
                        aiPreview.category === cat && styles.optionButtonActive,
                      ]}
                      onPress={() => setAiPreview({ ...aiPreview, category: cat })}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          aiPreview.category === cat && styles.optionTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Priority</Text>
                <View style={styles.optionsRow}>
                  {['high', 'medium', 'low'].map((pri) => (
                    <TouchableOpacity
                      key={pri}
                      style={[
                        styles.optionButton,
                        aiPreview.priority === pri && styles.optionButtonActive,
                      ]}
                      onPress={() => setAiPreview({ ...aiPreview, priority: pri })}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          aiPreview.priority === pri && styles.optionTextActive,
                        ]}
                      >
                        {pri}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Save Task</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={() => {
                    setShowPreview(false);
                    setChatMessages([]);
                  }}
                >
                  <Text style={styles.resetButtonText}>Start Over</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1f2937',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  analyzeButton: {
    flexDirection: 'row',
    backgroundColor: '#9333ea',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  chatSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#1f2937',
  },
  messagesContainer: {
    maxHeight: 250,
    marginBottom: 15,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#9333ea',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
  },
  messageText: {
    fontSize: 14,
    color: '#1f2937',
  },
  userMessageText: {
    color: '#fff',
  },
  chatInputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#9333ea',
    width: 45,
    height: 45,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewSection: {
    backgroundColor: '#f3e8ff',
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#d8b4fe',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#1f2937',
  },
  formGroup: {
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1f2937',
  },
  formInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#9333ea',
    borderColor: '#9333ea',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  optionTextActive: {
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#9333ea',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  resetButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: 'bold',
  },
});