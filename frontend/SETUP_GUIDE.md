# FocusFlow React Native - Complete Setup Guide

## 📱 About This App

This is a **complete React Native mobile application** built with **JavaScript** (no TypeScript). It includes all the features you requested:

### ✅ Implemented Features

1. **JavaScript Tech Stack** - 100% JavaScript, no TypeScript
2. **AI Suggestions with Accept/Decline** - Interactive popup with automatic task updates
3. **Reactive AI Chat** - Real-time chat interface in Smart Capture screen
4. **Bottom Navigation Bar** - Native-feeling tab bar at the bottom
5. **Edit Profile Page** - Separate page with Save button (not in settings)
6. **All Core Features**:
   - Splash Screen
   - Login/Signup
   - Home Dashboard with AI
   - Smart Capture with AI Chat
   - Calendar with Heatmap
   - Workspace Pages
   - Insights & Analytics
   - Settings
   - Profile Management

## 🚀 Quick Start

### Option 1: Using Expo (Recommended - Easiest)

```bash
# 1. Install Expo CLI globally
npm install -g expo-cli

# 2. Navigate to the project
cd REACT_NATIVE_APP

# 3. Install dependencies
npm install

# 4. Start the app
expo start
```

Then:
- Press `i` to open iOS Simulator (Mac only)
- Press `a` to open Android Emulator
- Scan QR code with Expo Go app on your phone

### Option 2: Using React Native CLI

```bash
# 1. Navigate to the project
cd REACT_NATIVE_APP

# 2. Install dependencies
npm install

# 3. Install iOS dependencies (Mac only)
cd ios && pod install && cd ..

# 4. Run the app
# For iOS:
npx react-native run-ios

# For Android:
npx react-native run-android
```

## 📦 Required Dependencies

All dependencies are listed in `package.json`. Here's what the app uses:

### Core
- `react-native` - Mobile framework
- `react` - JavaScript library

### Navigation
- `@react-navigation/native` - Navigation library
- `@react-navigation/native-stack` - Stack navigator
- `@react-navigation/bottom-tabs` - Bottom tab navigator
- `react-native-screens` - Native screen components
- `react-native-safe-area-context` - Safe area handling

### Storage & State
- `@react-native-async-storage/async-storage` - Local storage

### UI Components
- `react-native-vector-icons` - Icon library (Feather icons)
- `react-native-linear-gradient` - Gradient backgrounds

### Expo (if using Expo)
- `expo` - Expo SDK
- `expo-status-bar` - Status bar component

## 📁 Project Structure

```
REACT_NATIVE_APP/
│
├── App.js                              # Main entry point
├── package.json                        # Dependencies
│
├── src/
│   ├── context/
│   │   └── AppContext.js              # Global state (AsyncStorage)
│   │
│   ├── navigation/
│   │   └── MainTabs.js                # Bottom tab navigator
│   │
│   └── screens/
│       ├── SplashScreen.js            # Animated splash
│       ├── LoginScreen.js             # Login with gradients
│       ├── SignupScreen.js            # Signup
│       ├── HomeScreen.js              # Dashboard + AI suggestions modal
│       ├── SmartCaptureScreen.js      # AI chat for task creation
│       ├── CalendarScreen.js          # Heatmap calendar
│       ├── WorkspaceScreen.js         # Day workspace
│       ├── InsightsScreen.js          # Analytics
│       ├── SettingsScreen.js          # Settings (view profile)
│       └── EditProfileScreen.js       # Edit profile (save button)
```

## 🎨 Key Features Explained

### 1. AI Suggestions (HomePage)
```javascript
// Appears when workload is high
// Click "Get AI Suggestions" button
// Modal shows suggestions
// Accept/Decline buttons
// Accept automatically updates tasks
```

**Location:** `src/screens/HomeScreen.js`
- Shows burnout warning when workload > 50
- Generates smart suggestions
- Modal with accept/decline options
- Automatic task updates on accept

### 2. AI Chat (Smart Capture)
```javascript
// Type task description
// AI analyzes automatically
// Chat interface appears
// Ask AI to change priority, deadline, category
// Real-time preview updates
```

**Location:** `src/screens/SmartCaptureScreen.js`
- Natural language processing
- Interactive chat bubbles
- Live preview updates
- Multiple input options

### 3. Bottom Navigation
```javascript
// Native bottom tabs
// Home, Calendar, Insights, Settings
// Active state highlighting
// Smooth transitions
```

