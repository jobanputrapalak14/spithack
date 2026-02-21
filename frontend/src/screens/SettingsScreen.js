import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function SettingsScreen({ navigation }) {
  const { user, theme, setTheme, logout } = useApp();
  const [taskReminders, setTaskReminders] = React.useState(true);
  const [dailySummary, setDailySummary] = React.useState(true);
  const [burnoutWarnings, setBurnoutWarnings] = React.useState(true);
  const [habitStreaks, setHabitStreaks] = React.useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Icon name="settings" size={32} color="#9333ea" />
          <View style={styles.headerText}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Manage your preferences</Text>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="user" size={24} color="#9333ea" />
            <Text style={styles.cardTitle}>Profile</Text>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <View style={styles.profileContent}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.name || 'User'}</Text>
                <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
              </View>
            </View>
            <Icon name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Reminder Settings */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="bell" size={24} color="#9333ea" />
            <Text style={styles.cardTitle}>Reminder Settings</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Task Reminders</Text>
              <Text style={styles.settingDescription}>
                Get notified about upcoming tasks
              </Text>
            </View>
            <Switch
              value={taskReminders}
              onValueChange={setTaskReminders}
              trackColor={{ false: '#d1d5db', true: '#c4b5fd' }}
              thumbColor={taskReminders ? '#9333ea' : '#f3f4f6'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Daily Summary</Text>
              <Text style={styles.settingDescription}>
                Receive a daily overview of your tasks
              </Text>
            </View>
            <Switch
              value={dailySummary}
              onValueChange={setDailySummary}
              trackColor={{ false: '#d1d5db', true: '#c4b5fd' }}
              thumbColor={dailySummary ? '#9333ea' : '#f3f4f6'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Burnout Warnings</Text>
              <Text style={styles.settingDescription}>
                Alert me when workload is too high
              </Text>
            </View>
            <Switch
              value={burnoutWarnings}
              onValueChange={setBurnoutWarnings}
              trackColor={{ false: '#d1d5db', true: '#c4b5fd' }}
              thumbColor={burnoutWarnings ? '#9333ea' : '#f3f4f6'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Habit Streak Reminders</Text>
              <Text style={styles.settingDescription}>
                Keep me on track with my habits
              </Text>
            </View>
            <Switch
              value={habitStreaks}
              onValueChange={setHabitStreaks}
              trackColor={{ false: '#d1d5db', true: '#c4b5fd' }}
              thumbColor={habitStreaks ? '#9333ea' : '#f3f4f6'}
            />
          </View>
        </View>

        {/* Theme Settings */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="moon" size={24} color="#9333ea" />
            <Text style={styles.cardTitle}>Theme</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Text style={styles.settingDescription}>Switch to dark theme</Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={(value) => setTheme(value ? 'dark' : 'light')}
              trackColor={{ false: '#d1d5db', true: '#c4b5fd' }}
              thumbColor={theme === 'dark' ? '#9333ea' : '#f3f4f6'}
            />
          </View>

          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                theme === 'light' && styles.themeOptionActive,
              ]}
              onPress={() => setTheme('light')}
            >
              <View style={styles.themePreview}>
                <View style={styles.lightThemePreview} />
              </View>
              <Text style={styles.themeLabel}>Light</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                theme === 'dark' && styles.themeOptionActive,
              ]}
              onPress={() => setTheme('dark')}
            >
              <View style={styles.themePreview}>
                <View style={styles.darkThemePreview} />
              </View>
              <Text style={styles.themeLabel}>Dark</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <View style={styles.logoutContent}>
              <Icon name="log-out" size={24} color="#ef4444" />
              <View style={styles.logoutInfo}>
                <Text style={styles.logoutTitle}>Sign Out</Text>
                <Text style={styles.logoutDescription}>Sign out of your account</Text>
              </View>
            </View>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  headerText: {
    marginLeft: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
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
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#1f2937',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#9333ea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 15,
  },
  themeOption: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  themeOptionActive: {
    borderColor: '#9333ea',
    backgroundColor: '#f3e8ff',
  },
  themePreview: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
  },
  lightThemePreview: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  darkThemePreview: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutInfo: {
    marginLeft: 15,
  },
  logoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  logoutDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});
