/**
 * Offline Queue Utility
 * 
 * Manages queuing of operations when offline and syncing when connection is restored.
 * 
 * Requirements: 18.4-18.5
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const QUEUE_KEY = '@skillbridge:offline_queue';

export interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId?: string;
  data?: any;
  timestamp: number;
}

/**
 * Add an operation to the offline queue
 * 
 * @param operation - Operation to queue
 */
export async function queueOperation(operation: Omit<QueuedOperation, 'id' | 'timestamp'>): Promise<void> {
  try {
    const queue = await getQueue();
    
    const queuedOp: QueuedOperation = {
      ...operation,
      id: generateId(),
      timestamp: Date.now()
    };
    
    queue.push(queuedOp);
    await saveQueue(queue);
    
    console.log('Operation queued:', queuedOp);
  } catch (error) {
    console.error('Error queuing operation:', error);
    throw error;
  }
}

/**
 * Get all queued operations
 * 
 * @returns Array of queued operations
 */
export async function getQueue(): Promise<QueuedOperation[]> {
  try {
    const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
    
    if (!queueJson) {
      return [];
    }
    
    return JSON.parse(queueJson);
  } catch (error) {
    console.error('Error getting queue:', error);
    return [];
  }
}

/**
 * Save queue to storage
 * 
 * @param queue - Queue to save
 */
async function saveQueue(queue: QueuedOperation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error saving queue:', error);
    throw error;
  }
}

/**
 * Clear the offline queue
 */
export async function clearQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
    console.log('Queue cleared');
  } catch (error) {
    console.error('Error clearing queue:', error);
    throw error;
  }
}

/**
 * Remove a specific operation from the queue
 * 
 * @param operationId - ID of operation to remove
 */
export async function removeFromQueue(operationId: string): Promise<void> {
  try {
    const queue = await getQueue();
    const filteredQueue = queue.filter(op => op.id !== operationId);
    await saveQueue(filteredQueue);
  } catch (error) {
    console.error('Error removing from queue:', error);
    throw error;
  }
}

/**
 * Sync all queued operations with Firestore
 * 
 * @returns Promise resolving to number of successfully synced operations
 */
export async function syncQueue(): Promise<number> {
  try {
    const queue = await getQueue();
    
    if (queue.length === 0) {
      console.log('No operations to sync');
      return 0;
    }
    
    console.log(`Syncing ${queue.length} queued operations...`);
    
    let successCount = 0;
    const failedOps: QueuedOperation[] = [];
    
    // Import firebase operations
    const { createDocument, updateDocument, deleteDocument } = await import('../services/firebase');
    
    // Process each operation
    for (const operation of queue) {
      try {
        switch (operation.type) {
          case 'create':
            await createDocument(operation.collection, operation.data);
            break;
            
          case 'update':
            if (operation.documentId) {
              await updateDocument(operation.collection, operation.documentId, operation.data);
            }
            break;
            
          case 'delete':
            if (operation.documentId) {
              await deleteDocument(operation.collection, operation.documentId);
            }
            break;
        }
        
        successCount++;
        console.log(`Synced operation ${operation.id}`);
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);
        failedOps.push(operation);
      }
    }
    
    // Save failed operations back to queue
    await saveQueue(failedOps);
    
    console.log(`Sync complete: ${successCount} succeeded, ${failedOps.length} failed`);
    
    return successCount;
  } catch (error) {
    console.error('Error syncing queue:', error);
    throw error;
  }
}

/**
 * Check if device is online
 * 
 * @returns Promise resolving to true if online, false otherwise
 */
export async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable === true;
  } catch (error) {
    console.error('Error checking online status:', error);
    return false;
  }
}

/**
 * Listen for connection changes and auto-sync when online
 * 
 * @param onConnectionChange - Callback when connection status changes
 * @returns Unsubscribe function
 */
export function watchConnection(
  onConnectionChange?: (isConnected: boolean) => void
): () => void {
  const unsubscribe = NetInfo.addEventListener(state => {
    const connected = state.isConnected === true && state.isInternetReachable === true;
    
    console.log('Connection status changed:', connected ? 'online' : 'offline');
    
    if (onConnectionChange) {
      onConnectionChange(connected);
    }
    
    // Auto-sync when connection is restored
    if (connected) {
      syncQueue().catch(error => {
        console.error('Auto-sync failed:', error);
      });
    }
  });
  
  return unsubscribe;
}

/**
 * Generate a unique ID for queued operations
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
