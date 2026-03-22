/**
 * Authentication Store
 * 
 * Zustand store for managing authentication state including:
 * - User authentication state
 * - Sign in/sign up/sign out actions
 * - Profile updates
 * - Auth state persistence with Expo SecureStore
 * - Firebase Auth integration
 * 
 * Validates: Requirements 1.1-1.3, 2.1-2.7, 3.1-3.5, 17.1-17.7
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import {
  signInWithEmail,
  signUpWithEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  getCurrentUser,
  createDocument,
  updateDocument,
  getDocument
} from '../services/firebase';
import { User } from '../types';
import { validateEmail, validatePassword, validateUserProfile } from '../utils/validation';
import { sanitizeUserProfile } from '../utils/sanitize';
import { mapAuthError } from '../utils/errors';

// ============================================================================
// Constants
// ============================================================================

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

// ============================================================================
// Store Interface
// ============================================================================

interface AuthStore {
  // State
  user: User | null;
  loading: boolean;
  error: string | null;
  initializing: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, profile: Partial<User>) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  initialize: () => Promise<void>;
}

// ============================================================================
// Secure Storage Helpers
// ============================================================================

/**
 * Store auth token securely
 * Requirement 17.1: Store auth token in secure storage
 */
async function storeAuthToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to store auth token:', error);
  }
}

/**
 * Retrieve auth token from secure storage
 * Requirement 17.2: Check for valid auth token on app start
 */
async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to retrieve auth token:', error);
    return null;
  }
}

/**
 * Remove auth token from secure storage
 * Requirement 17.4: Remove auth token on sign out
 */
async function removeAuthToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to remove auth token:', error);
  }
}

/**
 * Store user data in secure storage for offline access
 * Requirement 17.1: Persist user profile data
 */
async function storeUserData(user: User): Promise<void> {
  try {
    await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to store user data:', error);
  }
}

/**
 * Retrieve user data from secure storage
 * Requirement 17.3: Load user profile on app start
 */
async function getUserData(): Promise<User | null> {
  try {
    const data = await SecureStore.getItemAsync(USER_DATA_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Convert date strings back to Date objects
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt)
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to retrieve user data:', error);
    return null;
  }
}

/**
 * Remove user data from secure storage
 * Requirement 17.5: Clear user data on sign out
 */
async function removeUserData(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(USER_DATA_KEY);
  } catch (error) {
    console.error('Failed to remove user data:', error);
  }
}

// ============================================================================
// Auth Store Implementation
// ============================================================================

/**
 * Zustand store for authentication state management
 * Validates: Requirements 1.1-1.3, 2.1-2.7, 3.1-3.5, 17.1-17.7
 */
