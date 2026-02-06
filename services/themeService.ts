
import { TenantConfig } from '../types';

/**
 * Injects tenant-specific branding into the document root via CSS variables.
 * This allows Tailwind classes (configured to use these variables) to update dynamically.
 */
export const injectTenantTheme = (tenant: TenantConfig) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Mapping Supabase tenant fields to CSS variables
  const backgroundImageUrl = (tenant as any).background_image_url || null;
  
  const themeMap: Record<string, string> = {
    '--brand-primary': tenant.primaryColor,
    '--brand-secondary': tenant.secondaryColor,
    '--brand-accent': tenant.accentColor,
    '--brand-bg': '#ffffff', // Could be added to TenantConfig later
    '--brand-radius': '1rem', // Could be added to TenantConfig later
    '--font-family': tenant.fontFamily || 'Inter, sans-serif',
    '--bg-image': backgroundImageUrl ? `url(${backgroundImageUrl})` : 'none',
  };

  Object.entries(themeMap).forEach(([property, value]) => {
    if (value) {
      root.style.setProperty(property, value);
    }
  });

  // Update browser theme color for mobile PWA experience
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', tenant.primaryColor);
  }
};
