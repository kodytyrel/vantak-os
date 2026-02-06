'use client';

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface LineItem {
  description: string;
  quantity: number;
  price: number;
  total: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email?: string;
  status: string;
  line_items: LineItem[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  due_date: string;
  paid_at?: string;
  notes?: string;
  created_at: string;
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

interface InvoicePageClientProps {
  invoice: Invoice;
  tenant: Tenant;
}

export default function InvoicePageClient({ invoice, tenant }: InvoicePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Check if payment was successful
  useEffect(() => {
    const paid = searchParams.get('paid');
    if (paid === 'true') {
      // Show success message and refresh
      alert('✅ Invoice paid successfully! The payment will be synced to The Ledger automatically.');
      // Clean up URL params and refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
    const cancelled = searchParams.get('cancelled');
    if (cancelled === 'true') {
      // Clean up URL params
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  const handlePayInvoice = async () => {
    if (invoice.status === 'paid') {
      alert('This invoice has already been paid.');
      return;
    }

    setIsProcessingPayment(true);
    try {
      // Get tenant slug from URL or use invoice tenant_id to look it up
      const response = await fetch('/api/invoice/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          tenantSlug: tenant.slug,
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
    } catch (err: any) {
      console.error('Payment error:', err);
      alert(`Payment Error: ${err.message || 'Please try again.'}`);
      setIsProcessingPayment(false);
    }
  };

  const dueDate = new Date(invoice.due_date);
  const isOverdue = invoice.status !== 'paid' && dueDate < new Date();
  const invoiceDate = new Date(invoice.created_at);

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
              <p className="text-sm text-slate-600 font-medium mt-1">Invoice</p>
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
              invoice.status === 'paid'
                ? 'bg-emerald-100 text-emerald-700'
                : isOverdue
                ? 'bg-red-100 text-red-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {invoice.status === 'paid' ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
            </div>
          </div>
        </div>
      </header>

      {/* Invoice Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Invoice Header */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-4xl font-black mb-6" style={{ color: tenant.primary_color || '#0f172a' }}>
              Invoice {invoice.invoice_number}
            </h2>
            <div className="space-y-2 text-sm text-slate-600">
              <p><span className="font-semibold">Date:</span> {invoiceDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><span className="font-semibold">Due Date:</span> {dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 mb-4">Bill To</h3>
            <p className="text-lg font-black text-slate-900 mb-2">{invoice.customer_name}</p>
            {invoice.customer_email && (
              <p className="text-sm text-slate-600">{invoice.customer_email}</p>
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
                  <th className="text-right py-4 px-4 text-sm font-black uppercase tracking-widest text-slate-700">Price</th>
                  <th className="text-right py-4 px-4 text-sm font-black uppercase tracking-widest text-slate-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.line_items.map((item, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    <td className="py-4 px-4 text-slate-900 font-medium">{item.description}</td>
                    <td className="py-4 px-4 text-center text-slate-700">{item.quantity}</td>
                    <td className="py-4 px-4 text-right text-slate-700">${item.price.toFixed(2)}</td>
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
                  <span className="text-lg font-black text-slate-900">${invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.tax_amount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-600">Tax</span>
                    <span className="text-lg font-black text-slate-900">${invoice.tax_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t-2 border-slate-300">
                  <span className="text-xl font-black text-slate-900">Total</span>
                  <span className="text-3xl font-black" style={{ color: tenant.primary_color || '#0f172a' }}>
                    ${invoice.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 mb-2">Notes</h3>
            <p className="text-slate-700 font-medium whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}

        {/* Payment Button */}
        {invoice.status !== 'paid' && (
          <div className="bg-gradient-to-br from-white via-white to-slate-50 border-2 border-slate-200 rounded-2xl p-8 shadow-xl">
            <div className="text-center space-y-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Pay Invoice</h3>
                <p className="text-slate-600 font-medium">Secure payment via Stripe Checkout</p>
              </div>

              {/* BNPL Badge - Elite Tier Only */}
              {tenant.tier === 'elite' && (
                <div className="bg-gradient-to-br from-sky-50 to-purple-50 border-2 border-sky-200 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-black text-sky-900 uppercase tracking-widest">Financing Available</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    Get paid in full today. Your customers pay over time. <span className="font-black text-slate-900">Zero risk to you.</span>
                  </p>
                </div>
              )}
              
              <button
                onClick={handlePayInvoice}
                disabled={isProcessingPayment}
                className="w-full md:w-auto min-w-[280px] px-12 py-5 rounded-xl font-black text-lg text-white transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 flex items-center justify-center gap-3 mx-auto"
                style={{ 
                  backgroundColor: tenant.primary_color || '#0f172a',
                }}
              >
                {isProcessingPayment ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Pay ${invoice.total_amount.toFixed(2)}
                  </>
                )}
              </button>
              
              <p className="text-xs text-slate-500 font-medium">
                Apple Pay, Google Pay,{tenant.tier === 'elite' ? ' Klarna, Affirm,' : ''} and all major credit cards accepted
              </p>
            </div>
          </div>
        )}

        {invoice.status === 'paid' && invoice.paid_at && (
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-black text-emerald-900">Invoice Paid</h3>
            </div>
            <p className="text-sm text-emerald-700 font-medium">
              Paid on {new Date(invoice.paid_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        )}

        {/* Business Info Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200 text-center text-sm text-slate-500 space-y-3">
          <p className="font-semibold">{tenant.business_name}</p>
          {tenant.contact_email && <p>{tenant.contact_email}</p>}
          {tenant.contact_phone && <p>{tenant.contact_phone}</p>}
          {tenant.physical_address && <p>{tenant.physical_address}</p>}
          
          {/* VantakOS Branding */}
          <div className="flex items-center justify-center gap-2 pt-4 border-t border-slate-200 mt-4">
            <span className="text-xs text-slate-400 font-medium">Powered by</span>
            <img
              src="/logo.png"
              alt="VantakOS - No more gatekeeping"
              className="h-5 w-auto opacity-60"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

