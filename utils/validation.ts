/**
 * Validation Utilities for SkillBridge Mobile App
 * 
 * This module provides comprehensive validation functions for user input
 * throughout the application. All validators return ValidationResult objects
 * with clear error messages.
 */

import { ValidationResult, SkillCategory } from '../types';

// ============================================================================
// Basic Field Validators
// ============================================================================

/**
 * Validates email format
 * Requirements: 1.5, 15.3
 */
export function validateEmail(email: string): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Trim and sanitize
  const trimmedEmail = email.trim();
  
  if (!trimmedEmail) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = 'Invalid email format';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates password strength
 * Requirements: 1.6
 */
export function validatePassword(password: string): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates display name
 * Requirements: 1.7
 */
export function validateDisplayName(displayName: string): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Trim and sanitize
  const trimmedName = displayName.trim();
  
  if (!trimmedName) {
    errors.displayName = 'Display name is required';
  } else if (trimmedName.length < 2) {
    errors.displayName = 'Display name must be at least 2 characters';
  } else if (trimmedName.length > 50) {
    errors.displayName = 'Display name must be at most 50 characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// ============================================================================
// Skill Post Validation
// ============================================================================

export interface CreateSkillPostInput {
  title: string;
  description: string;
  category: SkillCategory;
  skills: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  type: 'teach' | 'learn';
  format: 'in-person' | 'online' | 'both';
  availability: string;
}

/**
 * Validates skill post data
 * Requirements: 4.1-4.8, 15.1-15.7
 */
export function validateSkillPost(data: CreateSkillPostInput): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Validate title (Requirement 4.1)
  const trimmedTitle = data.title?.trim() || '';
  if (!trimmedTitle) {
    errors.title = 'Title is required';
  } else if (trimmedTitle.length < 10) {
    errors.title = 'Title must be at least 10 characters';
  } else if (trimmedTitle.length > 100) {
    errors.title = 'Title must be at most 100 characters';
  }
  
  // Validate description (Requirement 4.2)
  const trimmedDescription = data.description?.trim() || '';
  if (!trimmedDescription) {
    errors.description = 'Description is required';
  } else if (trimmedDescription.length < 50) {
    errors.description = 'Description must be at least 50 characters';
  } else if (trimmedDescription.length > 1000) {
    errors.description = 'Description must be at most 1000 characters';
  }
  
  // Validate category (Requirement 4.3)
  const validCategories: SkillCategory[] = [
    'programming', 'design', 'languages', 'music', 
    'sports', 'cooking', 'academic', 'other'
  ];
  if (!data.category) {
    errors.category = 'Category is required';
  } else if (!validCategories.includes(data.category)) {
    errors.category = 'Invalid category selected';
  }
  
  // Validate skills array (Requirement 4.4, 15.4)
  if (!Array.isArray(data.skills)) {
    errors.skills = 'Skills must be an array';
  } else if (data.skills.length < 1) {
    errors.skills = 'At least 1 skill is required';
  } else if (data.skills.length > 5) {
    errors.skills = 'Maximum 5 skills allowed';
  }
  
  // Validate level (Requirement 4.5)
  const validLevels = ['beginner', 'intermediate', 'advanced'];
  if (!data.level) {
    errors.level = 'Level is required';
  } else if (!validLevels.includes(data.level)) {
    errors.level = 'Invalid level selected';
  }
  
  // Validate type (Requirement 4.6)
  const validTypes = ['teach', 'learn'];
  if (!data.type) {
    errors.type = 'Type is required';
  } else if (!validTypes.includes(data.type)) {
    errors.type = 'Type must be either teach or learn';
  }
  
  // Validate format (Requirement 4.7)
  const validFormats = ['in-person', 'online', 'both'];
  if (!data.format) {
    errors.format = 'Format is required';
  } else if (!validFormats.includes(data.format)) {
    errors.format = 'Invalid format selected';
  }
  
  // Validate availability (Requirement 4.8)
  const trimmedAvailability = data.availability?.trim() || '';
  if (!trimmedAvailability) {
    errors.availability = 'Availability is required';
  } else if (trimmedAvailability.length < 10) {
    errors.availability = 'Availability must be at least 10 characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// ============================================================================
// User Profile Validation
// ============================================================================

export interface UpdateUserProfileInput {
  displayName?: string;
  bio?: string;
  skillsToTeach?: string[];
  skillsToLearn?: string[];
  university?: string;
  major?: string;
  year?: number;
}

/**
 * Validates user profile update data
 * Requirements: 1.7-1.9, 15.1-15.7
 */
export function validateUserProfile(data: UpdateUserProfileInput): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Validate displayName if provided (Requirement 1.7)
  if (data.displayName !== undefined) {
    const trimmedName = data.displayName.trim();
    if (trimmedName.length < 2) {
      errors.displayName = 'Display name must be at least 2 characters';
    } else if (trimmedName.length > 50) {
      errors.displayName = 'Display name must be at most 50 characters';
    }
  }
  
  // Validate bio if provided (Requirement 15.2)
  if (data.bio !== undefined) {
    const trimmedBio = data.bio.trim();
    if (trimmedBio.length > 500) {
      errors.bio = 'Bio must be at most 500 characters';
    }
  }
  
  // Validate skillsToTeach if provided (Requirement 1.8, 1.9, 15.4)
  if (data.skillsToTeach !== undefined) {
    if (!Array.isArray(data.skillsToTeach)) {
      errors.skillsToTeach = 'Skills to teach must be an array';
    } else if (data.skillsToTeach.length < 1) {
      errors.skillsToTeach = 'At least 1 skill to teach is required';
    } else if (data.skillsToTeach.length > 10) {
      errors.skillsToTeach = 'Maximum 10 skills to teach allowed';
    }
  }
  
  // Validate skillsToLearn if provided (Requirement 1.8, 1.9, 15.4)
  if (data.skillsToLearn !== undefined) {
    if (!Array.isArray(data.skillsToLearn)) {
      errors.skillsToLearn = 'Skills to learn must be an array';
    } else if (data.skillsToLearn.length < 1) {
      errors.skillsToLearn = 'At least 1 skill to learn is required';
    } else if (data.skillsToLearn.length > 10) {
      errors.skillsToLearn = 'Maximum 10 skills to learn allowed';
    }
  }
  
  // Validate university if provided
  if (data.university !== undefined) {
    const trimmedUniversity = data.university.trim();
    if (trimmedUniversity.length < 2) {
      errors.university = 'University name must be at least 2 characters';
    }
  }
  
  // Validate major if provided
  if (data.major !== undefined) {
    const trimmedMajor = data.major.trim();
    if (trimmedMajor.length < 2) {
      errors.major = 'Major must be at least 2 characters';
    }
  }
  
  // Validate year if provided (Requirement 15.5)
  if (data.year !== undefined) {
    if (typeof data.year !== 'number') {
      errors.year = 'Year must be a number';
    } else if (data.year < 1 || data.year > 4) {
      errors.year = 'Year must be between 1 and 4';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// ============================================================================
// Review Validation
// ============================================================================

export interface CreateReviewInput {
  reviewerId: string;
  revieweeId: string;
  sessionId: string;
  rating: number;
  comment: string;
  skills: string[];
}

/**
 * Validates review submission data
 * Requirements: 11.5-11.7, 15.1-15.7
 */
export function validateReview(data: CreateReviewInput): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Validate reviewerId (Requirement 11.1)
  if (!data.reviewerId || !data.reviewerId.trim()) {
    errors.reviewerId = 'Reviewer ID is required';
  }
  
  // Validate revieweeId (Requirement 11.2)
  if (!data.revieweeId || !data.revieweeId.trim()) {
    errors.revieweeId = 'Reviewee ID is required';
  } else if (data.reviewerId === data.revieweeId) {
    errors.revieweeId = 'Cannot review yourself';
  }
  
  // Validate sessionId (Requirement 11.3)
  if (!data.sessionId || !data.sessionId.trim()) {
    errors.sessionId = 'Session ID is required';
  }
  
  // Validate rating (Requirement 11.5, 15.5)
  if (data.rating === undefined || data.rating === null) {
    errors.rating = 'Rating is required';
  } else if (typeof data.rating !== 'number') {
    errors.rating = 'Rating must be a number';
  } else if (!Number.isInteger(data.rating)) {
    errors.rating = 'Rating must be an integer';
  } else if (data.rating < 1 || data.rating > 5) {
    errors.rating = 'Rating must be between 1 and 5';
  }
  
  // Validate comment (Requirement 11.6)
  if (data.comment !== undefined && data.comment !== null) {
    const trimmedComment = data.comment.trim();
    if (trimmedComment.length > 500) {
      errors.comment = 'Comment must be at most 500 characters';
    }
  }
  
  // Validate skills array (Requirement 11.7, 15.4)
  if (!Array.isArray(data.skills)) {
    errors.skills = 'Skills must be an array';
  } else if (data.skills.length < 1) {
    errors.skills = 'At least 1 skill is required';
  } else if (data.skills.length > 10) {
    errors.skills = 'Maximum 10 skills allowed';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// ============================================================================
// Message Validation
// ============================================================================

/**
 * Validates message text
 * Requirements: 15.1, 15.2
 */
export function validateMessage(text: string): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Trim and sanitize (Requirement 15.2)
  const trimmedText = text.trim();
  
  if (!trimmedText) {
    errors.text = 'Message cannot be empty';
  } else if (trimmedText.length > 1000) {
    errors.text = 'Message must be at most 1000 characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// ============================================================================
// Sanitization Utilities
// ============================================================================

/**
 * Removes HTML tags and scripts from text input
 * Requirements: 15.1
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  // Remove HTML tags and scripts
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Sanitizes and validates array input
 * Requirements: 15.4
 */
export function sanitizeArray(input: any, maxLength: number = 10): string[] {
  if (!Array.isArray(input)) {
    return [];
  }
  
  return input
    .filter(item => typeof item === 'string' && item.trim().length > 0)
    .map(item => sanitizeText(item))
    .slice(0, maxLength);
}

// ============================================================================
// Error Message Mapping
// ============================================================================

/**
 * Maps Firebase Auth error codes to user-friendly messages
 * Requirements: 15.6
 */
export function mapAuthError(error: any): string {
  const errorCode = error?.code || '';
  
  const errorMap: Record<string, string> = {
    'auth/email-already-in-use': 'Account already exists with this email',
    'auth/invalid-email': 'Invalid email format',
    'auth/weak-password': 'Password must be at least 6 characters',
    'auth/user-not-found': 'Incorrect email or password',
    'auth/wrong-password': 'Incorrect email or password',
    'auth/too-many-requests': 'Too many attempts. Please try again later',
    'auth/user-disabled': 'This account has been disabled',
    'auth/network-request-failed': 'Network error. Check your connection',
    'auth/operation-not-allowed': 'This operation is not allowed',
    'auth/invalid-credential': 'Invalid credentials provided'
  };
  
  return errorMap[errorCode] || 'An error occurred. Please try again';
}

/**
 * Maps Firestore error codes to user-friendly messages
 * Requirements: 15.6
 */
export function mapFirestoreError(error: any): string {
  const errorCode = error?.code || '';
  
  const errorMap: Record<string, string> = {
    'permission-denied': 'You do not have permission to perform this action',
    'not-found': 'The requested resource was not found',
    'already-exists': 'This resource already exists',
    'resource-exhausted': 'Too many requests. Please try again later',
    'failed-precondition': 'Operation cannot be performed in current state',
    'aborted': 'Operation was aborted. Please try again',
    'out-of-range': 'Invalid value provided',
    'unimplemented': 'This feature is not yet available',
    'internal': 'Internal error occurred. Please try again',
    'unavailable': 'Service temporarily unavailable. Please try again',
    'data-loss': 'Data loss occurred. Please contact support',
    'unauthenticated': 'Please sign in to continue',
    'deadline-exceeded': 'Request timed out. Please try again'
  };
  
  return errorMap[errorCode] || 'An error occurred. Please try again';
}

/**
 * Maps Storage error codes to user-friendly messages
 * Requirements: 15.6
 */
export function mapStorageError(error: any): string {
  const errorCode = error?.code || '';
  
  const errorMap: Record<string, string> = {
    'storage/unauthorized': 'You do not have permission to access this file',
    'storage/canceled': 'Upload was canceled',
    'storage/unknown': 'An unknown error occurred',
    'storage/object-not-found': 'File not found',
    'storage/bucket-not-found': 'Storage bucket not found',
    'storage/project-not-found': 'Project not found',
    'storage/quota-exceeded': 'Storage quota exceeded',
    'storage/unauthenticated': 'Please sign in to upload files',
    'storage/retry-limit-exceeded': 'Upload failed after multiple retries',
    'storage/invalid-checksum': 'File upload corrupted. Please try again',
    'storage/canceled': 'Upload was canceled',
    'storage/invalid-event-name': 'Invalid operation',
    'storage/invalid-url': 'Invalid file URL',
    'storage/invalid-argument': 'Invalid file provided',
    'storage/no-default-bucket': 'No storage bucket configured',
    'storage/cannot-slice-blob': 'File cannot be processed',
    'storage/server-file-wrong-size': 'File size mismatch. Please try again'
  };
  
  return errorMap[errorCode] || 'File operation failed. Please try again';
}

/**
 * Generic error message mapper that handles all Firebase services
 * Requirements: 15.6
 */
export function mapFirebaseError(error: any): string {
  if (!error) return 'An error occurred. Please try again';
  
  const errorCode = error?.code || '';
  
  // Try auth errors first
  if (errorCode.startsWith('auth/')) {
    return mapAuthError(error);
  }
  
  // Try storage errors
  if (errorCode.startsWith('storage/')) {
    return mapStorageError(error);
  }
  
  // Default to Firestore errors
  return mapFirestoreError(error);
}
