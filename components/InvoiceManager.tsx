'use client';

import React, { useState, useEffect } from 'react';
import { TenantConfig } from '../types';
import { supabase } from '../lib/supabase';
import { InvoiceCreator } from './InvoiceCreator';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email?: string;
  status: string;
  total_amount: number;
  due_date: string;
  paid_at?: string;
  created_at: string;
}

interface InvoiceManagerProps {
  tenant: TenantConfig;
}

export const InvoiceManager: React.FC<InvoiceManagerProps> = ({ tenant }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'list' | 'create'>('list');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all');

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (err: any) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [tenant.id]);

  // Calculate statistics
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const overdueInvoices = invoices.filter(inv => {
    if (inv.status === 'paid' || inv.status === 'draft') return false;
    const dueDate = new Date(inv.due_date);
    return dueDate < new Date();
  });
  const pendingInvoices = invoices.filter(inv => inv.status === 'sent' || inv.status === 'draft');

  const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);

  // Filter invoices based on status
  const filteredInvoices = invoices.filter(inv => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'overdue') {
      if (inv.status === 'paid' || inv.status === 'draft') return false;
      const dueDate = new Date(inv.due_date);
      return dueDate < new Date();
    }
    return inv.status === filterStatus;
  });

  const getInvoiceStatusColor = (invoice: Invoice) => {
    if (invoice.status === 'paid') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    const dueDate = new Date(invoice.due_date);
    if (dueDate < new Date() && invoice.status !== 'paid') {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    if (invoice.status === 'sent') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getInvoiceStatusLabel = (invoice: Invoice) => {
    if (invoice.status === 'paid') return 'Paid';
    const dueDate = new Date(invoice.due_date);
    if (dueDate < new Date() && invoice.status !== 'paid') {
      return 'Overdue';
    }
    if (invoice.status === 'sent') return 'Pending';
    return 'Draft';
  };

  const handleShareInvoice = (invoiceId: string) => {
    const invoiceUrl = `https://vantakos.com/invoice/${invoiceId}`;
    navigator.clipboard.writeText(invoiceUrl);
    alert('Invoice link copied to clipboard!');
  };

  if (activeView === 'create') {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActiveView('list')}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-900 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            ← Back to Invoices
          </button>
        </div>
        <InvoiceCreator tenant={tenant} onInvoiceCreated={() => { fetchInvoices(); setActiveView('list'); }} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Invoice Engine</h2>
          <p className="text-slate-600 font-medium">Create, send, and track professional invoices.</p>
        </div>
        <button
          onClick={() => setActiveView('create')}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Create Invoice
        </button>
      </div>

      {/* Income Summary Chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Paid</span>
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 mb-2">${totalPaid.toFixed(2)}</div>
          <div className="text-sm font-semibold text-emerald-600">{paidInvoices.length} invoices</div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Pending</span>
            <div className="w-3 h-3 rounded-full bg-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 mb-2">${totalPending.toFixed(2)}</div>
          <div className="text-sm font-semibold text-amber-600">{pendingInvoices.length} invoices</div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Overdue</span>
            <div className="w-3 h-3 rounded-full bg-red-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 mb-2">${totalOverdue.toFixed(2)}</div>
          <div className="text-sm font-semibold text-red-600">{overdueInvoices.length} invoices</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-2 inline-flex gap-2">
        {(['all', 'draft', 'sent', 'paid', 'overdue'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all capitalize ${
              filterStatus === status
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading invoices...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-20 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium mb-2">No invoices found</p>
          <p className="text-sm text-slate-500">Create your first invoice to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => {
            const dueDate = new Date(invoice.due_date);
            const isOverdue = dueDate < new Date() && invoice.status !== 'paid';

            return (
              <div
                key={invoice.id}
                className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 flex-1">
                    <div className="flex-shrink-0">
                      <div className={`px-3 py-1 rounded-lg border font-black text-xs uppercase tracking-wider ${getInvoiceStatusColor(invoice)}`}>
                        {getInvoiceStatusLabel(invoice)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-xl font-black text-slate-900">{invoice.invoice_number}</h3>
                        <span className="text-sm text-slate-500">•</span>
                        <p className="text-base font-semibold text-slate-900 truncate">{invoice.customer_name}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span>Due: {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        {invoice.customer_email && (
                          <>
                            <span>•</span>
                            <span className="truncate">{invoice.customer_email}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-black text-slate-900 mb-1">${invoice.total_amount.toFixed(2)}</div>
                      <p className="text-xs font-semibold text-slate-500">
                        {new Date(invoice.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-6">
                    <button
                      onClick={() => handleShareInvoice(invoice.id)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-colors"
                    >
                      Share
                    </button>
                    <a
                      href={`/invoice/${invoice.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold text-sm hover:bg-slate-800 transition-colors"
                    >
                      View
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

