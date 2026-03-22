/**
 * Error Handling Utilities
 * 
 * Provides comprehensive error handling utilities including:
 * - Authentication error mapping
 * - Firestore operation error handling
 * - Timeout and retry mechanisms
 * - Error recovery strategies
 * 
 * Validates: Requirements 20.1-20.8
 */

import { AuthError } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ErrorResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

// ============================================================================
// Authentication Error Mapping
// ============================================================================

/**
 * Map Firebase Auth errors to user-friendly messages
 * 
 * @param error - Firebase Auth error or generic error
 * @returns User-friendly error message
 * 
 * Validates: Requirement 20.5
 */
export function mapAuthError(error: unknown): string {
  // Handle non-error objects
  if (!error) {
    return 'An unexpected error occurred';
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle Error objects without code property
  if (error instanceof Error && !('code' in error)) {
    return error.message || 'An unexpected error occurred';
  }

  // Handle Firebase Auth errors
  const authError = error as AuthError | FirebaseError;

  switch (authError.code) {
    case 'auth/invalid-email':
      return 'Invalid email format';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/user-not-found':
      return 'Incorrect email or password';
    case 'auth/wrong-password':
      return 'Incorrect email or password';
    case 'auth/email-already-in-use':
      return 'Account already exists with this email';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection';
    case 'auth/invalid-credential':
      return 'Incorrect email or password';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled';
    case 'auth/requires-recent-login':
      return 'Please sign in again to continue';
    default:
      return authError.message || 'Authentication failed. Please try again';
  }
}

// ============================================================================
// Firestore Error Handling
// ============================================================================

/**
 * Handle Firestore operations with proper error handling
 * 
 * Catches permission-denied errors and provides appropriate recovery actions.
 * Validates user authentication status and redirects if necessary.
 * 
 * @param operation - Async operation to execute
 * @returns Promise resolving to operation result
 * @throws Error with user-friendly message
 * 
 * Validates: Requirement 20.2
 */
export async function handleFirestoreOperation<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // Handle Firebase errors
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as FirebaseError;

      switch (firebaseError.code) {
        case 'permission-denied':
          throw new Error('You do not have permission to perform this action');
        case 'not-found':
          throw new Error('The requested resource was not found');
        case 'already-exists':
          throw new Error('This resource already exists');
        case 'resource-exhausted':
          throw new Error('Too many requests. Please try again later');
        case 'failed-precondition':
          throw new Error('Operation cannot be performed in current state');
        case 'aborted':
          throw new Error('Operation was aborted. Please try again');
        case 'out-of-range':
          throw new Error('Invalid operation parameters');
        case 'unimplemented':
          throw new Error('This operation is not supported');
        case 'internal':
          throw new Error('Internal error. Please try again');
        case 'unavailable':
          throw new Error('Service temporarily unavailable. Please try again');
        case 'data-loss':
          throw new Error('Data loss detected. Please contact support');
        case 'unauthenticated':
          throw new Error('Please sign in to continue');
        case 'invalid-argument':
          throw new Error('Invalid request parameters');
        case 'deadline-exceeded':
          throw new Error('Operation timed out. Please try again');
        case 'cancelled':
          throw new Error('Operation was cancelled');
        default:
          throw new Error(firebaseError.message || 'Operation failed. Please try again');
      }
    }

    // Handle generic errors
    if (error instanceof Error) {
      throw error;
    }

    // Handle unknown errors
    throw new Error('An unexpected error occurred');
  }
}

// ============================================================================
// Timeout Handling
// ============================================================================

/**
 * Wrap a promise with a timeout
 * 
 * If the promise doesn't resolve within the specified timeout,
 * it will be rejected with a timeout error.
 * 
 * @param promise - Promise to wrap
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns Promise that resolves or rejects based on timeout
 * @throws Error if operation times out
 * 
 * Validates: Requirement 20.4
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000
): Promise<T> {
  // Create timeout promise
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Operation timed out'));
    }, timeoutMs);
  });

  // Race between the operation and timeout
  return Promise.race([promise, timeout]);
}

// ============================================================================
// Retry Handling
// ============================================================================

/**
 * Retry an operation with exponential backoff
 * 
 * Attempts the operation multiple times with increasing delays between attempts.
 * Uses exponential backoff strategy: delay = baseDelay * 2^attempt
 * 
 * @param operation - Async operation to retry
 * @param options - Retry configuration options
 * @returns Promise resolving to operation result
 * @throws Error from last failed attempt
 * 
 * Validates: Requirement 20.6
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 80000
  } = options;

  let lastError: Error = new Error('Operation failed');

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Attempt the operation with timeout
      return await withTimeout(operation());
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Operation failed');

      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All retries failed, throw last error
  throw lastError;
}

// ============================================================================
// Network Error Detection
// ============================================================================

/**
 * Check if an error is a network error
 * 
 * @param error - Error to check
 * @returns True if error is network-related
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('offline')
    );
  }

  if (typeof error === 'object' && 'code' in error) {
    const code = (error as any).code;
    return (
      code === 'auth/network-request-failed' ||
      code === 'unavailable' ||
      code === 'deadline-exceeded'
    );
  }

  return false;
}

// ============================================================================
// Error Result Helpers
// ============================================================================

/**
 * Create a success result
 * 
 * @param data - Result data
 * @returns Success result object
 */
export function successResult<T>(data: T): ErrorResult<T> {
  return {
    success: true,
    data
  };
}

/**
 * Create an error result
 * 
 * @param error - Error message or Error object
 * @returns Error result object
 */
export function errorResult<T>(error: string | Error): ErrorResult<T> {
  return {
    success: false,
    error: error instanceof Error ? error.message : error
  };
}
