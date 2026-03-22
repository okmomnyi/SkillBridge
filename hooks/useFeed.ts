/**
 * useFeed Hook
 * 
 * Custom hook that wraps the feedStore for easier component usage.
 * Provides feed state and actions for the home screen.
 * 
 * Validates: Requirements 7.1-7.10
 */

import { useFeedStore } from '../stores/feedStore';
import { SkillPost, SkillCategory } from '../types';

interface FeedFilters {
  category: SkillCategory | 'all';
  type: 'teach' | 'learn' | 'all';
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
}

interface UseFeedReturn {
  posts: SkillPost[];
  loading: boolean;
  hasMore: boolean;
  filters: FeedFilters;
  error: string | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  setFilters: (filters: Partial<FeedFilters>) => void;
}

/**
 * Hook for accessing feed state and actions
 * 
 * @returns Feed state and methods
 * 
 * @example
 * ```tsx
 * const { posts, loading, hasMore, loadMore, refresh, setFilters } = useFeed();
 * 
 * // Load more posts on scroll
 * const handleEndReached = () => {
 *   if (!loading && hasMore) {
 *     loadMore();
 *   }
 * };
 * 
 * // Refresh feed
 * const handleRefresh = async () => {
 *   await refresh();
 * };
 * 
 * // Apply filters
 * const handleFilterChange = (category: SkillCategory) => {
 *   setFilters({ category });
 * };
 * ```
 */
export function useFeed(): UseFeedReturn {
  const posts = useFeedStore((state) => state.posts);
  const loading = useFeedStore((state) => state.loading);
  const hasMore = useFeedStore((state) => state.hasMore);
  const filters = useFeedStore((state) => state.filters);
  const error = useFeedStore((state) => state.error);
  const fetchMorePosts = useFeedStore((state) => state.fetchMorePosts);
  const refreshPosts = useFeedStore((state) => state.refreshPosts);
  const setFiltersAction = useFeedStore((state) => state.setFilters);
  const fetchPosts = useFeedStore((state) => state.fetchPosts);

  const setFilters = (newFilters: Partial<FeedFilters>) => {
    setFiltersAction(newFilters);
    // Refetch posts with new filters
    refreshPosts();
  };

  return {
    posts,
    loading,
    hasMore,
    filters,
    error,
    loadMore: fetchMorePosts,
    refresh: refreshPosts,
    setFilters,
  };
}
