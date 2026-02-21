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
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="SmartCapture"
            component={SmartCaptureScreen}
            options={{
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
