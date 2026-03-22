/**
 * Pagination Utilities
 * 
 * Generic utilities for cursor-based pagination with Firestore:
 * - Fetch paginated results
 * - Handle cursor management
 * - Support filter combinations
 * 
 * Validates: Requirements 7.3-7.6
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  DocumentSnapshot,
  QueryConstraint,
  Firestore
} from 'firebase/firestore';

// ============================================================================
// Pagination Result Interface
// ============================================================================

export interface PaginationResult<T> {
  data: T[];
  hasMore: boolean;
  lastDoc: DocumentSnapshot | null;
}

// ============================================================================
// Pagination Options Interface
// ============================================================================

export interface PaginationOptions {
  pageSize?: number;
  lastDoc?: DocumentSnapshot | null;
  constraints?: QueryConstraint[];
}

// ============================================================================
// Pagination Functions
// ============================================================================

/**
 * Fetch paginated data from Firestore
 * 
 * @param db - Firestore instance
 * @param collectionName - Name of the collection
 * @param options - Pagination options
 * @param transform - Function to transform document data
 * @returns Pagination result with data, hasMore flag, and lastDoc cursor
 * 
 * Validates: Requirements 7.3-7.6
 */
export async function fetchPaginatedData<T>(
  db: Firestore,
  collectionName: string,
  options: PaginationOptions,
  transform: (doc: any) => T
): Promise<PaginationResult<T>> {
  try {
    const pageSize = options.pageSize || 10;
    const constraints = options.constraints || [];

    // Build query with constraints
    let q = query(collection(db, collectionName), ...constraints);

    // Apply pagination cursor if provided
    if (options.lastDoc) {
      q = query(q, startAfter(options.lastDoc));
    }

    // Fetch one extra to check if more exist
    q = query(q, limit(pageSize + 1));

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;

    // Process results
    const data: T[] = [];
    for (let i = 0; i < Math.min(docs.length, pageSize); i++) {
      data.push(transform(docs[i]));
    }

    // Determine if more data exists
    const hasMore = docs.length > pageSize;
    const newLastDoc = docs.length > 0 ? docs[Math.min(docs.length - 1, pageSize - 1)] : null;

    return {
      data,
      hasMore,
      lastDoc: newLastDoc
    };

  } catch (error) {
    console.error('Pagination error:', error);
    return {
      data: [],
      hasMore: false,
      lastDoc: null
    };
  }
}

/**
 * Build query constraints for feed posts
 * 
 * @param filters - Filter options
 * @returns Array of query constraints
 */
export function buildFeedConstraints(filters: {
  category?: string;
  type?: string;
  level?: string;
}): QueryConstraint[] {
  const constraints: QueryConstraint[] = [
    where('isActive', '==', true)
  ];

  // Add filter constraints
  if (filters.category && filters.category !== 'all') {
    constraints.push(where('category', '==', filters.category));
  }

  if (filters.type && filters.type !== 'all') {
    constraints.push(where('type', '==', filters.type));
  }

  if (filters.level && filters.level !== 'all') {
    constraints.push(where('level', '==', filters.level));
  }

  // Always add orderBy last
  constraints.push(orderBy('createdAt', 'desc'));

  return constraints;
}

/**
 * Build query constraints for conversations
 * 
 * @param userId - User ID to filter by
 * @returns Array of query constraints
 */
export function buildConversationsConstraints(userId: string): QueryConstraint[] {
  return [
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  ];
}

/**
 * Build query constraints for messages
 * 
 * @returns Array of query constraints
 */
export function buildMessagesConstraints(): QueryConstraint[] {
  return [
    orderBy('timestamp', 'asc')
  ];
}
