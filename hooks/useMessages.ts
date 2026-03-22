/**
 * useMessages Hook
 * 
 * Custom hook for managing real-time message subscriptions.
 * Handles conversation list and individual chat messages.
 * 
 * Validates: Requirements 9.1-9.14, 10.1-10.7
 */

import { useEffect } from 'react';
import { useMessagesStore } from '../stores/messagesStore';
import { Conversation, Message } from '../types';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { getDb } from '../services/firebaseConfig';

interface UseMessagesReturn {
  conversations: Conversation[];
  messages: Message[];
  loading: boolean;
  error: string | null;
  subscribeToConversations: (userId: string) => void;
  subscribeToMessages: (conversationId: string) => void;
  sendMessage: (conversationId: string, senderId: string, text: string) => Promise<void>;
  markAsRead: (conversationId: string, userId: string) => Promise<void>;
  getUnreadCount: (conversationId: string, userId: string) => number;
  cleanup: () => void;
}

/**
 * Hook for managing real-time messaging
 * 
 * @returns Messaging state and methods
 * 
 * @example
 * ```tsx
 * const { conversations, messages, subscribeToMessages, sendMessage } = useMessages();
 * 
 * // Subscribe to conversation messages
 * useEffect(() => {
 *   subscribeToMessages(conversationId);
 *   return () => cleanup();
 * }, [conversationId]);
 * 
 * // Send a message
 * const handleSend = async (text: string) => {
 *   await sendMessage(conversationId, userId, text);
 * };
 * ```
 */
export function useMessages(): UseMessagesReturn {
  const conversations = useMessagesStore((state) => state.conversations);
  const messages = useMessagesStore((state) => state.messages);
  const loading = useMessagesStore((state) => state.loading);
  const error = useMessagesStore((state) => state.error);
  const subscribeToConversationsAction = useMessagesStore((state) => state.subscribeToConversations);
  const subscribeToMessagesAction = useMessagesStore((state) => state.subscribeToMessages);
  const getUnreadCountAction = useMessagesStore((state) => state.getUnreadCount);
  const cleanupAction = useMessagesStore((state) => state.cleanup);

  /**
   * Send a message in a conversation
   * Validates: Requirements 9.1-9.9
   */
  const sendMessage = async (
    conversationId: string,
    senderId: string,
    text: string
  ): Promise<void> => {
    try {
      // Validate text
      const trimmedText = text.trim();
      if (!trimmedText) {
        throw new Error('Message text cannot be empty');
      }

      if (trimmedText.length > 1000) {
        throw new Error('Message text must be under 1000 characters');
      }

      // Create message document
      const messageData = {
        conversationId,
        senderId,
        text: trimmedText,
        timestamp: serverTimestamp(),
        read: false,
        type: 'text'
      };

      await addDoc(
        collection(getDb(), 'conversations', conversationId, 'messages'),
        messageData
      );

      // Update conversation's lastMessage and updatedAt
      await updateDoc(doc(getDb(), 'conversations', conversationId), {
        lastMessage: {
          text: trimmedText,
          senderId,
          timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });

    } catch (error: any) {
      console.error('Send message error:', error);
      throw error;
    }
  };

  /**
   * Mark messages as read when viewing a conversation
   * Validates: Requirements 9.13-9.14
   */
  const markAsRead = async (
    conversationId: string,
    userId: string
  ): Promise<void> => {
    try {
      // Update user's lastRead timestamp in conversation
      await updateDoc(doc(getDb(), 'conversations', conversationId), {
        [`participantDetails.${userId}.lastRead`]: serverTimestamp()
      });

    } catch (error: any) {
      console.error('Mark as read error:', error);
      throw error;
    }
  };

  return {
    conversations,
    messages,
    loading,
    error,
    subscribeToConversations: subscribeToConversationsAction,
    subscribeToMessages: subscribeToMessagesAction,
    sendMessage,
    markAsRead,
    getUnreadCount: getUnreadCountAction,
    cleanup: cleanupAction,
  };
}
