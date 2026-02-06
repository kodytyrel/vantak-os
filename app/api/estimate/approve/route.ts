import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const { estimateId, signature, createInvoice } = await req.json();

    if (!estimateId || !signature) {
      return NextResponse.json({ error: 'Missing estimate ID or signature' }, { status: 400 });
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

    if (estimate.status === 'approved' || estimate.status === 'converted') {
      return NextResponse.json({ error: 'Estimate already approved' }, { status: 400 });
    }

    // Fetch estimate items
    const { data: estimateItems } = await supabaseAdmin
      .from('estimate_items')
      .select('*')
      .eq('estimate_id', estimateId)
      .order('created_at', { ascending: true });

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
        approved_signature: signature,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', estimateId);

    if (updateError) {
      console.error('Failed to update estimate:', updateError);
      return NextResponse.json({ error: 'Failed to approve estimate' }, { status: 500 });
    }

    // If createInvoice flag is set, create invoice immediately
    if (createInvoice) {
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
            status: 'draft',
            line_items: (estimateItems || []).map((item: any) => ({
              description: item.description,
              quantity: item.quantity,
              price: item.unit_price,
              total: item.total,
            })),
            subtotal: estimate.subtotal,
            tax_amount: 0,
            total_amount: estimate.subtotal,
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            notes: estimate.notes || null,
          } as any,
        ])
        .select()
        .single();

      if (invoiceError) {
        console.error('Failed to create invoice:', invoiceError);
        // Don't fail the approval if invoice creation fails
      } else {
        // Mark estimate as converted
        await supabaseAdmin
          .from('estimates')
          .update({
            status: 'converted',
            converted_at: new Date().toISOString(),
            invoice_id: invoice.id,
          } as any)
          .eq('id', estimateId);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Estimate approved successfully',
    });

  } catch (error: any) {
    console.error('Estimate approval error:', error);
    return NextResponse.json({ 
      error: 'Failed to approve estimate',
      details: error.message 
    }, { status: 500 });
  }
}
