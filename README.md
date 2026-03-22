# SkillBridge Mobile App

A React Native mobile application built with Expo that connects university students for peer-to-peer skill exchange.

## Features

- 🎓 User authentication with Firebase
- 📝 Create and browse skill posts (teaching/learning)
- 🔍 Search for skills and users by name
- 💬 Real-time messaging
- ⭐ User ratings and reviews
- 🏆 Leaderboard system
- 🌓 Dark mode / Light mode toggle
- 👤 User availability scheduling
- 📱 Cross-platform (iOS & Android)

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Backend**: Firebase (Auth, Firestore, Storage)
- **State Management**: Zustand
- **Navigation**: Expo Router
- **Styling**: React Native StyleSheet

## Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- Firebase project with Firestore, Authentication, and Storage enabled
- iOS Simulator (Mac) or Android Emulator

## Quick Start

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd skillbridge-mobile-app
   npm install
   ```

2. **Configure Firebase**
   - Copy `.env.example` to `.env`
   - Add your Firebase credentials from Firebase Console
   - **NEVER commit `.env` files to git**

3. **Run the app**
   ```bash
   npm start
   ```

## Project Structure

```
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   └── (tabs)/            # Main app tabs
├── components/            # Reusable UI components
├── contexts/              # React contexts (Theme)
├── hooks/                 # Custom React hooks
├── services/              # API services (Firebase)
├── stores/                # Zustand state stores
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase credentials:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Security

⚠️ **CRITICAL**: Never commit these files:
- `.env`, `.env.development`, `.env.production`
- `google-services.json` (Android)
- `GoogleService-Info.plist` (iOS)
- `*-firebase-adminsdk-*.json` (Service account keys)

All sensitive files are already in `.gitignore`.

## Building for Production

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

## License

MIT

## Support

For issues, open a GitHub issue.
