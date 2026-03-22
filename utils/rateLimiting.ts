/**
 * Rate Limiting Utility
 * 
 * Client-side rate limiting to prevent abuse and excessive API calls.
 * Note: Server-side rate limiting should also be implemented in Cloud Functions.
 * 
 * Requirements: 24.1-24.4, NFR 4.7
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

// Store request counts per operation
const requestCounts = new Map<string, RequestRecord>();

// Default rate limit: 100 requests per minute
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 1000 // 1 minute
};

/**
 * Check if an operation is rate limited
 * 
 * @param operationKey - Unique key for the operation (e.g., 'createPost', 'sendMessage')
 * @param config - Optional rate limit configuration
 * @returns Object with allowed status and retry-after time if limited
 * 
 * Requirements: 24.1-24.4
 */
export function checkRateLimit(
  operationKey: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = requestCounts.get(operationKey);

  // No previous requests or window expired
  if (!record || now >= record.resetTime) {
    requestCounts.set(operationKey, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return { allowed: true };
  }

  // Within rate limit
  if (record.count < config.maxRequests) {
    record.count++;
    return { allowed: true };
  }

  // Rate limit exceeded
  const retryAfter = Math.ceil((record.resetTime - now) / 1000);
  return {
    allowed: false,
    retryAfter
  };
}

/**
 * Wrap an async function with rate limiting
 * 
 * @param operationKey - Unique key for the operation
 * @param fn - Function to rate limit
 * @param config - Optional rate limit configuration
 * @returns Rate-limited function
 * 
 * @example
 * ```ts
 * const createPost = withRateLimit('createPost', async (data) => {
 *   return await createDocument('skillPosts', data);
 * });
 * ```
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  operationKey: string,
  fn: T,
  config?: RateLimitConfig
): T {
  return (async (...args: any[]) => {
    const { allowed, retryAfter } = checkRateLimit(operationKey, config);

    if (!allowed) {
      throw new Error(
        `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
      );
    }

    return await fn(...args);
  }) as T;
}

/**
 * Reset rate limit for a specific operation
 * 
 * @param operationKey - Key of the operation to reset
 */
export function resetRateLimit(operationKey: string): void {
  requestCounts.delete(operationKey);
}

/**
 * Reset all rate limits
 */
export function resetAllRateLimits(): void {
  requestCounts.clear();
}

/**
 * Get current request count for an operation
 * 
 * @param operationKey - Key of the operation
 * @returns Current count and reset time, or null if no record
 */
export function getRateLimitStatus(operationKey: string): {
  count: number;
  resetTime: number;
  remaining: number;
} | null {
  const record = requestCounts.get(operationKey);

  if (!record) {
    return null;
  }

  const now = Date.now();

  // Check if window expired
  if (now >= record.resetTime) {
    requestCounts.delete(operationKey);
    return null;
  }

  return {
    count: record.count,
    resetTime: record.resetTime,
    remaining: Math.max(0, DEFAULT_CONFIG.maxRequests - record.count)
  };
}

/**
 * Predefined rate limit configurations for common operations
 */
export const RATE_LIMITS = {
  // Posting operations - more restrictive
  CREATE_POST: {
    maxRequests: 10,
    windowMs: 60 * 1000 // 10 posts per minute
  },
  
  // Messaging - moderate
  SEND_MESSAGE: {
    maxRequests: 30,
    windowMs: 60 * 1000 // 30 messages per minute
  },
  
  // Search - less restrictive
  SEARCH: {
    maxRequests: 50,
    windowMs: 60 * 1000 // 50 searches per minute
  },
  
  // Profile updates - restrictive
  UPDATE_PROFILE: {
    maxRequests: 5,
    windowMs: 60 * 1000 // 5 updates per minute
  },
  
  // Reviews - very restrictive
  SUBMIT_REVIEW: {
    maxRequests: 3,
    windowMs: 60 * 1000 // 3 reviews per minute
  },
  
  // File uploads - restrictive
  UPLOAD_FILE: {
    maxRequests: 5,
    windowMs: 60 * 1000 // 5 uploads per minute
  }
};
