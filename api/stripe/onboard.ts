
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Initialize Supabase with Service Role to bypass RLS for merchant setup
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests for onboarding initiation
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tenantId } = req.body;

  if (!tenantId) {
    return res.status(400).json({ error: 'Missing tenantId' });
  }

  try {
    // 1. Fetch current tenant status from the registry
    const { data: tenant, error: fetchError } = await supabaseAdmin
      .from('tenants')
      .select('stripe_account_id, business_name, slug')
      .eq('id', tenantId)
      .single();

    if (fetchError || !tenant) {
      throw new Error('Tenant not found in registry.');
    }

    let stripeAccountId = tenant.stripe_account_id;

    // 2. Create a new Stripe Express account if one doesn't exist
    if (!stripeAccountId) {
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
          platform: 'VantakOS'
        }
      });
      
      stripeAccountId = account.id;

      // Persist the Stripe ID immediately to the tenant record
      const { error: updateError } = await supabaseAdmin
        .from('tenants')
        .update({ stripe_account_id: stripeAccountId })
        .eq('id', tenantId);

      if (updateError) throw updateError;
    }

    // 3. Generate the Hosted Onboarding Link
    // Note: In production, window.location.origin would be used via an env var
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${baseUrl}/claim?tenant=${tenant.slug}&error=retry`,
      return_url: `${baseUrl}/dashboard?success=true&tenant=${tenant.slug}`,
      type: 'account_onboarding',
    });

    // 4. Return the secure onboarding URL to the client
    return res.status(200).json({ url: accountLink.url });
  } catch (error: any) {
    console.error('VantakOS Stripe Onboarding Engine Failure:', error.message);
    return res.status(500).json({ 
      error: 'Failed to initialize onboarding session.',
      details: error.message 
    });
  }
}
