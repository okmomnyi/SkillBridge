/**
 * Firebase Service Layer
 * 
 * Provides a comprehensive interface for Firebase operations including:
 * - Authentication (Email/Password, Google OAuth)
 * - Firestore CRUD operations
 * - Real-time subscriptions
 * - Firebase Storage operations
 * 
 * Requirements: 1.1, 2.1, 2.3, 3.1, 3.8
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  User as FirebaseUser,
  AuthError
} from 'firebase/auth';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  QueryConstraint,
  onSnapshot,
  Unsubscribe,
  DocumentSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

import {
  ref,
  uploadBytes,
  deleteObject,
  getDownloadURL as firebaseGetDownloadURL
} from 'firebase/storage';

import { auth, storage, getDb } from './firebaseConfig';
import { User } from '../types';

// ============================================================================
// Type Definitions
// ============================================================================

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

// ============================================================================
// Authentication Methods
// ============================================================================

/**
 * Sign in with email and password
 * 
 * @param email - User email address
 * @param password - User password (minimum 6 characters)
 * @returns Promise resolving to User object
 * @throws Error with user-friendly message on failure
 * 
 * Requirements: 2.1-2.7
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<User> {
  try {
    // Authenticate with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Fetch user profile from Firestore
    const userDoc = await getDoc(doc(getDb(), 'users', firebaseUser.uid));

    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    // Convert Firestore data to User type
    const userData = convertFirestoreUser(userDoc);
    return userData;
  } catch (error) {
    throw new Error(mapAuthError(error as AuthError));
  }
}

/**
 * Sign up with email and password
 * 
 * @param email - User email address
 * @param password - User password (minimum 6 characters)
 * @returns Promise resolving to User object
 * @throws Error with user-friendly message on failure
 * 
 * Requirements: 1.1-1.9
 */
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<User> {
  try {
    // Create Firebase Auth account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Note: User profile creation in Firestore should be done separately
    // after collecting additional profile information
    // This function only creates the auth account

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: '',
      photoURL: null,
      university: '',
      major: '',
      year: 1,
      bio: '',
      skillsToTeach: [],
      skillsToLearn: [],
      interests: [],
      rating: 0,
      reviewCount: 0,
      sessionsCompleted: 0,
      points: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    throw new Error(mapAuthError(error as AuthError));
  }
}

/**
 * Sign in with Google OAuth
 * 
 * @returns Promise resolving to User object
 * @throws Error with user-friendly message on failure
 * 
 * Requirements: 2.3
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    // Note: Google Sign-In requires platform-specific implementation
    // For React Native, you'll need to use @react-native-google-signin/google-signin
    // or expo-auth-session for web-based OAuth flow
    
    // This is a placeholder that shows the general flow
    // Actual implementation depends on the OAuth library used
    
    throw new Error('Google Sign-In not yet implemented. Please use email/password authentication.');
  } catch (error) {
    throw new Error(mapAuthError(error as AuthError));
  }
}

/**
 * Sign out the current user
 * 
 * Requirements: 17.4-17.6
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    throw new Error('Failed to sign out. Please try again.');
  }
}

/**
 * Get the currently authenticated user
 * 
 * @returns Current user or null if not authenticated
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Listen to authentication state changes
 * 
 * @param callback - Function to call when auth state changes
 * @returns Unsubscribe function
 * 
 * Requirements: 17.1-17.3
 */
export function onAuthStateChanged(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return firebaseOnAuthStateChanged(auth, callback);
}

// ============================================================================
// Firestore CRUD Operations
// ============================================================================

/**
 * Create a new document in a collection
 * 
 * @param collectionName - Name of the Firestore collection
 * @param data - Document data
 * @param docId - Optional document ID (if not provided, Firestore generates one)
 * @returns Promise resolving to the document ID
 * 
 * Requirements: 1.2, 4.11
 */
export async function createDocument<T extends Record<string, any>>(
  collectionName: string,
  data: T,
  docId?: string
): Promise<string> {
  try {
    const collectionRef = collection(getDb(), collectionName);
    const docRef = docId ? doc(collectionRef, docId) : doc(collectionRef);
    
    // Add timestamps
    const dataWithTimestamps = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(docRef, dataWithTimestamps);
    return docRef.id;
  } catch (error) {
    throw new Error(`Failed to create document in ${collectionName}: ${(error as Error).message}`);
  }
}

/**
 * Update an existing document
 * 
 * @param collectionName - Name of the Firestore collection
 * @param id - Document ID
 * @param data - Partial document data to update
 * 
 * Requirements: 3.1-3.5, 5.1-5.5
 */
export async function updateDocument<T extends Record<string, any>>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  try {
    const docRef = doc(getDb(), collectionName, id);
    
    // Add updated timestamp
    const dataWithTimestamp = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(docRef, dataWithTimestamp);
  } catch (error) {
    throw new Error(`Failed to update document ${id} in ${collectionName}: ${(error as Error).message}`);
  }
}

/**
 * Delete a document
 * 
 * @param collectionName - Name of the Firestore collection
 * @param id - Document ID
 * 
 * Requirements: 5.3-5.4
 */
