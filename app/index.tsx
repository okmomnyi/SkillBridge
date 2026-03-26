import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

export default function Index() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/splash');
      }
    }
  }, [user, isLoading]);

  return null;
}
