/**
 * useImageUpload Hook
 * 
 * Custom hook for handling image uploads including:
 * - Image picking from library or camera
 * - Image compression
 * - Upload progress tracking
 * - Firebase Storage integration
 * 
 * Validates: Requirements 3.6-3.8, 16.1-16.6
 */

import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../services/firebase';

interface UseImageUploadReturn {
  uploading: boolean;
  progress: number;
  error: string | null;
  pickImage: (source: 'library' | 'camera') => Promise<string | null>;
  uploadImage: (uri: string, userId: string) => Promise<string>;
  deleteImage: (path: string) => Promise<void>;
}

/**
 * Hook for managing image uploads
 * 
 * @returns Image upload state and methods
 * 
 * @example
 * ```tsx
 * const { uploading, progress, pickImage, uploadImage } = useImageUpload();
 * 
 * const handleUpload = async () => {
 *   const uri = await pickImage('library');
 *   if (uri) {
 *     const downloadURL = await uploadImage(uri, userId);
 *     // Update profile with downloadURL
 *   }
 * };
 * ```
 */
export function useImageUpload(): UseImageUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /**
   * Pick an image from library or camera
   * Validates: Requirements 3.6, 16.1-16.2
   */
  const pickImage = async (source: 'library' | 'camera'): Promise<string | null> => {
    try {
      setError(null);

      // Request permissions
      let permissionResult;
      if (source === 'camera') {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (!permissionResult.granted) {
        setError('Permission to access media library or camera is required');
        return null;
      }

      // Launch picker
      let result;
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (result.canceled) {
        return null;
      }

      return result.assets[0].uri;

    } catch (err: any) {
      console.error('Pick image error:', err);
      setError(err.message || 'Failed to pick image');
      return null;
    }
  };

  /**
   * Compress and upload image to Firebase Storage
   * Validates: Requirements 3.7-3.8, 16.3-16.6
   */
  const uploadImage = async (uri: string, userId: string): Promise<string> => {
    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      // Compress image to max 1024x1024 at 80% quality
      const manipulatedImage = await manipulateAsync(
        uri,
        [{ resize: { width: 1024, height: 1024 } }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );

      // Fetch image as blob
      const response = await fetch(manipulatedImage.uri);
      const blob = await response.blob();

      // Validate file size (max 5MB)
      if (blob.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be under 5MB');
      }

      // Validate file type
      if (!blob.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Generate secure filename with timestamp
      const timestamp = Date.now();
      const filename = `${timestamp}.jpg`;
      const storagePath = `profile-photos/${userId}/${filename}`;

      // Create storage reference
      const storageRef = ref(storage, storagePath);

      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Track upload progress
            const progressPercent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(progressPercent);
          },
          (error) => {
            // Handle upload error
            console.error('Upload error:', error);
            setError(error.message || 'Upload failed');
            setUploading(false);
            reject(error);
          },
          async () => {
            // Upload complete - get download URL
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              setUploading(false);
              setProgress(100);
              resolve(downloadURL);
            } catch (error: any) {
              console.error('Get download URL error:', error);
              setError(error.message || 'Failed to get download URL');
              setUploading(false);
              reject(error);
            }
          }
        );
      });

    } catch (err: any) {
      console.error('Upload image error:', err);
      setError(err.message || 'Failed to upload image');
      setUploading(false);
      throw err;
    }
  };

  /**
   * Delete an image from Firebase Storage
   * Validates: Requirements 16.5
   */
  const deleteImage = async (path: string): Promise<void> => {
    try {
      setError(null);
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (err: any) {
      console.error('Delete image error:', err);
      setError(err.message || 'Failed to delete image');
      throw err;
    }
  };

  return {
    uploading,
    progress,
    error,
    pickImage,
    uploadImage,
    deleteImage,
  };
}
