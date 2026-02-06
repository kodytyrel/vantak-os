'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Extract parameters from URL
    const sessionId = searchParams.get('session_id');
    const subscription = searchParams.get('subscription');
    const terminal = searchParams.get('terminal');
    const invoiceId = searchParams.get('invoice_id');
    const slug = searchParams.get('slug');
    const tenant = searchParams.get('tenant');
    const tenantId = searchParams.get('tenant_id');
    const recurring = searchParams.get('recurring');
    const type = searchParams.get('type');
    const paid = searchParams.get('paid');

    // Handle different success scenarios
    if (subscription === 'success') {
      // Connectivity fee subscription completed
      console.log(`✅ Connectivity fee subscription completed: ${sessionId}`);
      // Redirect to dashboard with tenant slug
      setTimeout(() => {
        if (tenant) {
          router.push(`/dashboard?tenant=${tenant}&subscription=success&session_id=${sessionId}`);
        } else {
          router.push('/dashboard');
        }
      }, 2000);
    } else if (terminal === 'success') {
      // Terminal payment successful - handled by realtime listener
      console.log(`✅ Terminal payment successful: ${sessionId}`);
      // Redirect back to dashboard
      setTimeout(() => {
        if (tenant) {
          router.push(`/dashboard?tenant=${tenant}&terminal=success`);
        } else if (tenantId) {
          router.push(`/dashboard?terminal=success`);
        } else {
          router.push('/dashboard');
        }
      }, 2000);
    } else if (paid === 'true' && invoiceId) {
      // Invoice payment successful
      console.log(`✅ Invoice payment successful: ${invoiceId}`);
      // Redirect to invoice page or dashboard
      setTimeout(() => {
        router.push(`/invoice/${invoiceId}?paid=true&session_id=${sessionId}`);
      }, 2000);
    } else if (recurring === 'true') {
      // Recurring appointment booking successful
      console.log(`✅ Recurring appointment booking successful: ${sessionId}`);
      setTimeout(() => {
        if (slug) {
          router.push(`/?tenant=${slug}&booking=success&recurring=true`);
        } else {
          router.push('/');
        }
      }, 2000);
    } else {
      // Generic checkout success
      console.log(`✅ Checkout successful: ${sessionId}`);
      setTimeout(() => {
        if (slug || tenant) {
          router.push(`/?tenant=${slug || tenant}&booking=success`);
        } else {
          router.push('/');
        }
      }, 2000);
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-8">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900">Payment Successful!</h1>
          <p className="text-lg text-slate-600 font-medium">Redirecting you back...</p>
        </div>
        <div className="pt-8 border-t border-slate-200">
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

