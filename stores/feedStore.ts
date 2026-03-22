/**
 * Feed Store
 * 
 * Zustand store for managing the home feed including:
 * - Skill posts list
 * - Pagination state
 * - Filters (category, type, level)
 * - Loading states
 * 
 * Validates: Requirements 7.1-7.10
 */

import { create } from 'zustand';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  DocumentSnapshot
} from 'firebase/firestore';
import { getDb } from '../services/firebaseConfig';
import { SkillPost, SkillCategory } from '../types';

// ============================================================================
// Constants
// ============================================================================

const PAGE_SIZE = 10;

// ============================================================================
// Store Interface
// ============================================================================

interface FeedFilters {
  category: SkillCategory | 'all';
  type: 'teach' | 'learn' | 'all';
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
}

interface FeedStore {
  // State
  posts: SkillPost[];
  loading: boolean;
  hasMore: boolean;
  lastDoc: DocumentSnapshot | null;
  filters: FeedFilters;
  error: string | null;

  // Actions
  setPosts: (posts: SkillPost[]) => void;
  addPosts: (posts: SkillPost[]) => void;
  setLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setLastDoc: (doc: DocumentSnapshot | null) => void;
  setFilters: (filters: Partial<FeedFilters>) => void;
  setError: (error: string | null) => void;
  fetchPosts: () => Promise<void>;
  fetchMorePosts: () => Promise<void>;
  refreshPosts: () => Promise<void>;
}

// ============================================================================
// Feed Store Implementation
// ============================================================================

/**
 * Zustand store for feed state management
 * Validates: Requirements 7.1-7.10
 */
export const useFeedStore = create<FeedStore>((set, get) => ({
  // ============================================================================
  // Initial State
  // ============================================================================

  posts: [],
  loading: false,
  hasMore: true,
  lastDoc: null,
  filters: {
    category: 'all',
    type: 'all',
    level: 'all'
  },
  error: null,

  // ============================================================================
  // Basic Setters
  // ============================================================================

  setPosts: (posts) => set({ posts }),
  
  addPosts: (posts) => set((state) => ({ 
    posts: [...state.posts, ...posts] 
  })),
  
  setLoading: (loading) => set({ loading }),
  
  setHasMore: (hasMore) => set({ hasMore }),
  
  setLastDoc: (lastDoc) => set({ lastDoc }),
  
  setFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters } 
  })),
  
  setError: (error) => set({ error }),

  // ============================================================================
  // Fetch Posts Action
  // ============================================================================

  /**
   * Fetch initial page of posts
   * Validates: Requirements 7.1-7.3
   */
  fetchPosts: async () => {
    try {
      const { filters } = get();
      set({ loading: true, error: null });

      // Get db instance
      const db = getDb();

      // Build base query
      let q = query(
        collection(db, 'skillPosts'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      // Apply filters
      if (filters.category !== 'all') {
        q = query(q, where('category', '==', filters.category));
      }

      if (filters.type !== 'all') {
        q = query(q, where('type', '==', filters.type));
      }

      if (filters.level !== 'all') {
        q = query(q, where('level', '==', filters.level));
      }

      // Fetch one extra to check if more exist
      q = query(q, limit(PAGE_SIZE + 1));

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;

      // Process results
      const posts: SkillPost[] = [];
      for (let i = 0; i < Math.min(docs.length, PAGE_SIZE); i++) {
        const data = docs[i].data();
        posts.push({
          id: docs[i].id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as SkillPost);
      }

      // Determine if more posts exist
      const hasMore = docs.length > PAGE_SIZE;
      const newLastDoc = docs.length > 0 ? docs[Math.min(docs.length - 1, PAGE_SIZE - 1)] : null;

      set({
        posts,
        hasMore,
        lastDoc: newLastDoc,
        loading: false,
        error: null
      });

    } catch (error: any) {
      console.error('Feed fetch error:', error);
      set({
        error: error.message || 'Failed to fetch posts',
        loading: false
      });
    }
  },

  // ============================================================================
  // Fetch More Posts Action (Pagination)
  // ============================================================================

  /**
   * Fetch next page of posts
   * Validates: Requirements 7.4-7.6
   */
  fetchMorePosts: async () => {
    try {
      const { filters, lastDoc, hasMore, loading } = get();

      // Don't fetch if already loading or no more posts
      if (loading || !hasMore || !lastDoc) {
        return;
      }

      set({ loading: true, error: null });

      // Get db instance
      const db = getDb();

      // Build base query
      let q = query(
        collection(db, 'skillPosts'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      // Apply filters
      if (filters.category !== 'all') {
        q = query(q, where('category', '==', filters.category));
      }

      if (filters.type !== 'all') {
        q = query(q, where('type', '==', filters.type));
      }

      if (filters.level !== 'all') {
        q = query(q, where('level', '==', filters.level));
      }

      // Apply pagination cursor
      q = query(q, startAfter(lastDoc));

      // Fetch one extra to check if more exist
      q = query(q, limit(PAGE_SIZE + 1));

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;

      // Process results
      const posts: SkillPost[] = [];
      for (let i = 0; i < Math.min(docs.length, PAGE_SIZE); i++) {
        const data = docs[i].data();
        posts.push({
          id: docs[i].id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as SkillPost);
      }

      // Determine if more posts exist
      const newHasMore = docs.length > PAGE_SIZE;
      const newLastDoc = docs.length > 0 ? docs[Math.min(docs.length - 1, PAGE_SIZE - 1)] : null;

      set((state) => ({
        posts: [...state.posts, ...posts],
        hasMore: newHasMore,
        lastDoc: newLastDoc,
        loading: false,
        error: null
      }));

    } catch (error: any) {
      console.error('Feed pagination error:', error);
      set({
        error: error.message || 'Failed to fetch more posts',
        loading: false
      });
    }
  },

  // ============================================================================
  // Refresh Posts Action
  // ============================================================================

  /**
   * Refresh posts (pull to refresh)
   * Validates: Requirements 7.10
   */
  refreshPosts: async () => {
    // Reset pagination state and fetch first page
    set({
      posts: [],
      lastDoc: null,
      hasMore: true
    });

    await get().fetchPosts();
  }
}));
