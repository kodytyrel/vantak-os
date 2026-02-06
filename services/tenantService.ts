
import { MOCK_TENANTS } from '../constants';
import { TenantConfig } from '../types';
import { injectTenantTheme } from './themeService';
import { supabase } from './supabase';

/**
 * Resolves the current tenant based on the 'tenant' query parameter.
 * This is the 'Magic Link' engine that powers slug.vantak.app style routing.
 */
export const resolveTenant = async (): Promise<TenantConfig> => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const tenantSlug = params.get('tenant');
  
  let selectedTenant: TenantConfig | null = null;

  // 1. Try to fetch from the "Truth" Database (Supabase)
  if (tenantSlug) {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', tenantSlug)
        .single();

      if (data && !error) {
        // Map the SQL snake_case schema to our TypeScript camelCase interface
        selectedTenant = {
          id: data.id,
          slug: data.slug,
          name: data.business_name, // Mapping from SQL 'business_name'
          logoUrl: data.logo_url,    // Mapping from SQL 'logo_url'
          primaryColor: data.primary_color, // Mapping from SQL 'primary_color'
          secondaryColor: data.secondary_color || '#0F172A',
          accentColor: data.accent_color || '#F0F9FF',
          fontFamily: data.font_family || 'sans-serif',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          timezone: data.timezone || 'UTC',
          stripeConnectedId: data.stripe_account_id, // Mapping from SQL 'stripe_account_id'
          tier: data.tier || 'starter',
          platform_fee_percent: parseFloat(data.platform_fee_percent) || 1.5,
          monthly_subscription_fee: 0,
          is_demo: data.is_demo,
          business_type: data.business_type || 'service',
          seo: data.seo || {
            title: `${data.business_name} | Professional Services`,
            description: `Book your next appointment with ${data.business_name} instantly.`
          },
          features: data.features || {
            enableBooking: true,
            enableShop: false,
            enableGallery: true
          }
        };
      }
    } catch (err) {
      console.error("Vantak OS Handshake Failed:", err);
    }
  }

  // 2. Fallback to Local Cache (Mocks) if slug not found or DB unreachable
  if (!selectedTenant) {
    const fallbackSlug = tenantSlug || 'glow-studio';
    selectedTenant = MOCK_TENANTS[fallbackSlug] || MOCK_TENANTS['glow-studio'];
  }

  // 3. Inject Branding & Metadata into the DOM
  if (typeof document !== 'undefined' && selectedTenant) {
    injectTenantTheme(selectedTenant);
    
    // Update SEO tags dynamically
    document.title = selectedTenant.seo.title;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', selectedTenant.seo.description);
    }
  }

  return selectedTenant as TenantConfig;
};
