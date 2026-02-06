import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, amount, customerName, customerEmail, method } = body;

    if (!tenantId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Missing required parameters: tenantId and amount' },
        { status: 400 }
      );
    }

    // Fetch tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, stripe_account_id, platform_fee_percent, business_name, slug, tier')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    if (!tenant.stripe_account_id) {
      return NextResponse.json(
        { error: 'Stripe account not connected' },
        { status: 400 }
      );
    }

    // Calculate fees
    const amountCents = Math.round(amount * 100);
    const feePercent = tenant.platform_fee_percent || 1.5;
    const applicationFeeAmount = Math.round(amountCents * (feePercent / 100));

    // Use automatic_payment_methods to respect Stripe Dashboard settings
    // BNPL will be automatically included if enabled in dashboard for Elite tier
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customerEmail || undefined,
      automatic_payment_methods: {
        enabled: true,
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Payment - ${tenant.business_name}`,
              description: `Terminal payment via ${method === 'scan' ? 'QR Code' : 'Payment Link'}`,
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
          tenant_id: tenantId,
          type: 'TERMINAL_PAYMENT',
          method: method || 'scan',
          customer_name: customerName || '',
          engine: 'VantakOS-Terminal-v1',
        },
      },
      success_url: `https://vantakos.com/dashboard/success?session_id={CHECKOUT_SESSION_ID}&tenant_id=${tenantId}&terminal=success`,
      cancel_url: `https://vantakos.com/dashboard?tenant=${tenant.slug}&terminal=cancelled`,
      metadata: {
        tenantId: tenantId,
        type: 'terminal_payment',
        method: method || 'scan',
        customer_name: customerName || '',
      },
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('Terminal checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error.message },
      { status: 500 }
    );
  }
}