export async function deleteDocument(
  collectionName: string,
  id: string
): Promise<void> {
  try {
    const docRef = doc(getDb(), collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    throw new Error(`Failed to delete document ${id} from ${collectionName}: ${(error as Error).message}`);
  }
}

/**
 * Get a single document by ID
 * 
 * @param collectionName - Name of the Firestore collection
 * @param id - Document ID
 * @returns Promise resolving to document data or null if not found
 */
export async function getDocument<T>(
  collectionName: string,
  id: string
): Promise<T | null> {
  try {
    const docRef = doc(getDb(), collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return convertFirestoreDocument<T>(docSnap);
  } catch (error) {
    throw new Error(`Failed to get document ${id} from ${collectionName}: ${(error as Error).message}`);
  }
}

/**
 * Query documents with constraints
 * 
 * @param collectionName - Name of the Firestore collection
 * @param constraints - Array of query constraints (where, orderBy, limit, etc.)
 * @returns Promise resolving to array of documents
 * 
 * Requirements: 7.1-7.10, 8.1-8.9
 */
export async function queryDocuments<T>(
  collectionName: string,
  constraints: QueryConstraint[]
): Promise<T[]> {
  try {
    const collectionRef = collection(getDb(), collectionName);
    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const documents: T[] = [];
    querySnapshot.forEach((doc) => {
      documents.push(convertFirestoreDocument<T>(doc));
    });
    
    return documents;
  } catch (error) {
    throw new Error(`Failed to query ${collectionName}: ${(error as Error).message}`);
  }
}

// ============================================================================
// Real-time Subscriptions
// ============================================================================

/**
 * Subscribe to a single document for real-time updates
 * 
 * @param collectionName - Name of the Firestore collection
 * @param id - Document ID
 * @param callback - Function to call when document changes
 * @returns Unsubscribe function
 * 
 * Requirements: 9.10-9.11
 */
export function subscribeToDocument<T>(
  collectionName: string,
  id: string,
  callback: (data: T | null) => void
): Unsubscribe {
  const docRef = doc(getDb(), collectionName, id);
  
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(convertFirestoreDocument<T>(docSnap));
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error(`Subscription error for ${collectionName}/${id}:`, error);
      callback(null);
    }
  );
}

/**
 * Subscribe to a query for real-time updates
 * 
 * @param collectionName - Name of the Firestore collection
 * @param constraints - Array of query constraints
 * @param callback - Function to call when query results change
 * @returns Unsubscribe function
 * 
 * Requirements: 9.10-9.11, 10.4-10.6
 */
export function subscribeToQuery<T>(
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void
): Unsubscribe {
  const collectionRef = collection(getDb(), collectionName);
  const q = query(collectionRef, ...constraints);
  
  return onSnapshot(
    q,
    (querySnapshot) => {
      const documents: T[] = [];
      querySnapshot.forEach((doc) => {
        documents.push(convertFirestoreDocument<T>(doc));
      });
      callback(documents);
    },
    (error) => {
      console.error(`Subscription error for ${collectionName}:`, error);
      callback([]);
    }
  );
}

// ============================================================================
// Firebase Storage Operations
// ============================================================================

/**
 * Upload a file to Firebase Storage
 * 
 * @param path - Storage path (e.g., 'profile-photos/userId/photo.jpg')
 * @param file - File blob to upload
 * @returns Promise resolving to download URL
 * 
 * Requirements: 3.6-3.8, 16.1-16.6
 */
export async function uploadFile(
  path: string,
  file: Blob
): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const downloadURL = await firebaseGetDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    throw new Error(`Failed to upload file to ${path}: ${(error as Error).message}`);
  }
}

/**
 * Delete a file from Firebase Storage
 * 
 * @param path - Storage path of the file to delete
 * 
 * Requirements: 22.8
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    throw new Error(`Failed to delete file at ${path}: ${(error as Error).message}`);
  }
}

/**
 * Get download URL for a file
 * 
 * @param path - Storage path of the file
 * @returns Promise resolving to download URL
 */
export async function getDownloadURL(path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    return await firebaseGetDownloadURL(storageRef);
  } catch (error) {
    throw new Error(`Failed to get download URL for ${path}: ${(error as Error).message}`);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert Firestore document to typed object
 */
function convertFirestoreDocument<T>(docSnap: DocumentSnapshot): T {
  const data = docSnap.data();
  
  if (!data) {
    throw new Error('Document data is undefined');
  }
  
  // Convert Firestore Timestamps to JavaScript Dates
  const converted: any = { id: docSnap.id };
  
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      converted[key] = value.toDate();
    } else {
      converted[key] = value;
    }
  }
  
  return converted as T;
}

/**
 * Convert Firestore user document to User type
 */
function convertFirestoreUser(docSnap: DocumentSnapshot): User {
  return convertFirestoreDocument<User>(docSnap);
}

/**
 * Map Firebase Auth errors to user-friendly messages
 * 
 * Requirements: 20.5
 */
function mapAuthError(error: AuthError | Error): string {
  if (!('code' in error)) {
    return error.message || 'An unexpected error occurred';
  }
  
  const authError = error as AuthError;
  
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
    default:
      return authError.message || 'Authentication failed. Please try again';
  }
}