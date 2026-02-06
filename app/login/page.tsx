'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Mail, Lock, ArrowRight } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim() || !password) {
      setError('Please enter your email and password');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (signInError) {
        setError(signInError.message || 'Invalid email or password');
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        setError('Login failed. Please try again.');
        setIsLoading(false);
        return;
      }

      // Query tenants table for matching contact_email
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('slug')
        .eq('contact_email', data.user.email?.toLowerCase() || '')
        .single();

      if (tenantError || !tenant) {
        // No tenant found - redirect to signup
        router.push('/signup');
        return;
      }

      // Tenant found - redirect to dashboard
      router.push(`/dashboard?tenant=${tenant.slug}`);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError('');

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) {
        setError(oauthError.message || 'Google sign-in failed');
        setIsGoogleLoading(false);
      }
      // If successful, user will be redirected to callback
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-block mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200 shadow-sm inline-block">
              <img
                src="/logo.png"
                alt="VantakOS"
                className="h-10 w-auto"
              />
            </div>
          </Link>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-3">
            Welcome back
          </h1>
          <p className="text-slate-600 font-medium">
            Sign in to access your Command Center
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
            className="w-full bg-white hover:bg-slate-50 text-slate-900 py-4 px-6 rounded-xl font-semibold text-base transition-all shadow-sm hover:shadow-md border-2 border-slate-200 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mb-6"
          >
            {isGoogleLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500 font-medium">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white border-2 border-slate-200 rounded-xl pl-12 pr-4 py-4 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 font-medium transition-all"
                  disabled={isLoading || isGoogleLoading}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border-2 border-slate-200 rounded-xl pl-12 pr-4 py-4 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 font-medium transition-all"
                  disabled={isLoading || isGoogleLoading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading || !email.trim() || !password}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-semibold text-base transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600 font-medium">
              Don't have an account?{' '}
              <Link href="/signup" className="text-slate-900 font-semibold hover:text-sky-500 transition-colors">
                Claim Your App
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
