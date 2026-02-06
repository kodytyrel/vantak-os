import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import ApproveEstimateClient from './ApproveEstimateClient';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PageProps {
  params: {
    id: string;
  };
}

export default async function ApproveEstimatePage({ params }: PageProps) {
  // Fetch estimate with items
  const { data: estimate, error: estimateError } = await supabaseAdmin
    .from('estimates')
    .select('*')
    .eq('id', params.id)
    .single();

  if (estimateError || !estimate) {
    notFound();
  }

  // Fetch estimate items
  const { data: estimateItems, error: itemsError } = await supabaseAdmin
    .from('estimate_items')
    .select('*')
    .eq('estimate_id', params.id)
    .order('created_at', { ascending: true });

  if (itemsError) {
    notFound();
  }

  // Fetch customer
  const { data: customer } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('id', estimate.customer_id)
    .single();

  // Fetch tenant
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('tenants')
    .select('id, business_name, logo_url, primary_color, secondary_color, contact_email, contact_phone, physical_address, slug, tier')
    .eq('id', estimate.tenant_id)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  // Combine estimate with items
  const estimateWithItems = {
    ...estimate,
    items: estimateItems || [],
    customer: customer || null,
  };

  return <ApproveEstimateClient estimate={estimateWithItems} tenant={tenant} />;
}
