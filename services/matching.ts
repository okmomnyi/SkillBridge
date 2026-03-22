/**
 * Skill Matching Service
 * 
 * Implements the skill matching algorithm that calculates compatibility scores
 * between users and skill posts based on multiple factors:
 * - Skill overlap (max 30 points)
 * - Mutual exchange opportunities (25 points)
 * - Category alignment (15 points)
 * - User rating (max 15 points)
 * - Activity level (max 10 points)
 * - Post recency (max 5 points)
 * 
 * Validates: Requirements 6.1-6.11
 */

import { SkillPost, User, MatchScore } from '../types';

// ============================================================================
// Constants
// ============================================================================

const WEIGHTS = {
  SKILL_OVERLAP_MAX: 30,
  SKILL_OVERLAP_PER_MATCH: 10,
  MUTUAL_EXCHANGE: 25,
  CATEGORY_ALIGNMENT: 15,
  RATING_MAX: 15,
  ACTIVITY_MAX: 10,
  ACTIVITY_PER_SESSION: 2,
  RECENCY_MAX: 5,
  RECENCY_DECAY_WEEKS: 1
};

// ============================================================================
// Matching Algorithm
// ============================================================================

/**
 * Calculate match score between a user's post and a target user
 * 
 * @param userPost - The skill post from the requesting user
 * @param targetUser - The potential match user
 * @param targetPosts - All active posts from the target user
 * @returns MatchScore with total score (0-100) and breakdown
 * 
 * Validates: Requirements 6.1-6.11
 */
export function calculateMatchScore(
  userPost: SkillPost,
  targetUser: User,
  targetPosts: SkillPost[]
): MatchScore {
  const breakdown = {
    skillOverlap: 0,
    mutualExchange: 0,
    categoryAlignment: 0,
    rating: 0,
    activity: 0,
    recency: 0
  };

  // ============================================================================
  // Step 1: Calculate skill overlap (max 30 points)
  // Validates: Requirement 6.2
  // ============================================================================

  let matchCount = 0;
  const targetSkills = userPost.type === 'teach' 
    ? targetUser.skillsToLearn 
    : targetUser.skillsToTeach;

  for (const skill of userPost.skills) {
    if (targetSkills.includes(skill)) {
      matchCount++;
    }
  }

  breakdown.skillOverlap = Math.min(
    WEIGHTS.SKILL_OVERLAP_MAX,
    matchCount * WEIGHTS.SKILL_OVERLAP_PER_MATCH
  );

  // ============================================================================
  // Step 2: Check for mutual exchange (25 points)
  // Validates: Requirement 6.3
  // ============================================================================

  const complementaryType = userPost.type === 'teach' ? 'learn' : 'teach';
  const userComplementarySkills = userPost.type === 'teach'
    ? targetUser.skillsToLearn
    : targetUser.skillsToTeach;

  let hasMutualExchange = false;

  for (const targetPost of targetPosts) {
    if (targetPost.type === complementaryType) {
      // Check if target's post skills match user's complementary skills
      const hasOverlap = targetPost.skills.some(skill => 
        userComplementarySkills.includes(skill)
      );

      if (hasOverlap) {
        hasMutualExchange = true;
        break;
      }
    }
  }

  breakdown.mutualExchange = hasMutualExchange ? WEIGHTS.MUTUAL_EXCHANGE : 0;

  // ============================================================================
  // Step 3: Category alignment (15 points)
  // Validates: Requirement 6.4
  // ============================================================================

  const categoryMatch = targetPosts.some(post => post.category === userPost.category);
  breakdown.categoryAlignment = categoryMatch ? WEIGHTS.CATEGORY_ALIGNMENT : 0;

  // ============================================================================
  // Step 4: User rating (max 15 points)
  // Validates: Requirement 6.5
  // ============================================================================

  // Scale rating from 0-5 to 0-15
  // Handle NaN ratings by treating as 0
  // Round to avoid floating point precision issues
  const userRating = isNaN(targetUser.rating) ? 0 : targetUser.rating;
  breakdown.rating = Math.round(
    Math.min(
      WEIGHTS.RATING_MAX,
      (userRating / 5) * WEIGHTS.RATING_MAX
    ) * 100
  ) / 100;

  // ============================================================================
  // Step 5: User activity (max 10 points)
  // Validates: Requirement 6.6
  // ============================================================================

  const activityScore = Math.min(
    WEIGHTS.ACTIVITY_MAX,
    targetUser.sessionsCompleted * WEIGHTS.ACTIVITY_PER_SESSION
  );
  breakdown.activity = activityScore;

  // ============================================================================
  // Step 6: Post recency (max 5 points)
  // Validates: Requirement 6.7
  // ============================================================================

  const now = Date.now();
  const postTime = userPost.createdAt.getTime();
  
  // Handle invalid dates or future dates
  if (isNaN(postTime) || postTime > now) {
    breakdown.recency = WEIGHTS.RECENCY_MAX;
  } else {
    const daysSincePost = (now - postTime) / (1000 * 60 * 60 * 24);
    const weeksSincePost = Math.floor(daysSincePost / 7);
    breakdown.recency = Math.max(
      0,
      Math.min(WEIGHTS.RECENCY_MAX, WEIGHTS.RECENCY_MAX - (weeksSincePost * WEIGHTS.RECENCY_DECAY_WEEKS))
    );
  }

  // ============================================================================
  // Calculate total score
  // Validates: Requirements 6.1, 6.8-6.9
  // ============================================================================

  const totalScore = 
    breakdown.skillOverlap +
    breakdown.mutualExchange +
    breakdown.categoryAlignment +
    breakdown.rating +
    breakdown.activity +
    breakdown.recency;

  // Ensure score is within bounds (0-100) and round to avoid floating point issues
  const finalScore = Math.round(Math.max(0, Math.min(100, totalScore)) * 100) / 100;

  return {
    userId: targetUser.uid,
    postId: userPost.id,
    score: finalScore,
    breakdown
  };
}

