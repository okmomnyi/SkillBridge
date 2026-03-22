/**
 * Edit Profile Screen
 * 
 * Allows users to update:
 * - Display name, bio, university, major, year
 * - Skills to teach, skills to learn, interests
 * - Profile photo
 * 
 * Validates: Requirements 3.1-3.8, 16.1-16.6
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { useImageUpload } from '../../../hooks/useImageUpload';
import { useTheme } from '../../../contexts/ThemeContext';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Ionicons } from '@expo/vector-icons';

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, updateProfile, loading } = useAuth();
  const { uploading, progress, pickImage, uploadImage } = useImageUpload();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [university, setUniversity] = useState(user?.university || '');
  const [major, setMajor] = useState(user?.major || '');
  const [year, setYear] = useState(user?.year.toString() || '');
  const [skillsToTeach, setSkillsToTeach] = useState(user?.skillsToTeach.join(', ') || '');
  const [skillsToLearn, setSkillsToLearn] = useState(user?.skillsToLearn.join(', ') || '');
  const [interests, setInterests] = useState(user?.interests.join(', ') || '');
  const [availability, setAvailability] = useState(user?.availability || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || null);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handlePickImage = async () => {
    const uri = await pickImage('library');
    if (uri && user) {
      try {
        const downloadURL = await uploadImage(uri, user.uid);
        setPhotoURL(downloadURL);
      } catch (error: any) {
        Alert.alert('Error', 'Failed to upload image');
      }
    }
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!displayName.trim() || displayName.trim().length < 2 || displayName.trim().length > 50) {
      newErrors.displayName = 'Name must be 2-50 characters';
    }

    if (bio.length > 500) {
      newErrors.bio = 'Bio must be under 500 characters';
    }

    const teachSkills = skillsToTeach.split(',').map(s => s.trim()).filter(s => s);
    if (teachSkills.length < 1 || teachSkills.length > 10) {
      newErrors.skillsToTeach = 'Add 1-10 skills to teach';
    }

    const learnSkills = skillsToLearn.split(',').map(s => s.trim()).filter(s => s);
    if (learnSkills.length < 1 || learnSkills.length > 10) {
      newErrors.skillsToLearn = 'Add 1-10 skills to learn';
    }

    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1 || yearNum > 4) {
      newErrors.year = 'Year must be 1-4';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    try {
      await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        university: university.trim(),
        major: major.trim(),
        year: parseInt(year),
        skillsToTeach: skillsToTeach.split(',').map(s => s.trim()).filter(s => s),
        skillsToLearn: skillsToLearn.split(',').map(s => s.trim()).filter(s => s),
        interests: interests.split(',').map(s => s.trim()).filter(s => s),
        availability: availability.trim(),
        photoURL,
      });

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.photoSection}>
          <Avatar uri={photoURL} name={displayName || user.displayName} size="xl" />
          <Button
            variant="outline"
            size="sm"
            onPress={handlePickImage}
            loading={uploading}
            disabled={uploading}
            icon={<Ionicons name="camera-outline" size={16} color={colors.primary} />}
          >
            {uploading ? `Uploading ${Math.round(progress)}%` : 'Change Photo'}
          </Button>
        </View>

        <Input
          label="Full Name"
          value={displayName}
          onChangeText={setDisplayName}
          error={errors.displayName}
        />

        <Input
          label="Bio"
          value={bio}
          onChangeText={setBio}
          error={errors.bio}
          multiline
          numberOfLines={3}
          placeholder="Tell us about yourself..."
        />

        <Input
          label="University"
          value={university}
          onChangeText={setUniversity}
        />

        <Input
          label="Major"
          value={major}
          onChangeText={setMajor}
        />

        <Input
          label="Year"
          value={year}
          onChangeText={setYear}
          error={errors.year}
          keyboardType="number-pad"
        />

        <Input
          label="Skills to Teach"
          value={skillsToTeach}
          onChangeText={setSkillsToTeach}
          error={errors.skillsToTeach}
          multiline
          numberOfLines={2}
          placeholder="JavaScript, Python, Guitar (comma-separated)"
        />

        <Input
          label="Skills to Learn"
          value={skillsToLearn}
          onChangeText={setSkillsToLearn}
          error={errors.skillsToLearn}
          multiline
          numberOfLines={2}
          placeholder="Design, Spanish, Cooking (comma-separated)"
        />

        <Input
          label="Interests (Optional)"
          value={interests}
          onChangeText={setInterests}
          multiline
          numberOfLines={2}
          placeholder="Music, Sports, Art (comma-separated)"
        />

        <Input
          label="Availability (Optional)"
          value={availability}
          onChangeText={setAvailability}
          multiline
          numberOfLines={2}
          placeholder="Mon-Fri 2-5pm, Weekends flexible"
        />

        <Button
          variant="primary"
          size="lg"
          onPress={handleSave}
          loading={loading}
          disabled={loading || uploading}
          fullWidth
        >
          Save Changes
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onPress={() => router.back()}
          disabled={loading || uploading}
          fullWidth
        >
          Cancel
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 16,
  },
  photoSection: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
});
