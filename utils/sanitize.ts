/**
 * Sanitization Utilities for SkillBridge Mobile App
 * 
 * This module provides comprehensive sanitization functions for user-generated
 * content to prevent XSS attacks and ensure data integrity.
 * 
 * Requirements: 15.1-15.2
 */

/**
 * Removes HTML tags and scripts from text input
 * Requirement 15.1: Remove all HTML tags and scripts
 */
export function removeHtml(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  // Remove script tags and their content
  let sanitized = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove style tags and their content
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove all HTML tags
  sanitized = sanitized.replace(/<[^>]+>/g, '');
  
  // Decode common HTML entities
  sanitized = sanitized
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  return sanitized;
}

/**
 * Trims leading and trailing whitespace
 * Requirement 15.2: Trim leading and trailing whitespace
 */
export function trimWhitespace(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  // Trim leading and trailing whitespace
  return text.trim();
}

/**
 * Sanitizes text by removing HTML and trimming whitespace
 * Combines requirements 15.1 and 15.2
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  // First remove HTML tags and scripts
  let sanitized = removeHtml(text);
  
  // Then trim whitespace
  sanitized = trimWhitespace(sanitized);
  
  return sanitized;
}

/**
 * Sanitizes user display name
 * Requirements: 15.1-15.2
 */
export function sanitizeDisplayName(name: string): string {
  return sanitizeText(name);
}

/**
 * Sanitizes user bio text
 * Requirements: 15.1-15.2
 */
export function sanitizeBio(bio: string): string {
  return sanitizeText(bio);
}

/**
 * Sanitizes skill post title
 * Requirements: 15.1-15.2
 */
export function sanitizeTitle(title: string): string {
  return sanitizeText(title);
}

/**
 * Sanitizes skill post description
 * Requirements: 15.1-15.2
 */
export function sanitizeDescription(description: string): string {
  return sanitizeText(description);
}

/**
 * Sanitizes message text
 * Requirements: 15.1-15.2
 */
export function sanitizeMessage(message: string): string {
  return sanitizeText(message);
}

/**
 * Sanitizes review comment
 * Requirements: 15.1-15.2
 */
export function sanitizeComment(comment: string): string {
  return sanitizeText(comment);
}

/**
 * Sanitizes an array of strings
 * Requirements: 15.1-15.2
 */
export function sanitizeArray(items: any[], maxLength: number = 10): string[] {
  if (!Array.isArray(items)) {
    return [];
  }
  
  return items
    .filter(item => typeof item === 'string' && item.trim().length > 0)
    .map(item => sanitizeText(item))
    .slice(0, maxLength);
}

/**
 * Sanitizes skill names array
 * Requirements: 15.1-15.2
 */
export function sanitizeSkills(skills: any[], maxLength: number = 10): string[] {
  return sanitizeArray(skills, maxLength);
}

/**
 * Removes special characters that could be used for injection attacks
 * Additional security measure beyond requirements
 */
export function removeSpecialCharacters(text: string, allowedChars: string = ''): string {
  if (!text || typeof text !== 'string') return '';
  
  // Allow alphanumeric, spaces, and specified allowed characters
  const pattern = new RegExp(`[^a-zA-Z0-9\\s${allowedChars}]`, 'g');
  return text.replace(pattern, '');
}

/**
 * Sanitizes URL to prevent javascript: and data: protocols
 * Additional security measure for profile photos and links
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  
  const trimmedUrl = url.trim().toLowerCase();
  
  // Block dangerous protocols
  if (
    trimmedUrl.startsWith('javascript:') ||
    trimmedUrl.startsWith('data:') ||
    trimmedUrl.startsWith('vbscript:') ||
    trimmedUrl.startsWith('file:')
  ) {
    return '';
  }
  
  return url.trim();
}

/**
 * Comprehensive sanitization for all user profile fields
 * Requirements: 15.1-15.2
 */
export function sanitizeUserProfile(profile: {
  displayName?: string;
  bio?: string;
  university?: string;
  major?: string;
  skillsToTeach?: any[];
  skillsToLearn?: any[];
  interests?: any[];
  photoURL?: string;
}): {
  displayName?: string;
  bio?: string;
  university?: string;
  major?: string;
  skillsToTeach?: string[];
  skillsToLearn?: string[];
  interests?: string[];
  photoURL?: string;
} {
  const sanitized: any = {};
  
  if (profile.displayName !== undefined) {
    sanitized.displayName = sanitizeDisplayName(profile.displayName);
  }
  
  if (profile.bio !== undefined) {
    sanitized.bio = sanitizeBio(profile.bio);
  }
  
  if (profile.university !== undefined) {
    sanitized.university = sanitizeText(profile.university);
  }
  
  if (profile.major !== undefined) {
    sanitized.major = sanitizeText(profile.major);
  }
  
  if (profile.skillsToTeach !== undefined) {
    sanitized.skillsToTeach = sanitizeSkills(profile.skillsToTeach);
  }
  
  if (profile.skillsToLearn !== undefined) {
    sanitized.skillsToLearn = sanitizeSkills(profile.skillsToLearn);
  }
  
  if (profile.interests !== undefined) {
    sanitized.interests = sanitizeArray(profile.interests);
  }
  
  if (profile.photoURL !== undefined) {
    sanitized.photoURL = sanitizeUrl(profile.photoURL);
  }
  
  return sanitized;
}

/**
 * Comprehensive sanitization for skill post data
 * Requirements: 15.1-15.2
 */
export function sanitizeSkillPost(post: {
  title?: string;
  description?: string;
  skills?: any[];
  availability?: string;
}): {
  title?: string;
  description?: string;
  skills?: string[];
  availability?: string;
} {
  const sanitized: any = {};
  
  if (post.title !== undefined) {
    sanitized.title = sanitizeTitle(post.title);
  }
  
  if (post.description !== undefined) {
    sanitized.description = sanitizeDescription(post.description);
  }
  
  if (post.skills !== undefined) {
    sanitized.skills = sanitizeSkills(post.skills, 5);
  }
  
  if (post.availability !== undefined) {
    sanitized.availability = sanitizeText(post.availability);
  }
  
  return sanitized;
}

/**
 * Comprehensive sanitization for review data
 * Requirements: 15.1-15.2
 */
export function sanitizeReview(review: {
  comment?: string;
  skills?: any[];
}): {
  comment?: string;
  skills?: string[];
} {
  const sanitized: any = {};
  
  if (review.comment !== undefined) {
    sanitized.comment = sanitizeComment(review.comment);
  }
  
  if (review.skills !== undefined) {
    sanitized.skills = sanitizeSkills(review.skills);
  }
  
  return sanitized;
}
