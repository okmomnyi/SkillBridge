/**
 * Accessibility Utilities
 * 
 * Provides helper functions and constants for improving app accessibility.
 * 
 * Requirements: 25.1-25.7
 */

import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Minimum touch target size (44x44 points)
 * Requirement 25.7
 */
export const MIN_TOUCH_TARGET_SIZE = 44;

/**
 * Announce a message to screen readers
 * 
 * @param message - Message to announce
 * 
 * Requirement 25.5
 */
export function announceForAccessibility(message: string): void {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    AccessibilityInfo.announceForAccessibility(message);
  }
}

/**
 * Check if screen reader is enabled
 * 
 * @returns Promise resolving to true if screen reader is enabled
 */
export async function isScreenReaderEnabled(): Promise<boolean> {
  try {
    return await AccessibilityInfo.isScreenReaderEnabled();
  } catch (error) {
    console.error('Error checking screen reader status:', error);
    return false;
  }
}

/**
 * Generate accessibility label for a button
 * 
 * @param label - Button label
 * @param hint - Optional hint for what the button does
 * @returns Accessibility props object
 * 
 * Requirement 25.1, 25.4
 */
export function getButtonAccessibility(
  label: string,
  hint?: string
): {
  accessibilityLabel: string;
  accessibilityRole: 'button';
  accessibilityHint?: string;
} {
  return {
    accessibilityLabel: label,
    accessibilityRole: 'button',
    ...(hint && { accessibilityHint: hint })
  };
}

/**
 * Generate accessibility label for an image
 * 
 * @param description - Image description
 * @returns Accessibility props object
 * 
 * Requirement 25.2
 */
export function getImageAccessibility(description: string): {
  accessibilityLabel: string;
  accessibilityRole: 'image';
} {
  return {
    accessibilityLabel: description,
    accessibilityRole: 'image'
  };
}

/**
 * Generate accessibility props for a text input
 * 
 * @param label - Input label
 * @param hint - Optional hint for what to enter
 * @returns Accessibility props object
 * 
 * Requirement 25.3
 */
export function getInputAccessibility(
  label: string,
  hint?: string
): {
  accessibilityLabel: string;
  accessibilityRole: 'text';
  accessibilityHint?: string;
} {
  return {
    accessibilityLabel: label,
    accessibilityRole: 'text',
    ...(hint && { accessibilityHint: hint })
  };
}

/**
 * Generate accessibility props for a link
 * 
 * @param label - Link label
 * @param destination - Where the link goes
 * @returns Accessibility props object
 * 
 * Requirement 25.1
 */
export function getLinkAccessibility(
  label: string,
  destination?: string
): {
  accessibilityLabel: string;
  accessibilityRole: 'link';
  accessibilityHint?: string;
} {
  return {
    accessibilityLabel: label,
    accessibilityRole: 'link',
    ...(destination && { accessibilityHint: `Opens ${destination}` })
  };
}

/**
 * Generate accessibility props for a header
 * 
 * @param text - Header text
 * @param level - Header level (1-6)
 * @returns Accessibility props object
 * 
 * Requirement 25.1
 */
export function getHeaderAccessibility(
  text: string,
  level: number = 1
): {
  accessibilityLabel: string;
  accessibilityRole: 'header';
  accessibilityLevel?: number;
} {
  return {
    accessibilityLabel: text,
    accessibilityRole: 'header',
    ...(Platform.OS === 'ios' && { accessibilityLevel: level })
  };
}

/**
 * Generate accessibility props for a rating display
 * 
 * @param rating - Rating value (0-5)
 * @param maxRating - Maximum rating value
 * @returns Accessibility props object
 */
export function getRatingAccessibility(
  rating: number,
  maxRating: number = 5
): {
  accessibilityLabel: string;
  accessibilityRole: 'text';
  accessibilityValue: { text: string };
} {
  return {
    accessibilityLabel: `Rating: ${rating} out of ${maxRating} stars`,
    accessibilityRole: 'text',
    accessibilityValue: {
      text: `${rating} out of ${maxRating}`
    }
  };
}

