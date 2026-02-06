import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import InstallBanner from '@/components/InstallBanner';
import ClientLandingPage from './ClientLandingPage';
import { BodyBackgroundProvider } from '@/components/BodyBackgroundProvider';
import { ManifestInjector } from '@/components/ManifestInjector';

interface PageProps {
  params: {
    slug: string;
  };
}

async function getTenant(slug: string) {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }

          // Map to TenantConfig format
          return {
            id: data.id,
            slug: data.slug,
            name: data.business_name,
            logoUrl: data.logo_url,
            primaryColor: data.primary_color || '#38bdf8',
            secondaryColor: data.secondary_color || '#0F172A',
            accentColor: data.accent_color || '#F0F9FF',
            fontFamily: data.font_family || 'sans-serif',
            contactEmail: data.contact_email || '',
            contactPhone: data.contact_phone || '',
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            timezone: data.timezone || 'UTC',
            stripeConnectedId: data.stripe_account_id,
            tier: data.tier || 'starter',
            platform_fee_percent: parseFloat(data.platform_fee_percent) || 1.5,
            monthly_subscription_fee: 0,
            is_demo: data.is_demo,
            business_type: data.business_type || 'service',
            background_image_url: data.background_image_url || null,
            is_founding_member: data.is_founding_member || false,
            founding_member_number: data.founding_member_number || null,
    seo: {
      title: `${data.business_name} | Professional Services`,
      description: `Book your next appointment with ${data.business_name} instantly.`
    },
    features: data.features || {
      enableBooking: true,
      enableShop: data.enable_shop || false,
      enableGallery: true
    }
  } as any;
}

async function getServices(tenantId: string) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching services:', error);
    return [];
  }

  return (data || []).map((s: any) => ({
    id: s.id,
    tenantId: s.tenant_id,
    name: s.name,
    description: s.description,
    price: s.price / 100, // Convert cents to dollars
    durationMinutes: s.duration_minutes || 30,
    imageUrl: s.image_url,
  }));
}

async function getProducts(tenantId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return (data || []).map((p: any) => ({
    id: p.id,
    tenantId: p.tenant_id,
    name: p.name,
    description: p.description,
    price: p.price / 100, // Convert cents to dollars
    imageUrl: p.image_url,
    sku: p.sku,
  }));
}

export default async function TenantLandingPage({ params }: PageProps) {
  const tenant = await getTenant(params.slug);

  if (!tenant) {
    notFound();
  }

  const services = await getServices(tenant.id);
  const products = tenant.features?.enableShop ? await getProducts(tenant.id) : [];

  return (
    <BodyBackgroundProvider tenant={tenant}>
      {/* Inject tenant-specific PWA manifest for "Business in a Box" white-label experience */}
      <ManifestInjector 
        slug={tenant.slug} 
        themeColor={tenant.primaryColor}
        appName={tenant.name}
      />
      <ClientLandingPage
        tenant={tenant}
        services={services}
        products={products}
      />
      <InstallBanner
        businessName={tenant.name}
        primaryColor={tenant.primaryColor}
        logoUrl={tenant.logoUrl}
      />
    </BodyBackgroundProvider>
  );
}


