import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookies().set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookies().delete({ name, ...options });
        },
      },
    });

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Query tenants table for matching contact_email
      const { data: tenant } = await supabase
        .from('tenants')
        .select('slug')
        .eq('contact_email', data.user.email?.toLowerCase() || '')
        .single();

      if (tenant) {
        // Tenant found - redirect to dashboard
        return NextResponse.redirect(new URL(`/dashboard?tenant=${tenant.slug}`, requestUrl.origin));
      } else {
        // No tenant found - redirect to signup
        return NextResponse.redirect(new URL('/signup', requestUrl.origin));
      }
    }
  }

  // If code exchange failed or no code, redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}

