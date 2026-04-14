import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export function useUserTier() {
  const { isSignedIn, user } = useUser();
  const [userTier, setUserTier] = useState('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) {
      setUserTier('free');
      setLoading(false);
      return;
    }

    // Check localStorage for user tier
    const checkSubscription = () => {
      try {
        const savedTier = localStorage.getItem(`user_tier_${user.id}`);
        if (savedTier === 'pro') {
          setUserTier('pro');
        } else {
          setUserTier('free');
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setUserTier('free');
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [isSignedIn, user]);

  return { userTier, loading };
}

// Helper function to upgrade user
export function upgradeToPro(userId) {
  if (userId) {
    localStorage.setItem(`user_tier_${userId}`, 'pro');
    return true;
  }
  return false;
}