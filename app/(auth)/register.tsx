/**
 * Register Screen
 * 
 * Multi-step registration form for new users.
 * Step 1: Email, password, confirm password
 * Step 2: Display name, university, major, year
 * Step 3: Skills to teach, skills to learn, interests
 * 
 * Validates: Requirements 1.1-1.9, 15.1-15.7
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, loading } = useAuth();

  const [step, setStep] = useState(1);

  // Step 1: Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Profile
  const [displayName, setDisplayName] = useState('');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState('');

  // Step 3: Skills
  const [skillsToTeach, setSkillsToTeach] = useState('');
  const [skillsToLearn, setSkillsToLearn] = useState('');
  const [interests, setInterests] = useState('');
  const [bio, setBio] = useState('');

  // Errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateStep1 = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Name is required';
    } else if (displayName.trim().length < 2 || displayName.trim().length > 50) {
      newErrors.displayName = 'Name must be 2-50 characters';
    }

    if (!university.trim()) {
      newErrors.university = 'University is required';
    }

    if (!major.trim()) {
      newErrors.major = 'Major is required';
    }

    if (!year) {
      newErrors.year = 'Year is required';
    } else {
      const yearNum = parseInt(year);
      if (isNaN(yearNum) || yearNum < 1 || yearNum > 4) {
        newErrors.year = 'Year must be 1-4';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    const teachSkills = skillsToTeach.split(',').map(s => s.trim()).filter(s => s);
    const learnSkills = skillsToLearn.split(',').map(s => s.trim()).filter(s => s);

    if (teachSkills.length < 1) {
      newErrors.skillsToTeach = 'Add at least 1 skill to teach';
    } else if (teachSkills.length > 10) {
      newErrors.skillsToTeach = 'Maximum 10 skills to teach';
    }

    if (learnSkills.length < 1) {
      newErrors.skillsToLearn = 'Add at least 1 skill to learn';
    } else if (learnSkills.length > 10) {
      newErrors.skillsToLearn = 'Maximum 10 skills to learn';
    }

    if (bio.length > 500) {
      newErrors.bio = 'Bio must be under 500 characters';
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

  const handleRegister = async () => {
    if (!validateStep3()) {
      return;
    }

    try {
      const profile: Partial<User> = {
        displayName: displayName.trim(),
        university: university.trim(),
        major: major.trim(),
        year: parseInt(year),
        bio: bio.trim(),
        skillsToTeach: skillsToTeach.split(',').map(s => s.trim()).filter(s => s),
        skillsToLearn: skillsToLearn.split(',').map(s => s.trim()).filter(s => s),
        interests: interests.split(',').map(s => s.trim()).filter(s => s),
      };

      await signUp(email.trim(), password, profile);
      
      // Show success message
      Alert.alert(
        'Success! 🎉',
        'Your account has been created successfully. Welcome to SkillBridge!',
        [
          {
            text: 'Get Started',
            onPress: () => router.replace('/(tabs)/home')
          }
        ]
      );
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Please try again');
    }
  };

  const renderStep1 = () => (
    <>
      <Input
        label="Email"
        placeholder="your.email@university.edu"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        leftIcon={<Ionicons name="mail-outline" size={20} color="#666666" />}
      />

      <Input
        label="Password"
        placeholder="At least 6 characters"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#666666" />}
        rightIcon={
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#666666"
            onPress={() => setShowPassword(!showPassword)}
          />
        }
      />

      <Input
        label="Confirm Password"
        placeholder="Re-enter your password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        error={errors.confirmPassword}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#666666" />}
      />
    </>
  );

  const renderStep2 = () => (
    <>
      <Input
        label="Full Name"
        placeholder="John Doe"
        value={displayName}
        onChangeText={setDisplayName}
        error={errors.displayName}
        autoCapitalize="words"
        leftIcon={<Ionicons name="person-outline" size={20} color="#666666" />}
      />

      <Input
        label="University"
        placeholder="Your University"
        value={university}
        onChangeText={setUniversity}
        error={errors.university}
        autoCapitalize="words"
        leftIcon={<Ionicons name="school-outline" size={20} color="#666666" />}
      />

      <Input
        label="Major"
        placeholder="Computer Science"
        value={major}
        onChangeText={setMajor}
        error={errors.major}
        autoCapitalize="words"
        leftIcon={<Ionicons name="book-outline" size={20} color="#666666" />}
      />

      <Input
        label="Year"
        placeholder="1-4"
        value={year}
        onChangeText={setYear}
        error={errors.year}
        keyboardType="number-pad"
        leftIcon={<Ionicons name="calendar-outline" size={20} color="#666666" />}
      />
    </>
  );

  const renderStep3 = () => (
    <>
      <Input
        label="Skills to Teach"
        placeholder="JavaScript, Python, Guitar (comma-separated)"
        value={skillsToTeach}
        onChangeText={setSkillsToTeach}
        error={errors.skillsToTeach}
        multiline
        numberOfLines={2}
        leftIcon={<Ionicons name="bulb-outline" size={20} color="#666666" />}
      />

      <Input
        label="Skills to Learn"
        placeholder="Design, Spanish, Cooking (comma-separated)"
        value={skillsToLearn}
        onChangeText={setSkillsToLearn}
        error={errors.skillsToLearn}
        multiline
        numberOfLines={2}
        leftIcon={<Ionicons name="school-outline" size={20} color="#666666" />}
      />

      <Input
        label="Interests (Optional)"
        placeholder="Music, Sports, Art (comma-separated)"
        value={interests}
        onChangeText={setInterests}
        multiline
        numberOfLines={2}
        leftIcon={<Ionicons name="heart-outline" size={20} color="#666666" />}
      />

      <Input
        label="Bio (Optional)"
        placeholder="Tell us about yourself..."
        value={bio}
        onChangeText={setBio}
        error={errors.bio}
        multiline
        numberOfLines={3}
      />
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>🎓</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Step {step} of 3</Text>
        </View>

        <View style={styles.progress}>
          <View style={[styles.progressBar, step >= 1 && styles.progressBarActive]} />
          <View style={[styles.progressBar, step >= 2 && styles.progressBarActive]} />
          <View style={[styles.progressBar, step >= 3 && styles.progressBarActive]} />
        </View>

        <View style={styles.form}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <View style={styles.buttons}>
            {step > 1 && (
              <Button
                variant="outline"
                size="lg"
                onPress={handleBack}
                disabled={loading}
                accessibilityLabel="Go back"
              >
                Back
              </Button>
            )}

            {step < 3 ? (
              <Button
                variant="primary"
                size="lg"
                onPress={handleNext}
                fullWidth={step === 1}
                accessibilityLabel="Continue to next step"
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                accessibilityLabel="Create account"
              >
                Create Account
              </Button>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => router.push('/(auth)/login')}
              accessibilityLabel="Go to login"
            >
              Sign In
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  progress: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
  },
  progressBarActive: {
    backgroundColor: '#007AFF',
  },
  form: {
    gap: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
  },
});
