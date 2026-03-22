/**
 * Review Modal Component
 * 
 * Modal for submitting reviews after completing a learning session.
 * Includes rating input, comment textarea, and skills multi-select.
 * 
 * Requirements: 11.1-11.11
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { StarRating } from './StarRating';
import { Button } from './Button';
import { submitReview } from '../services/reviews';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  revieweeId: string;
  revieweeName: string;
  sessionId: string;
  onSuccess?: () => void;
}

export function ReviewModal({
  visible,
  onClose,
  revieweeId,
  revieweeName,
  sessionId,
  onSuccess
}: ReviewModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [skills, setSkills] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateInputs = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate rating (Requirement 11.5)
    if (rating < 1 || rating > 5) {
      newErrors.rating = 'Please select a rating between 1 and 5 stars';
    }

    // Validate comment length (Requirement 11.6)
    if (comment.length > 500) {
      newErrors.comment = 'Comment must be 500 characters or less';
    }

    // Validate skills (Requirement 11.7)
    const skillsArray = skills
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (skillsArray.length < 1) {
      newErrors.skills = 'Please enter at least one skill';
    } else if (skillsArray.length > 10) {
      newErrors.skills = 'Please enter no more than 10 skills';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateInputs()) {
      return;
    }

    setLoading(true);

    try {
      const skillsArray = skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      await submitReview(revieweeId, sessionId, rating, comment, skillsArray);

      Alert.alert('Success', 'Review submitted successfully!');
      
      // Reset form
      setRating(0);
      setComment('');
      setSkills('');
      setErrors({});

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    setSkills('');
    setErrors({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.scrollView}>
            <Text style={styles.title}>Review {revieweeName}</Text>

            {/* Rating Input */}
            <View style={styles.section}>
              <Text style={styles.label}>Rating *</Text>
              <StarRating
                rating={rating}
                size={40}
                interactive={true}
                onRatingChange={setRating}
              />
              {errors.rating && (
                <Text style={styles.errorText}>{errors.rating}</Text>
              )}
            </View>

            {/* Comment Input */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Comment ({comment.length}/500)
              </Text>
              <TextInput
                style={styles.textArea}
                placeholder="Share your experience..."
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
              {errors.comment && (
                <Text style={styles.errorText}>{errors.comment}</Text>
              )}
            </View>

            {/* Skills Input */}
            <View style={styles.section}>
              <Text style={styles.label}>Skills (comma-separated) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., JavaScript, React, Node.js"
                value={skills}
                onChangeText={setSkills}
              />
              <Text style={styles.helperText}>
                Enter 1-10 skills separated by commas
              </Text>
              {errors.skills && (
                <Text style={styles.errorText}>{errors.skills}</Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                variant="outline"
                size="md"
                onPress={handleClose}
                disabled={loading}
                fullWidth
              >
                Cancel
              </Button>
              <View style={styles.buttonSpacer} />
              <Button
                variant="primary"
                size="md"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                fullWidth
              >
                Submit Review
              </Button>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingTop: 20
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1F2937'
  },
  section: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151'
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF'
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 100
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 20
  },
  buttonSpacer: {
    width: 12
  }
});
