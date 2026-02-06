import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import InvoicePageClient from './InvoicePageClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for public invoice pages
);

interface PageProps {
  params: {
    id: string;
  };
}

export default async function InvoicePage({ params }: PageProps) {
  // Fetch invoice first
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', params.id)
    .single();

  if (invoiceError || !invoice) {
    notFound();
  }

  // Fetch tenant separately
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, business_name, logo_url, primary_color, secondary_color, contact_email, contact_phone, physical_address, slug, tier')
    .eq('id', invoice.tenant_id)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  return <InvoicePageClient invoice={invoice} tenant={tenant} />;
}

