/**
 * Firebase Configuration
 * 
 * This file contains the Firebase project configuration and initializes
 * Firebase services (Authentication, Firestore, Storage).
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Enable Authentication with Email/Password and Google OAuth providers
 * 3. Create a Firestore database in production mode
 * 4. Enable Firebase Storage
 * 5. Go to Project Settings > General > Your apps
 * 6. Register a web app and copy the configuration
 * 7. Replace the firebaseConfig object below with your actual credentials
 * 
 * IMPORTANT: In production, use environment variables instead of hardcoded values
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration object
// TODO: Replace with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MESSAGING_SENDER_ID',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'YOUR_APP_ID',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'YOUR_MEASUREMENT_ID'
};

// Initialize Firebase app (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication with React Native persistence
// This ensures auth state persists across app restarts
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // If already initialized, get the existing instance
  auth = getAuth(app);
}

// Initialize Firestore with offline persistence settings
let db;
try {
  db = initializeFirestore(app, {
    cacheSizeBytes: 50 * 1024 * 1024, // 50MB cache
    experimentalForceLongPolling: false,
    experimentalAutoDetectLongPolling: true
  });
} catch (error) {
  // If already initialized, get the existing instance
  db = getFirestore(app);
}

// Initialize Firebase Storage
const storage = getStorage(app);

// Helper function to ensure db is initialized
export function getDb() {
  if (!db) {
    db = getFirestore(app);
  }
  return db;
}

// Export initialized services
export { app, auth, db, storage };

// Export configuration for reference
export { firebaseConfig };
