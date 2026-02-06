'use client';

import React, { useState, useEffect } from 'react';
import { TenantConfig } from '../types';
import { supabase } from '../lib/supabase';

interface InvoiceCreatorProps {
  tenant: TenantConfig;
  onInvoiceCreated: () => void;
}

interface LineItem {
  description: string;
  quantity: number;
  price: number;
  total: number;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  created_at: string;
}

export const InvoiceCreator: React.FC<InvoiceCreatorProps> = ({ tenant, onInvoiceCreated }) => {
  const [customerMode, setCustomerMode] = useState<'select' | 'create'>('select');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, price: 0, total: 0 },
  ]);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [error, setError] = useState('');

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const totalAmount = subtotal + taxAmount;

  // Update line item totals when quantity or price changes
  useEffect(() => {
    setLineItems(items =>
      items.map(item => ({
        ...item,
        total: item.quantity * item.price,
      }))
    );
  }, [lineItems.map(item => `${item.quantity}-${item.price}`).join(',')]);

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, price: 0, total: 0 }]);
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
          if (field === 'quantity' || field === 'price') {
            updated.total = updated.quantity * updated.price;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Validate
    if (!customerName.trim()) {
      setError('Please select or create a customer');
      setIsSubmitting(false);
      return;
    }

    // If creating new customer mode and no customer ID, create customer first
    let customerId = selectedCustomerId;
    if (customerMode === 'create' && !customerId) {
      try {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert([
            {
              tenant_id: tenant.id,
              name: customerName.trim(),
              email: customerEmail.trim() || null,
              phone: customerPhone.trim() || null,
            } as any,
          ])
          .select()
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;
        
        // Add to customers list
        setCustomers([...customers, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err: any) {
        console.error('Customer creation error:', err);
        setError(err.message || 'Failed to create customer. Please try again.');
        setIsSubmitting(false);
        return;
      }
    }

    if (lineItems.some(item => !item.description.trim() || item.quantity <= 0 || item.price <= 0)) {
      setError('Please fill in all line items with valid quantities and prices');
      setIsSubmitting(false);
      return;
    }

    if (!dueDate) {
      setError('Please select a due date');
      setIsSubmitting(false);
      return;
    }

    try {
      // Generate invoice number - try database function first, fallback to manual
      let invoiceNumber: string;
      
      // Try database function first
      const { data: invoiceNumberData, error: numberError } = await supabase
        .rpc('generate_invoice_number', { p_tenant_id: tenant.id });
      
      if (!numberError && invoiceNumberData) {
        invoiceNumber = invoiceNumberData;
      } else {
        // Fallback: generate manually by finding max invoice number
        const { data: existingInvoices, error: fetchError } = await supabase
          .from('invoices')
          .select('invoice_number')
          .eq('tenant_id', tenant.id)
          .like('invoice_number', 'VTK-%')
          .order('invoice_number', { ascending: false })
          .limit(1);

        if (fetchError || !existingInvoices || existingInvoices.length === 0) {
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

      // Create invoice with generated invoice number and customer_id
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([
          {
            tenant_id: tenant.id,
            customer_id: customerId || null,
            invoice_number: invoiceNumber,
            customer_name: customerName.trim(),
            customer_email: customerEmail.trim() || null,
            status: 'draft',
            line_items: lineItems.map(item => ({
              description: item.description.trim(),
              quantity: item.quantity,
              price: item.price,
              total: item.total,
            })),
            subtotal: subtotal,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            due_date: dueDate,
            notes: notes.trim() || null,
          } as any,
        ])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Reset form
      setSelectedCustomerId(null);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setCustomerMode('select');
      setDueDate('');
      setLineItems([{ description: '', quantity: 1, price: 0, total: 0 }]);
      setTaxRate(0);
      setNotes('');
      onInvoiceCreated();

      alert(`Invoice ${invoiceNumber} created successfully!`);
    } catch (err: any) {
      console.error('Invoice creation error:', err);
      setError(err.message || 'Failed to create invoice. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch existing customers
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoadingCustomers(true);
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('id, name, email, phone, created_at')
          .eq('tenant_id', tenant.id)
          .order('name', { ascending: true });

        if (error) throw error;
        setCustomers(data || []);
      } catch (err: any) {
        console.error('Failed to fetch customers:', err);
        setError('Failed to load customers. Please refresh and try again.');
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, [tenant.id]);

  // Handle customer selection - auto-populate name and email
  const handleSelectCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomerId(customerId);
      setCustomerName(customer.name);
      setCustomerEmail(customer.email || '');
      setCustomerPhone(customer.phone || '');
    }
  };

  // Handle creating new customer
  const handleCreateCustomer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!customerName.trim()) {
      setError('Please enter a customer name');
      return;
    }

    setIsCreatingCustomer(true);
    setError('');

    try {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert([
          {
            tenant_id: tenant.id,
            name: customerName.trim(),
            email: customerEmail.trim() || null,
            phone: customerPhone.trim() || null,
          } as any,
        ])
        .select()
        .single();

      if (customerError) throw customerError;

      // Add to customers list and select it
      setCustomers([...customers, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedCustomerId(newCustomer.id);
      setCustomerMode('select');
      
      alert(`Customer "${newCustomer.name}" added to your client list!`);
    } catch (err: any) {
      console.error('Customer creation error:', err);
      setError(err.message || 'Failed to create customer. Please try again.');
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  // Set default due date to 30 days from now
  useEffect(() => {
    if (!dueDate) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      setDueDate(defaultDate.toISOString().split('T')[0]);
    }
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">Create Invoice</h3>
        <p className="text-slate-600 font-medium">Generate professional invoices with automatic numbering.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Customer Selection/Creation */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-black text-slate-900">Customer</h4>
            <div className="flex gap-2 bg-slate-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => {
                  setCustomerMode('select');
                  setSelectedCustomerId(null);
                  setCustomerName('');
                  setCustomerEmail('');
                  setCustomerPhone('');
                }}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  customerMode === 'select'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Select Existing
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomerMode('create');
                  setSelectedCustomerId(null);
                  setCustomerName('');
                  setCustomerEmail('');
                  setCustomerPhone('');
                }}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  customerMode === 'create'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Create New
              </button>
            </div>
          </div>

          {customerMode === 'select' ? (
            <div className="space-y-4">
              {isLoadingCustomers ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-600 font-medium">Loading customers...</p>
                </div>
              ) : customers.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">No customers yet</p>
                  <p className="text-xs text-slate-500 mb-4">Create your first customer to get started</p>
                  <button
                    type="button"
                    onClick={() => setCustomerMode('create')}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold text-sm hover:bg-slate-800 transition-colors"
                  >
                    Create Customer
                  </button>
                </div>
              ) : (
                <>
                  <label className="block text-sm font-black uppercase tracking-widest text-slate-700 mb-2">
                    Select Customer *
                  </label>
                  <select
                    value={selectedCustomerId || ''}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    required
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-6 py-4 text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 font-medium transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="">-- Choose a customer --</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} {customer.email ? `(${customer.email})` : ''}
                      </option>
                    ))}
                  </select>
                  
                  {selectedCustomerId && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-black text-slate-900">{customerName}</p>
                          {customerEmail && (
                            <p className="text-xs text-slate-600 font-medium">{customerEmail}</p>
                          )}
                          {customerPhone && (
                            <p className="text-xs text-slate-600 font-medium">{customerPhone}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomerId(null);
                            setCustomerName('');
                            setCustomerEmail('');
                            setCustomerPhone('');
                          }}
                          className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg font-semibold text-xs hover:bg-slate-50 transition-colors"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-slate-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-white border-2 border-slate-200 rounded-xl px-6 py-4 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 font-medium transition-all shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-slate-700 mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-white border-2 border-slate-200 rounded-xl px-6 py-4 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 font-medium transition-all shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-slate-700 mb-2">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full bg-white border-2 border-slate-200 rounded-xl px-6 py-4 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 font-medium transition-all shadow-sm"
                />
              </div>

              {customerName.trim() && (
                <div className="pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleCreateCustomer}
                    disabled={isCreatingCustomer || !customerName.trim()}
                    className="w-full px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCreatingCustomer ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Adding Customer...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add to Client List
                      </>
                    )}
                  </button>
                  <p className="text-xs text-slate-500 mt-2 text-center font-medium">
                    Customer will be saved to your client list for future invoices
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Line Items */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-black text-slate-900">Line Items</h4>
            <button
              type="button"
              onClick={handleAddLineItem}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold text-sm hover:bg-slate-800 transition-colors"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-4">
            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-end">
                <div className="col-span-4">
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Description</label>
                  <input
                    type="text"
                    required
                    value={item.description}
                    onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                    placeholder="Service or product name"
                    className="w-full bg-white border-2 border-slate-200 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 font-medium transition-all shadow-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Quantity</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border-2 border-slate-200 rounded-lg px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 font-medium transition-all shadow-sm"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Price</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => handleLineItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border-2 border-slate-200 rounded-lg px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 font-medium transition-all shadow-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Total</label>
                  <div className="w-full bg-slate-50 border-2 border-slate-200 rounded-lg px-4 py-3 text-slate-900 font-bold">
                    ${item.total.toFixed(2)}
                  </div>
                </div>
                <div className="col-span-1">
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(index)}
                      className="w-full px-3 py-3 bg-red-100 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-200 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="pt-6 border-t border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-600">Subtotal</span>
              <span className="text-lg font-black text-slate-900">${subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-600 mb-2">Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border-2 border-slate-200 rounded-lg px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 font-medium transition-all shadow-sm"
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center pt-6">
                  <span className="text-sm font-semibold text-slate-600">Tax Amount</span>
                  <span className="text-lg font-black text-slate-900">${taxAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t-2 border-slate-300">
              <span className="text-lg font-black text-slate-900">Total Amount</span>
              <span className="text-2xl font-black text-slate-900">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Due Date & Notes */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6 space-y-6">
          <div>
            <label className="block text-sm font-black uppercase tracking-widest text-slate-700 mb-2">
              Due Date *
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-white border-2 border-slate-200 rounded-xl px-6 py-4 text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 font-medium transition-all shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-black uppercase tracking-widest text-slate-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes for the customer..."
              rows={3}
              className="w-full bg-white border-2 border-slate-200 rounded-xl px-6 py-4 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 font-medium transition-all shadow-sm resize-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-black text-lg transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating Invoice...
              </>
            ) : (
              <>
                Create Invoice
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

