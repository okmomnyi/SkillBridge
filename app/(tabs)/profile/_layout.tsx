/**
 * Profile Stack Layout
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Profile',
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          title: 'Edit Profile',
          headerBackTitle: 'Cancel',
        }}
      />
      <Stack.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}
