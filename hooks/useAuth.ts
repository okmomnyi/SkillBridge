/**
 * useAuth Hook
 * 
 * Custom hook that wraps the authStore for easier component usage.
 * Provides authentication state and actions.
 * 
 * Validates: Requirements 1.1-1.3, 2.1-2.7, 3.1-3.5
 */

import { useAuthStore } from '../stores/authStore';
import { User } from '../types';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, profile: Partial<User>) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

/**
 * Hook for accessing authentication state and actions
 * 
 * @returns Authentication state and methods
 * 
 * @example
 * ```tsx
 * const { user, loading, signIn, signOut } = useAuth();
 * 
 * const handleLogin = async () => {
 *   try {
 *     await signIn(email, password);
 *   } catch (error) {
 *     console.error('Login failed:', error);
 *   }
 * };
 * ```
 */
export function useAuth(): UseAuthReturn {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const initializing = useAuthStore((state) => state.initializing);
  const signIn = useAuthStore((state) => state.signIn);
  const signUp = useAuthStore((state) => state.signUp);
  const signOut = useAuthStore((state) => state.signOut);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  return {
    user,
    loading,
    error,
    initializing,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };
}
