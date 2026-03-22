/**
 * Messages Stack Layout
 */

import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';

export default function MessagesLayout() {
  const { colors } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Messages',
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="chat/[id]"
        options={{
          title: 'Chat',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}
