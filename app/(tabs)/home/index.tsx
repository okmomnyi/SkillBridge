/**
 * Home Feed Screen
 * 
 * Main feed displaying skill posts with:
 * - Pull-to-refresh
 * - Infinite scroll pagination
 * - Filters (category, type, level)
 * - Loading skeletons
 * 
 * Validates: Requirements 7.1-7.10, 21.1-21.7
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFeed } from '../../../hooks/useFeed';
import { useAuthStore } from '../../../stores/authStore';
import { useTheme } from '../../../contexts/ThemeContext';
import { SkillCard } from '../../../components/SkillCard';
import { Skeleton } from '../../../components/Skeleton';
import { Badge } from '../../../components/Badge';
import { SkillPost, User, SkillCategory } from '../../../types';
import { getDocument } from '../../../services/firebase';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { posts, loading, hasMore, filters, loadMore, refresh, setFilters } = useFeed();
  const currentUser = useAuthStore((state) => state.user);
  const initializing = useAuthStore((state) => state.initializing);
  const [refreshing, setRefreshing] = useState(false);
  const [userCache, setUserCache] = useState<{ [userId: string]: User }>({});

  useEffect(() => {
    // Only fetch when auth is initialized
    if (!initializing && currentUser) {
      refresh();
    }
  }, [initializing, currentUser]);

  // Fetch users for all posts
  useEffect(() => {
    const fetchUsers = async () => {
      const userIds = [...new Set(posts.map(post => post.userId))];
      const missingUserIds = userIds.filter(id => !userCache[id]);
      
      if (missingUserIds.length === 0) return;

      const userPromises = missingUserIds.map(userId => 
        getDocument<User>('users', userId)
      );
      
      const users = await Promise.all(userPromises);
      const newCache: { [userId: string]: User } = {};
      
      users.forEach((user, index) => {
        if (user) {
          newCache[missingUserIds[index]] = user;
        }
      });

      if (Object.keys(newCache).length > 0) {
        setUserCache(prev => ({ ...prev, ...newCache }));
      }
    };

    fetchUsers();
  }, [posts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleEndReached = () => {
    if (!loading && hasMore) {
      loadMore();
    }
  };

  const renderSkillCard = ({ item }: { item: SkillPost }) => {
    const user = userCache[item.userId];

    if (!user) {
      return <SkeletonCard />;
    }

    return (
      <SkillCard
        post={item}
        user={user}
        onPress={() => router.push(`/home/skill/${item.id}`)}
        onUserPress={() => {}}
      />
    );
  };

  const renderFilters = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filters}
    >
      <TouchableOpacity onPress={() => setFilters({ category: 'all' })}>
        <Badge
          text="All"
          variant={filters.category === 'all' ? 'primary' : 'secondary'}
          size="md"
        />
      </TouchableOpacity>
      {(['programming', 'design', 'languages', 'music', 'sports', 'cooking', 'academic'] as SkillCategory[]).map(cat => (
        <TouchableOpacity key={cat} onPress={() => setFilters({ category: cat })}>
          <Badge
            text={cat.charAt(0).toUpperCase() + cat.slice(1)}
            variant={filters.category === cat ? 'primary' : 'secondary'}
            size="md"
          />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderTypeFilters = () => (
    <View style={styles.typeFilters}>
      <TouchableOpacity onPress={() => setFilters({ type: 'all' })}>
        <Badge
          text="All"
          variant={filters.type === 'all' ? 'primary' : 'secondary'}
          size="sm"
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setFilters({ type: 'teach' })}>
        <Badge
          text="Teaching"
          variant={filters.type === 'teach' ? 'primary' : 'secondary'}
          size="sm"
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setFilters({ type: 'learn' })}>
        <Badge
          text="Learning"
          variant={filters.type === 'learn' ? 'primary' : 'secondary'}
          size="sm"
        />
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>📚</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No posts found</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Try adjusting your filters or check back later</Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || posts.length === 0) return null;
    return (
      <View style={styles.footer}>
        <SkeletonCard />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderFilters()}
      {renderTypeFilters()}
      
      <FlatList
        data={posts}
        renderItem={renderSkillCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.8}
        ListEmptyComponent={!loading ? renderEmpty : <SkeletonList />}
        ListFooterComponent={renderFooter}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
    </View>
  );
}

const SkeletonCard = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonHeader}>
      <Skeleton width={40} height={40} variant="circle" />
      <View style={styles.skeletonHeaderText}>
        <Skeleton width={120} height={16} />
        <Skeleton width={80} height={12} />
      </View>
    </View>
    <Skeleton width="100%" height={20} />
    <Skeleton width="100%" height={60} />
    <View style={styles.skeletonFooter}>
      <Skeleton width={60} height={24} />
      <Skeleton width={60} height={24} />
      <Skeleton width={60} height={24} />
    </View>
  </View>
);

const SkeletonList = () => (
  <View style={styles.list}>
    <SkeletonCard />
    <SkeletonCard />
    <SkeletonCard />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filters: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  typeFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  list: {
    padding: 16,
    gap: 16,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
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
  footer: {
    paddingVertical: 16,
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skeletonHeaderText: {
    flex: 1,
    gap: 4,
  },
  skeletonFooter: {
    flexDirection: 'row',
    gap: 8,
  },
});
