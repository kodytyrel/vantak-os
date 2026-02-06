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
    const { invoiceId, tenantSlug } = await req.json();

    if (!invoiceId || !tenantSlug) {
      return NextResponse.json({ error: 'Missing invoiceId or tenantSlug' }, { status: 400 });
    }

    // Fetch invoice first
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Fetch tenant separately
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, business_name, slug, stripe_account_id, platform_fee_percent, tier')
      .eq('id', invoice.tenant_id)
      .eq('slug', tenantSlug)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found or invoice does not belong to this tenant' }, { status: 404 });
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 });
    }

    if (!tenant.stripe_account_id) {
      return NextResponse.json({ error: 'Merchant has not completed Stripe onboarding' }, { status: 400 });
    }

    // Calculate fees
    const amountCents = Math.round(invoice.total_amount * 100);
    const feePercent = tenant.platform_fee_percent || 1.5;
    const feeCents = Math.round(amountCents * (feePercent / 100));
    const applicationFeeAmount = amountCents > 0 ? Math.max(feeCents, 1) : 0;

    // Build line items array
    const lineItems = invoice.line_items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.description,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // Add tax as separate line item if applicable
    if (invoice.tax_amount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Tax',
          },
          unit_amount: Math.round(invoice.tax_amount * 100),
        },
        quantity: 1,
      });
    }

    // Use automatic_payment_methods to respect Stripe Dashboard settings
    // BNPL will be automatically included if enabled in dashboard for Elite tier
    // Metadata includes invoice_id for Success Ding feature
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: invoice.customer_email || undefined,
      automatic_payment_methods: {
        enabled: true,
      },
      line_items: lineItems,
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: tenant.stripe_account_id,
        },
        metadata: {
          tenant_id: tenant.id,
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          type: 'invoice_payment',
          engine: 'VantakOS-Invoice-v1',
        },
      },
      success_url: `https://vantakos.com/dashboard/success?session_id={CHECKOUT_SESSION_ID}&invoice_id=${invoice.id}&paid=true`,
      cancel_url: `https://vantakos.com/dashboard?invoice_id=${invoice.id}&cancelled=true`,
      metadata: {
        tenant_id: tenant.id,
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        type: 'invoice_payment',
      },
    });

    // Update invoice with checkout session ID
    await supabaseAdmin
      .from('invoices')
      .update({ 
        stripe_checkout_session_id: session.id,
        status: 'sent',
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', invoice.id);

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id,
    });

  } catch (error: any) {
    console.error('Invoice checkout error:', error);
    return NextResponse.json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    }, { status: 500 });
  }
}

