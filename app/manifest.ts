
import { MetadataRoute } from 'next';

/**
 * Next.js Web App Manifest
 * Standard manifest for VantakOS homepage
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VantakOS - The Operating System for Service Businesses',
    short_name: 'VantakOS',
    description: 'VantakOS running on vantakos.com. We handle the business, so you can focus on the craft.',
    start_url: '/',
    scope: 'https://vantakos.com/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0F172A',
    theme_color: '#38BDF8',
    id: 'https://vantakos.com/',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
