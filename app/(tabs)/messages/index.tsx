/**
 * Messages List Screen
 * 
 * Displays list of conversations with:
 * - Last message preview
 * - Timestamp
 * - Unread indicator
 * - Sorted by updatedAt descending
 * 
 * Validates: Requirements 10.1-10.7
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMessages } from '../../../hooks/useMessages';
import { useAuthStore } from '../../../stores/authStore';
import { useTheme } from '../../../contexts/ThemeContext';
import { Avatar } from '../../../components/Avatar';
import { Conversation } from '../../../types';

export default function MessagesListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const currentUser = useAuthStore((state) => state.user);
  const { conversations, subscribeToConversations, cleanup } = useMessages();

  useEffect(() => {
    if (currentUser) {
      subscribeToConversations(currentUser.uid);
    }

    return () => cleanup();
  }, [currentUser]);

  const getOtherParticipant = (conversation: Conversation) => {
    const otherUserId = conversation.participants.find(id => id !== currentUser?.uid);
    if (!otherUserId) return null;
    return conversation.participantDetails[otherUserId];
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const hasUnread = (conversation: Conversation): boolean => {
    if (!currentUser) return false;
    
    const userDetails = conversation.participantDetails[currentUser.uid];
    if (!userDetails) return false;

    const lastRead = userDetails.lastRead;
    const lastMessageTime = conversation.lastMessage.timestamp;

    // If last message is from current user, no unread
    if (conversation.lastMessage.senderId === currentUser.uid) {
      return false;
    }

    // If last message is after last read, there's unread
    return lastMessageTime > lastRead;
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherParticipant = getOtherParticipant(item);
    if (!otherParticipant) return null;

    const unread = hasUnread(item);

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => router.push(`/messages/chat/${item.id}?participantName=${otherParticipant.displayName}`)}
        activeOpacity={0.7}
      >
        <Avatar
          uri={otherParticipant.photoURL}
          name={otherParticipant.displayName}
          size="md"
          badge={unread ? { count: 1, color: colors.primary } : undefined}
        />
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.participantName, { color: colors.text }, unread && { color: colors.primary, fontWeight: '700' }]}>
              {otherParticipant.displayName}
            </Text>
            <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
              {formatTimestamp(item.lastMessage.timestamp)}
            </Text>
          </View>
          <Text
            style={[styles.lastMessage, { color: colors.textSecondary }, unread && { color: colors.primary, fontWeight: '700' }]}
            numberOfLines={1}
          >
            {item.lastMessage.senderId === currentUser?.uid && 'You: '}
            {item.lastMessage.text || 'No messages yet'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>💬</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Messages Yet</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Start a conversation by messaging someone from their skill post
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
  },
  lastMessage: {
    fontSize: 14,
  },
  separator: {
    height: 1,
    marginLeft: 76,
  },
  emptyContainer: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
