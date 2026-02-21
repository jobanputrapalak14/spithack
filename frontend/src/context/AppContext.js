import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

const AppContext = createContext(undefined);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

  // ─── Google Integration State ───
  const [googleTokens, setGoogleTokens] = useState(null);
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState([]);
  const [googleEmails, setGoogleEmails] = useState([]);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 1. Load local data (User, Notes, Theme)
      const [userData, notesData, themeData, googleTokenData] = await Promise.all([
        AsyncStorage.getItem('focusflow-user'),
        AsyncStorage.getItem('focusflow-notes'),
        AsyncStorage.getItem('focusflow-theme'),
        AsyncStorage.getItem('focusflow-google-tokens'),
      ]);

      if (userData) setUser(JSON.parse(userData));
      if (notesData) setNotes(JSON.parse(notesData));
      if (themeData) setTheme(themeData);
      if (googleTokenData) {
        const tokens = JSON.parse(googleTokenData);
        setGoogleTokens(tokens);
      }

      // 2. Fetch Tasks from FastAPI Backend
      try {
        const response = await fetch(`${API_URL}/tasks/`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const fetchedTasks = data.map((t) => ({
          ...t,
          deadline: new Date(t.deadline),
          createdAt: new Date(t.created_at || t.createdAt),
        }));
        setTasks(fetchedTasks);
      } catch (apiError) {
        console.error('API connection failed. Are you sure the backend is running?', apiError.message);
        // Fallback to local storage if API fails during demo
        const localTasks = await AsyncStorage.getItem('focusflow-tasks-fallback');
        if (localTasks) setTasks(JSON.parse(localTasks));
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save user locally
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        AsyncStorage.setItem('focusflow-user', JSON.stringify(user));
      } else {
        AsyncStorage.removeItem('focusflow-user');
      }
    }
  }, [user, isLoading]);

  // Save tasks locally as a fallback just in case the backend crashes
  useEffect(() => {
    if (!isLoading && tasks.length > 0) {
      AsyncStorage.setItem('focusflow-tasks-fallback', JSON.stringify(tasks));
    }
  }, [tasks, isLoading]);

  // Save notes locally
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('focusflow-notes', JSON.stringify(notes));
    }
  }, [notes, isLoading]);

  // Save theme locally
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('focusflow-theme', theme);
    }
  }, [theme, isLoading]);

  // ─── Google: Auto-fetch when tokens are available ───
  useEffect(() => {
    if (googleTokens && !isLoading) {
      fetchGoogleCalendar();
      fetchGoogleEmails();
    }
  }, [googleTokens, isLoading]);

  // ─── Google: Connect ───
  const connectGoogle = async (tokens) => {
    setGoogleTokens(tokens);
    await AsyncStorage.setItem('focusflow-google-tokens', JSON.stringify(tokens));
  };

  // ─── Google: Disconnect ───
  const disconnectGoogle = async () => {
    setGoogleTokens(null);
    setGoogleCalendarEvents([]);
    setGoogleEmails([]);
    await AsyncStorage.removeItem('focusflow-google-tokens');
  };

  // ─── Google: Fetch Calendar Events ───
  const fetchGoogleCalendar = async () => {
    if (!googleTokens?.accessToken) return;
    setGoogleLoading(true);
    try {
      const response = await fetch(`${API_URL}/google/calendar/events`, {
        headers: { Authorization: `Bearer ${googleTokens.accessToken}` },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setGoogleCalendarEvents(data);
    } catch (error) {
      console.error('Failed to fetch Google Calendar events:', error);
    } finally {
      setGoogleLoading(false);
    }
  };

  // ─── Google: Fetch Gmail Messages ───
  const fetchGoogleEmails = async () => {
    if (!googleTokens?.accessToken) return;
    setGoogleLoading(true);
    try {
      const response = await fetch(`${API_URL}/google/gmail/messages`, {
        headers: { Authorization: `Bearer ${googleTokens.accessToken}` },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setGoogleEmails(data);
    } catch (error) {
      console.error('Failed to fetch Gmail messages:', error);
    } finally {
      setGoogleLoading(false);
    }
  };

  // API Call: Add Task
  const addTask = async (task) => {
    try {
      // Ensure deadline is an ISO string before sending
      const payload = {
        ...task,
        deadline: task.deadline instanceof Date ? task.deadline.toISOString() : task.deadline
      };

      const response = await fetch(`${API_URL}/tasks/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      const newTask = {
        ...data,
        deadline: new Date(data.deadline),
        createdAt: new Date(data.created_at || new Date()),
      };

      setTasks((prev) => [...prev, newTask]);
    } catch (error) {
      console.error('Failed to add task via API:', error);
    }
  };

  // API Call: Update Task
  const updateTask = async (id, updates) => {
    // Optimistic UI Update (updates UI instantly while background syncs)
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updates } : task))
    );

    try {
      const payload = { ...updates };
      if (payload.deadline && payload.deadline instanceof Date) {
        payload.deadline = payload.deadline.toISOString();
      }

      const response = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      console.error('Failed to update task via API:', error);
      // If API fails, reload from server to fix state mismatch
      loadData();
    }
  };

  // API Call: Delete Task
  const deleteTask = async (id) => {
    // Optimistic UI Update
    setTasks((prev) => prev.filter((task) => task.id !== id));

    try {
      const response = await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      console.error('Failed to delete task via API:', error);
      loadData(); // Revert on failure
    }
  };

  const addNote = (note) => {
    const newNote = {
      ...note,
      id: Date.now().toString(),
    };
    setNotes((prev) => [...prev, newNote]);
  };

  const login = (email, password) => {
    if (email && password) {
      setUser({
        id: '1',
        name: email.split('@')[0],
        email,
      });
      return true;
    }
    return false;
  };

  const signup = (name, email, password) => {
    if (name && email && password) {
      setUser({
        id: Date.now().toString(),
        name,
        email,
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        tasks,
        addTask,
        updateTask,
        deleteTask,
        notes,
        addNote,
        theme,
        setTheme,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        isLoading,
        // Google Integration
        googleTokens,
        googleCalendarEvents,
        googleEmails,
        googleLoading,
        connectGoogle,
        disconnectGoogle,
        fetchGoogleCalendar,
        fetchGoogleEmails,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}