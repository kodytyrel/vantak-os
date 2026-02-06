import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

// Initialize Supabase with Service Role to bypass RLS for merchant setup
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Enable Payments API
 * Creates a Stripe Connect account ONLY when user explicitly requests it.
 * This prevents creating accounts for 'zombie' users who never intend to process payments.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId' },
        { status: 400 }
      );
    }

    // 1. Fetch current tenant status from the registry
    const { data: tenant, error: fetchError } = await supabaseAdmin
      .from('tenants')
      .select('stripe_account_id, business_name, slug')
      .eq('id', tenantId)
      .single();

    if (fetchError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found in registry.' },
        { status: 404 }
      );
    }

    // 2. If account already exists, just return the onboarding link
    if (tenant.stripe_account_id) {
      const accountLink = await stripe.accountLinks.create({
        account: tenant.stripe_account_id,
        refresh_url: `https://vantakos.com/dashboard?tenant=${tenant.slug}&error=retry`,
        return_url: `https://vantakos.com/dashboard?tenant=${tenant.slug}&success=true`,
        type: 'account_onboarding',
      });

      return NextResponse.json({ url: accountLink.url });
    }

    // 2.5. Check if tenant is a founding member (to skip annual fees)
    const { data: tenantFull, error: tenantFullError } = await supabaseAdmin
      .from('tenants')
      .select('is_founding_member, founding_member_number')
      .eq('id', tenantId)
      .single();

    const isFoundingMember = tenantFull?.is_founding_member === true;

    // 3. Create a new Stripe Express account (ONLY when explicitly requested)
    // For founding members: Skip annual fee schedule in metadata
    const account = await stripe.accounts.create({
      type: 'express',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: tenant.business_name,
      },
      metadata: {
        tenantId: tenantId,
        slug: tenant.slug,
        platform: 'VantakOS',
        is_founding_member: isFoundingMember ? 'true' : 'false',
        skip_annual_fee: isFoundingMember ? 'true' : 'false', // Flag to skip annual fee billing
        founding_member_number: tenantFull?.founding_member_number?.toString() || '',
      },
    });

    // 4. Persist the Stripe ID to the tenant record
    const { error: updateError } = await supabaseAdmin
      .from('tenants')
      .update({ stripe_account_id: account.id })
      .eq('id', tenantId);

    if (updateError) {
      console.error('Failed to save Stripe account ID:', updateError);
      return NextResponse.json(
        { error: 'Failed to save Stripe account configuration.' },
        { status: 500 }
      );
    }

    // 5. Generate the Hosted Onboarding Link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `https://vantakos.com/dashboard?tenant=${tenant.slug}&error=retry`,
      return_url: `https://vantakos.com/dashboard?tenant=${tenant.slug}&success=true&onboarding_complete=true`,
      type: 'account_onboarding',
    });

    // 6. Return the secure onboarding URL to the client
    // Note: After onboarding completes, the return_url should trigger a call to
    // /api/stripe/create-subscription-schedule to set up annual fees (if not founding member)
    return NextResponse.json({ 
      url: accountLink.url,
      isFoundingMember, // Include in response for client-side handling
      foundingMemberNumber: tenantFull?.founding_member_number || null,
    });

  } catch (error: any) {
    console.error('VantakOS Enable Payments Error:', error.message);
    return NextResponse.json(
      {
        error: 'Failed to enable payments.',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

