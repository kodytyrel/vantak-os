
import React, { useEffect } from 'react';
import { TenantConfig } from '../types';

interface ThemeProviderProps {
  tenantConfig: TenantConfig;
  children: React.ReactNode;
}

/**
 * ThemeProvider watches the tenantConfig and injects CSS variables into the document root.
 * This ensures that Tailwind classes using var(--brand-*) update in real-time.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ tenantConfig, children }) => {
  useEffect(() => {
    if (tenantConfig) {
      const root = document.documentElement;
      
      // Map tenant config to CSS variables
      // Supporting both CamelCase (TS interface) and snake_case (Supabase convention) if needed
      const primary = tenantConfig.primaryColor;
      const secondary = tenantConfig.secondaryColor;
      const accent = tenantConfig.accentColor;
      const font = tenantConfig.fontFamily || 'Inter, sans-serif';
      const radius = '1rem'; // Default or from config
      const bg = '#ffffff';  // Default or from config

      root.style.setProperty('--brand-primary', primary);
      root.style.setProperty('--brand-secondary', secondary);
      root.style.setProperty('--brand-accent', accent);
      root.style.setProperty('--brand-bg', bg);
      root.style.setProperty('--brand-radius', radius);
      root.style.setProperty('--font-family', font);

      // Update mobile PWA theme color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', primary);
      }
    }
  }, [tenantConfig]);

  return <>{children}</>;
};
