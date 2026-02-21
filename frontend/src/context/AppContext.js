import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// ⚠️ UPDATE THIS URL based on your environment:
// - Android Emulator: 'http://10.0.2.2:8000/api'
// - iOS Simulator: 'http://localhost:8000/api'
// - Physical Device: 'http://<YOUR_COMPUTER_WIFI_IP>:8000/api'
const API_URL = 'http://10.10.53.72:8000/api';

const AppContext = createContext(undefined);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 1. Load local data (User, Notes, Theme)
      const [userData, notesData, themeData] = await Promise.all([
        AsyncStorage.getItem('focusflow-user'),
        AsyncStorage.getItem('focusflow-notes'),
        AsyncStorage.getItem('focusflow-theme'),
      ]);

      if (userData) setUser(JSON.parse(userData));
      if (notesData) setNotes(JSON.parse(notesData));
      if (themeData) setTheme(themeData);

      // 2. Fetch Tasks from FastAPI Backend
      try {
        const response = await axios.get(`${API_URL}/tasks/`);
        const fetchedTasks = response.data.map((t) => ({
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

  // API Call: Add Task
  const addTask = async (task) => {
    try {
      // Ensure deadline is an ISO string before sending
      const payload = {
        ...task,
        deadline: task.deadline instanceof Date ? task.deadline.toISOString() : task.deadline
      };

      const response = await axios.post(`${API_URL}/tasks/`, payload);

      const newTask = {
        ...response.data,
        deadline: new Date(response.data.deadline),
        createdAt: new Date(response.data.created_at || new Date()),
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

      await axios.patch(`${API_URL}/tasks/${id}`, payload);
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
      await axios.delete(`${API_URL}/tasks/${id}`);
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