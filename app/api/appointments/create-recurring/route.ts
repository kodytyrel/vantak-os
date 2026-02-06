import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tenantId,
      serviceId,
      startDate,
      startTime,
      recurringPattern,
      endDate,
      customerEmail,
      subscribeToNewsletter,
      slug
    } = body;

    // Validate input
    if (!tenantId || !serviceId || !startDate || !startTime || !endDate || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Get tenant and service info
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, stripe_account_id, platform_fee_percent, business_name, tier')
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
        { error: 'Merchant has not linked a bank account' },
        { status: 400 }
      );
    }

    // Get service details - try to fetch from services table, or use MOCK_SERVICES
    let servicePrice = 50;
    let serviceDuration = 30;
    
    // Try to fetch from services table first
    const { data: serviceData } = await supabaseAdmin
      .from('services')
      .select('price, duration_minutes')
      .eq('id', serviceId)
      .eq('tenant_id', tenantId)
      .single();
    
    if (serviceData) {
      servicePrice = (serviceData.price || 0) / 100; // Convert cents to dollars
      serviceDuration = serviceData.duration_minutes || 30;
    } else {
      // Fallback: import MOCK_SERVICES (for development)
      // In production, services should always be in the database
      const { MOCK_SERVICES } = await import('@/constants');
      const services = MOCK_SERVICES[tenantId] || [];
      const service = services.find(s => s.id === serviceId);
      if (service) {
        servicePrice = service.price;
        serviceDuration = service.durationMinutes;
      }
    }

    // 2. Calculate all appointment dates
    const appointments: Array<{ startTime: string; endTime: string }> = [];
    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(endDate);
    const recurringGroupId = crypto.randomUUID();

    let currentDate = new Date(start);
    while (currentDate <= end) {
      const appointmentStart = new Date(currentDate);
      const appointmentEnd = new Date(appointmentStart);
      appointmentEnd.setMinutes(appointmentEnd.getMinutes() + serviceDuration);

      appointments.push({
        startTime: appointmentStart.toISOString(),
        endTime: appointmentEnd.toISOString()
      });

      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7);
    }

    if (appointments.length === 0) {
      return NextResponse.json(
        { error: 'No appointments to create' },
        { status: 400 }
      );
    }

    // 3. Create all appointments in database (all PENDING)
    const appointmentsToInsert = appointments.map((apt, index) => ({
      tenantId,
      serviceId,
      startTime: apt.startTime,
      endTime: apt.endTime,
      status: 'PENDING',
      paid: false,
      customer_email: customerEmail || 'guest@example.com',
      is_recurring: true,
      recurring_pattern: recurringPattern,
      recurring_end_date: endDate,
      recurring_group_id: recurringGroupId,
      parent_appointment_id: index === 0 ? null : undefined // First one is parent
    }));

    const { data: createdAppointments, error: insertError } = await supabaseAdmin
      .from('appointments')
      .insert(appointmentsToInsert)
      .select();

    if (insertError || !createdAppointments || createdAppointments.length === 0) {
      console.error('Error creating appointments:', insertError);
      return NextResponse.json(
        { error: 'Failed to create appointments' },
        { status: 500 }
      );
    }

    // Update parent_appointment_id for all child appointments
    const parentId = createdAppointments[0].id;
    if (createdAppointments.length > 1) {
      await supabaseAdmin
        .from('appointments')
        .update({ parent_appointment_id: parentId })
        .in('id', createdAppointments.slice(1).map(a => a.id));
    }

    // 4. Create Stripe checkout session for the first appointment
    const amountCents = Math.round(servicePrice * 100);
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
              name: `Recurring ${recurringPattern} appointment`,
              description: `${appointments.length} appointments with ${tenant.business_name}`,
              metadata: {
                tenant_id: tenant.id,
                recurring_group_id: recurringGroupId,
                appointment_count: appointments.length.toString()
              }
            },
            unit_amount: amountCents,
          },
          quantity: appointments.length, // Charge for all appointments upfront
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount * appointments.length,
        transfer_data: {
          destination: tenant.stripe_account_id,
        },
        metadata: {
          tenant_id: tenant.id,
          recurring_group_id: recurringGroupId,
          appointment_count: appointments.length.toString(),
          type: 'RECURRING_BOOKING',
          engine: 'VantakOS-Recurring-v1'
        },
      },
      success_url: `https://vantakos.com/dashboard/success?session_id={CHECKOUT_SESSION_ID}&slug=${slug}&recurring=true`,
      cancel_url: `https://vantakos.com/dashboard?tenant=${slug}`,
    });

    return NextResponse.json({
      success: true,
      appointmentCount: appointments.length,
      recurringGroupId,
      checkoutUrl: session.url
    });

  } catch (error: any) {
    console.error('Error creating recurring appointments:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

