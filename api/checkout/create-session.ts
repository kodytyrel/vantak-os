
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Initialize Supabase Admin for secure tenant lookup
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug, amount, serviceName, appointmentId, customerEmail } = req.body;

  // 1. Validate Input
  if (!slug || !amount) {
    return res.status(400).json({ error: 'Missing required checkout parameters: slug and amount' });
  }

  try {
    // 2. Resolve Tenant Financial Profile from the Registry
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, stripe_account_id, platform_fee_percent, business_name')
      .eq('slug', slug)
      .single();

    if (tenantError || !tenant) {
      return res.status(404).json({ error: 'Merchant configuration not found for this slug' });
    }

    if (!tenant.stripe_account_id) {
      return res.status(400).json({ error: 'Merchant has not linked a bank account (Stripe Connect)' });
    }

    // 3. Financial Logic (Cents)
    const amountCents = Math.round(parseFloat(amount) * 100);
    const feePercent = tenant.platform_fee_percent || 1.5;
    
    // Calculate Vantak's platform cut
    const applicationFeeAmount = Math.round(amountCents * (feePercent / 100));

    // 4. Initialize Multi-Tenant Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customerEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: serviceName || `Service at ${tenant.business_name}`,
              description: `Booking via VantakOS`,
              metadata: { 
                tenant_id: tenant.id,
                slug: slug 
              }
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        // This is Vantak's platform cut
        application_fee_amount: applicationFeeAmount,
        // This sends the remaining balance to the Merchant's Connected Account
        transfer_data: {
          destination: tenant.stripe_account_id,
        },
        metadata: {
          tenant_id: tenant.id,
          appointment_id: appointmentId || 'manual_entry',
          engine: 'VantakOS-v1-Ignition'
        },
      },
      // Environment-aware redirects
      success_url: `${req.headers.origin}/booking/success?session_id={CHECKOUT_SESSION_ID}&slug=${slug}`,
      cancel_url: `${req.headers.origin}/book?tenant=${slug}`,
    });

    // 5. Return the payload
    return res.status(200).json({ 
      url: session.url,
      merchant: tenant.business_name,
      platform_fee: `${feePercent}%`,
      application_fee_cents: applicationFeeAmount
    });

  } catch (error: any) {
    console.error('VantakOS Payment Engine Error:', error.message);
    return res.status(500).json({ 
      error: 'Failed to create Vantak checkout session', 
      details: error.message 
    });
  }
}
