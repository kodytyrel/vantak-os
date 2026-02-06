import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
  params: {
    slug: string;
  };
}

async function getTenantForMetadata(slug: string) {
  const { data, error } = await supabase
    .from('tenants')
    .select('business_name, primary_color, logo_url, slug')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    name: data.business_name,
    primaryColor: data.primary_color || '#0F172A',
    logoUrl: data.logo_url,
    slug: data.slug,
  };
}

/**
 * Dynamic layout for tenant pages
 * Injects tenant-specific PWA manifest for "Business in a Box" white-label experience
 */
export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const tenant = await getTenantForMetadata(params.slug);

  if (!tenant) {
    return {
      title: 'Business Not Found',
      description: 'This business page could not be found.',
    };
  }

  return {
    title: `${tenant.name} | Professional Services`,
    description: `Your Business. Your App. Book services and manage appointments with ${tenant.name}.`,
    icons: {
      icon: tenant.logoUrl || '/icon',
      shortcut: tenant.logoUrl || '/icon',
      apple: tenant.logoUrl || '/icon',
    },
    other: {
      'manifest': `/api/manifest/${tenant.slug}`,
      'theme-color': tenant.primaryColor,
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'black-translucent',
      'apple-mobile-web-app-title': tenant.name,
    },
  };
}

export default async function TenantLayout({ children }: LayoutProps) {
  return <>{children}</>;
}

