
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug') || 'glow-studio';

  try {
    // Fetch the branding data for the specific tenant from the Truth Database
    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .select('business_name, primary_color, logo_url')
      .eq('slug', slug)
      .single();

    // Use fallback values if tenant not found
    const name = tenant?.business_name || 'Vantak Service';
    const themeColor = tenant?.primary_color || '#0F172A';
    const logo = tenant?.logo_url || 'https://via.placeholder.com/512';

    const manifest = {
      name: name,
      short_name: name.split(' ')[0],
      description: `Official app for ${name}. Book services and manage your appointments.`,
      start_url: `/?tenant=${slug}&utm_source=pwa`,
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: themeColor,
      icons: [
        {
          src: logo,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable'
        },
        {
          src: logo,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        }
      ]
    };

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, s-maxage=3600'
      }
    });
  } catch (err: any) {
    // Always return a valid manifest, even on error
    const fallbackManifest = {
      name: 'Vantak Service',
      short_name: 'Vantak',
      description: 'Book services and manage your appointments.',
      start_url: `/?tenant=${slug}&utm_source=pwa`,
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#0F172A',
      icons: [
        {
          src: 'https://via.placeholder.com/192',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable'
        },
        {
          src: 'https://via.placeholder.com/512',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        }
      ]
    };

    return NextResponse.json(fallbackManifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, s-maxage=3600'
      }
    });
  }
}
