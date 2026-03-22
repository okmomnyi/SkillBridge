/**
 * Create Stack Layout
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function CreateLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Create Skill Post',
          headerLargeTitle: true,
        }}
      />
    </Stack>
  );
}
