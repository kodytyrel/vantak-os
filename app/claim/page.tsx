'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { ClaimOnboarding } from '@/components/ClaimOnboarding';
import { TenantConfig } from '@/types';

function ClaimContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get('tenant');
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tenantSlug) {
      setError('Missing tenant parameter');
      setLoading(false);
      return;
    }

    const fetchTenant = async () => {
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('slug', tenantSlug)
          .single();

        if (error || !data) {
          setError('Business not found. Please check your signup link.');
          setLoading(false);
          return;
        }

        // Map to TenantConfig format
        const tenantData: TenantConfig = {
          id: data.id,
          slug: data.slug,
          name: data.business_name,
          logoUrl: data.logo_url || '',
          primaryColor: data.primary_color || '#0f172a',
          secondaryColor: data.secondary_color || '#ffffff',
          accentColor: data.accent_color || '#f8fafc',
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
          is_demo: data.is_demo || false,
          business_type: data.business_type || 'service',
          background_image_url: data.background_image_url || null,
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

        setTenant(tenantData);
      } catch (err: any) {
        setError(err.message || 'Failed to load business information');
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [tenantSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your business...</p>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-black text-slate-900">Business Not Found</h1>
          <p className="text-slate-600">{error || 'The business you\'re looking for doesn\'t exist.'}</p>
          <a href="/signup" className="inline-block px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-all">
            Create Your Business
          </a>
        </div>
      </div>
    );
  }

  // Check if already claimed (not a demo)
  // If it's a regular business (not a demo), redirect to their landing page
  if (!tenant.is_demo) {
    router.push(`/${tenant.slug}`);
    return null;
  }

  return <ClaimOnboarding tenant={tenant} />;
}

export default function ClaimPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <ClaimContent />
    </Suspense>
  );
}