**Location:** `src/navigation/MainTabs.js`
- Uses `@react-navigation/bottom-tabs`
- Feather icons
- Purple accent color (#9333ea)

### 4. Edit Profile (Separate Page)
```javascript
// Settings shows "view only" profile
// Tap to navigate to edit page
// Edit page has Save/Cancel buttons
// AsyncStorage persistence
```

**Location:** `src/screens/EditProfileScreen.js`
- Separate from settings
- Save button in edit screen only
- Full form validation

## 🔧 Customization Guide

### Change Colors

Edit the hex values in component StyleSheets:

```javascript
// Primary Purple
'#9333ea' -> Your color

// Success Green
'#22c55e' -> Your color

// Warning Orange
'#f97316' -> Your color

// Danger Red
'#ef4444' -> Your color
```

### Add New Screen

1. Create file in `src/screens/YourScreen.js`
2. Add route in `App.js`:
```javascript
<Stack.Screen 
  name="YourScreen" 
  component={YourScreen}
  options={{ title: 'Your Title' }}
/>
```

### Modify AI Behavior

Edit `src/screens/SmartCaptureScreen.js`:
```javascript
// Line ~30-60: handleAnalyze function
// Customize task detection logic

// Line ~80-100: handleChatSend function
// Customize AI responses
```

## 🐛 Troubleshooting

### Icons Not Showing (iOS)

```bash
cd ios
pod install
cd ..
npx react-native link react-native-vector-icons
```

### Icons Not Showing (Android)

Add to `android/app/build.gradle`:
```gradle
apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"
```

### Gradients Not Working

```bash
# iOS
cd ios && pod install && cd ..

# Android - should work out of the box

# Link manually if needed
npx react-native link react-native-linear-gradient
```

### AsyncStorage Issues

```bash
npm install @react-native-async-storage/async-storage

# iOS
cd ios && pod install && cd ..

# Android - should work automatically
```

### Navigation Errors

Make sure all navigation packages are installed:
```bash
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context
```

### Metro Bundler Issues

```bash
# Clear cache
npx react-native start --reset-cache

# Or
watchman watch-del-all
rm -rf node_modules
npm install
```

## 📱 Testing the App

### Features to Test

1. **Splash Screen**
   - App opens → Splash shows → Redirects to Login/Home

2. **Authentication**
   - Sign up with any credentials
   - Login with email/password
   - Logout from settings

3. **AI Suggestions**
   - Go to Home
   - If workload warning shows, click "Get AI Suggestions"
   - Accept/Decline suggestions
   - Verify task updates

4. **AI Chat**
   - Click "Quick Add Task" or FAB
   - Type task description
   - Click "Analyze with AI"
   - Chat with AI to modify task
   - Save task

5. **Calendar**
   - View monthly calendar
   - See color-coded workload
   - Tap dates to open workspace

6. **Bottom Navigation**
   - Verify all 4 tabs work
   - Check active state highlighting

7. **Edit Profile**
   - Go to Settings
   - Tap profile section
   - Edit name/email
   - Save changes
   - Verify persistence

## 📊 Data Persistence

The app uses **AsyncStorage** for all data:

```javascript
// Stored data:
- 'focusflow-user' → User info
- 'focusflow-tasks' → All tasks
- 'focusflow-notes' → All notes
- 'focusflow-theme' → Theme preference

// Data persists across:
- App restarts
- Device reboots
- Updates
```

To clear data:
```javascript
// Add to AppContext.js temporarily:
AsyncStorage.clear();
```

## 🚢 Building for Production

### iOS

```bash
# 1. Open Xcode
cd ios
open FocusFlow.xcworkspace

# 2. Select "Any iOS Device" or your device
# 3. Product → Archive
# 4. Upload to App Store Connect
```

### Android

```bash
# 1. Generate signing key
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# 2. Build APK
cd android
./gradlew assembleRelease

# 3. Find APK at:
# android/app/build/outputs/apk/release/app-release.apk
```

## 🔐 Environment Variables (Optional)

For real AI API integration, create `.env`:

```env
OPENAI_API_KEY=your_key_here
API_BASE_URL=https://api.example.com
```

Then use in code:
```javascript
import { OPENAI_API_KEY } from '@env';
```

## 📝 Next Steps

After basic setup, consider:

1. **Real AI Integration**
   - Replace mock AI with OpenAI API
   - Add API key management

2. **Push Notifications**
   - Install `@notifee/react-native`
   - Set up notification service

3. **Cloud Sync**
   - Integrate Firebase or Supabase
   - Sync tasks across devices

4. **Native Features**
   - Calendar integration
   - Biometric authentication
   - Widgets

5. **Performance**
   - Add loading states
   - Implement pagination
   - Optimize re-renders

## 🆘 Getting Help

If you encounter issues:

1. Check this guide first
2. Read error messages carefully
3. Google the specific error
4. Check React Native documentation
5. Check library-specific docs

## 📄 License

MIT License - Free to use and modify

---

## ✨ You're All Set!

Your React Native FocusFlow app is ready to go! 

Run `expo start` or `npx react-native run-ios/android` and start testing all the features.

**Happy coding! 🚀**
