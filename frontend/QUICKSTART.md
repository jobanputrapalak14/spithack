# 🚀 Quick Start - FocusFlow React Native

## ⚡ Get Running in 5 Minutes

### Step 1: Prerequisites Check

Make sure you have:
- ✅ Node.js installed (v16+)
- ✅ npm or yarn installed
- ✅ A code editor (VS Code recommended)
- ✅ Either:
  - Expo Go app on your phone (easiest), OR
  - iOS Simulator (Mac only), OR
  - Android Emulator

### Step 2: Navigate to Project

```bash
cd REACT_NATIVE_APP
```

### Step 3: Install Dependencies

```bash
npm install
```

This will install all required packages (~2-3 minutes).

### Step 4: Start the App

**Using Expo (Recommended):**

```bash
npm start
```

Then:
1. Scan the QR code with your phone's camera (iOS) or Expo Go app (Android)
2. OR press `i` for iOS simulator
3. OR press `a` for Android emulator

**Using React Native CLI:**

```bash
# iOS (Mac only)
npm run ios

# Android
npm run android
```

### Step 5: Test the Features

1. **Login**: Use any email/password
2. **Home**: Click "Get AI Suggestions" if warning shows
3. **Smart Capture**: Test AI chat
4. **Calendar**: View workload heatmap
5. **Settings**: Test theme toggle
6. **Profile**: Edit and save

## 🎯 Key Features to Test

### AI Suggestions (Home Screen)
- Look for red "Workload Alert" card
- Click "Get AI Suggestions"
- Click "Accept" on a suggestion
- ✅ Task updates automatically!

### AI Chat (Smart Capture)
- Click "+ Quick Add Task" button
- Type: "Submit math assignment tomorrow, it's urgent"
- Click "Analyze with AI"
- Chat with AI: "Change priority to high"
- ✅ Preview updates in real-time!

### Bottom Navigation
- ✅ Tap each tab at the bottom
- ✅ See active state highlighting

### Edit Profile
- Go to Settings tab
- Tap on your profile card (with avatar)
- Edit your name
- Click "Save Changes"
- ✅ Changes persist!

## 📱 App Flow

```
Splash Screen (2s)
    ↓
Login Screen
    ↓
Home (Main Tabs)
    ├── Home Tab
    ├── Calendar Tab
    ├── Insights Tab
    └── Settings Tab
```

## 🎨 Color Scheme

- **Primary**: Purple (#9333ea)
- **Success**: Green (#22c55e)
- **Warning**: Orange (#f97316)
- **Danger**: Red (#ef4444)

## 📝 Default Test Data

The app comes with pre-loaded tasks:
- "Complete React Project" - High priority
- "Study for Math Exam" - High priority
- "Morning Exercise" - Medium priority (completed)

## 🔧 Common Issues & Solutions

### "Metro Bundler not running"
```bash
npm start -- --reset-cache
```

### "Icons not showing"
```bash
# This is normal on first run
# Install the icon package:
npm install react-native-vector-icons

# For iOS:
cd ios && pod install && cd ..
```

### "AsyncStorage not found"
```bash
npm install @react-native-async-storage/async-storage
cd ios && pod install && cd ..
```

### "Navigation error"
```bash
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
cd ios && pod install && cd ..
```

## 📖 File Overview

| File | Purpose |
|------|---------|
| `App.js` | Main app entry, navigation setup |
| `src/context/AppContext.js` | Global state management |
| `src/navigation/MainTabs.js` | Bottom tab navigator |
| `src/screens/HomeScreen.js` | Dashboard + AI suggestions |
| `src/screens/SmartCaptureScreen.js` | AI chat interface |
| `src/screens/CalendarScreen.js` | Heatmap calendar |
| `src/screens/SettingsScreen.js` | Settings (view profile) |
| `src/screens/EditProfileScreen.js` | Edit profile (save button) |

## 🎯 Development Workflow

1. **Make changes** to any `.js` file
2. **Save** the file
3. **Shake device** or press `Cmd+D` (iOS) / `Cmd+M` (Android)
4. **Reload** the app
5. See changes instantly!

## 📦 Package Scripts

```bash
npm start        # Start Expo development server
npm run android  # Run on Android (React Native CLI)
npm run ios      # Run on iOS (React Native CLI, Mac only)
npm run web      # Run on web browser (Expo only)
```

## 🌟 Pro Tips

1. **Use Expo Go** for fastest testing (no emulator needed)
2. **Enable Fast Refresh** for instant updates
3. **Use Remote Debugging** for console.log
4. **Shake device** to open dev menu
5. **Check terminal** for error messages

## ✅ Success Checklist

- [ ] App opens and shows splash screen
- [ ] Can login/signup
- [ ] Can see tasks on home screen
- [ ] AI suggestions modal works
- [ ] AI chat in Smart Capture works
- [ ] Calendar shows colored days
- [ ] Bottom tabs all work
- [ ] Can edit profile
- [ ] Theme toggle works
- [ ] Data persists after closing app

## 🚀 You're Ready!

If all checklist items work, you're successfully running FocusFlow!

### Next Steps:
1. Read `README.md` for full feature list
2. Read `SETUP_GUIDE.md` for advanced setup
3. Customize colors and features
4. Add your own AI API key
5. Build and deploy!

---

**Need help?** Check the troubleshooting section in SETUP_GUIDE.md

**Happy building! 🎉**
