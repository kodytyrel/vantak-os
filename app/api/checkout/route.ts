import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

// Initialize Supabase Admin for secure tenant lookup
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, type, itemId, customerEmail, subscribeToNewsletter } = body;

    // 1. Validate Input
    if (!slug || !type || !itemId) {
      return NextResponse.json(
        { error: 'Missing required parameters: slug, type, and itemId' },
        { status: 400 }
      );
    }

    if (type !== 'service' && type !== 'product') {
      return NextResponse.json(
        { error: 'Type must be either "service" or "product"' },
        { status: 400 }
      );
    }

    // 2. Resolve Tenant Financial Profile
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, stripe_account_id, platform_fee_percent, business_name, tier')
      .eq('slug', slug)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Merchant configuration not found for this slug' },
        { status: 404 }
      );
    }

    if (!tenant.stripe_account_id) {
      return NextResponse.json(
        { error: 'Merchant has not linked a bank account (Stripe Connect)' },
        { status: 400 }
      );
    }

    // 3. Fetch item from appropriate table
    let item: any = null;
    let itemName = '';
    let itemPrice = 0;

    if (type === 'service') {
      const { data: service, error: serviceError } = await supabaseAdmin
        .from('services')
        .select('id, name, price, tenant_id')
        .eq('id', itemId)
        .eq('tenant_id', tenant.id)
        .single();

      if (serviceError || !service) {
        return NextResponse.json(
          { error: 'Service not found or does not belong to this tenant' },
          { status: 404 }
        );
      }

      item = service;
      itemName = service.name;
      itemPrice = service.price; // Assuming price is already in cents in DB
    } else if (type === 'product') {
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select('id, name, price, tenant_id')
        .eq('id', itemId)
        .eq('tenant_id', tenant.id)
        .single();

      if (productError || !product) {
        return NextResponse.json(
          { error: 'Product not found or does not belong to this tenant' },
          { status: 404 }
        );
      }

      item = product;
      itemName = product.name;
      itemPrice = product.price; // Assuming price is in cents in DB
    }

    // 4. Financial Logic
    const amountCents = typeof itemPrice === 'number' ? itemPrice : Math.round(parseFloat(itemPrice) * 100);
    const feePercent = tenant.platform_fee_percent || 1.5;
    
    // Calculate Vantak's platform cut
    const applicationFeeAmount = Math.round(amountCents * (feePercent / 100));

    // 5. Initialize Multi-Tenant Stripe Checkout Session
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
              name: itemName,
              description: type === 'service' 
                ? `Service booking at ${tenant.business_name}` 
                : `Product purchase from ${tenant.business_name}`,
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
          item_id: itemId,
          type: type === 'service' ? 'SERVICE_BOOKING' : 'PRODUCT_PURCHASE',
          engine: 'VantakOS-Checkout-v2'
        },
      },
      // Production redirects to vantakos.com
      success_url: `https://vantakos.com/dashboard/success?session_id={CHECKOUT_SESSION_ID}&slug=${slug}&type=${type}${subscribeToNewsletter && customerEmail ? `&subscribe=true&email=${encodeURIComponent(customerEmail)}` : ''}`,
      cancel_url: `https://vantakos.com/dashboard?tenant=${slug}`,
    });

    // 6. If newsletter subscription is requested, save subscriber now (before checkout)
    if (subscribeToNewsletter && customerEmail) {
      try {
        await supabaseAdmin
          .from('subscribers')
          .upsert({
            tenant_id: tenant.id,
            email: customerEmail.toLowerCase(),
            source: 'checkout',
          }, {
            onConflict: 'tenant_id,email',
          });
      } catch (subscriberError) {
        // Log but don't fail checkout if subscriber save fails
        console.error('Failed to save subscriber:', subscriberError);
      }
    }

    // 7. Return the payload
    return NextResponse.json({ 
      url: session.url,
      merchant: tenant.business_name,
      platform_fee: `${feePercent}%`,
      application_fee_cents: applicationFeeAmount,
      item_name: itemName,
      type: type
    });

  } catch (error: any) {
    console.error('VantakOS Payment Engine Error:', error.message);
    return NextResponse.json(
      { 
        error: 'Failed to create Vantak checkout session', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

