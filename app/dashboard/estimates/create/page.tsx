'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';

interface LineItem {
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

function CreateEstimateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get('tenant');
  
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [requireDeposit, setRequireDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch tenant ID
  useEffect(() => {
    const fetchTenant = async () => {
      if (!tenantSlug) {
        setError('Tenant slug is required');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('id')
          .eq('slug', tenantSlug)
          .single();

        if (error) throw error;
        if (data) {
          setTenantId(data.id);
          await fetchCustomers(data.id);
        }
      } catch (err: any) {
        console.error('Failed to fetch tenant:', err);
        setError('Failed to load tenant data');
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [tenantSlug]);

  // Fetch customers
  const fetchCustomers = async (tid: string) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, phone')
        .eq('tenant_id', tid)
        .order('name', { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err: any) {
      console.error('Failed to fetch customers:', err);
    }
  };

  // Calculate line item totals
  useEffect(() => {
    setLineItems(items =>
      items.map(item => ({
        ...item,
        total: item.quantity * item.unit_price,
      }))
    );
  }, [lineItems.map(item => `${item.quantity}-${item.unit_price}`).join(',')]);

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const handleLineItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    setLineItems(items =>
      items.map((item, i) => {
        if (i === index) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unit_price') {
            updated.total = updated.quantity * updated.unit_price;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const deposit = requireDeposit && depositAmount ? parseFloat(depositAmount) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Validation
    if (!selectedCustomerId) {
      setError('Please select a customer');
      setIsSubmitting(false);
      return;
    }

    if (lineItems.some(item => !item.description.trim() || item.quantity <= 0 || item.unit_price <= 0)) {
      setError('Please fill in all line items with valid values');
      setIsSubmitting(false);
      return;
    }

    if (requireDeposit && (!depositAmount || parseFloat(depositAmount) <= 0)) {
      setError('Please enter a valid deposit amount');
      setIsSubmitting(false);
      return;
    }

    if (requireDeposit && parseFloat(depositAmount) > subtotal) {
      setError('Deposit amount cannot exceed subtotal');
      setIsSubmitting(false);
      return;
    }

    try {
      if (!tenantId) {
        throw new Error('Tenant ID is missing');
      }

      // Create estimate
      const { data: estimate, error: estimateError } = await supabase
        .from('estimates')
        .insert([
          {
            tenant_id: tenantId,
            customer_id: selectedCustomerId,
            notes: notes.trim() || null,
            require_deposit: requireDeposit,
            deposit_amount: requireDeposit ? parseFloat(depositAmount) : null,
            status: 'draft',
            subtotal: subtotal,
          } as any,
        ])
        .select()
        .single();

      if (estimateError) throw estimateError;

      // Create estimate items
      const estimateItems = lineItems.map(item => ({
        estimate_id: estimate.id,
        description: item.description.trim(),
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      }));

      const { error: itemsError } = await supabase
        .from('estimate_items')
        .insert(estimateItems as any);

      if (itemsError) throw itemsError;

      // Redirect back to dashboard
      router.push(`/dashboard?tenant=${tenantSlug}`);
    } catch (err: any) {
      console.error('Failed to create estimate:', err);
      setError(err.message || 'Failed to create estimate. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/dashboard?tenant=${tenantSlug}`)}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-black text-white">New Estimate</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer Selector */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Customer <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
              required
            >
              <option value="">Select a customer...</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} {customer.email ? `(${customer.email})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Line Items */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-slate-300">Line Items</label>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-5">
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Description</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                      placeholder="Service or product name"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Quantity</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                      required
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Unit Price</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => handleLineItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Total</label>
                    <div className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white font-semibold">
                      ${item.total.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800">
              <div className="flex justify-end">
                <div className="text-right">
                  <div className="text-sm text-slate-400 mb-1">Subtotal</div>
                  <div className="text-2xl font-black text-white">${subtotal.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Deposit Toggle */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Require Deposit</label>
                <p className="text-xs text-slate-400">Collect a deposit payment when the estimate is approved</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRequireDeposit(!requireDeposit);
                  if (requireDeposit) setDepositAmount('');
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  requireDeposit ? 'bg-sky-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    requireDeposit ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {requireDeposit && (
              <div className="mt-4">
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Deposit Amount
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={subtotal}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                />
                <p className="text-xs text-slate-400 mt-1">Maximum: ${subtotal.toFixed(2)}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <label className="block text-sm font-semibold text-slate-300 mb-2">Estimate Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Additional notes or terms for this estimate..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push(`/dashboard?tenant=${tenantSlug}`)}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Estimate'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateEstimatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <CreateEstimateForm />
    </Suspense>
  );
}
