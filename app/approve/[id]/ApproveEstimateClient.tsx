'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface EstimateItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Estimate {
  id: string;
  tenant_id: string;
  customer_id: string;
  notes?: string;
  require_deposit: boolean;
  deposit_amount?: number;
  status: string;
  subtotal: number;
  created_at: string;
  items: EstimateItem[];
  customer: Customer | null;
}

interface Tenant {
  id: string;
  business_name: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  contact_email?: string;
  contact_phone?: string;
  physical_address?: string;
  slug: string;
  tier?: string;
}

interface ApproveEstimateClientProps {
  estimate: Estimate;
  tenant: Tenant;
}

export default function ApproveEstimateClient({ estimate, tenant }: ApproveEstimateClientProps) {
  const router = useRouter();
  const [signature, setSignature] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  
  // Check if returning from successful payment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paid = urlParams.get('paid');
    const sessionId = urlParams.get('session_id');
    
    if (paid === 'true' && sessionId) {
      // Retrieve signature from sessionStorage
      const savedSignature = sessionStorage.getItem(`estimate_signature_${estimate.id}`);
      
      // Call deposit success handler
      fetch('/api/estimate/deposit-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estimateId: estimate.id,
          sessionId: sessionId,
          signature: savedSignature || '',
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert('✅ Deposit received! Estimate approved and invoice created.');
            // Clean up URL and sessionStorage
            sessionStorage.removeItem(`estimate_signature_${estimate.id}`);
            window.history.replaceState({}, '', window.location.pathname);
            window.location.reload();
          } else {
            alert(`Error: ${data.error || 'Failed to process deposit'}`);
          }
        })
        .catch(err => {
          console.error('Deposit success error:', err);
          alert('Error processing deposit. Please contact support.');
        });
    }
  }, [estimate.id]);

  const handleApprove = async () => {
    if (!signature.trim()) {
      setError('Please provide your signature');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      if (estimate.require_deposit && estimate.deposit_amount) {
        // Save signature to sessionStorage before redirect
        sessionStorage.setItem(`estimate_signature_${estimate.id}`, signature.trim());
        
        // Create Stripe checkout session for deposit
        const response = await fetch('/api/estimate/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            estimateId: estimate.id,
            tenantSlug: tenant.slug,
            depositAmount: estimate.deposit_amount,
            customerEmail: estimate.customer?.email,
          }),
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL returned');
        }
      } else {
        // No deposit required - just approve the estimate and create invoice
        const response = await fetch('/api/estimate/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            estimateId: estimate.id,
            signature: signature.trim(),
            createInvoice: true,
          }),
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        // Show success message
        alert('✅ Estimate approved successfully! An invoice has been created.');
        // Optionally redirect or refresh
        window.location.reload();
      }
    } catch (err: any) {
      console.error('Approval error:', err);
      setError(err.message || 'Failed to approve estimate. Please try again.');
      setIsProcessing(false);
    }
  };

  const estimateDate = new Date(estimate.created_at);
  const isApproved = estimate.status === 'approved' || estimate.status === 'converted';

  return (
    <div className="min-h-screen bg-white" style={{ backgroundColor: tenant.secondary_color || '#ffffff' }}>
      {/* Header with Branding */}
      <header className="border-b border-slate-200 py-8 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {tenant.logo_url && (
              <img
                src={tenant.logo_url}
                alt={tenant.business_name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-black" style={{ color: tenant.primary_color || '#0f172a' }}>
                {tenant.business_name}
              </h1>
              <p className="text-sm text-slate-600 font-medium mt-1">Estimate</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {/* VantakOS Logo */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Powered by</span>
              <img
                src="/logo.png"
                alt="VantakOS - No more gatekeeping"
                className="h-6 w-auto opacity-60"
              />
            </div>
            {/* Status Badge */}
            <div className={`px-4 py-2 rounded-lg font-black text-sm ${
              isApproved
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {isApproved ? 'Approved' : 'Pending Approval'}
            </div>
          </div>
        </div>
      </header>

      {/* Estimate Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Estimate Header */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-4xl font-black mb-6" style={{ color: tenant.primary_color || '#0f172a' }}>
              Estimate
            </h2>
            <div className="space-y-2 text-sm text-slate-600">
              <p><span className="font-semibold">Date:</span> {estimateDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 mb-4">Bill To</h3>
            <p className="text-lg font-black text-slate-900 mb-2">{estimate.customer?.name || 'Customer'}</p>
            {estimate.customer?.email && (
              <p className="text-sm text-slate-600">{estimate.customer.email}</p>
            )}
            {estimate.customer?.phone && (
              <p className="text-sm text-slate-600">{estimate.customer.phone}</p>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-8 mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-300">
                  <th className="text-left py-4 px-4 text-sm font-black uppercase tracking-widest text-slate-700">Description</th>
                  <th className="text-center py-4 px-4 text-sm font-black uppercase tracking-widest text-slate-700">Quantity</th>
                  <th className="text-right py-4 px-4 text-sm font-black uppercase tracking-widest text-slate-700">Unit Price</th>
                  <th className="text-right py-4 px-4 text-sm font-black uppercase tracking-widest text-slate-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {estimate.items.map((item, index) => (
                  <tr key={item.id || index} className="border-b border-slate-100">
                    <td className="py-4 px-4 text-slate-900 font-medium">{item.description}</td>
                    <td className="py-4 px-4 text-center text-slate-700">{item.quantity}</td>
                    <td className="py-4 px-4 text-right text-slate-700">${item.unit_price.toFixed(2)}</td>
                    <td className="py-4 px-4 text-right text-slate-900 font-black">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-8 pt-8 border-t-2 border-slate-300 space-y-3">
            <div className="flex justify-end">
              <div className="w-64 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-600">Subtotal</span>
                  <span className="text-lg font-black text-slate-900">${estimate.subtotal.toFixed(2)}</span>
                </div>
                {estimate.require_deposit && estimate.deposit_amount && (
                  <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                    <span className="text-sm font-semibold text-slate-600">Deposit Required</span>
                    <span className="text-lg font-black text-sky-600">${estimate.deposit_amount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {estimate.notes && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 mb-2">Notes</h3>
            <p className="text-slate-700 font-medium whitespace-pre-line">{estimate.notes}</p>
          </div>
        )}

        {/* Approval Section - Only show if not already approved */}
        {!isApproved && (
          <div className="bg-gradient-to-br from-white via-white to-slate-50 border-2 border-slate-200 rounded-2xl p-8 shadow-xl">
            <div className="space-y-8">
              {/* Signature Section */}
              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-slate-700 mb-4">
                  Signature <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Type your full name to approve"
                  className="w-full bg-white border-2 border-slate-300 rounded-lg px-4 py-4 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-medium text-lg"
                />
                <p className="text-xs text-slate-500 mt-2">By signing, you approve this estimate and agree to the terms</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Approve Button */}
              <button
                onClick={handleApprove}
                disabled={isProcessing || !signature.trim()}
                className="w-full py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl font-black text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                style={{
                  background: estimate.require_deposit && estimate.deposit_amount
                    ? `linear-gradient(to right, ${tenant.primary_color || '#0ea5e9'}, ${tenant.primary_color || '#0ea5e9'})`
                    : undefined
                }}
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : estimate.require_deposit && estimate.deposit_amount ? (
                  <>
                    Approve & Pay Deposit (${estimate.deposit_amount.toFixed(2)})
                  </>
                ) : (
                  'Approve Estimate'
                )}
              </button>

              {estimate.require_deposit && estimate.deposit_amount && (
                <p className="text-center text-xs text-slate-500">
                  Secure payment via Stripe Checkout. The remaining balance will be invoiced separately.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Already Approved Message */}
        {isApproved && (
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-emerald-900 mb-2">Estimate Approved</h3>
            <p className="text-emerald-700 font-medium">
              {estimate.require_deposit && estimate.deposit_amount
                ? 'Deposit payment received. An invoice will be created for the remaining balance.'
                : 'This estimate has been approved and will be converted to an invoice.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
