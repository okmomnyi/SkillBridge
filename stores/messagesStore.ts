/**
 * Messages Store
 * 
 * Zustand store for managing messaging state including:
 * - Conversations list
 * - Messages for active conversation
 * - Real-time subscriptions
 * - Unread count tracking
 * 
 * Validates: Requirements 9.1-9.14, 10.1-10.7
 */

import { create } from 'zustand';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
  Timestamp
} from 'firebase/firestore';
import { getDb } from '../services/firebaseConfig';
import { Conversation, Message } from '../types';

// ============================================================================
// Store Interface
// ============================================================================

interface MessagesStore {
  // State
  conversations: Conversation[];
  messages: Message[];
  activeConversationId: string | null;
  loading: boolean;
  error: string | null;
  
  // Subscription management
  conversationsUnsubscribe: Unsubscribe | null;
  messagesUnsubscribe: Unsubscribe | null;

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  setMessages: (messages: Message[]) => void;
  setActiveConversationId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  subscribeToConversations: (userId: string) => void;
  subscribeToMessages: (conversationId: string) => void;
  unsubscribeFromConversations: () => void;
  unsubscribeFromMessages: () => void;
  getUnreadCount: (conversationId: string, userId: string) => number;
  cleanup: () => void;
}

// ============================================================================
// Messages Store Implementation
// ============================================================================

/**
 * Zustand store for messages state management
 * Validates: Requirements 9.1-9.14, 10.1-10.7
 */
export const useMessagesStore = create<MessagesStore>((set, get) => ({
  // ============================================================================
  // Initial State
  // ============================================================================

  conversations: [],
  messages: [],
  activeConversationId: null,
  loading: false,
  error: null,
  conversationsUnsubscribe: null,
  messagesUnsubscribe: null,

  // ============================================================================
  // Basic Setters
  // ============================================================================

  setConversations: (conversations) => set({ conversations }),
  
  setMessages: (messages) => set({ messages }),
  
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),

  // ============================================================================
  // Subscribe to Conversations
  // ============================================================================

  /**
   * Subscribe to user's conversations in real-time
   * Validates: Requirements 10.1-10.7
   */
  subscribeToConversations: (userId: string) => {
    try {
      // Unsubscribe from previous subscription if exists
      const { conversationsUnsubscribe } = get();
      if (conversationsUnsubscribe) {
        conversationsUnsubscribe();
      }

      set({ loading: true, error: null });

      // Build query for user's conversations
      const q = query(
        collection(getDb(), 'conversations'),
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );

      // Set up real-time listener
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const conversations: Conversation[] = [];

          snapshot.forEach((doc) => {
            const data = doc.data();
            conversations.push({
              id: doc.id,
              participants: data.participants,
              participantDetails: data.participantDetails,
              lastMessage: {
                text: data.lastMessage?.text || '',
                senderId: data.lastMessage?.senderId || '',
                timestamp: data.lastMessage?.timestamp?.toDate() || new Date()
              },
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date()
            });
          });

          set({
            conversations,
            loading: false,
            error: null
          });
        },
        (error) => {
          console.error('Conversations subscription error:', error);
          set({
            error: error.message || 'Failed to load conversations',
            loading: false
          });
        }
      );

      set({ conversationsUnsubscribe: unsubscribe });

    } catch (error: any) {
      console.error('Subscribe to conversations error:', error);
      set({
        error: error.message || 'Failed to subscribe to conversations',
        loading: false
      });
    }
  },

  // ============================================================================
  // Subscribe to Messages
  // ============================================================================

  /**
   * Subscribe to messages in a conversation in real-time
   * Validates: Requirements 9.10-9.12
   */
  subscribeToMessages: (conversationId: string) => {
    try {
      // Unsubscribe from previous subscription if exists
      const { messagesUnsubscribe } = get();
      if (messagesUnsubscribe) {
        messagesUnsubscribe();
      }

      set({ loading: true, error: null, activeConversationId: conversationId });

      // Build query for conversation messages
      const q = query(
        collection(getDb(), 'conversations', conversationId, 'messages'),
        orderBy('timestamp', 'asc'),
        limit(50)
      );

      // Set up real-time listener
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const messages: Message[] = [];

          snapshot.forEach((doc) => {
            const data = doc.data();
            messages.push({
              id: doc.id,
              conversationId,
              senderId: data.senderId,
              text: data.text,
              timestamp: data.timestamp?.toDate() || new Date(),
              read: data.read || false,
              type: data.type || 'text'
            });
          });

          set({
            messages,
            loading: false,
            error: null
          });
        },
        (error) => {
          console.error('Messages subscription error:', error);
          set({
            error: error.message || 'Failed to load messages',
            loading: false
          });
        }
      );

      set({ messagesUnsubscribe: unsubscribe });

    } catch (error: any) {
      console.error('Subscribe to messages error:', error);
      set({
        error: error.message || 'Failed to subscribe to messages',
        loading: false
      });
    }
  },

  // ============================================================================
  // Unsubscribe Actions
  // ============================================================================

  /**
   * Unsubscribe from conversations listener
   */
  unsubscribeFromConversations: () => {
    const { conversationsUnsubscribe } = get();
    if (conversationsUnsubscribe) {
      conversationsUnsubscribe();
      set({ conversationsUnsubscribe: null });
    }
  },

  /**
   * Unsubscribe from messages listener
   */
  unsubscribeFromMessages: () => {
    const { messagesUnsubscribe } = get();
    if (messagesUnsubscribe) {
      messagesUnsubscribe();
      set({ 
        messagesUnsubscribe: null,
        messages: [],
        activeConversationId: null
      });
    }
  },

  // ============================================================================
  // Unread Count
  // ============================================================================

  /**
   * Get unread message count for a conversation
   * Validates: Requirements 10.6
   */
  getUnreadCount: (conversationId: string, userId: string) => {
    const { conversations } = get();
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (!conversation) {
      return 0;
    }

    const userDetails = conversation.participantDetails[userId];
    if (!userDetails) {
      return 0;
    }

    const lastRead = userDetails.lastRead;
    const lastMessageTime = conversation.lastMessage.timestamp;

    // If last message is from current user, no unread
    if (conversation.lastMessage.senderId === userId) {
      return 0;
    }

    // If last message is after last read, there's at least 1 unread
    if (lastMessageTime > lastRead) {
      return 1;
    }

    return 0;
  },

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Cleanup all subscriptions
   */
  cleanup: () => {
    const { conversationsUnsubscribe, messagesUnsubscribe } = get();
    
    if (conversationsUnsubscribe) {
      conversationsUnsubscribe();
    }
    
    if (messagesUnsubscribe) {
      messagesUnsubscribe();
    }

    set({
      conversations: [],
      messages: [],
      activeConversationId: null,
      conversationsUnsubscribe: null,
      messagesUnsubscribe: null,
      loading: false,
      error: null
    });
  }
}));
