import React from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  onPress?: () => void;
  badge?: {
    count: number;
    color: string;
  };
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 'md',
  onPress,
  badge,
}) => {
  const sizeValue = sizeMap[size];
  const initials = getInitials(name);

  const containerStyle: ViewStyle = {
    width: sizeValue,
    height: sizeValue,
    borderRadius: sizeValue / 2,
  };

  const content = (
    <View style={[styles.container, containerStyle]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, containerStyle]}
          accessibilityLabel={`${name}'s profile picture`}
        />
      ) : (
        <View style={[styles.fallback, containerStyle]}>
          <Text
            style={[styles.initials, { fontSize: sizeValue / 2.5 }]}
            accessibilityLabel={`${name}'s initials`}
          >
            {initials}
          </Text>
        </View>
      )}
      {badge && badge.count > 0 && (
        <View
          style={[
            styles.badge,
            { backgroundColor: badge.color },
            size === 'xs' && styles.badgeXs,
            size === 'sm' && styles.badgeSm,
          ]}
        >
          <Text style={styles.badgeText}>
            {badge.count > 99 ? '99+' : badge.count}
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`View ${name}'s profile`}
        style={{ minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    backgroundColor: '#E5E5E5',
  },
  fallback: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeXs: {
    minWidth: 12,
    height: 12,
    borderRadius: 6,
    top: -2,
    right: -2,
  },
  badgeSm: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    top: -3,
    right: -3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
});
