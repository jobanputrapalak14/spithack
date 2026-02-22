import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert, Animated, ActivityIndicator } from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

// Your actual Google Client ID from Google Cloud Console
const GOOGLE_CLIENT_ID = '1058825657468-v0g6smcjlgkqplrce4pblm21dj3pp939.apps.googleusercontent.com';

const discovery = AuthSession.useAutoDiscovery ? undefined : {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export default function SettingsScreen({ navigation }) {
  const { user, theme, setTheme, logout, googleTokens, connectGoogle, disconnectGoogle, googleLoading } = useApp();
  const [taskReminders, setTaskReminders] = React.useState(true);
  const [dailySummary, setDailySummary] = React.useState(true);
  const [burnoutWarnings, setBurnoutWarnings] = React.useState(true);
  const [habitStreaks, setHabitStreaks] = React.useState(false);
  const [reminderCall, setReminderCall] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);

  const isDark = theme === 'dark';
  const colors = isDark
    ? { bg1: '#0f0a1e', bg2: '#1a1333', bg3: '#1a1333', bg4: '#251d3d', card: 'rgba(37,29,61,0.9)', cardBorder: 'rgba(147,51,234,0.2)', text: '#f3e8ff', textSub: '#a78bca', settingBorder: '#2d2250' }
    : { bg1: '#e8d5f5', bg2: '#f0e0f7', bg3: '#fce4ec', bg4: '#f8d7e8', card: 'rgba(255,255,255,0.5)', cardBorder: 'rgba(147,51,234,0.08)', text: '#1f2937', textSub: '#7c6f8a', settingBorder: '#f3f0f8' };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, []);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { logout(); navigation.replace('Login'); } },
    ]);
  };

  // ─── Google OAuth Flow ───
  const handleGoogleConnect = async () => {
    setConnecting(true);
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'focusflow',
        preferLocalhost: true,
      });

      console.log('Redirect URI:', redirectUri);

      const authRequest = new AuthSession.AuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        scopes: [
          'https://www.googleapis.com/auth/calendar.readonly',
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
        ],
        redirectUri,
        responseType: AuthSession.ResponseType.Token,
        usePKCE: false,
      });

      const googleDiscovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
        revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
      };

      const result = await authRequest.promptAsync(googleDiscovery);

      console.log('Auth result:', JSON.stringify(result, null, 2));

      if (result.type === 'success') {
        const accessToken = result.params?.access_token || result.authentication?.accessToken;
        if (accessToken) {
          await connectGoogle({ accessToken });
          Alert.alert('✅ Connected!', 'Google Calendar & Gmail linked successfully.');
        } else {
          console.error('No access token in result:', result);
          Alert.alert('Error', 'No access token received. Check console for details.');
        }
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        // User cancelled, do nothing
      } else {
        console.error('Auth failed:', result);
        Alert.alert('Connection Failed', `Could not connect to Google. Result type: ${result.type}`);
      }
    } catch (error) {
      console.error('Google Auth Error:', error);
      Alert.alert('Error', `Something went wrong: ${error.message}`);
    } finally {
      setConnecting(false);
    }
  };

  const handleGoogleDisconnect = () => {
    Alert.alert('Disconnect Google', 'This will remove access to your Calendar & Gmail data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: () => disconnectGoogle() },
    ]);
  };

  const SettingToggle = ({ label, description, value, onValueChange }) => (
    <View style={[styles.settingItem, { borderBottomColor: colors.settingBorder }]}>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.settingDescription, { color: colors.textSub }]}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: isDark ? '#3d2e5c' : '#d1d5db', true: '#c4b5fd' }}
        thumbColor={value ? '#9333ea' : isDark ? '#6b5b8a' : '#f3f4f6'}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bg1, colors.bg2, colors.bg3, colors.bg4]}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>

            {/* ─── Header ─── */}
            <View style={styles.header}>
              <LinearGradient colors={isDark ? ['#2d2250', '#3d2e5c'] : ['#f3e8ff', '#ede9fe']} style={styles.headerIcon}>
                <Icon name="settings" size={22} color="#9333ea" />
              </LinearGradient>
              <View style={styles.headerTextWrap}>
                <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
                <Text style={[styles.subtitle, { color: colors.textSub }]}>Manage your preferences</Text>
              </View>
            </View>

            {/* ─── Profile ─── */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.sectionHeader}>
                <LinearGradient colors={isDark ? ['#2d2250', '#3d2e5c'] : ['#f3e8ff', '#ede9fe']} style={styles.smallIcon}>
                  <Icon name="user" size={15} color="#9333ea" />
                </LinearGradient>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile</Text>
              </View>

              <TouchableOpacity
                style={styles.profileRow}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: colors.text }]}>{user?.name || 'User'}</Text>
                  <Text style={[styles.profileEmail, { color: colors.textSub }]}>{user?.name || 'user'}</Text>
                </View>
                <Icon name="chevron-right" size={20} color={colors.textSub} />
              </TouchableOpacity>
            </View>

            {/* ─── Connected Accounts (Google) ─── */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.sectionHeader}>
                <LinearGradient colors={isDark ? ['#1a2744', '#1e3a5f'] : ['#e8f0fe', '#d2e3fc']} style={styles.smallIcon}>
                  <Icon name="link" size={15} color="#4285F4" />
                </LinearGradient>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Connected Accounts</Text>
              </View>

              {/* Google Account Row */}
              <View style={[styles.googleRow, { borderBottomColor: colors.settingBorder }]}>
                <View style={styles.googleInfo}>
                  <View style={styles.googleIconRow}>
                    <View style={[styles.googleLogoWrap, { backgroundColor: isDark ? '#1a2744' : '#e8f0fe' }]}>
                      <Text style={styles.googleLogoText}>G</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.settingLabel, { color: colors.text }]}>Google</Text>
                      <Text style={[styles.settingDescription, { color: colors.textSub }]}>
                        Calendar & Gmail
                      </Text>
                    </View>
                  </View>
                </View>

                {googleTokens ? (
                  <View style={styles.googleActions}>
                    <View style={styles.connectedBadge}>
                      <Icon name="check-circle" size={12} color="#22c55e" />
                      <Text style={styles.connectedText}>Connected</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.disconnectBtn, isDark && { borderColor: '#3d2e5c' }]}
                      activeOpacity={0.7}
                      onPress={handleGoogleDisconnect}
                    >
                      <Text style={[styles.disconnectText, { color: isDark ? '#fca5a5' : '#ef4444' }]}>Disconnect</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.connectBtn}
                    activeOpacity={0.8}
                    onPress={handleGoogleConnect}
                    disabled={connecting}
                  >
                    {connecting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Icon name="log-in" size={14} color="#fff" />
                        <Text style={styles.connectBtnText}>Connect</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {googleTokens && (
                <View style={styles.googleSyncInfo}>
                  <Icon name="refresh-cw" size={12} color={colors.textSub} />
                  <Text style={[styles.syncText, { color: colors.textSub }]}>
                    {googleLoading ? 'Syncing...' : 'Synced • Calendar & Gmail data available'}
                  </Text>
                </View>
              )}
            </View>

            {/* ─── Permission ─── */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.sectionHeader}>
                <LinearGradient colors={isDark ? ['#2d2250', '#3d2e5c'] : ['#f3e8ff', '#ede9fe']} style={styles.smallIcon}>
                  <Icon name="bell" size={15} color="#9333ea" />
                </LinearGradient>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Permission</Text>
              </View>

              <SettingToggle
                label="Task Reminders"
                description="Get notified about upcoming tasks"
                value={taskReminders}
                onValueChange={setTaskReminders}
              />
              <SettingToggle
                label="Daily Summary"
                description="Receive a daily overview"
                value={dailySummary}
                onValueChange={setDailySummary}
              />
              <SettingToggle
                label="Burnout Warnings"
                description="Alert when workload is too high"
                value={burnoutWarnings}
                onValueChange={setBurnoutWarnings}
              />
              <SettingToggle
                label="Habit Streak Reminders"
                description="Keep on track with habits"
                value={habitStreaks}
                onValueChange={setHabitStreaks}
              />
              <SettingToggle
                label="Reminder Call"
                description="Allow phone call reminders for deadlines"
                value={reminderCall}
                onValueChange={setReminderCall}
              />
            </View>

            {/* ─── Theme ─── */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.sectionHeader}>
                <LinearGradient colors={isDark ? ['#2d2250', '#3d2e5c'] : ['#fef3c7', '#fde68a']} style={styles.smallIcon}>
                  <Icon name="moon" size={15} color={isDark ? '#a78bca' : '#d97706'} />
                </LinearGradient>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Theme</Text>
              </View>

              <View style={[styles.settingItem, { borderBottomColor: 'transparent' }]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSub }]}>
                    Currently: <Text style={{ color: '#9333ea', fontWeight: '600' }}>{isDark ? 'Dark' : 'Light'}</Text>
                  </Text>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={(v) => setTheme(v ? 'dark' : 'light')}
                  trackColor={{ false: '#d1d5db', true: '#c4b5fd' }}
                  thumbColor={isDark ? '#9333ea' : '#f3f4f6'}
                />
              </View>

              <View style={styles.themeOptions}>
                {/* Light Preview */}
                <TouchableOpacity
                  style={[styles.themeCard, !isDark && styles.themeCardActive]}
                  activeOpacity={0.8}
                  onPress={() => setTheme('light')}
                >
                  <View style={styles.themePreview}>
                    <View style={styles.lightPreviewBar} />
                    <View style={styles.lightPreviewLine1} />
                    <View style={styles.lightPreviewLine2} />
                  </View>
                  <View style={styles.themeLabelRow}>
                    {!isDark && <Icon name="check-circle" size={14} color="#9333ea" style={{ marginRight: 4 }} />}
                    <Text style={[styles.themeLabel, !isDark && { color: '#9333ea' }]}>Light</Text>
                  </View>
                </TouchableOpacity>

                {/* Dark Preview */}
                <TouchableOpacity
                  style={[styles.themeCard, isDark && styles.themeCardActive]}
                  activeOpacity={0.8}
                  onPress={() => setTheme('dark')}
                >
                  <View style={[styles.themePreview, { backgroundColor: '#1a1333' }]}>
                    <View style={[styles.lightPreviewBar, { backgroundColor: '#7c3aed' }]} />
                    <View style={[styles.lightPreviewLine1, { backgroundColor: '#3d2e5c' }]} />
                    <View style={[styles.lightPreviewLine2, { backgroundColor: '#2d2250' }]} />
                  </View>
                  <View style={styles.themeLabelRow}>
                    {isDark && <Icon name="check-circle" size={14} color="#9333ea" style={{ marginRight: 4 }} />}
                    <Text style={[styles.themeLabel, isDark && { color: '#9333ea' }]}>Dark</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* ─── Sign Out ─── */}
            <TouchableOpacity
              style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              activeOpacity={0.7}
              onPress={handleLogout}
            >
              <View style={styles.logoutRow}>
                <View style={styles.logoutIconWrap}>
                  <Icon name="log-out" size={18} color="#ef4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logoutTitle}>Sign Out</Text>
                  <Text style={[styles.logoutDesc, { color: colors.textSub }]}>Sign out of your account</Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={{ height: 30 }} />
          </Animated.View>
        </ScrollView>
      </LinearGradient>
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
    paddingHorizontal: 22, paddingTop: 56, paddingBottom: 10,
  },
  headerIcon: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTextWrap: { marginLeft: 14 },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },

  /* ── Section Card ── */
  sectionCard: {
    marginHorizontal: 20, marginTop: 14, padding: 18,
    borderRadius: 18, borderWidth: 1,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  smallIcon: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center', marginRight: 9,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700' },

  /* ── Profile ── */
  profileRow: {
    flexDirection: 'row', alignItems: 'center',
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#9333ea',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#9333ea', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 5, elevation: 4,
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  profileInfo: { flex: 1, marginLeft: 14 },
  profileName: { fontSize: 17, fontWeight: '700' },
  profileEmail: { fontSize: 13, marginTop: 1 },

  /* ── Google Connected Accounts ── */
  googleRow: {
    paddingBottom: 12,
  },
  googleInfo: { flex: 1 },
  googleIconRow: { flexDirection: 'row', alignItems: 'center' },
  googleLogoWrap: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  googleLogoText: {
    fontSize: 18, fontWeight: '800', color: '#4285F4',
  },
  googleActions: {
    flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10,
  },
  connectedBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(34,197,94,0.12)', paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: 8,
  },
  connectedText: {
    fontSize: 12, fontWeight: '600', color: '#22c55e', marginLeft: 4,
  },
  disconnectBtn: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8,
    borderWidth: 1, borderColor: '#fecaca',
  },
  disconnectText: { fontSize: 12, fontWeight: '600' },
  connectBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#4285F4', paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 10, marginTop: 10,
    alignSelf: 'flex-start',
    shadowColor: '#4285F4', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  connectBtnText: { color: '#fff', fontWeight: '700', fontSize: 13, marginLeft: 6 },
  googleSyncInfo: {
    flexDirection: 'row', alignItems: 'center', marginTop: 8,
  },
  syncText: { fontSize: 11, marginLeft: 6 },

  /* ── Settings Toggle ── */
  settingItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingInfo: { flex: 1, marginRight: 12 },
  settingLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  settingDescription: { fontSize: 12 },

  /* ── Theme ── */
  themeOptions: { flexDirection: 'row', gap: 14, marginTop: 10 },
  themeCard: {
    flex: 1, padding: 10, borderRadius: 14,
    borderWidth: 2, borderColor: '#e5e7eb', alignItems: 'center',
  },
  themeCardActive: { borderColor: '#9333ea', backgroundColor: 'rgba(147,51,234,0.06)' },
  themePreview: {
    width: '100%', height: 70, borderRadius: 10,
    backgroundColor: '#f8f9fa', overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center', padding: 10,
    marginBottom: 8,
  },
  lightPreviewBar: {
    width: '80%', height: 8, borderRadius: 4,
    backgroundColor: '#9333ea', marginBottom: 8,
  },
  lightPreviewLine1: {
    width: '70%', height: 5, borderRadius: 3,
    backgroundColor: '#d1d5db', marginBottom: 5, alignSelf: 'flex-start',
  },
  lightPreviewLine2: {
    width: '50%', height: 5, borderRadius: 3,
    backgroundColor: '#e5e7eb', alignSelf: 'flex-start',
  },
  themeLabelRow: { flexDirection: 'row', alignItems: 'center' },
  themeLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280' },

  /* ── Logout ── */
  logoutRow: { flexDirection: 'row', alignItems: 'center' },
  logoutIconWrap: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#fef2f2',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  logoutTitle: { fontSize: 16, fontWeight: '700', color: '#ef4444' },
  logoutDesc: { fontSize: 12, marginTop: 1 },
});
