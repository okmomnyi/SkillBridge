/**
 * Search Service
 * 
 * Implements search functionality for skill posts with:
 * - Text search across title, description, and skills
 * - Relevance scoring (title: 3pts, skills: 2pts, description: 1pt)
 * - Filter support (category, type, level, format)
 * - Results sorted by relevance descending
 * - Limited to 50 results
 * 
 * Validates: Requirements 8.1-8.9
 */

import { SkillPost, SkillCategory } from '../types';

// ============================================================================
// Constants
// ============================================================================

const RELEVANCE_WEIGHTS = {
  TITLE: 3,
  SKILL: 2,
  DESCRIPTION: 1
};

const MAX_RESULTS = 50;

// ============================================================================
// Search Filters Interface
// ============================================================================

export interface SearchFilters {
  category?: SkillCategory | 'all';
  type?: 'teach' | 'learn' | 'all';
  level?: 'beginner' | 'intermediate' | 'advanced' | 'all';
  format?: 'in-person' | 'online' | 'both' | 'all';
}

// ============================================================================
// Search Result Interface
// ============================================================================

export interface SearchResult {
  post: SkillPost;
  relevanceScore: number;
}

// ============================================================================
// Search Algorithm
// ============================================================================

/**
 * Calculate relevance score for a post based on search query
 * 
 * @param post - The skill post to score
 * @param query - The search query (case-insensitive)
 * @returns Relevance score (higher is better)
 * 
 * Validates: Requirements 8.2-8.4
 */
function calculateRelevanceScore(post: SkillPost, query: string): number {
  if (!query || query.trim() === '') {
    return 0;
  }

  const normalizedQuery = query.toLowerCase().trim();
  let score = 0;

  // Check title (3 points per match)
  if (post.title.toLowerCase().includes(normalizedQuery)) {
    score += RELEVANCE_WEIGHTS.TITLE;
  }

  // Check skills (2 points per matching skill)
  for (const skill of post.skills) {
    if (skill.toLowerCase().includes(normalizedQuery)) {
      score += RELEVANCE_WEIGHTS.SKILL;
    }
  }

  // Check description (1 point per match)
  if (post.description.toLowerCase().includes(normalizedQuery)) {
    score += RELEVANCE_WEIGHTS.DESCRIPTION;
  }

  return score;
}

/**
 * Check if a post matches the given filters
 * 
 * @param post - The skill post to check
 * @param filters - The filters to apply
 * @returns True if post matches all filters
 * 
 * Validates: Requirement 8.7
 */
function matchesFilters(post: SkillPost, filters: SearchFilters): boolean {
  // Category filter
  if (filters.category && filters.category !== 'all') {
    if (post.category !== filters.category) {
      return false;
    }
  }

  // Type filter
  if (filters.type && filters.type !== 'all') {
    if (post.type !== filters.type) {
      return false;
    }
  }

  // Level filter
  if (filters.level && filters.level !== 'all') {
    if (post.level !== filters.level) {
      return false;
    }
  }

  // Format filter
  if (filters.format && filters.format !== 'all') {
    if (post.format !== filters.format) {
      return false;
    }
  }

  return true;
}

/**
 * Search skill posts by query and filters
 * 
 * @param posts - All available skill posts
 * @param query - Search query string
 * @param filters - Optional filters to apply
 * @returns Array of search results sorted by relevance descending
 * 
 * Validates: Requirements 8.1-8.9
 */
export function searchSkillPosts(
  posts: SkillPost[],
  query: string,
  filters: SearchFilters = {}
): SearchResult[] {
  const normalizedQuery = query.trim();

  // Filter posts by filters first
  let filteredPosts = posts.filter(post => {
    // Only include active posts
    if (!post.isActive) {
      return false;
    }

    // Apply filters
    return matchesFilters(post, filters);
  });

  // If query is empty, return all filtered posts with score 0
  if (normalizedQuery === '') {
    return filteredPosts
      .map(post => ({
        post,
        relevanceScore: 0
      }))
      .slice(0, MAX_RESULTS);
  }

  // Calculate relevance scores
  const results: SearchResult[] = filteredPosts
    .map(post => ({
      post,
      relevanceScore: calculateRelevanceScore(post, normalizedQuery)
    }))
    .filter(result => result.relevanceScore > 0); // Only include posts with matches

  // Sort by relevance score descending
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Limit to MAX_RESULTS
  return results.slice(0, MAX_RESULTS);
}

/**
 * Get human-readable explanation of search result relevance
 * 
 * @param result - The search result
 * @param query - The search query
 * @returns Array of strings explaining the relevance
 */
export function getRelevanceExplanation(result: SearchResult, query: string): string[] {
  const explanation: string[] = [];
  const normalizedQuery = query.toLowerCase().trim();
  const { post } = result;

  if (post.title.toLowerCase().includes(normalizedQuery)) {
    explanation.push('Matches title');
  }

  const matchingSkills = post.skills.filter(skill => 
    skill.toLowerCase().includes(normalizedQuery)
  );
  if (matchingSkills.length > 0) {
    explanation.push(`Matches skills: ${matchingSkills.join(', ')}`);
  }

  if (post.description.toLowerCase().includes(normalizedQuery)) {
    explanation.push('Matches description');
  }

  return explanation;
}
