/**
 * Search Screen
 * 
 * Search for skill posts with:
 * - Debounced search input (300ms)
 * - Filter chips (category, type, level, format)
 * - Results sorted by relevance
 * - No results state
 * 
 * Validates: Requirements 8.1-8.9
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { Input } from '../../../components/Input';
import { SkillCard } from '../../../components/SkillCard';
import { Badge } from '../../../components/Badge';
import { SkillPost, User, SkillCategory } from '../../../types';
import { searchSkillPosts } from '../../../services/search';
import { getDocument, queryDocuments } from '../../../services/firebase';
import { where } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SkillPost[]>([]);
  const [userResults, setUserResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [userCache, setUserCache] = useState<{ [userId: string]: User }>({});
  const [allPosts, setAllPosts] = useState<SkillPost[]>([]);
  const [searchMode, setSearchMode] = useState<'posts' | 'users'>('posts');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<SkillCategory | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'teach' | 'learn' | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<'beginner' | 'intermediate' | 'advanced' | 'all'>('all');
  const [formatFilter, setFormatFilter] = useState<'in-person' | 'online' | 'both' | 'all'>('all');

  // Load all posts on mount
  useEffect(() => {
    loadAllPosts();
  }, []);

  const loadAllPosts = async () => {
    try {
      const posts = await queryDocuments<SkillPost>('skillPosts', [
        where('isActive', '==', true)
      ]);
      setAllPosts(posts);
    } catch (error: any) {
      console.error('Load posts error:', error);
    }
  };

  // Fetch users for search results
  useEffect(() => {
    const fetchUsers = async () => {
      const userIds = [...new Set(results.map(post => post.userId))];
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
  }, [results]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, categoryFilter, typeFilter, levelFilter, formatFilter, allPosts, searchMode]);

  const performSearch = async () => {
    try {
      setLoading(true);

      if (searchMode === 'users') {
        // Search users by username
        if (searchQuery.trim()) {
          const users = await queryDocuments<User>('users', []);
          const filtered = users.filter(user => 
            user.displayName.toLowerCase().includes(searchQuery.toLowerCase().trim())
          );
          setUserResults(filtered.slice(0, 20));
        } else {
          setUserResults([]);
        }
      } else {
        // Search posts
        const filters = {
          category: categoryFilter,
          type: typeFilter,
          level: levelFilter,
          format: formatFilter,
        };

        const searchResults = searchSkillPosts(allPosts, searchQuery.trim(), filters);
        setResults(searchResults.map(r => r.post));
      }
    } catch (error: any) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSkillCard = ({ item }: { item: SkillPost }) => {
    const user = userCache[item.userId];

    if (!user) return null;

    return (
      <SkillCard
        post={item}
        user={user}
        onPress={() => router.push(`/home/skill/${item.id}`)}
        onUserPress={() => {}}
      />
    );
  };

  const renderUserCard = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[styles.userCard, { backgroundColor: colors.card }]}
      onPress={() => {}}
      activeOpacity={0.7}
    >
      <Avatar uri={item.photoURL} name={item.displayName} size="md" />
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.text }]}>{item.displayName}</Text>
        <Text style={[styles.userUniversity, { color: colors.textSecondary }]}>{item.university}</Text>
        <View style={styles.userSkills}>
          {item.skillsToTeach.slice(0, 2).map((skill, index) => (
            <Badge key={index} text={skill} variant="primary" size="sm" />
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (!searchQuery && categoryFilter === 'all' && typeFilter === 'all') {
      return (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Search for Skills or Users</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Enter keywords or use filters to find skill posts, or switch to Users to find people
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>😕</Text>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Results Found</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Try different keywords or adjust your filters
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Input
          placeholder={searchMode === 'posts' ? "Search skills..." : "Search users..."}
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Ionicons name="search" size={20} color={colors.textSecondary} />}
          rightIcon={
            searchQuery ? (
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textSecondary}
                onPress={() => setSearchQuery('')}
              />
            ) : undefined
          }
        />
        
        <View style={styles.modeSelector}>
          <TouchableOpacity onPress={() => setSearchMode('posts')}>
            <Badge
              text="Posts"
              variant={searchMode === 'posts' ? 'primary' : 'secondary'}
              size="md"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSearchMode('users')}>
            <Badge
              text="Users"
              variant={searchMode === 'users' ? 'primary' : 'secondary'}
              size="md"
            />
          </TouchableOpacity>
        </View>
      </View>

      {searchMode === 'posts' && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Category:</Text>
            <TouchableOpacity onPress={() => setCategoryFilter('all')}>
              <Badge
                text="All"
                variant={categoryFilter === 'all' ? 'primary' : 'secondary'}
                size="sm"
              />
            </TouchableOpacity>
            {(['programming', 'design', 'languages', 'music'] as SkillCategory[]).map(cat => (
              <TouchableOpacity key={cat} onPress={() => setCategoryFilter(cat)}>
                <Badge
                  text={cat.charAt(0).toUpperCase() + cat.slice(1)}
                  variant={categoryFilter === cat ? 'primary' : 'secondary'}
                  size="sm"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Type:</Text>
            <TouchableOpacity onPress={() => setTypeFilter('all')}>
              <Badge text="All" variant={typeFilter === 'all' ? 'primary' : 'secondary'} size="sm" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTypeFilter('teach')}>
              <Badge text="Teaching" variant={typeFilter === 'teach' ? 'primary' : 'secondary'} size="sm" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTypeFilter('learn')}>
              <Badge text="Learning" variant={typeFilter === 'learn' ? 'primary' : 'secondary'} size="sm" />
            </TouchableOpacity>
          </ScrollView>
        </>
      )}

      <FlatList
        data={searchMode === 'posts' ? results : userResults}
        renderItem={searchMode === 'posts' ? renderSkillCard : renderUserCard}
        keyExtractor={(item) => searchMode === 'posts' ? (item as SkillPost).id : (item as User).uid}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  filters: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  list: {
    padding: 16,
    gap: 16,
  },
  loading: {
    paddingVertical: 64,
    alignItems: 'center',
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
    paddingHorizontal: 32,
  },
  userCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userUniversity: {
    fontSize: 14,
  },
  userSkills: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
});
