import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role client for admin access (supabaseServiceRole)
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, business_name, owner_id } = body;

    // ONLY validate slug and business_name - this is tenant creation, not checkout
    if (!slug) {
      return NextResponse.json(
        { error: "Missing slug" },
        { status: 400 }
      );
    }

    if (!business_name) {
      return NextResponse.json(
        { error: "Missing business name" },
        { status: 400 }
      );
    }

    // Check if Pioneer spots are available (first 100)
    // This check happens BEFORE insert to determine if this tenant qualifies
    const { count: pioneerCount } = await supabaseServiceRole
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('is_founding_member', true);

    // If there are still spots (< 100), this tenant is a Pioneer
    const spotsRemaining = Math.max(0, 100 - (pioneerCount || 0));
    const isPioneer = spotsRemaining > 0;

    // Extract challenge fields from request body
    const challengeType = body.challenge_type || 'starter';
    const depositPaid = parseFloat(body.deposit_paid || '0');
    const challengeStatus = body.challenge_status || (isPioneer && depositPaid === 0 ? 'waived' : 'active');

    // 1. Perform the insert using the Service Role Client
    const { data: tenant, error } = await supabaseServiceRole
      .from('tenants')
      .insert([{
        business_name: body.business_name,
        slug: body.slug,
        business_type: body.business_type || "service",
        primary_color: body.primary_color || "#0f172a",
        secondary_color: body.secondary_color || "#64748b",
        accent_color: body.accent_color || "#f8fafc",
        logo_url: body.logo_url,
        tier: body.tier || "starter",
        platform_fee_percent: 1.5,
        is_founding_member: isPioneer,
        is_pioneer: isPioneer,
        deposit_status: isPioneer && depositPaid === 0 ? 'waived' : 'pending',
        deposit_amount_paid: depositPaid,
        challenge_type: challengeType,
        deposit_paid: depositPaid,
        challenge_status: challengeStatus,
        contact_email: body.contact_email,
        contact_phone: body.contact_phone,
        physical_address: body.physical_address || null,
        hours_of_operation: body.hours_of_operation || {},
        owner_id: owner_id || null, // Link to authenticated user
        is_demo: false
      }])
      .select() // This asks for the data back
      .single(); // This asks for exactly one object

    // 2. THE CRITICAL FIX: If 'tenant' is null but there is no 'error', 
    // it means the insert worked but the select failed. 
    // We manually construct the response so the frontend can move forward.
    if (error) {
      console.error("DB Error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const responseData = tenant || { slug: body.slug, business_name: body.business_name };

    console.log("Tenant Created Successfully:", responseData.slug);
    return NextResponse.json(responseData);
    
  } catch (err) {
    console.error("Critical API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
