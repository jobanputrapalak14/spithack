# FocusFlow - React Native App

A comprehensive productivity app built with **React Native** and **JavaScript** featuring AI-powered task management, smart scheduling, and burnout prevention.

## Features

### ✨ Core Features
- **Splash Screen** - Animated intro with branding
- **Authentication** - Sign up & Login screens
- **Smart AI Capture** - Interactive AI chat for task creation
  - Natural language processing
  - Real-time AI suggestions
  - Chat with AI to adjust tasks
- **Home Dashboard** - Today's schedule with AI suggestions
  - Workload alerts
  - Accept/Decline AI recommendations
  - Automatic task updates
- **Calendar View** - Visual workload heatmap
  - Color-coded by workload (Red=Heavy, Orange=Medium, Green=Light)
  - Special event markers (Exams, Trips)
- **Workspace** - Day-specific task management
  - Task lists with progress tracking
  - Notes for each day
  - Deadline management
- **Insights** - Productivity analytics
  - Burnout risk scoring
  - Habit streak tracking
  - Task completion stats
- **Settings** - Preferences and profile
  - Theme toggle (Light/Dark)
  - Notification settings
  - Profile management
- **Edit Profile** - Dedicated profile editing page

### 🎨 Design Features
- Bottom Tab Navigation (Native feel)
- Gradient backgrounds
- Modern UI with smooth animations
- Responsive design
- Native icons (Feather icons)

## Tech Stack

```json
{
  "framework": "React Native 0.73",
  "language": "JavaScript",
  "navigation": "@react-navigation/native",
  "storage": "@react-native-async-storage/async-storage",
  "icons": "react-native-vector-icons",
  "gradients": "react-native-linear-gradient"
}
```

## Project Structure

```
REACT_NATIVE_APP/
├── App.js                          # Main app entry
├── package.json                    # Dependencies
├── src/
│   ├── context/
│   │   └── AppContext.js          # Global state management
│   ├── navigation/
│   │   └── MainTabs.js            # Bottom tab navigator
│   └── screens/
│       ├── SplashScreen.js        # Splash screen
│       ├── LoginScreen.js         # Login
│       ├── SignupScreen.js        # Sign up
│       ├── HomeScreen.js          # Home dashboard with AI suggestions
│       ├── SmartCaptureScreen.js  # AI chat for task capture
│       ├── CalendarScreen.js      # Calendar with heatmap
│       ├── WorkspaceScreen.js     # Day workspace
│       ├── InsightsScreen.js      # Analytics & insights
│       ├── SettingsScreen.js      # Settings
│       └── EditProfileScreen.js   # Edit profile
```

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (recommended) or React Native CLI
- iOS Simulator (Mac) or Android Emulator

### Setup Steps

1. **Navigate to the project directory:**
```bash
cd REACT_NATIVE_APP
```

2. **Install dependencies:**
```bash
npm install
# or
yarn install
```

3. **Install required packages:**
```bash
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install react-native-vector-icons
npm install react-native-linear-gradient
```

4. **For Expo (Recommended):**
```bash
npx expo install expo-status-bar
```

5. **Link native dependencies (if not using Expo):**
```bash
npx pod-install ios
```

### Running the App

**Using Expo:**
```bash
npm start
# or
expo start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your device

**Using React Native CLI:**
```bash
# iOS
npm run ios
# or
npx react-native run-ios

# Android
npm run android
# or
npx react-native run-android
```

## Key Features Implementation

### 1. **AI Chat in Smart Capture**
- Type task description
- AI analyzes and categorizes automatically
- Interactive chat to refine task details
- Real-time preview updates

### 2. **AI Suggestions with Accept/Decline**
- Appears when workload is high
- Accept button applies changes automatically
- Decline button dismisses suggestion
- Visual feedback on action taken

### 3. **Bottom Navigation**
- Native bottom tab bar
- Home, Calendar, Insights, Settings
- Active tab highlighting
- Smooth transitions

### 4. **Separate Edit Profile**
- Settings shows view-only profile
- Tap to navigate to edit page
- Save/Cancel buttons on edit page
- AsyncStorage persistence

## Data Persistence

The app uses **AsyncStorage** for local data persistence:
- User authentication state
- Tasks and their completion status
- Notes and resources
- Theme preferences

All data is automatically saved and restored on app restart.

## Customization

### Changing Colors
Edit the color values in component StyleSheets:
- Primary: `#9333ea` (Purple)
- Success: `#22c55e` (Green)
- Warning: `#f97316` (Orange)
- Danger: `#ef4444` (Red)

### Adding New Features
1. Create new screen in `src/screens/`
2. Add route in `App.js` or `MainTabs.js`
3. Update context in `AppContext.js` if needed

## Known Limitations

- Requires React Native environment (won't run in web Vite setup)
- Uses mock AI (no real API calls)
- Local storage only (no cloud sync)
- Date picker uses text input (can upgrade to native picker)

## Next Steps / Enhancements

- [ ] Integrate real AI API (OpenAI, etc.)
- [ ] Add native date/time pickers
- [ ] Implement push notifications
- [ ] Add cloud sync with Firebase/Supabase
- [ ] Calendar integration (Google Calendar, etc.)
- [ ] Biometric authentication
- [ ] Offline mode improvements
- [ ] Data export/import
- [ ] Widget support
- [ ] Share tasks feature

## Troubleshooting

### Icons not showing
```bash
# iOS
cd ios && pod install && cd ..
npx react-native link react-native-vector-icons

# Android - add to android/app/build.gradle:
apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"
```

### Gradient not working
```bash
cd ios && pod install && cd ..
npx react-native link react-native-linear-gradient
```

### Navigation errors
Make sure all navigation packages are installed and linked properly.

## License

MIT License - Free to use and modify

## Support

For issues or questions, please create an issue in the repository.

---

Built with ❤️ using React Native and JavaScript
