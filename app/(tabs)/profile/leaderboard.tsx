/**
 * Leaderboard Screen
 * 
 * Displays top 100 users by points with:
 * - Rank, avatar, name, points, rating, sessions completed
 * - Current user's position highlighted
 * 
 * Validates: Requirements 14.1-14.5
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../../../stores/authStore';
import { Avatar } from '../../../components/Avatar';
import { StarRating } from '../../../components/StarRating';
import { User } from '../../../types';
import { queryDocuments } from '../../../services/firebase';
import { orderBy, limit } from 'firebase/firestore';

export default function LeaderboardScreen() {
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const topUsers = await queryDocuments<User>('users', [
        orderBy('points', 'desc'),
        orderBy('rating', 'desc'),
        limit(100)
      ]);
      setUsers(topUsers);
    } catch (error: any) {
      console.error('Load leaderboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderUser = ({ item, index }: { item: User; index: number }) => {
    const isCurrentUser = item.uid === currentUser?.uid;
    const rank = index + 1;

    return (
      <View style={[styles.userItem, isCurrentUser && styles.currentUserItem]}>
        <View style={styles.rankContainer}>
          <Text style={[styles.rank, isCurrentUser && styles.currentUserText]}>
            #{rank}
          </Text>
        </View>

        <Avatar uri={item.photoURL} name={item.displayName} size="sm" />

        <View style={styles.userInfo}>
          <Text style={[styles.userName, isCurrentUser && styles.currentUserText]}>
            {item.displayName}
            {isCurrentUser && ' (You)'}
          </Text>
          <View style={styles.userStats}>
            <StarRating rating={item.rating} size={12} />
            <Text style={styles.statText}>
              {item.sessionsCompleted} sessions
            </Text>
          </View>
        </View>

        <View style={styles.pointsContainer}>
          <Text style={[styles.points, isCurrentUser && styles.currentUserText]}>
            {item.points}
          </Text>
          <Text style={styles.pointsLabel}>pts</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Top 100 Users</Text>
        <Text style={styles.headerSubtitle}>Ranked by points and rating</Text>
      </View>

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    gap: 12,
  },
  currentUserItem: {
    backgroundColor: '#E5F1FF',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rank: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666666',
  },
  currentUserText: {
    color: '#007AFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 12,
    color: '#666666',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#999999',
  },
});
