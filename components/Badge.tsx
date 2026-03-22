import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface BadgeProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'primary',
  size = 'md',
}) => {
  const { colors, theme } = useTheme();

  const getBackgroundColor = () => {
    if (theme === 'dark') {
      switch (variant) {
        case 'primary': return '#1A3A52';
        case 'secondary': return '#2E2D4D';
        case 'success': return '#1A3A1F';
        case 'warning': return '#4D3A1A';
        case 'error': return '#4D1A1A';
        default: return '#1A3A52';
      }
    } else {
      switch (variant) {
        case 'primary': return '#E5F1FF';
        case 'secondary': return '#F0EFFF';
        case 'success': return '#E5F9E7';
        case 'warning': return '#FFF4E5';
        case 'error': return '#FFE5E5';
        default: return '#E5F1FF';
      }
    }
  };

  const getTextColor = () => {
    if (theme === 'dark') {
      switch (variant) {
        case 'primary': return '#64B5F6';
        case 'secondary': return '#9FA8DA';
        case 'success': return '#81C784';
        case 'warning': return '#FFB74D';
        case 'error': return '#E57373';
        default: return '#64B5F6';
      }
    } else {
      switch (variant) {
        case 'primary': return '#007AFF';
        case 'secondary': return '#5856D6';
        case 'success': return '#34C759';
        case 'warning': return '#FF9500';
        case 'error': return '#FF3B30';
        default: return '#007AFF';
      }
    }
  };

  const containerStyle: ViewStyle[] = [
    styles.container,
    { backgroundColor: getBackgroundColor() },
    size === 'sm' ? styles.size_sm : styles.size_md,
  ];

  const textStyle: TextStyle[] = [
    styles.text,
    { color: getTextColor() },
    size === 'sm' ? styles.textSize_sm : styles.textSize_md,
  ];

  return (
    <View style={containerStyle}>
      <Text style={textStyle}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  size_sm: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  size_md: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  text: {
    fontWeight: '600',
  },
  textSize_sm: {
    fontSize: 12,
  },
  textSize_md: {
    fontSize: 14,
  },
});
