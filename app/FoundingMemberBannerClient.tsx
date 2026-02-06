'use client';

import { useEffect, useState } from 'react';
import { FoundingMemberBanner } from '@/components/FoundingMemberBanner';

export default function FoundingMemberBannerClient() {
  const [remainingSpots, setRemainingSpots] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const response = await fetch('/api/founding-member/spots', {
          method: 'GET',
          cache: 'no-store'
        });
        const data = await response.json();
        
        if (data.spotsRemaining && data.spotsRemaining > 0) {
          setRemainingSpots(data.spotsRemaining);
        } else {
          setRemainingSpots(0);
        }
      } catch (error) {
        console.error('Error fetching tenant count:', error);
        setRemainingSpots(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
    // Refresh every minute
    const interval = setInterval(fetchAvailability, 60000);

    return () => clearInterval(interval);
  }, []);

  // Hide banner if loading, null, or when Pioneer spots are no longer available (count >= 100)
  if (isLoading || remainingSpots === null || remainingSpots <= 0) {
    return null;
  }

  return <FoundingMemberBanner remainingSpots={remainingSpots} />;
}

