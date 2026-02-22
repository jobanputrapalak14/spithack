import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import InsightsScreen from '../screens/InsightsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SmartCaptureScreen from '../screens/SmartCaptureScreen';
import { useApp } from '../context/AppContext';

const Tab = createBottomTabNavigator();

function SmartCaptureButton({ children, onPress, isDark }) {
  return (
    <TouchableOpacity
      style={styles.plusButtonContainer}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={isDark ? ['#a855f7', '#7c3aed', '#6d28d9'] : ['#c084fc', '#9333ea', '#7c3aed']}
        style={styles.plusButton}
      >
        <Icon name="plus" size={28} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

/**
 * Wrapper that adds a fade + slight slide animation every time a tab is focused.
 */
function AnimatedTabScreen({ children }) {
  const isFocused = useIsFocused();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    if (isFocused) {
      fadeAnim.setValue(0);
      slideAnim.setValue(18);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFocused]);

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {children}
    </Animated.View>
  );
}

// Wrap each screen component in AnimatedTabScreen
function AnimatedHome(props) {
  return (
    <AnimatedTabScreen>
      <HomeScreen {...props} />
    </AnimatedTabScreen>
  );
}
function AnimatedCalendar(props) {
  return (
    <AnimatedTabScreen>
      <CalendarScreen {...props} />
    </AnimatedTabScreen>
  );
}
function AnimatedSmartCapture(props) {
  return (
    <AnimatedTabScreen>
      <SmartCaptureScreen {...props} />
    </AnimatedTabScreen>
  );
}
function AnimatedInsights(props) {
  return (
    <AnimatedTabScreen>
      <InsightsScreen {...props} />
    </AnimatedTabScreen>
  );
}
function AnimatedSettings(props) {
  return (
    <AnimatedTabScreen>
      <SettingsScreen {...props} />
    </AnimatedTabScreen>
  );
}

export default function MainTabs() {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Calendar') {
            iconName = 'calendar';
          } else if (route.name === 'SmartCapture') {
            iconName = 'plus';
          } else if (route.name === 'Insights') {
            iconName = 'trending-up';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#9333ea',
        tabBarInactiveTintColor: isDark ? '#6b5b8a' : 'gray',
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
          backgroundColor: isDark ? '#1a1333' : '#fff',
          borderTopColor: isDark ? '#2d2250' : '#f3f0f8',
          borderTopWidth: 1,
        },
      })}
    >
      <Tab.Screen name="Home" component={AnimatedHome} />
      <Tab.Screen name="Calendar" component={AnimatedCalendar} />
      <Tab.Screen
        name="SmartCapture"
        component={AnimatedSmartCapture}
        options={{
          tabBarLabel: () => null,
          tabBarButton: (props) => <SmartCaptureButton {...props} isDark={isDark} />,
        }}
      />
      <Tab.Screen name="Insights" component={AnimatedInsights} />
      <Tab.Screen name="Settings" component={AnimatedSettings} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  plusButtonContainer: {
    top: -18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9333ea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
});
