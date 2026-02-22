import 'react-native-get-random-values';
import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppProvider } from './src/context/AppContext';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import MainTabs from './src/navigation/MainTabs';
import SmartCaptureScreen from './src/screens/SmartCaptureScreen';
import WorkspaceScreen from './src/screens/WorkspaceScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" />
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 300,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        >
          <Stack.Screen
            name="Splash"
            component={SplashScreen}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ animation: 'fade_from_bottom' }}
          />
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen
            name="SmartCapture"
            component={SmartCaptureScreen}
            options={{
              animation: 'slide_from_bottom',
              headerShown: true,
              title: 'Smart Capture',
              headerStyle: { backgroundColor: '#9333ea' },
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="Workspace"
            component={WorkspaceScreen}
            options={{
              animation: 'slide_from_right',
              headerShown: true,
              title: 'Workspace',
              headerStyle: { backgroundColor: '#9333ea' },
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{
              animation: 'slide_from_bottom',
              headerShown: true,
              title: 'Edit Profile',
              headerStyle: { backgroundColor: '#9333ea' },
              headerTintColor: '#fff',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
