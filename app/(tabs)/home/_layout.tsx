/**
 * Home Stack Layout
 * 
 * Navigation layout for home feed screens.
 */

import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';

export default function HomeLayout() {
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
          title: 'SkillBridge',
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="skill/[id]"
        options={{
          title: 'Skill Details',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}
