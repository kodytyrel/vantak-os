import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');
  const tenantId = searchParams.get('tenant_id');

  if (!sessionId || !tenantId) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Fetch tenant slug for redirect
  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('slug')
    .eq('id', tenantId)
    .single();

  const slug = tenant?.slug || 'dashboard';

  // Redirect to dashboard with success flag
  // The webhook will handle creating the invoice and ledger entry
  return NextResponse.redirect(
    new URL(`/dashboard?tenant=${slug}&terminal=success&session_id=${sessionId}`, req.url)
  );
}

