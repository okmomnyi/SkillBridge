/**
 * Push Notification Service
 * 
 * Handles push notification permissions, device token registration,
 * and notification event handling.
 * 
 * Requirements: 19.1-19.7
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { updateDocument } from './firebase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true
  })
});

/**
 * Request notification permissions from the user
 * 
 * @returns Promise resolving to true if permissions granted, false otherwise
 * 
 * Requirements: 19.1
 */
export async function requestPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C'
      });

      await Notifications.setNotificationChannelAsync('matches', {
        name: 'Matches',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C'
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Get the device's push notification token
 * 
 * @returns Promise resolving to the FCM token or null if unavailable
 * 
 * Requirements: 19.2
 */
export async function getToken(): Promise<string | null> {
  try {
    // Check if running on a physical device
    if (!Notifications.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return null;
    }

    // Get Expo push token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PROJECT_ID
    });

    return token.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Register device token with user profile in Firestore
 * 
 * @param userId - User ID to associate token with
 * @returns Promise resolving when token is registered
 * 
 * Requirements: 19.2
 */
export async function registerDeviceToken(userId: string): Promise<void> {
  try {
    const token = await getToken();
    
    if (!token) {
      console.warn('No push token available to register');
      return;
    }

    // Store token in user document
    await updateDocument('users', userId, {
      fcmToken: token,
      fcmTokenUpdatedAt: new Date()
    });

    console.log('Device token registered successfully');
  } catch (error) {
    console.error('Error registering device token:', error);
    throw error;
  }
}

/**
 * Handle notification received while app is in foreground
 * 
 * @param callback - Function to call when notification is received
 * @returns Subscription object with remove() method
 * 
 * Requirements: 19.3
 */
export function onNotificationReceived(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Handle notification tap/interaction
 * 
 * @param callback - Function to call when notification is tapped
 * @returns Subscription object with remove() method
 * 
 * Requirements: 19.5
 */
export function onNotificationTapped(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Schedule a local notification
 * 
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Additional data to include
 * @param trigger - When to trigger the notification (Date or seconds from now)
 * @returns Promise resolving to notification ID
 */
export async function scheduleNotification(
  title: string,
  body: string,
  data: any = {},
  trigger: Date | number = 0
): Promise<string> {
  try {
    let triggerConfig: Notifications.NotificationTriggerInput;

    if (trigger instanceof Date) {
      triggerConfig = { date: trigger };
    } else if (trigger > 0) {
      triggerConfig = { seconds: trigger };
    } else {
      triggerConfig = null as any; // Immediate notification
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default'
      },
      trigger: triggerConfig
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
}

/**
 * Cancel a scheduled notification
 * 
 * @param notificationId - ID of the notification to cancel
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
    throw error;
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
    throw error;
  }
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('Error getting badge count:', error);
    return 0;
  }
}

/**
 * Set badge count
 * 
 * @param count - Badge count to set
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
}

/**
 * Clear badge count
 */
export async function clearBadge(): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.error('Error clearing badge:', error);
  }
}
