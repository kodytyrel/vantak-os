'use client';

import { useEffect } from 'react';
import { TenantConfig } from '@/types';

interface BodyBackgroundProviderProps {
  tenant: TenantConfig;
  children: React.ReactNode;
}

/**
 * BodyBackgroundProvider applies the tenant's background image to the body element using CSS variables.
 * This creates the premium "full-page background" effect for Elite tier demos.
 * The background is injected via CSS variable --bg-image and applied with Tailwind's arbitrary value syntax.
 */
export const BodyBackgroundProvider: React.FC<BodyBackgroundProviderProps> = ({ tenant, children }) => {
  useEffect(() => {
    const backgroundImageUrl = (tenant as any).background_image_url || null;
    const root = document.documentElement;
    const body = document.body;

    // Set CSS variable on root element (already done by ThemeProvider, but ensuring it's set)
    const bgImageValue = backgroundImageUrl ? `url(${backgroundImageUrl})` : 'none';
    root.style.setProperty('--bg-image', bgImageValue);

    // Apply background image styles to body using CSS variable
    if (backgroundImageUrl) {
      body.style.backgroundImage = 'var(--bg-image)';
      body.style.backgroundSize = 'cover';
      body.style.backgroundPosition = 'center';
      body.style.backgroundRepeat = 'no-repeat';
      body.style.backgroundAttachment = 'fixed';
      body.style.minHeight = '100vh';
      body.style.position = 'relative';
    } else {
      // Reset to default if no background image
      body.style.backgroundImage = 'none';
      body.style.backgroundSize = '';
      body.style.backgroundPosition = '';
      body.style.backgroundRepeat = '';
      body.style.backgroundAttachment = '';
    }

    // Cleanup function to reset styles if component unmounts
    return () => {
      if (!backgroundImageUrl) {
        body.style.backgroundImage = '';
        body.style.backgroundSize = '';
        body.style.backgroundPosition = '';
        body.style.backgroundRepeat = '';
        body.style.backgroundAttachment = '';
        body.style.minHeight = '';
        body.style.position = '';
      }
    };
  }, [tenant]);

  return <>{children}</>;
};

