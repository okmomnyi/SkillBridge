/**
 * Session Management Service
 * 
 * Provides functions for creating and managing learning sessions between users.
 * 
 * Requirements: 13.1-13.10
 */

import { Session } from '../types';
import { createDocument, getDocument, getCurrentUser } from './firebase';

/**
 * Create a new learning session
 * 
 * @param participants - Array of user IDs (must include current user)
 * @param skillPostId - Reference to the skill post
 * @param scheduledAt - When the session is scheduled
 * @returns Promise resolving to the session ID
 * @throws Error if validation fails
 * 
 * Requirements: 13.1-13.7
 */
export async function createSession(
  participants: string[],
  skillPostId: string,
  scheduledAt: Date
): Promise<string> {
  // Validate current user is authenticated
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be authenticated to create a session');
  }

  // Validate participants array contains at least 2 users (Requirement 13.2)
  if (!participants || participants.length < 2) {
    throw new Error('Session must have at least 2 participants');
  }

  // Validate current user is in participants array (Requirement 13.1)
  if (!participants.includes(currentUser.uid)) {
    throw new Error('You must be a participant in the session');
  }

  // Validate skillPostId is provided (Requirement 13.3)
  if (!skillPostId || skillPostId.trim() === '') {
    throw new Error('Skill post ID is required');
  }

  // Verify skill post exists
  const skillPost = await getDocument('skillPosts', skillPostId);
  if (!skillPost) {
    throw new Error('Skill post not found');
  }

  // Validate scheduledAt is a valid date
  if (!(scheduledAt instanceof Date) || isNaN(scheduledAt.getTime())) {
    throw new Error('Invalid scheduled date');
  }

  // Create session document (Requirements 13.4-13.7)
  const sessionData = {
    participants,
    skillPostId,
    status: 'scheduled' as const,
    scheduledAt,
    completedAt: null
  };

  const sessionId = await createDocument('sessions', sessionData);
  return sessionId;
}

/**
 * Update session status to completed
 * 
 * @param sessionId - ID of the session to complete
 * @returns Promise resolving when update is complete
 * @throws Error if validation fails
 * 
 * Requirements: 13.8
 */
export async function completeSession(sessionId: string): Promise<void> {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be authenticated to complete a session');
  }

  // Verify session exists and user is a participant
  const session = await getDocument<Session>('sessions', sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  if (!session.participants.includes(currentUser.uid)) {
    throw new Error('You must be a participant to complete this session');
  }

  // Update session status
  const { updateDocument } = await import('./firebase');
  await updateDocument('sessions', sessionId, {
    status: 'completed',
    completedAt: new Date()
  });
}

/**
 * Cancel a session
 * 
 * @param sessionId - ID of the session to cancel
 * @returns Promise resolving when update is complete
 * @throws Error if validation fails
 */
export async function cancelSession(sessionId: string): Promise<void> {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be authenticated to cancel a session');
  }

  // Verify session exists and user is a participant
  const session = await getDocument<Session>('sessions', sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  if (!session.participants.includes(currentUser.uid)) {
    throw new Error('You must be a participant to cancel this session');
  }

  // Update session status
  const { updateDocument } = await import('./firebase');
  await updateDocument('sessions', sessionId, {
    status: 'cancelled'
  });
}
