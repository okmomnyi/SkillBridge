/**
 * Review Management Service
 * 
 * Provides functions for submitting and managing reviews for completed sessions.
 * 
 * Requirements: 11.1-11.11
 */

import { Review, Session } from '../types';
import { createDocument, getDocument, getCurrentUser, queryDocuments } from './firebase';
import { where } from 'firebase/firestore';

/**
 * Submit a review for a completed session
 * 
 * @param revieweeId - User ID being reviewed
 * @param sessionId - ID of the completed session
 * @param rating - Rating from 1-5
 * @param comment - Review comment (max 500 characters)
 * @param skills - Array of skills reviewed (1-10 items)
 * @returns Promise resolving to the review ID
 * @throws Error if validation fails
 * 
 * Requirements: 11.1-11.11
 */
export async function submitReview(
  revieweeId: string,
  sessionId: string,
  rating: number,
  comment: string,
  skills: string[]
): Promise<string> {
  // Validate current user is authenticated
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be authenticated to submit a review');
  }

  const reviewerId = currentUser.uid;

  // Validate reviewerId does not equal revieweeId (Requirement 11.2)
  if (reviewerId === revieweeId) {
    throw new Error('You cannot review yourself');
  }

  // Validate session exists and has status 'completed' (Requirement 11.3)
  const session = await getDocument<Session>('sessions', sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  if (session.status !== 'completed') {
    throw new Error('You can only review completed sessions');
  }

  // Validate both reviewer and reviewee are participants (Requirement 11.4)
  if (!session.participants.includes(reviewerId)) {
    throw new Error('You must be a participant in the session to review it');
  }

  if (!session.participants.includes(revieweeId)) {
    throw new Error('Reviewee must be a participant in the session');
  }

  // Validate rating is between 1 and 5 (Requirement 11.5)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('Rating must be an integer between 1 and 5');
  }

  // Validate comment length (Requirement 11.6)
  if (comment && comment.length > 500) {
    throw new Error('Comment must be 500 characters or less');
  }

  // Validate skills array (Requirement 11.7)
  if (!skills || !Array.isArray(skills) || skills.length < 1 || skills.length > 10) {
    throw new Error('Skills must be an array with 1-10 items');
  }

  // Check for duplicate review (Requirement 11.11)
  const existingReviews = await queryDocuments<Review>('reviews', [
    where('reviewerId', '==', reviewerId),
    where('sessionId', '==', sessionId)
  ]);

  if (existingReviews.length > 0) {
    throw new Error('You have already submitted a review for this session');
  }

  // Create review document (Requirement 11.8)
  const reviewData = {
    reviewerId,
    revieweeId,
    sessionId,
    rating,
    comment: comment.trim(),
    skills
  };

  const reviewId = await createDocument('reviews', reviewData);

  // Note: Cloud Function will handle review aggregation (Requirement 11.9)
  // The onReviewCreate trigger will update the reviewee's aggregate rating

  return reviewId;
}

/**
 * Get all reviews for a specific user
 * 
 * @param userId - User ID to get reviews for
 * @returns Promise resolving to array of reviews
 */
export async function getUserReviews(userId: string): Promise<Review[]> {
  const reviews = await queryDocuments<Review>('reviews', [
    where('revieweeId', '==', userId)
  ]);

  return reviews;
}

/**
 * Get reviews for a specific session
 * 
 * @param sessionId - Session ID to get reviews for
 * @returns Promise resolving to array of reviews
 */
export async function getSessionReviews(sessionId: string): Promise<Review[]> {
  const reviews = await queryDocuments<Review>('reviews', [
    where('sessionId', '==', sessionId)
  ]);

  return reviews;
}
