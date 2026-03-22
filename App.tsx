/**
 * App Entry Point
 * 
 * Main app component using Expo Router for navigation.
 * The actual routing is handled by app/_layout.tsx
 */

import 'react-native-gesture-handler';
import { Slot } from 'expo-router';

export default function App() {
  return <Slot />;
}
