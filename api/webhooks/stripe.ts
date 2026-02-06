
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

// Initialize Supabase with Service Role Key to bypass RLS for administrative updates
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  // 1. Verify the signature to ensure the request actually came from Stripe
  try {
    if (!sig || !endpointSecret) {
      return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
    }
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Signature Verification Failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // 2. Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Extract our custom metadata
    const tenantId = session.metadata?.tenant_id || session.metadata?.tenantId;
    const appointmentId = session.metadata?.appointment_id || session.metadata?.appointmentId;
    const type = session.metadata?.type;
    const recurringGroupId = session.metadata?.recurring_group_id;

    // Handle Connectivity Fee Subscription Checkout Completion
    if (type === 'connectivity_fee_subscription' && tenantId) {
      console.log(`Processing connectivity fee subscription checkout for tenant: ${tenantId}`);

      // Retrieve the subscription ID from the checkout session
      // For subscription mode, the subscription_id is available directly
      const subscriptionId = session.subscription as string;

      if (subscriptionId) {
        // Retrieve subscription details to verify trial period
        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          // Save subscription ID to tenants table
          const { error } = await supabaseAdmin
            .from('tenants')
            .update({ 
              stripe_subscription_id: subscriptionId,
              updated_at: new Date().toISOString()
            } as any)
            .eq('id', tenantId);

          if (error) {
            console.error('Failed to save subscription ID:', error);
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
          }

          console.log(`✅ Connectivity fee subscription saved for tenant ${tenantId}: ${subscriptionId}`);
          console.log(`   Trial ends: ${subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : 'N/A'}`);
        } catch (err: any) {
          console.error('Error retrieving subscription:', err.message);
          return NextResponse.json({ error: 'Failed to retrieve subscription' }, { status: 500 });
        }
      } else {
        console.error('No subscription ID found in checkout session');
        return NextResponse.json({ error: 'Missing subscription ID' }, { status: 400 });
      }
    } else if (type === 'RECURRING_BOOKING' && recurringGroupId && tenantId) {
      console.log(`Processing confirmed recurring booking group: ${recurringGroupId} for tenant: ${tenantId}`);

      // Update all appointments in the recurring group
      const { error } = await supabaseAdmin
        .from('appointments')
        .update({ 
          status: 'CONFIRMED',
          paid: true,
          stripe_payment_intent: session.payment_intent as string,
          updated_at: new Date().toISOString()
        })
        .eq('recurring_group_id', recurringGroupId)
        .eq('tenantId', tenantId); // Safety check: ensure appointments belong to tenant

      if (error) {
        console.error('Supabase update failed:', error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      console.log(`Successfully confirmed recurring appointment group ${recurringGroupId}`);
    } else if (type === 'invoice_payment' && tenantId) {
      const invoiceId = session.metadata?.invoice_id;
      const invoiceNumber = session.metadata?.invoice_number;

      if (!invoiceId) {
        console.error('Missing invoice_id in metadata');
        return NextResponse.json({ error: 'Missing invoice_id' }, { status: 400 });
      }

      console.log(`Processing invoice payment: ${invoiceId} (${invoiceNumber}) for tenant: ${tenantId}`);

      // Fetch invoice to get total amount
      const { data: invoice, error: invoiceFetchError } = await supabaseAdmin
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('tenant_id', tenantId)
        .single();

      if (invoiceFetchError || !invoice) {
        console.error('Invoice not found:', invoiceFetchError);
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      // Update invoice status to paid
      const { error: invoiceUpdateError } = await supabaseAdmin
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: session.payment_intent as string,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', invoiceId)
        .eq('tenant_id', tenantId);

      if (invoiceUpdateError) {
        console.error('Failed to update invoice:', invoiceUpdateError);
        return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
      }

      // ✅ THE LEDGER SYNC: Automatically create revenue entry
      const { error: revenueError } = await supabaseAdmin
        .from('revenue')
        .insert([
          {
            tenant_id: tenantId,
            amount: invoice.total_amount,
            category: 'invoice',
            description: `Invoice ${invoiceNumber} - ${invoice.customer_name}`,
            invoice_id: invoiceId,
            invoice_number: invoiceNumber,
            date: new Date().toISOString().split('T')[0],
            notes: `Automatically synced from invoice payment`,
          } as any,
        ]);

      if (revenueError) {
        console.error('Failed to create revenue entry:', revenueError);
        // Don't fail the webhook - invoice is already marked as paid
        // Log error for manual review
      } else {
        console.log(`✅ Invoice ${invoiceNumber} paid and synced to The Ledger as revenue entry`);
      }

      console.log(`Successfully processed invoice payment: ${invoiceNumber}`);
    } else if (type === 'SERVICE_BOOKING' && appointmentId && tenantId) {
      console.log(`Processing confirmed booking: ${appointmentId} for tenant: ${tenantId}`);

      // 3. Update Supabase
      const { error } = await supabaseAdmin
        .from('appointments')
        .update({ 
          status: 'CONFIRMED',
          paid: true,
          stripe_payment_intent: session.payment_intent as string,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .eq('tenantId', tenantId); // Safety check: ensure appointment belongs to tenant

      if (error) {
        console.error('Supabase update failed:', error);
        // We return 500 here so Stripe retries the webhook later
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      console.log(`Successfully confirmed appointment ${appointmentId}`);
    } else if (type === 'PRODUCT_PURCHASE' && tenantId) {
      const itemId = session.metadata?.item_id;
      const customerEmail = session.customer_email || session.customer_details?.email;

      console.log(`Processing product purchase: item ${itemId} for tenant: ${tenantId}`);

      // Fetch product to get details
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', itemId)
        .eq('tenant_id', tenantId)
        .single();

      if (productError || !product) {
        console.error('Product not found:', productError);
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      // Get amount from payment intent
      const paymentIntentId = session.payment_intent as string;
      let amount = 0;
      
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        amount = paymentIntent.amount / 100; // Convert cents to dollars
      } catch (err: any) {
        console.error('Failed to retrieve payment intent:', err);
        // Fallback to product price if available
        amount = typeof product.price === 'number' ? product.price : parseFloat(product.price || '0');
      }

      // Generate receipt number (similar to invoice number format)
      const { count: receiptCount } = await supabaseAdmin
        .from('revenue')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('category', 'direct_sales');

      const nextReceiptNumber = (receiptCount || 0) + 1;
      const receiptNumber = `RCP-${String(nextReceiptNumber).padStart(4, '0')}`;

      // ✅ AUTOMATED RECEIPT: Automatically create revenue entry in The Ledger
      // Extract customer name from payment intent or use email as fallback
      let customerName = 'Customer';
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.shipping?.name) {
          customerName = paymentIntent.shipping.name;
        } else if (paymentIntent.customer) {
          const customer = await stripe.customers.retrieve(paymentIntent.customer as string);
          if (typeof customer !== 'deleted' && customer.name) {
            customerName = customer.name;
          }
        }
      } catch (err: any) {
        console.error('Failed to retrieve customer name:', err);
        // Fallback to email or default
        customerName = customerEmail?.split('@')[0] || 'Customer';
      }

      const { error: revenueError } = await supabaseAdmin
        .from('revenue')
        .insert([
          {
            tenant_id: tenantId,
            amount: amount,
            category: 'direct_sales', // Direct sales revenue for retail/artisan
            description: `Digital Receipt ${receiptNumber} - ${product.name}`,
            date: new Date().toISOString().split('T')[0],
            notes: `Automatically generated receipt for product purchase. Payment Intent: ${paymentIntentId}`,
            invoice_number: receiptNumber, // Store receipt number for reference
            customer_name: customerName,
            customer_email: customerEmail || null,
            product_id: itemId, // Link to product for future reference
            stripe_payment_intent: paymentIntentId,
          } as any,
        ]);

      if (revenueError) {
        console.error('Failed to create revenue entry for product purchase:', revenueError);
        // Don't fail the webhook - payment is already processed
        // Log error for manual review
      } else {
        console.log(`✅ Product purchase processed: Digital Receipt ${receiptNumber} created and synced to The Ledger`);
      }

      console.log(`Successfully processed product purchase for item ${itemId}`);
    } else if (type === 'TERMINAL_PAYMENT' && tenantId) {
      const method = session.metadata?.method || 'unknown';
      const customerName = session.metadata?.customer_name || session.customer_details?.name || 'Customer';
      const customerEmail = session.customer_email || session.customer_details?.email;

      console.log(`Processing terminal payment via ${method} for tenant: ${tenantId}`);

      // Get amount from payment intent
      const paymentIntentId = session.payment_intent as string;
      let amount = 0;
      
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        amount = paymentIntent.amount / 100; // Convert cents to dollars
      } catch (err: any) {
        console.error('Failed to retrieve payment intent:', err);
        return NextResponse.json({ error: 'Failed to retrieve payment details' }, { status: 500 });
      }

      // Generate invoice number
      const { data: invoiceNumberData } = await supabaseAdmin
        .rpc('generate_invoice_number', { p_tenant_id: tenantId })
        .catch(() => ({ data: null }));

      const invoiceNumber = invoiceNumberData || `VTK-${Date.now().toString().slice(-6)}`;

      // ✅ CREATE INVOICE: Automatically create a paid invoice for terminal sale
      const { data: invoice, error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .insert([
          {
            tenant_id: tenantId,
            invoice_number: invoiceNumber,
            customer_name: customerName,
            customer_email: customerEmail || null,
            status: 'paid',
            line_items: [
              {
                description: `Terminal Payment via ${method === 'scan' ? 'QR Code' : method === 'push' ? 'Payment Link' : 'Manual Entry'}`,
                quantity: 1,
                price: amount,
                total: amount,
              },
            ],
            subtotal: amount,
            tax_amount: 0,
            total_amount: amount,
            due_date: new Date().toISOString().split('T')[0],
            paid_at: new Date().toISOString(),
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: paymentIntentId,
          } as any,
        ])
        .select()
        .single();

      if (invoiceError) {
        console.error('Failed to create invoice:', invoiceError);
        return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
      }

      // ✅ THE LEDGER SYNC: Automatically create revenue entry under 'Daily Sales'
      const { error: revenueError } = await supabaseAdmin
        .from('revenue')
        .insert([
          {
            tenant_id: tenantId,
            amount: amount,
            category: 'daily_sales', // Terminal sales go under daily sales
            description: `Terminal Payment - ${customerName} (${method})`,
            date: new Date().toISOString().split('T')[0],
            notes: `Terminal payment via ${method}. Payment Intent: ${paymentIntentId}`,
            invoice_id: invoice.id,
            invoice_number: invoiceNumber,
            customer_name: customerName,
            customer_email: customerEmail || null,
            stripe_payment_intent: paymentIntentId,
          } as any,
        ]);

      if (revenueError) {
        console.error('Failed to create ledger entry:', revenueError);
        // Don't fail the webhook - invoice is already created
      } else {
        console.log(`✅ Terminal payment processed: Invoice ${invoiceNumber} created and synced to The Ledger as daily sales`);
      }

      console.log(`Successfully processed terminal payment via ${method} for tenant ${tenantId}`);
    }
  }

  // 3. Handle account.updated event (when Connect account onboarding completes)
  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account;
    const tenantId = account.metadata?.tenantId;
    const isFoundingMember = account.metadata?.is_founding_member === 'true';

    if (tenantId && account.details_submitted && !isFoundingMember) {
      console.log(`Account onboarding completed for tenant ${tenantId}. Creating subscription schedule...`);
      
      // Trigger subscription creation (non-blocking - we'll handle it asynchronously)
      // In production, you might want to use a queue system or call the API directly here
      try {
        const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
        // Make internal API call to create subscription schedule
        // Note: This is a fire-and-forget approach. For production, consider using a queue.
        fetch(`${baseUrl}/api/stripe/create-subscription-schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId, stripeAccountId: account.id }),
        }).catch(err => {
          console.error('Failed to trigger subscription creation:', err);
          // Log but don't fail the webhook - we can retry later
        });
      } catch (err: any) {
        console.error('Error triggering subscription creation:', err.message);
      }
    } else if (tenantId && account.details_submitted && isFoundingMember) {
      console.log(`🏆 Founding Member account onboarding completed - annual fees waived for tenant ${tenantId}`);
    }
  }

  // 4. Return a 200 response to acknowledge receipt
  return NextResponse.json({ received: true });
}

// Ensure the body isn't parsed by Next.js so we can get the raw string for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};
