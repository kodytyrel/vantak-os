
import React, { useEffect } from 'react';
import { TenantConfig } from '../../types';

interface ThemeProviderProps {
  tenantConfig: TenantConfig;
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ tenantConfig, children }) => {
  useEffect(() => {
    if (tenantConfig) {
      const root = document.documentElement;
      const body = document.body;
      const backgroundImageUrl = (tenantConfig as any).background_image_url || null;
      
      root.style.setProperty('--brand-primary', tenantConfig.primaryColor);
      root.style.setProperty('--brand-secondary', tenantConfig.secondaryColor);
      root.style.setProperty('--brand-accent', tenantConfig.accentColor);
      root.style.setProperty('--brand-bg', '#ffffff');
      root.style.setProperty('--brand-radius', '1.5rem');
      root.style.setProperty('--font-family', tenantConfig.fontFamily || 'Inter, sans-serif');
      root.style.setProperty('--bg-image', backgroundImageUrl ? `url(${backgroundImageUrl})` : 'none');

      // Apply background image to body dynamically
      if (backgroundImageUrl) {
        body.style.backgroundImage = `url(${backgroundImageUrl})`;
        body.style.backgroundSize = 'cover';
        body.style.backgroundPosition = 'center';
        body.style.backgroundRepeat = 'no-repeat';
        body.style.backgroundAttachment = 'fixed';
      } else {
        body.style.backgroundImage = 'none';
      }

      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', tenantConfig.primaryColor);
      }
    }
  }, [tenantConfig]);

  return <>{children}</>;
};
