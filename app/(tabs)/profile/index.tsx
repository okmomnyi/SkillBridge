/**
 * Profile Screen
 * 
 * Displays user profile with:
 * - Avatar, name, university, major, year, bio
 * - Rating, review count, sessions completed, points
 * - Skills to teach and learn as badges
 * - Edit Profile button
 * - View Leaderboard button
 * - Sign Out button
 * 
 * Validates: Requirements 3.1-3.5, 12.1-12.7
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../contexts/ThemeContext';
import { Avatar } from '../../../components/Avatar';
import { Badge } from '../../../components/Badge';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { StarRating } from '../../../components/StarRating';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  const { theme, colors, toggleTheme } = useTheme();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={styles.content}
    >
      <Card variant="elevated" padding="lg">
        <View style={styles.header}>
          <Avatar uri={user.photoURL} name={user.displayName} size="xl" />
          <Text style={[styles.name, { color: colors.text }]}>{user.displayName}</Text>
          <Text style={[styles.university, { color: colors.textSecondary }]}>{user.university}</Text>
          <Text style={[styles.major, { color: colors.textTertiary }]}>
            {user.major} • Year {user.year}
          </Text>
          {user.bio && <Text style={[styles.bio, { color: colors.textSecondary }]}>{user.bio}</Text>}
          {user.availability && (
            <View style={styles.availabilitySection}>
              <View style={styles.availabilityHeader}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text style={[styles.availabilityLabel, { color: colors.textSecondary }]}>
                  Available:
                </Text>
              </View>
              <Text style={[styles.availabilityText, { color: colors.text }]}>
                {user.availability}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <StarRating rating={user.rating} size={20} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {user.rating > 0 ? user.rating.toFixed(1) : 'New'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Rating</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{user.reviewCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Reviews</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{user.sessionsCompleted}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Sessions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{user.points}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Points</Text>
          </View>
        </View>
      </Card>

      <Card variant="elevated" padding="lg">
        <View style={styles.themeSection}>
          <View style={styles.themeSectionHeader}>
            <Ionicons 
              name={theme === 'dark' ? 'moon' : 'sunny'} 
              size={20} 
              color={colors.primary} 
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Dark Mode</Text>
          </View>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>
      </Card>

      <Card variant="elevated" padding="lg">
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Skills to Teach</Text>
          </View>
          <View style={styles.skillsList}>
            {user.skillsToTeach.map((skill, index) => (
              <Badge key={index} text={skill} variant="primary" size="sm" />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school" size={20} color="#5856D6" />
            <Text style={styles.sectionTitle}>Skills to Learn</Text>
          </View>
          <View style={styles.skillsList}>
            {user.skillsToLearn.map((skill, index) => (
              <Badge key={index} text={skill} variant="secondary" size="sm" />
            ))}
          </View>
        </View>

        {user.interests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="heart" size={20} color="#FF3B30" />
              <Text style={styles.sectionTitle}>Interests</Text>
            </View>
            <View style={styles.skillsList}>
              {user.interests.map((interest, index) => (
                <Badge key={index} text={interest} variant="success" size="sm" />
              ))}
            </View>
          </View>
        )}
      </Card>

      <Button
        variant="primary"
        size="lg"
        onPress={() => router.push('/profile/edit')}
        fullWidth
        icon={<Ionicons name="create-outline" size={20} color="#FFFFFF" />}
      >
        Edit Profile
      </Button>

      <Button
        variant="outline"
        size="lg"
        onPress={() => router.push('/profile/leaderboard')}
        fullWidth
        icon={<Ionicons name="trophy-outline" size={20} color="#007AFF" />}
      >
        View Leaderboard
      </Button>

      <Button
        variant="ghost"
        size="lg"
        onPress={handleSignOut}
        disabled={loading}
        fullWidth
        icon={<Ionicons name="log-out-outline" size={20} color="#FF3B30" />}
      >
        <Text style={{ color: '#FF3B30' }}>Sign Out</Text>
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  university: {
    fontSize: 16,
    marginTop: 4,
  },
  major: {
    fontSize: 14,
    marginTop: 2,
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  availabilitySection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    width: '100%',
  },
  availabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  availabilityLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  availabilityText: {
    fontSize: 14,
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  themeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
