/**
 * Connection Status Component
 * 
 * Displays a banner when the device is offline and updates when connection is restored.
 * 
 * Requirements: 18.6-18.7
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { watchConnection } from '../utils/offlineQueue';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [slideAnim] = useState(new Animated.Value(-60));
  const [showRestored, setShowRestored] = useState<boolean>(false);

  useEffect(() => {
    // Watch for connection changes
    const unsubscribe = watchConnection((connected) => {
      if (!connected && isOnline) {
        // Going offline
        setIsOnline(false);
        setShowRestored(false);
        slideDown();
      } else if (connected && !isOnline) {
        // Coming back online
        setIsOnline(true);
        setShowRestored(true);
        slideDown();
        
        // Hide "Connection restored" message after 3 seconds
        setTimeout(() => {
          slideUp();
          setTimeout(() => setShowRestored(false), 300);
        }, 3000);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOnline]);

  const slideDown = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8
    }).start();
  };

  const slideUp = () => {
    Animated.spring(slideAnim, {
      toValue: -60,
      useNativeDriver: true,
      tension: 50,
      friction: 8
    }).start();
  };

  // Don't render anything if online and not showing restored message
  if (isOnline && !showRestored) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        showRestored ? styles.onlineContainer : styles.offlineContainer,
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <Text style={styles.text}>
        {showRestored ? '✓ Connection restored' : '⚠ No internet connection'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    paddingTop: 10
  },
  offlineContainer: {
    backgroundColor: '#EF4444'
  },
  onlineContainer: {
    backgroundColor: '#10B981'
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  }
});
