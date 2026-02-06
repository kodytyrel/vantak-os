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
    const { tenantId, amount, cardNumber, cardExpiry, cardCvc, cardholderName, customerName } = body;

    if (!tenantId || !amount || amount <= 0 || !cardNumber || !cardExpiry || !cardCvc || !cardholderName) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Fetch tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, stripe_account_id, platform_fee_percent, business_name')
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

    // Parse expiry date
    const [month, year] = cardExpiry.split('/');
    const expiryYear = 2000 + parseInt(year || '24');

    // Create Payment Intent on the connected account
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: tenant.stripe_account_id,
      },
      metadata: {
        tenant_id: tenantId,
        type: 'TERMINAL_PAYMENT',
        method: 'manual',
        customer_name: customerName || cardholderName,
        engine: 'VantakOS-Terminal-v1',
      },
    });

    // Create Payment Method
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: cardNumber.replace(/\s/g, ''),
        exp_month: parseInt(month || '12'),
        exp_year: expiryYear,
        cvc: cardCvc,
      },
    });

    // Attach payment method to payment intent and confirm
    await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method: paymentMethod.id,
    });

    // Generate receipt number
    const { data: invoiceNumberData } = await supabaseAdmin
      .rpc('generate_invoice_number', { p_tenant_id: tenantId })
      .catch(() => ({ data: null }));

    const receiptNumber = invoiceNumberData || `RCP-${Date.now().toString().slice(-6)}`;

    // Create invoice and ledger entry immediately for manual payments
    const invoiceNumber = invoiceNumberData || `VTK-${Date.now().toString().slice(-6)}`;

    // Insert invoice
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .insert([
        {
          tenant_id: tenantId,
          invoice_number: invoiceNumber,
          customer_name: customerName || cardholderName,
          status: 'paid',
          line_items: [
            {
              description: `Terminal Payment (Manual Entry) - ${tenant.business_name}`,
              quantity: 1,
              price: amount,
              total: amount,
            },
          ],
          subtotal: amount,
          tax_amount: 0,
          total_amount: amount,
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: paymentIntent.id,
        } as any,
      ])
      .select()
      .single();

    if (invoiceError) {
      console.error('Failed to create invoice:', invoiceError);
      return NextResponse.json(
        { error: 'Payment succeeded but failed to create invoice', details: invoiceError.message },
        { status: 500 }
      );
    }

    // Create ledger entry
    const { error: revenueError } = await supabaseAdmin
      .from('revenue')
      .insert([
        {
          tenant_id: tenantId,
          amount: amount,
          category: 'daily_sales',
          description: `Terminal Payment - ${customerName || cardholderName}`,
          date: new Date().toISOString().split('T')[0],
          notes: `Manual entry via Vantak Terminal. Payment Intent: ${paymentIntent.id}`,
          invoice_id: invoice.id,
          invoice_number: invoiceNumber,
          customer_name: customerName || cardholderName,
          stripe_payment_intent: paymentIntent.id,
        } as any,
      ]);

    if (revenueError) {
      console.error('Failed to create ledger entry:', revenueError);
      // Don't fail the request - invoice is already created
    }

    return NextResponse.json({
      success: true,
      receiptNumber: invoiceNumber,
      paymentIntentId: paymentIntent.id,
      invoiceId: invoice.id,
    });
  } catch (error: any) {
    console.error('Manual payment error:', error);
    return NextResponse.json(
      { error: 'Payment failed', details: error.message },
      { status: 500 }
    );
  }
}

