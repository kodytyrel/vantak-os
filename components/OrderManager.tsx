'use client';

import React, { useState, useEffect } from 'react';
import { TenantConfig } from '../types';
import { supabase } from '../lib/supabase';

interface Order {
  id: string;
  product_id: string;
  product_name: string;
  customer_name: string;
  customer_email?: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at?: string;
  stripe_payment_intent?: string;
}

interface OrderManagerProps {
  tenant: TenantConfig;
}

export const OrderManager: React.FC<OrderManagerProps> = ({ tenant }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      // Fetch revenue entries that are direct sales (product purchases)
      const { data, error } = await supabase
        .from('revenue')
        .select('id, amount, category, description, invoice_number, customer_name, customer_email, product_id, stripe_payment_intent, date, created_at, notes')
        .eq('tenant_id', tenant.id)
        .eq('category', 'direct_sales')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map revenue entries to orders
      // Extract product name from description (format: "Digital Receipt RCP-XXXX - Product Name")
      const ordersData = (data || []).map((rev: any) => {
        const description = rev.description || '';
        // Match pattern: "Digital Receipt RCP-XXXX - Product Name"
        const productNameMatch = description.match(/Digital Receipt\s+\S+\s+-\s+(.+)$/);
        const productName = productNameMatch ? productNameMatch[1].trim() : 
                          (description.includes(' - ') ? description.split(' - ').pop()?.trim() : 'Product') || 'Product';
        
        return {
          id: rev.id,
          product_id: rev.product_id || '',
          product_name: productName,
          customer_name: rev.customer_name || 'Customer',
          customer_email: rev.customer_email || '',
          amount: rev.amount,
          status: 'completed', // Product purchases are always completed (paid)
          created_at: rev.created_at,
          paid_at: rev.date || rev.created_at,
          stripe_payment_intent: rev.stripe_payment_intent || '',
        };
      });

      setOrders(ordersData);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [tenant.id]);

  // Calculate statistics
  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.amount, 0);
  const totalOrders = orders.length;

  // Filter orders based on status
  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Orders</h2>
          <p className="text-slate-600 font-medium">View and track product purchases and digital receipts.</p>
        </div>
      </div>

      {/* Order Summary Chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Total Revenue</span>
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 mb-2">${totalRevenue.toFixed(2)}</div>
          <div className="text-sm font-semibold text-emerald-600">{totalOrders} orders</div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Completed</span>
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 mb-2">{completedOrders.length}</div>
          <div className="text-sm font-semibold text-emerald-600">orders</div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Average Order</span>
            <div className="w-3 h-3 rounded-full bg-sky-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 mb-2">
            ${totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00'}
          </div>
          <div className="text-sm font-semibold text-sky-600">per order</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-2 inline-flex gap-2">
        {(['all', 'completed', 'pending'] as const).map((status) => (
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

      {/* Order List */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium mb-2">No orders yet</p>
          <p className="text-sm text-slate-500">Orders will appear here when customers purchase products</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 flex-1">
                  <div className="flex-shrink-0">
                    <div className="px-3 py-1 rounded-lg border font-black text-xs uppercase tracking-wider bg-emerald-100 text-emerald-700 border-emerald-200">
                      Completed
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-xl font-black text-slate-900 truncate">{order.product_name}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span className="font-semibold">{order.customer_name}</span>
                      {order.customer_email && (
                        <>
                          <span>•</span>
                          <span className="truncate">{order.customer_email}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{formatDate(order.created_at)}</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-black text-slate-900 mb-1">${order.amount.toFixed(2)}</div>
                    <p className="text-xs font-semibold text-slate-500">Digital Receipt</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

