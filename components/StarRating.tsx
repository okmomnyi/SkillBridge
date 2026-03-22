import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StarRatingProps {
  rating: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = 20,
  interactive = false,
  onRatingChange,
}) => {
  const handlePress = (index: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  const renderStar = (index: number) => {
    const filled = rating >= index + 1;
    const halfFilled = rating > index && rating < index + 1;

    const iconName = filled
      ? 'star'
      : halfFilled
      ? 'star-half'
      : 'star-outline';

    const star = (
      <Ionicons
        name={iconName}
        size={size}
        color="#FFB800"
        style={styles.star}
      />
    );

    if (interactive) {
      return (
        <TouchableOpacity
          key={index}
          onPress={() => handlePress(index)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Rate ${index + 1} star${index + 1 > 1 ? 's' : ''}`}
          style={{ minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}
        >
          {star}
        </TouchableOpacity>
      );
    }

    return <View key={index}>{star}</View>;
  };

  return (
    <View
      style={styles.container}
      accessibilityLabel={`Rating: ${rating.toFixed(1)} out of 5 stars`}
      accessibilityRole={interactive ? 'adjustable' : 'text'}
    >
      {[0, 1, 2, 3, 4].map(renderStar)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginHorizontal: 2,
  },
});