export const useAuthStore = create<AuthStore>((set, get) => ({
  // ============================================================================
  // Initial State
  // ============================================================================
  
  user: null,
  loading: false,
  error: null,
  initializing: true,

  // ============================================================================
  // Basic Setters
  // ============================================================================

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // ============================================================================
  // Sign In Action
  // ============================================================================

  /**
   * Sign in with email and password
   * Validates: Requirements 2.1-2.7
   */
  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });

      // Validate input
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.error || 'Invalid email');
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.error || 'Invalid password');
      }

      // Authenticate with Firebase
      const firebaseUser = await signInWithEmail(email, password);

      // Fetch user profile from Firestore
      const userDoc = await getDocument<User>('users', firebaseUser.uid);
      
      if (!userDoc) {
        throw new Error('User profile not found');
      }

      // Store auth token and user data
      await storeAuthToken(firebaseUser.uid);
      await storeUserData(userDoc);

      // Update store
      set({ user: userDoc, loading: false, error: null });

    } catch (error: any) {
      const errorMessage = mapAuthError(error);
      set({ error: errorMessage, loading: false, user: null });
      throw error;
    }
  },

  // ============================================================================
  // Sign Up Action
  // ============================================================================

  /**
   * Sign up with email, password, and profile data
   * Validates: Requirements 1.1-1.9
   */
  signUp: async (email: string, password: string, profile: Partial<User>) => {
    try {
      set({ loading: true, error: null });

      // Validate email and password
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.error || 'Invalid email');
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.error || 'Invalid password');
      }

      // Validate profile data
      const profileValidation = validateUserProfile(profile);
      if (!profileValidation.isValid) {
        throw new Error(profileValidation.error || 'Invalid profile data');
      }

      // Sanitize profile data
      const sanitizedProfile = sanitizeUserProfile(profile);

      // Create Firebase Auth account
      const firebaseUser = await signUpWithEmail(email, password);

      // Create user document in Firestore
      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || email,
        displayName: sanitizedProfile.displayName || '',
        photoURL: null,
        university: sanitizedProfile.university || '',
        major: sanitizedProfile.major || '',
        year: sanitizedProfile.year || 1,
        bio: sanitizedProfile.bio || '',
        skillsToTeach: sanitizedProfile.skillsToTeach || [],
        skillsToLearn: sanitizedProfile.skillsToLearn || [],
        interests: sanitizedProfile.interests || [],
        rating: 0,
        reviewCount: 0,
        sessionsCompleted: 0,
        points: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await createDocument('users', userData, firebaseUser.uid);

      // Store auth token and user data
      await storeAuthToken(firebaseUser.uid);
      await storeUserData(userData);

      // Update store
      set({ user: userData, loading: false, error: null });

    } catch (error: any) {
      const errorMessage = mapAuthError(error);
      set({ error: errorMessage, loading: false, user: null });
      throw error;
    }
  },

  // ============================================================================
  // Sign Out Action
  // ============================================================================

  /**
   * Sign out current user
   * Validates: Requirements 17.4-17.6
   */
  signOut: async () => {
    try {
      set({ loading: true, error: null });

      // Sign out from Firebase
      await firebaseSignOut();

      // Remove stored credentials
      await removeAuthToken();
      await removeUserData();

      // Clear store
      set({ user: null, loading: false, error: null });

    } catch (error: any) {
      const errorMessage = mapAuthError(error);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // ============================================================================
  // Update Profile Action
  // ============================================================================

  /**
   * Update user profile
   * Validates: Requirements 3.1-3.5
   */
  updateProfile: async (data: Partial<User>) => {
    try {
      const { user } = get();
      
      if (!user) {
        throw new Error('No user logged in');
      }

      set({ loading: true, error: null });

      // Validate profile updates
      const profileValidation = validateUserProfile(data);
      if (!profileValidation.isValid) {
        throw new Error(profileValidation.error || 'Invalid profile data');
      }

      // Sanitize profile data
      const sanitizedData = sanitizeUserProfile(data);

      // Prevent modification of protected fields
      const protectedFields = ['uid', 'email', 'rating', 'reviewCount', 'sessionsCompleted', 'points', 'createdAt'];
      const updateData: any = { ...sanitizedData };
      protectedFields.forEach(field => delete updateData[field]);

      // Add updatedAt timestamp
      updateData.updatedAt = new Date();

      // Update Firestore
      await updateDocument('users', user.uid, updateData);

      // Fetch updated user data
      const updatedUser = await getDocument<User>('users', user.uid);
      
      if (!updatedUser) {
        throw new Error('Failed to fetch updated profile');
      }

      // Update stored user data
      await storeUserData(updatedUser);

      // Update store
      set({ user: updatedUser, loading: false, error: null });

    } catch (error: any) {
      const errorMessage = mapAuthError(error);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // ============================================================================
  // Initialize Action
  // ============================================================================

  /**
   * Initialize auth state on app start
   * Validates: Requirements 17.2-17.3
   */
  initialize: async () => {
    try {
      set({ initializing: true });

      // Check for stored auth token
      const token = await getAuthToken();
      
      if (!token) {
        set({ initializing: false, user: null });
        return;
      }

      // Try to get current Firebase user
      const firebaseUser = getCurrentUser();
      
      if (!firebaseUser) {
        // Token exists but no Firebase user - clear storage
        await removeAuthToken();
        await removeUserData();
        set({ initializing: false, user: null });
        return;
      }

      // Fetch user profile from Firestore
      const userDoc = await getDocument<User>('users', firebaseUser.uid);
      
      if (!userDoc) {
        // Firebase user exists but no profile - clear storage
        await removeAuthToken();
        await removeUserData();
        set({ initializing: false, user: null });
        return;
      }

      // Update stored user data
      await storeUserData(userDoc);

      // Update store
      set({ user: userDoc, initializing: false });

      // Set up auth state listener
      onAuthStateChanged(async (user) => {
        if (!user) {
          // User signed out
          await removeAuthToken();
          await removeUserData();
          set({ user: null });
        } else {
          // User signed in or token refreshed
          const userDoc = await getDocument<User>('users', user.uid);
          if (userDoc) {
            await storeAuthToken(user.uid);
            await storeUserData(userDoc);
            set({ user: userDoc });
          }
        }
      });

    } catch (error: any) {
      console.error('Auth initialization error:', error);
      set({ initializing: false, user: null });
    }
  }
}));