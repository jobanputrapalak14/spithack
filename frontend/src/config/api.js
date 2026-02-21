import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Set your machine's WiFi IP here for physical device fallback
const MACHINE_IP = '10.10.53.57';
//10.10.53.74

const PORT = 8000;


function getBaseUrl() {
  // Running in web browser
  if (Platform.OS === 'web') {
    return `http://localhost:${PORT}/api`;
  }

  // Expo Go: use debuggerHost to auto-detect the dev machine IP
  const debuggerHost =
    Constants.expoConfig?.hostUri ??
    Constants.manifest2?.extra?.expoGo?.debuggerHost ??
    Constants.manifest?.debuggerHost;

  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:${PORT}/api`;
  }

  // Fallback for physical device / production
  return `http://${MACHINE_IP}:${PORT}/api`;
}

export const API_URL = getBaseUrl();
