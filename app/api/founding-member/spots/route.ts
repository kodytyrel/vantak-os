import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

// Use service role client for admin access (supabaseServiceRole)
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    const { count, error } = await supabaseServiceRole
      .from("tenants")
      .select("*", { count: "exact", head: true })
      .eq("is_founding_member", true);

    if (error) throw error;

    return NextResponse.json({ spotsRemaining: Math.max(0, 100 - (count || 0)) });
  } catch (err) {
    return NextResponse.json({ spotsRemaining: 100, error: "Count failed" });
  }
}
