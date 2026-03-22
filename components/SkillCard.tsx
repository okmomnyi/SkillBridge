import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SkillPost, User } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Card } from './Card';
import { StarRating } from './StarRating';

interface SkillCardProps {
  post: SkillPost;
  user: User;
  matchScore?: number;
  onPress: () => void;
  onUserPress: () => void;
}

export const SkillCard = React.memo<SkillCardProps>(({
  post,
  user,
  matchScore,
  onPress,
  onUserPress,
}) => {
  const { colors } = useTheme();

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  return (
    <Card onPress={onPress} variant="elevated" padding="md">
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onUserPress}
          style={styles.userInfo}
          activeOpacity={0.7}
        >
          <Avatar
            uri={user.photoURL}
            name={user.displayName}
            size="sm"
          />
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: colors.text }]}>{user.displayName}</Text>
            <View style={styles.userMeta}>
              <StarRating rating={user.rating} size={12} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {user.rating > 0 ? user.rating.toFixed(1) : 'New'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        {matchScore !== undefined && (
          <View style={styles.matchBadge}>
            <Text style={styles.matchScore}>{matchScore}%</Text>
            <Text style={styles.matchLabel}>Match</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Badge
            text={post.type === 'teach' ? 'Teaching' : 'Learning'}
            variant={post.type === 'teach' ? 'primary' : 'secondary'}
            size="sm"
          />
          <Text style={[styles.timestamp, { color: colors.textTertiary }]}>{formatDate(post.createdAt)}</Text>
        </View>
        
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {post.title}
        </Text>
        
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3}>
          {post.description}
        </Text>

        <View style={styles.skills}>
          {post.skills.slice(0, 3).map((skill, index) => (
            <Badge
              key={index}
              text={skill}
              variant="success"
              size="sm"
            />
          ))}
          {post.skills.length > 3 && (
            <Text style={[styles.moreSkills, { color: colors.textTertiary }]}>+{post.skills.length - 3} more</Text>
          )}
        </View>

        <View style={styles.footer}>
          <Badge text={post.category} variant="primary" size="sm" />
          <Badge text={post.level} variant="warning" size="sm" />
          <Badge text={post.format} variant="secondary" size="sm" />
        </View>
      </View>
    </Card>
  );
});

SkillCard.displayName = 'SkillCard';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: 8,
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
  },
  matchBadge: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  matchScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  matchLabel: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  content: {
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  moreSkills: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
});
