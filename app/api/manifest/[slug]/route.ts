import { NextRequest, NextResponse } from 'next/server';
import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Dynamic PWA Manifest API Route
 * Generates tenant-specific manifest for "Business in a Box" white-label experience
 * Each business gets their own logo, colors, and branding in the installed PWA
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;

  try {
    // Fetch the branding data for the specific tenant
    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .select('business_name, primary_color, logo_url, slug')
      .eq('slug', slug)
      .single();

    // Use tenant branding if found, otherwise fallback to generic
    const businessName = tenant?.business_name || 'Vantak Service';
    const shortName = businessName.split(' ')[0];
    const themeColor = tenant?.primary_color || '#0F172A';
    const backgroundColor = tenant?.primary_color || '#ffffff';
    const logoUrl = tenant?.logo_url || null;
    const tenantSlug = tenant?.slug || slug;

    // Generate manifest with tenant branding
    const manifest: MetadataRoute.Manifest = {
      name: `${businessName} - Powered by VantakOS`,
      short_name: shortName,
      description: `Your Business. Your App. Running on vantakos.com. Book services and manage appointments with ${businessName}.`,
      start_url: `https://vantakos.com/${tenantSlug}?utm_source=pwa&utm_medium=pwa`,
      scope: 'https://vantakos.com/',
      id: `https://vantakos.com/${tenantSlug}`,
      display: 'standalone',
      orientation: 'portrait',
      background_color: backgroundColor,
      theme_color: themeColor,
      icons: logoUrl ? [
        {
          src: logoUrl,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable',
        },
        {
          src: logoUrl,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
      ] : [
        // Fallback: Generate a simple icon with the business's primary color
        {
          src: generateIconSvg(themeColor, shortName.charAt(0).toUpperCase(), '192'),
          sizes: '192x192',
          type: 'image/svg+xml',
          purpose: 'maskable',
        },
        {
          src: generateIconSvg(themeColor, shortName.charAt(0).toUpperCase(), '512'),
          sizes: '512x512',
          type: 'image/svg+xml',
          purpose: 'any',
        },
      ],
    };

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err: any) {
    console.error('Manifest generation error:', err);
    
    // Always return a valid manifest, even on error
    const fallbackManifest: MetadataRoute.Manifest = {
      name: 'VantakOS - The Operating System for Service Businesses',
      short_name: 'VantakOS',
      description: 'VantakOS running on vantakos.com. Book services and manage your appointments.',
      start_url: `https://vantakos.com/${slug}?utm_source=pwa`,
      scope: 'https://vantakos.com/',
      id: `https://vantakos.com/${slug}`,
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#ffffff',
      theme_color: '#0F172A',
      icons: [
        {
          src: 'https://via.placeholder.com/192',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable',
        },
        {
          src: 'https://via.placeholder.com/512',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
      ],
    };

    return NextResponse.json(fallbackManifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, s-maxage=3600',
      },
    });
  }
}

/**
 * Helper function to generate an SVG icon with the business's branding
 * Used as fallback when logo_url is not available
 */
function generateIconSvg(color: string, letter: string, size: string): string {
  const sizeNum = parseInt(size);
  const fontSize = Math.floor(sizeNum * 0.65);
  const rectSize = sizeNum;
  
  const svg = `
<svg width="${rectSize}" height="${rectSize}" viewBox="0 0 ${rectSize} ${rectSize}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${rectSize}" height="${rectSize}" rx="${sizeNum * 0.125}" fill="${color}"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="900" fill="#ffffff">${letter}</text>
</svg>`.trim();
  
  // Convert to data URI
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