/**
 * Generate accessibility props for a loading indicator
 * 
 * @param message - Loading message
 * @returns Accessibility props object
 */
export function getLoadingAccessibility(message: string = 'Loading'): {
  accessibilityLabel: string;
  accessibilityRole: 'progressbar';
  accessibilityLiveRegion: 'polite';
} {
  return {
    accessibilityLabel: message,
    accessibilityRole: 'progressbar',
    accessibilityLiveRegion: 'polite'
  };
}

/**
 * Generate accessibility props for a tab
 * 
 * @param label - Tab label
 * @param selected - Whether tab is selected
 * @returns Accessibility props object
 */
export function getTabAccessibility(
  label: string,
  selected: boolean
): {
  accessibilityLabel: string;
  accessibilityRole: 'tab';
  accessibilityState: { selected: boolean };
} {
  return {
    accessibilityLabel: label,
    accessibilityRole: 'tab',
    accessibilityState: { selected }
  };
}

/**
 * Generate accessibility props for a checkbox
 * 
 * @param label - Checkbox label
 * @param checked - Whether checkbox is checked
 * @returns Accessibility props object
 */
export function getCheckboxAccessibility(
  label: string,
  checked: boolean
): {
  accessibilityLabel: string;
  accessibilityRole: 'checkbox';
  accessibilityState: { checked: boolean };
} {
  return {
    accessibilityLabel: label,
    accessibilityRole: 'checkbox',
    accessibilityState: { checked }
  };
}

/**
 * Generate accessibility props for a switch/toggle
 * 
 * @param label - Switch label
 * @param value - Whether switch is on
 * @returns Accessibility props object
 */
export function getSwitchAccessibility(
  label: string,
  value: boolean
): {
  accessibilityLabel: string;
  accessibilityRole: 'switch';
  accessibilityState: { checked: boolean };
} {
  return {
    accessibilityLabel: label,
    accessibilityRole: 'switch',
    accessibilityState: { checked: value }
  };
}

/**
 * Ensure minimum touch target size
 * 
 * @param size - Current size
 * @returns Size adjusted to meet minimum requirements
 * 
 * Requirement 25.7
 */
export function ensureMinTouchTarget(size: number): number {
  return Math.max(size, MIN_TOUCH_TARGET_SIZE);
}

/**
 * Get padding needed to meet minimum touch target
 * 
 * @param currentSize - Current element size
 * @returns Padding needed on each side
 * 
 * Requirement 25.7
 */
export function getTouchTargetPadding(currentSize: number): number {
  if (currentSize >= MIN_TOUCH_TARGET_SIZE) {
    return 0;
  }
  
  const deficit = MIN_TOUCH_TARGET_SIZE - currentSize;
  return Math.ceil(deficit / 2);
}

/**
 * Announce navigation change to screen readers
 * 
 * @param screenName - Name of the new screen
 * 
 * Requirement 25.5
 */
export function announceScreenChange(screenName: string): void {
  announceForAccessibility(`Navigated to ${screenName}`);
}

/**
 * Announce error to screen readers
 * 
 * @param error - Error message
 */
export function announceError(error: string): void {
  announceForAccessibility(`Error: ${error}`);
}

/**
 * Announce success to screen readers
 * 
 * @param message - Success message
 */
export function announceSuccess(message: string): void {
  announceForAccessibility(`Success: ${message}`);
}

/**
 * Check if color contrast is sufficient
 * Note: This is a simplified check. For production, use a proper contrast ratio calculator.
 * 
 * @param foreground - Foreground color (hex)
 * @param background - Background color (hex)
 * @returns True if contrast is sufficient
 * 
 * Requirement 25.6
 */
export function hasGoodContrast(foreground: string, background: string): boolean {
  // This is a placeholder - implement proper WCAG contrast ratio calculation
  // For now, just check if colors are different
  return foreground.toLowerCase() !== background.toLowerCase();
}
