/**
 * Create Skill Post Screen
 * 
 * Multi-step form for creating skill posts:
 * Step 1: Type, title, description
 * Step 2: Category, skills, level
 * Step 3: Availability, format
 * 
 * Validates: Requirements 4.1-4.11, 15.1-15.7
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { useTheme } from '../../../contexts/ThemeContext';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Badge } from '../../../components/Badge';
import { SkillCategory } from '../../../types';
import { createDocument } from '../../../services/firebase';
import { validateSkillPost } from '../../../utils/validation';

export default function CreatePostScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const currentUser = useAuthStore((state) => state.user);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [type, setType] = useState<'teach' | 'learn'>('teach');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Step 2
  const [category, setCategory] = useState<SkillCategory>('programming');
  const [skills, setSkills] = useState('');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

  // Step 3
  const [availability, setAvailability] = useState('');
  const [format, setFormat] = useState<'in-person' | 'online' | 'both'>('both');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateStep1 = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim() || title.trim().length < 10 || title.trim().length > 100) {
      newErrors.title = 'Title must be 10-100 characters';
    }

    if (!description.trim() || description.trim().length < 50 || description.trim().length > 1000) {
      newErrors.description = 'Description must be 50-1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    const skillsList = skills.split(',').map(s => s.trim()).filter(s => s);
    if (skillsList.length < 1 || skillsList.length > 5) {
      newErrors.skills = 'Add 1-5 skills (comma-separated)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!availability.trim() || availability.trim().length < 10) {
      newErrors.availability = 'Availability must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    }
  };

  const handleCreate = async () => {
    if (!validateStep3() || !currentUser) {
      return;
    }

    try {
      setLoading(true);

      const postData = {
        userId: currentUser.uid,
        type,
        title: title.trim(),
        description: description.trim(),
        category,
        skills: skills.split(',').map(s => s.trim()).filter(s => s),
        level,
        availability: availability.trim(),
        format,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        viewCount: 0,
        matchCount: 0,
      };

      const validation = validateSkillPost(postData);
      if (!validation.isValid) {
        Alert.alert('Validation Error', validation.error || 'Please check your inputs');
        setLoading(false);
        return;
      }

      const postId = await createDocument('skillPosts', postData);
      
      Alert.alert('Success', 'Your skill post has been created!', [
        {
          text: 'OK',
          onPress: () => {
            router.push(`/home/skill/${postId}`);
          },
        },
      ]);
    } catch (error: any) {
      console.error('Create post error:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[styles.typeOption, type === 'teach' && styles.typeOptionActive]}
          onPress={() => setType('teach')}
        >
          <Text style={[styles.typeText, type === 'teach' && styles.typeTextActive]}>
            I want to teach
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeOption, type === 'learn' && styles.typeOptionActive]}
          onPress={() => setType('learn')}
        >
          <Text style={[styles.typeText, type === 'learn' && styles.typeTextActive]}>
            I want to learn
          </Text>
        </TouchableOpacity>
      </View>

      <Input
        label="Title"
        placeholder="e.g., Learn Python Programming Basics"
        value={title}
        onChangeText={setTitle}
        error={errors.title}
      />

      <Input
        label="Description"
        placeholder="Describe what you want to teach or learn..."
        value={description}
        onChangeText={setDescription}
        error={errors.description}
        multiline
        numberOfLines={5}
      />
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {(['programming', 'design', 'languages', 'music', 'sports', 'cooking', 'academic', 'other'] as SkillCategory[]).map(cat => (
          <TouchableOpacity key={cat} onPress={() => setCategory(cat)}>
            <Badge
              text={cat.charAt(0).toUpperCase() + cat.slice(1)}
              variant={category === cat ? 'primary' : 'secondary'}
              size="md"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Input
        label="Skills"
        placeholder="JavaScript, React, Node.js (comma-separated)"
        value={skills}
        onChangeText={setSkills}
        error={errors.skills}
        multiline
        numberOfLines={2}
      />

      <Text style={styles.label}>Level</Text>
      <View style={styles.levelSelector}>
        {(['beginner', 'intermediate', 'advanced'] as const).map(lvl => (
          <TouchableOpacity
            key={lvl}
            style={[styles.levelOption, level === lvl && styles.levelOptionActive]}
            onPress={() => setLevel(lvl)}
          >
            <Text style={[styles.levelText, level === lvl && styles.levelTextActive]}>
              {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  const renderStep3 = () => (
    <>
      <Input
        label="Availability"
        placeholder="e.g., Weekday evenings, flexible schedule"
        value={availability}
        onChangeText={setAvailability}
        error={errors.availability}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Format</Text>
      <View style={styles.formatSelector}>
        {(['in-person', 'online', 'both'] as const).map(fmt => (
          <TouchableOpacity
            key={fmt}
            style={[styles.formatOption, format === fmt && styles.formatOptionActive]}
            onPress={() => setFormat(fmt)}
          >
            <Text style={[styles.formatText, format === fmt && styles.formatTextActive]}>
              {fmt === 'in-person' ? 'In Person' : fmt === 'online' ? 'Online' : 'Both'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Create Skill Post</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Step {step} of 3</Text>
        </View>

        <View style={styles.progress}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }, step >= 1 && { backgroundColor: colors.primary }]} />
          <View style={[styles.progressBar, { backgroundColor: colors.border }, step >= 2 && { backgroundColor: colors.primary }]} />
          <View style={[styles.progressBar, { backgroundColor: colors.border }, step >= 3 && { backgroundColor: colors.primary }]} />
        </View>

        <View style={styles.form}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <View style={styles.buttons}>
            {step > 1 && (
              <Button variant="outline" size="lg" onPress={handleBack} disabled={loading}>
                Back
              </Button>
            )}

            {step < 3 ? (
              <Button variant="primary" size="lg" onPress={handleNext} fullWidth={step === 1}>
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onPress={handleCreate}
                loading={loading}
                disabled={loading}
              >
                Create Post
              </Button>
            )}
          </View>
        </View>
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
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  progress: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  form: {
    gap: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  typeOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E5F1FF',
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  typeTextActive: {
    color: '#007AFF',
  },
  categoryScroll: {
    marginBottom: 16,
  },
  levelSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  levelOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  levelOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E5F1FF',
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  levelTextActive: {
    color: '#007AFF',
  },
  formatSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  formatOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  formatOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E5F1FF',
  },
  formatText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  formatTextActive: {
    color: '#007AFF',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});
