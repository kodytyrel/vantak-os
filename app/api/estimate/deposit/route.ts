import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const { estimateId, tenantSlug, depositAmount, customerEmail } = await req.json();

    if (!estimateId || !tenantSlug || !depositAmount) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Fetch estimate
    const { data: estimate, error: estimateError } = await supabaseAdmin
      .from('estimates')
      .select('*')
      .eq('id', estimateId)
      .single();

    if (estimateError || !estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    // Fetch tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, business_name, slug, stripe_account_id, platform_fee_percent')
      .eq('id', estimate.tenant_id)
      .eq('slug', tenantSlug)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    if (!tenant.stripe_account_id) {
      return NextResponse.json({ error: 'Merchant has not completed Stripe onboarding' }, { status: 400 });
    }

    // Calculate fees
    const amountCents = Math.round(parseFloat(depositAmount) * 100);
    const feePercent = tenant.platform_fee_percent || 1.5;
    const feeCents = Math.round(amountCents * (feePercent / 100));
    const applicationFeeAmount = amountCents > 0 ? Math.max(feeCents, 1) : 0;

    // Create Stripe checkout session for deposit
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customerEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Deposit for Estimate`,
              description: `Deposit payment for estimate approval`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: tenant.stripe_account_id,
        },
        metadata: {
          tenant_id: tenant.id,
          estimate_id: estimate.id,
          type: 'estimate_deposit',
          engine: 'VantakOS-Estimate-v1',
        },
      },
      success_url: `https://vantakos.com/approve/${estimateId}?paid=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://vantakos.com/approve/${estimateId}?cancelled=true`,
      metadata: {
        tenant_id: tenant.id,
        estimate_id: estimate.id,
        type: 'estimate_deposit',
      },
    });

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id,
    });

  } catch (error: any) {
    console.error('Estimate deposit checkout error:', error);
    return NextResponse.json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    }, { status: 500 });
  }
}

