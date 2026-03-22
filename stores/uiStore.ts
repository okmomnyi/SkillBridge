/**
 * UI Store
 * 
 * Zustand store for managing UI state including:
 * - Theme (light/dark)
 * - Bottom sheet visibility and content
 * - Toast notifications
 * 
 * Validates: Requirements NFR 5.6
 */

import { create } from 'zustand';
import React from 'react';

// ============================================================================
// Store Interface
// ============================================================================

interface UIStore {
  // State
  theme: 'light' | 'dark';
  bottomSheetVisible: boolean;
  bottomSheetContent: React.ReactNode | null;
  toastVisible: boolean;
  toastMessage: string;
  toastType: 'success' | 'error' | 'info';

  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  showBottomSheet: (content: React.ReactNode) => void;
  hideBottomSheet: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

// ============================================================================
// UI Store Implementation
// ============================================================================

/**
 * Zustand store for UI state management
 * Validates: Requirements NFR 5.6
 */
export const useUIStore = create<UIStore>((set) => ({
  // ============================================================================
  // Initial State
  // ============================================================================

  theme: 'light',
  bottomSheetVisible: false,
  bottomSheetContent: null,
  toastVisible: false,
  toastMessage: '',
  toastType: 'info',

  // ============================================================================
  // Theme Actions
  // ============================================================================

  /**
   * Set app theme
   */
  setTheme: (theme) => set({ theme }),

  // ============================================================================
  // Bottom Sheet Actions
  // ============================================================================

  /**
   * Show bottom sheet with content
   */
  showBottomSheet: (content) => set({
    bottomSheetVisible: true,
    bottomSheetContent: content
  }),

  /**
   * Hide bottom sheet
   */
  hideBottomSheet: () => set({
    bottomSheetVisible: false,
    bottomSheetContent: null
  }),

  // ============================================================================
  // Toast Actions
  // ============================================================================

  /**
   * Show toast notification
   */
  showToast: (message, type) => set({
    toastVisible: true,
    toastMessage: message,
    toastType: type
  }),

  /**
   * Hide toast notification
   */
  hideToast: () => set({
    toastVisible: false,
    toastMessage: '',
    toastType: 'info'
  })
}));
