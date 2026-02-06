import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const { estimateId, sessionId, signature } = await req.json();

    if (!estimateId) {
      return NextResponse.json({ error: 'Missing estimate ID' }, { status: 400 });
    }

    // Fetch estimate with items
    const { data: estimate, error: estimateError } = await supabaseAdmin
      .from('estimates')
      .select('*')
      .eq('id', estimateId)
      .single();

    if (estimateError || !estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    // Fetch estimate items
    const { data: estimateItems, error: itemsError } = await supabaseAdmin
      .from('estimate_items')
      .select('*')
      .eq('estimate_id', estimateId)
      .order('created_at', { ascending: true });

    if (itemsError) {
      return NextResponse.json({ error: 'Failed to fetch estimate items' }, { status: 500 });
    }

    // Fetch customer
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', estimate.customer_id)
      .single();

    // Update estimate status to approved
    const { error: updateError } = await supabaseAdmin
      .from('estimates')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_signature: signature || null,
        stripe_checkout_session_id: sessionId || null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', estimateId);

    if (updateError) {
      console.error('Failed to update estimate:', updateError);
      return NextResponse.json({ error: 'Failed to approve estimate' }, { status: 500 });
    }

    // Generate invoice number
    let invoiceNumber: string;
    try {
      const { data: invoiceNumberData, error: numberError } = await supabaseAdmin
        .rpc('generate_invoice_number', { p_tenant_id: estimate.tenant_id });
      
      if (!numberError && invoiceNumberData) {
        invoiceNumber = invoiceNumberData;
      } else {
        // Fallback: generate manually
        const { data: existingInvoices } = await supabaseAdmin
          .from('invoices')
          .select('invoice_number')
          .eq('tenant_id', estimate.tenant_id)
          .like('invoice_number', 'VTK-%')
          .order('invoice_number', { ascending: false })
          .limit(1);

        if (!existingInvoices || existingInvoices.length === 0) {
          invoiceNumber = 'VTK-1001';
        } else {
          const lastNumber = existingInvoices[0].invoice_number;
          const match = lastNumber.match(/VTK-(\d+)/);
          if (match) {
            const nextNum = parseInt(match[1]) + 1;
            invoiceNumber = `VTK-${String(nextNum).padStart(4, '0')}`;
          } else {
            invoiceNumber = 'VTK-1001';
          }
        }
      }
    } catch (err) {
      invoiceNumber = 'VTK-1001'; // Fallback
    }

    // Calculate amounts
    const subtotal = estimate.subtotal;
    const depositAmount = estimate.deposit_amount || 0;
    const remainingAmount = subtotal - depositAmount;
    const taxAmount = 0; // No tax for now, can be calculated if needed
    const totalAmount = subtotal;

    // Create invoice from estimate
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .insert([
        {
          tenant_id: estimate.tenant_id,
          customer_id: estimate.customer_id,
          estimate_id: estimate.id,
          invoice_number: invoiceNumber,
          customer_name: customer?.name || 'Customer',
          customer_email: customer?.email || null,
          status: depositAmount > 0 ? 'partially_paid' : 'draft',
          line_items: estimateItems.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            price: item.unit_price,
            total: item.total,
          })),
          subtotal: subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          amount_paid: depositAmount,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
          notes: estimate.notes || null,
        } as any,
      ])
      .select()
      .single();

    if (invoiceError) {
      console.error('Failed to create invoice:', invoiceError);
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }

    // Mark estimate as converted
    await supabaseAdmin
      .from('estimates')
      .update({
        status: 'converted',
        converted_at: new Date().toISOString(),
        invoice_id: invoice.id,
      } as any)
      .eq('id', estimateId);

    return NextResponse.json({ 
      success: true,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      message: 'Estimate approved and invoice created successfully',
    });

  } catch (error: any) {
    console.error('Deposit success error:', error);
    return NextResponse.json({ 
      error: 'Failed to process deposit success',
      details: error.message 
    }, { status: 500 });
  }
}

