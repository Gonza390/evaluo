'use client';

import { useEffect, useState } from 'react';
import { getPremiumStatus } from '@/app/actions';
import { useUser } from '@/hooks/useUser';

export function usePremium() {
  const { user, loading } = useUser();
  const [isPremium, setIsPremium] = useState(false);
  const [premiumLoading, setPremiumLoading] = useState(true);

  useEffect(() => {
    let active = true;

    if (loading) return;

    if (!user) {
      setIsPremium(false);
      setPremiumLoading(false);
      return;
    }

    setPremiumLoading(true);
    void getPremiumStatus()
      .then((result) => {
        if (!active) return;
        setIsPremium(result.isPremium);
      })
      .finally(() => {
        if (active) setPremiumLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loading, user]);

  return { isPremium, premiumLoading };
}
