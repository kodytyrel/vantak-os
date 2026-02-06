'use client';

import React, { useState, useEffect } from 'react';
import { LandingPageHero } from './LandingPageHero';

export const LandingPageHeroWrapper: React.FC = () => {
  const [tenantCount, setTenantCount] = useState<{
    totalCount: number;
    remaining: number;
    isPioneerAvailable: boolean;
  } | null>(null);

  // Fetch tenant count on mount
  useEffect(() => {
    const fetchTenantCount = async () => {
      try {
        const response = await fetch('/api/founding-member/spots', {
          method: 'GET',
          cache: 'no-store'
        });
        const data = await response.json();
        setTenantCount({
          totalCount: data.totalCount || 0,
          remaining: data.remaining || 0,
          isPioneerAvailable: data.isPioneerAvailable || false,
        });
      } catch (error) {
        console.error('Failed to fetch tenant count:', error);
        // Fallback: assume Pioneer is available if fetch fails
        setTenantCount({
          totalCount: 0,
          remaining: 100,
          isPioneerAvailable: true,
        });
      }
    };

    fetchTenantCount();
    // Refresh every minute
    const interval = setInterval(fetchTenantCount, 60000);

    return () => clearInterval(interval);
  }, []);

  // Show loading state or default to Pioneer while fetching
  if (!tenantCount) {
    return (
      <LandingPageHero 
        isPioneerAvailable={true}
        remainingSpots={100}
      />
    );
  }

  return (
    <LandingPageHero 
      isPioneerAvailable={tenantCount.isPioneerAvailable}
      remainingSpots={tenantCount.remaining}
    />
  );
};

