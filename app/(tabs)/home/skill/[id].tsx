/**
 * Skill Detail Screen
 * 
 * Displays full skill post details including:
 * - User profile info with avatar and rating
 * - Match score (if available)
 * - Full post description
 * - Message button to start conversation
 * 
 * Validates: Requirements 6.1-6.11, 9.1
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SkillPost, User } from '../../../../types';
import { getDocument, createDocument } from '../../../../services/firebase';
import { useAuthStore } from '../../../../stores/authStore';
import { Avatar } from '../../../../components/Avatar';
import { Badge } from '../../../../components/Badge';
import { Button } from '../../../../components/Button';
import { StarRating } from '../../../../components/StarRating';
import { Card } from '../../../../components/Card';
import { Ionicons } from '@expo/vector-icons';

export default function SkillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);

  const [post, setPost] = useState<SkillPost | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);

  useEffect(() => {
    loadPostDetails();
  }, [id]);

  const loadPostDetails = async () => {
    try {
      setLoading(true);

      const postData = await getDocument<SkillPost>('skillPosts', id);
      if (!postData) {
        Alert.alert('Error', 'Post not found');
        router.back();
        return;
      }

      const userData = await getDocument<User>('users', postData.userId);
      if (!userData) {
        Alert.alert('Error', 'User not found');
        router.back();
        return;
      }

      setPost(postData);
      setUser(userData);
    } catch (error: any) {
      console.error('Load post error:', error);
      Alert.alert('Error', 'Failed to load post details');
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!currentUser || !user) return;

    try {
      setMessageLoading(true);

      // Check if conversation already exists
      // For now, create a new conversation
      const conversationData = {
        participants: [currentUser.uid, user.uid],
        participantDetails: {
          [currentUser.uid]: {
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            lastRead: new Date(),
          },
          [user.uid]: {
            displayName: user.displayName,
            photoURL: user.photoURL,
            lastRead: new Date(),
          },
        },
        lastMessage: {
          text: '',
          senderId: '',
          timestamp: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const conversationId = await createDocument('conversations', conversationData);
      
      router.push(`/messages/chat/${conversationId}?participantName=${user.displayName}`);
    } catch (error: any) {
      console.error('Create conversation error:', error);
      Alert.alert('Error', 'Failed to start conversation');
    } finally {
      setMessageLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!post || !user) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  const isOwnPost = currentUser?.uid === user.uid;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card variant="elevated" padding="lg">
        <View style={styles.userSection}>
          <Avatar uri={user.photoURL} name={user.displayName} size="lg" />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.displayName}</Text>
            <Text style={styles.userMeta}>
              {user.university} • {user.major}
            </Text>
            <View style={styles.rating}>
              <StarRating rating={user.rating} size={16} />
              <Text style={styles.ratingText}>
                {user.rating > 0 ? `${user.rating.toFixed(1)} (${user.reviewCount} reviews)` : 'New user'}
              </Text>
            </View>
            <Text style={styles.sessions}>
              {user.sessionsCompleted} sessions completed
            </Text>
          </View>
        </View>
      </Card>

      <Card variant="elevated" padding="lg">
        <View style={styles.badges}>
          <Badge
            text={post.type === 'teach' ? 'Teaching' : 'Learning'}
            variant={post.type === 'teach' ? 'primary' : 'secondary'}
            size="md"
          />
          <Badge text={post.category} variant="success" size="md" />
          <Badge text={post.level} variant="warning" size="md" />
          <Badge text={post.format} variant="secondary" size="md" />
        </View>

        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.description}>{post.description}</Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb-outline" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Skills</Text>
          </View>
          <View style={styles.skillsList}>
            {post.skills.map((skill, index) => (
              <Badge key={index} text={skill} variant="primary" size="sm" />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Availability</Text>
          </View>
          <Text style={styles.sectionText}>{post.availability}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Posted</Text>
          </View>
          <Text style={styles.sectionText}>{formatDate(post.createdAt)}</Text>
        </View>
      </Card>

      {!isOwnPost && (
        <Button
          variant="primary"
          size="lg"
          onPress={handleMessage}
          loading={messageLoading}
          disabled={messageLoading}
          fullWidth
          icon={<Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />}
          accessibilityLabel="Send message"
        >
          Message {user.displayName}
        </Button>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
  },
  userSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
  },
  userMeta: {
    fontSize: 14,
    color: '#666666',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#666666',
  },
  sessions: {
    fontSize: 14,
    color: '#666666',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  sectionText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
