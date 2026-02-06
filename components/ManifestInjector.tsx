'use client';

import { useEffect } from 'react';

interface ManifestInjectorProps {
  slug: string;
  themeColor?: string;
  appName?: string;
}

/**
 * Client component that injects PWA manifest link into the document head
 * This ensures each business gets their own branded manifest for PWA installation
 */
export function ManifestInjector({ slug, themeColor, appName }: ManifestInjectorProps) {
  useEffect(() => {
    // Remove existing manifest link if any
    const existingLink = document.querySelector('link[rel="manifest"]');
    if (existingLink) {
      existingLink.remove();
    }

    // Create and inject the manifest link
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = `/api/manifest/${slug}`;
    document.head.appendChild(manifestLink);

    // Update theme color meta tag
    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeMeta);
    }
    if (themeColor) {
      themeMeta.setAttribute('content', themeColor);
    }

    // Update Apple mobile web app meta tags
    const appleCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]') || document.createElement('meta');
    if (!appleCapable.getAttribute('name')) {
      appleCapable.setAttribute('name', 'apple-mobile-web-app-capable');
      document.head.appendChild(appleCapable);
    }
    appleCapable.setAttribute('content', 'yes');

    const appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') || document.createElement('meta');
    if (!appleStatusBar.getAttribute('name')) {
      appleStatusBar.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
      document.head.appendChild(appleStatusBar);
    }
    appleStatusBar.setAttribute('content', 'black-translucent');

    if (appName) {
      const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]') || document.createElement('meta');
      if (!appleTitle.getAttribute('name')) {
        appleTitle.setAttribute('name', 'apple-mobile-web-app-title');
        document.head.appendChild(appleTitle);
      }
      appleTitle.setAttribute('content', appName);
    }

    // Cleanup function
    return () => {
      if (manifestLink.parentNode) {
        manifestLink.parentNode.removeChild(manifestLink);
      }
    };
  }, [slug, themeColor, appName]);

  return null;
}