/**
 * Find matches for a user's skill post
 * 
 * @param userPost - The skill post to find matches for
 * @param allUsers - All users in the system
 * @param allPosts - All active skill posts
 * @param limitCount - Maximum number of matches to return (default 20, max 100)
 * @returns Array of MatchScore sorted by score descending
 * 
 * Validates: Requirements 6.10-6.11
 */
export function findMatches(
  userPost: SkillPost,
  allUsers: User[],
  allPosts: SkillPost[],
  limitCount: number = 20
): MatchScore[] {
  // Validate limit
  const limit = Math.min(Math.max(1, limitCount), 100);

  // Group posts by user
  const postsByUser = new Map<string, SkillPost[]>();
  for (const post of allPosts) {
    if (post.isActive && post.userId !== userPost.userId) {
      const userPosts = postsByUser.get(post.userId) || [];
      userPosts.push(post);
      postsByUser.set(post.userId, userPosts);
    }
  }

  // Calculate match scores for all users
  const matches: MatchScore[] = [];

  for (const targetUser of allUsers) {
    // Skip the post owner
    if (targetUser.uid === userPost.userId) {
      continue;
    }

    const targetPosts = postsByUser.get(targetUser.uid) || [];
    const matchScore = calculateMatchScore(userPost, targetUser, targetPosts);
    matches.push(matchScore);
  }

  // Sort by score descending and limit results
  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, limit);
}

/**
 * Get human-readable breakdown of match score
 * 
 * @param score - The match score with breakdown
 * @returns Array of strings describing each component
 */
export function getMatchBreakdown(score: MatchScore): string[] {
  const breakdown: string[] = [];

  if (score.breakdown.skillOverlap > 0) {
    breakdown.push(`Skill overlap: ${score.breakdown.skillOverlap} points`);
  }

  if (score.breakdown.mutualExchange > 0) {
    breakdown.push(`Mutual exchange opportunity: ${score.breakdown.mutualExchange} points`);
  }

  if (score.breakdown.categoryAlignment > 0) {
    breakdown.push(`Category alignment: ${score.breakdown.categoryAlignment} points`);
  }

  if (score.breakdown.rating > 0) {
    breakdown.push(`User rating: ${score.breakdown.rating.toFixed(1)} points`);
  }

  if (score.breakdown.activity > 0) {
    breakdown.push(`Activity level: ${score.breakdown.activity} points`);
  }

  if (score.breakdown.recency > 0) {
    breakdown.push(`Post recency: ${score.breakdown.recency} points`);
  }

  return breakdown;
}
