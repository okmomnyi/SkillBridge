/**
 * Root Layout
 * 
 * Main app layout with auth state checking and navigation setup.
 * Wraps app with ErrorBoundary, ThemeProvider, and initializes auth state.
 * 
 * Validates: Requirements 17.1-17.7
 */

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/authStore';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    // Initialize auth state on app start
    initialize();
  }, []);

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <ErrorBoundary>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </ErrorBoundary>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
