'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { TheLedger } from '@/components/TaxVault';
import { VantakTerminal } from '@/components/VantakTerminal';
import { PaymentReceivedOverlay } from '@/components/PaymentReceivedOverlay';
import { InvoiceCreator } from '@/components/InvoiceCreator';
import { TenantConfig } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { hasBusinessSuiteAccess } from '@/lib/tierGating';
import { UpgradeModal } from '@/components/UpgradeModal';

function DashboardContent() {
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get('tenant');
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState<'overview' | 'kpi-dashboard' | 'ledger' | 'terminal' | 'settings'>('overview');
  
  // Data state
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingInvoices, setPendingInvoices] = useState(0);
  const [challengeProgress, setChallengeProgress] = useState({ current: 0, target: 100, percentage: 0 });
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  
  // Modal state
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [showInvoiceCreator, setShowInvoiceCreator] = useState(false);
  const [showEstimateCreator, setShowEstimateCreator] = useState(false);
  const [showPaymentReceived, setShowPaymentReceived] = useState(false);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);
  const [installTab, setInstallTab] = useState<'ios' | 'android'>('ios');
  const [paymentData, setPaymentData] = useState<{ amount: number; invoiceNumber?: string; customerName?: string } | null>(null);
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  
  // Settings state
  const [editingBranding, setEditingBranding] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0ea5e9');
  const [secondaryColor, setSecondaryColor] = useState('#ffffff');
  
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('dashboard-theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-theme', theme);
    }
  }, [theme]);
  
  const dashboardChannelRef = useRef<any>(null);
  const autoResetTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!tenantSlug) {
      setError('Missing tenant parameter');
      setLoading(false);
      return;
    }

    const fetchTenant = async () => {
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('slug', tenantSlug)
          .single();

        if (error || !data) {
          setError('Business not found');
          setLoading(false);
          return;
        }

        // Map to TenantConfig format
        const tenantData: TenantConfig = {
          id: data.id,
          slug: data.slug,
          name: data.business_name,
          logoUrl: data.logo_url || '',
          primaryColor: data.primary_color || '#0ea5e9',
          secondaryColor: data.secondary_color || '#ffffff',
          accentColor: data.accent_color || '#f8fafc',
          fontFamily: data.font_family || 'sans-serif',
          contactEmail: data.contact_email || '',
          contactPhone: data.contact_phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          timezone: data.timezone || 'UTC',
          stripeConnectedId: data.stripe_account_id,
          tier: data.tier || 'starter',
          platform_fee_percent: parseFloat(data.platform_fee_percent) || 1.5,
          monthly_subscription_fee: 0,
          is_demo: data.is_demo || false,
          business_type: data.business_type || 'service',
          background_image_url: data.background_image_url || null,
          is_founding_member: data.is_founding_member || false,
          founding_member_number: data.founding_member_number || null,
          seo: {
            title: `${data.business_name} | Owner Command Center`,
            description: `Manage your ${data.business_name} business`
          },
          features: data.features || {
            enableBooking: true,
            enableShop: data.enable_shop || false,
            enableGallery: true
          }
        } as any;

        setTenant(tenantData);
        setBusinessName(data.business_name);
        setPrimaryColor(data.primary_color || '#0ea5e9');
        setSecondaryColor(data.secondary_color || '#ffffff');
        
        // Fetch dashboard data
        await fetchDashboardData(data.id, data);
        
        // Set up realtime listener for payment success "ding"
        if (data.id) {
          const channel = supabase.channel(`dashboard-${data.id}`)
            .on('postgres_changes', {
              event: 'UPDATE',
              schema: 'public',
              table: 'invoices',
              filter: `tenant_id=eq.${data.id}`
            }, (payload) => {
              const newRecord = payload.new as any;
              const oldRecord = payload.old as any;
              
              if (newRecord.status === 'paid' && oldRecord.status !== 'paid') {
                console.log('✅ Payment received via realtime (Dashboard):', newRecord);
                
                if (autoResetTimerRef.current) {
                  clearTimeout(autoResetTimerRef.current);
                }
                
                setPaymentData({
                  amount: parseFloat(newRecord.total_amount || newRecord.amount || '0'),
                  invoiceNumber: newRecord.invoice_number,
                  customerName: newRecord.customer_name,
                });
                setShowPaymentReceived(true);
                
                autoResetTimerRef.current = setTimeout(() => {
                  setShowPaymentReceived(false);
                  setPaymentData(null);
                  autoResetTimerRef.current = null;
                }, 4000);
              }
            })
            .subscribe();
            
          dashboardChannelRef.current = channel;
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load business information');
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
    
    return () => {
      if (dashboardChannelRef.current) {
        supabase.removeChannel(dashboardChannelRef.current);
      }
      if (autoResetTimerRef.current) {
        clearTimeout(autoResetTimerRef.current);
      }
    };
  }, [tenantSlug]);

  const fetchDashboardData = async (tenantId: string, tenantData: any) => {
    try {
      // Fetch invoices for revenue and pending count
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('tenant_id', tenantId);

      let revenue = 0;
      if (invoices) {
        // Calculate total revenue (paid invoices)
        const paidInvoices = invoices.filter(inv => inv.status === 'paid');
        revenue = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || inv.amount || '0'), 0);
        setTotalRevenue(revenue);

        // Count pending invoices
        const pending = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'draft').length;
        setPendingInvoices(pending);

        // Get 5 most recent transactions (paid invoices)
        const recent = paidInvoices
          .sort((a, b) => new Date(b.paid_at || b.created_at).getTime() - new Date(a.paid_at || a.created_at).getTime())
          .slice(0, 5);
        setRecentTransactions(recent);
      }

      // Calculate challenge progress
      const challengeTarget = tenantData.challenge_type === 'elite' ? 250 : 100;
      const currentAmount = revenue || 0;
      const percentage = Math.min(100, (currentAmount / challengeTarget) * 100);
      setChallengeProgress({
        current: currentAmount,
        target: challengeTarget,
        percentage
      });

      // Fetch upcoming appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('tenantId', tenantId)
        .gte('startTime', new Date().toISOString())
        .order('startTime', { ascending: true })
        .limit(5);

      if (appointments) {
        setUpcomingAppointments(appointments);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentReceived(true);
    if (tenant) {
      fetchDashboardData(tenant.id, tenant);
    }
  };

  const handleSaveBranding = async () => {
    if (!tenant) return;
    
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          business_name: businessName,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
        })
        .eq('id', tenant.id);

      if (error) throw error;

      // Update local tenant state
      setTenant({
        ...tenant,
        name: businessName,
        primaryColor,
        secondaryColor,
      });
      
      setEditingBranding(false);
      alert('Branding updated successfully!');
    } catch (err: any) {
      alert(`Failed to update branding: ${err.message}`);
    }
  };

  const copyAppUrl = () => {
    const url = `https://vantakos.com/${tenant?.slug}`;
    navigator.clipboard.writeText(url);
    alert('App URL copied to clipboard!');
  };

  const handleConnectStripe = async () => {
    if (!tenant) return;
    setIsConnectingStripe(true);
    try {
      const res = await fetch('/api/stripe/enable-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenant.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(`Failed to connect Stripe: ${data.error}`);
        setIsConnectingStripe(false);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect Stripe. Please try again.');
      setIsConnectingStripe(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Loading Command Center...</p>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-8">
          <h1 className="text-2xl font-black text-white">Command Center Unavailable</h1>
          <p className="text-slate-400">{error || 'The business dashboard could not be loaded.'}</p>
          <a href="/signup" className="inline-block px-6 py-3 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-all shadow-lg">
            Create Your Business
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${theme === 'dark' ? 'bg-slate-950' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors ${
        theme === 'dark' 
          ? 'bg-slate-950/80 border-slate-800/50' 
          : 'bg-white/80 border-slate-200/50'
      }`}>
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-sky-500/20">
                V
              </div>
              <div>
                <h1 className={`text-xl font-black tracking-tight transition-colors ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  {tenant.name}
                </h1>
                <p className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Owner Command Center
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className={`flex items-center gap-2 rounded-xl p-1 backdrop-blur-sm border transition-colors ${
                theme === 'dark' 
                  ? 'bg-slate-900/50 border-slate-800' 
                  : 'bg-slate-100 border-slate-200'
              }`}>
                <button
                  onClick={() => setActiveView('overview')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeView === 'overview'
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                      : theme === 'dark' 
                        ? 'text-slate-400 hover:text-white' 
                        : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveView('kpi-dashboard')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeView === 'kpi-dashboard'
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                      : theme === 'dark' 
                        ? 'text-slate-400 hover:text-white' 
                        : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  KPI Dashboard
                </button>
                <button
                  onClick={() => setActiveView('ledger')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeView === 'ledger'
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                      : theme === 'dark' 
                        ? 'text-slate-400 hover:text-white' 
                        : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Ledger
                </button>
                <button
                  onClick={() => setActiveView('settings')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeView === 'settings'
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                      : theme === 'dark' 
                        ? 'text-slate-400 hover:text-white' 
                        : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Settings
                </button>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={async () => {
                  try {
                    const { error } = await supabase.auth.signOut();
                    if (error) {
                      console.error('Error signing out:', error);
                      alert('Failed to sign out. Please try again.');
                    } else {
                      // Redirect to login page after successful logout
                      window.location.href = '/login';
                    }
                  } catch (err) {
                    console.error('Unexpected error during sign out:', err);
                    alert('An unexpected error occurred. Please try again.');
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-semibold transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900'
                }`}
                title="Log out of your dashboard"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Log Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {activeView === 'kpi-dashboard' && (
          <div className="space-y-6">
            {/* KPI Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Revenue */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-slate-900 to-slate-800 border border-sky-500/20 rounded-2xl p-6 shadow-xl shadow-sky-500/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</h3>
                  <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-4xl font-black text-white mb-1">${totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-slate-400">All-time successful charges</p>
              </motion.div>

              {/* Pending Invoices */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-slate-900 to-slate-800 border border-sky-500/20 rounded-2xl p-6 shadow-xl shadow-sky-500/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Pending Invoices</h3>
                  <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-4xl font-black text-white mb-1">{pendingInvoices}</p>
                <p className="text-xs text-slate-400">Awaiting payment</p>
              </motion.div>

              {/* Challenge Progress */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-slate-900 to-slate-800 border border-sky-500/20 rounded-2xl p-6 shadow-xl shadow-sky-500/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Challenge Progress</h3>
                  <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-black text-white mb-2">
                  ${challengeProgress.current.toFixed(2)} / ${challengeProgress.target}
                </p>
                <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                  <div
                    className="bg-gradient-to-r from-sky-500 to-sky-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${challengeProgress.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">{challengeProgress.percentage.toFixed(1)}% to activation refund</p>
              </motion.div>
            </div>
          </div>
        )}

        {activeView === 'overview' && (
          <div className="space-y-8">
            {/* Stripe Connection Banner - Show if not connected */}
            {!tenant.stripeConnectedId && (
              <div className="bg-gradient-to-r from-sky-500/20 to-blue-500/20 border-2 border-sky-500/50 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-sky-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white mb-1">Connect Stripe to Accept Payments</h3>
                      <p className="text-sm text-slate-300">Enable payment processing to start accepting payments through invoices, the terminal, and bookings.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleConnectStripe}
                    disabled={isConnectingStripe}
                    className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-sky-500/20 hover:shadow-xl hover:shadow-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isConnectingStripe ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        Connect Stripe to Accept Payments
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-black text-white mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setShowInvoiceCreator(true)}
                  className="bg-gradient-to-br from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white rounded-xl p-6 text-left transition-all shadow-lg shadow-sky-500/20 hover:shadow-xl hover:shadow-sky-500/30"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-black mb-1">Create Invoice</h3>
                  <p className="text-sm text-sky-100">Send a professional invoice</p>
                </button>

                <button
                  onClick={() => router.push(`/dashboard/estimates/create?tenant=${tenantSlug}`)}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl p-6 text-left transition-all"
                >
                  <div className="w-12 h-12 bg-sky-500/20 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-black mb-1">Create Estimate</h3>
                  <p className="text-sm text-slate-400">Generate quotes and bids</p>
                </button>

                {!tenant.stripeConnectedId ? (
                  <button
                    onClick={handleConnectStripe}
                    disabled={isConnectingStripe}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl p-6 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-12 h-12 bg-sky-500/20 rounded-xl flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-black mb-1">Connect Stripe</h3>
                    <p className="text-sm text-slate-400">
                      {isConnectingStripe ? 'Connecting...' : 'Enable payment processing'}
                    </p>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsTerminalOpen(true)}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl p-6 text-left transition-all"
                  >
                    <div className="w-12 h-12 bg-sky-500/20 rounded-xl flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-black mb-1">Terminal</h3>
                    <p className="text-sm text-slate-400">Process payments instantly</p>
                  </button>
                )}
              </div>
            </div>

            {/* The Ledger Card - Show if user doesn't have Business Suite access */}
            {!hasBusinessSuiteAccess(tenant?.tier) && (
              <div className="bg-gradient-to-r from-sky-500/10 to-blue-500/10 border-2 border-sky-500/30 rounded-2xl p-8 backdrop-blur-sm">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-sky-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-8 h-8 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-white mb-2">The Ledger</h3>
                    <p className="text-slate-300 mb-4 leading-relaxed">
                      Your complete business expense and mileage tracking system. Track every expense, log business miles, and export everything to CSV for your accountant with one click. Keep your business records organized all year long.
                    </p>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setShowLedgerUpgradeModal(true)}
                        className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-black transition-all shadow-lg shadow-sky-500/20 hover:shadow-xl hover:shadow-sky-500/30"
                      >
                        Upgrade to Unlock
                      </button>
                      <button
                        onClick={() => setActiveView('ledger')}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl font-semibold transition-all"
                      >
                        Learn More
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Your Business App is Live */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">
                <h2 className="text-2xl font-black text-white mb-6">{tenant.name || tenant.business_name || 'Your Business'} App</h2>
                <div className="space-y-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <p className="text-sm text-slate-400 mb-2">App URL</p>
                    <p className="text-lg font-mono text-sky-400 break-all">vantakos.com/{tenant.slug}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={copyAppUrl}
                      className="flex-1 bg-sky-500 hover:bg-sky-600 text-white rounded-xl py-3 font-semibold transition-all shadow-lg shadow-sky-500/20"
                    >
                      Copy Link
                    </button>
                    <a
                      href={`/${tenant.slug}`}
                      target="_blank"
                      className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl py-3 font-semibold text-center transition-all"
                    >
                      Preview My App
                    </a>
                  </div>
                </div>
              </div>

              {/* Next Up - Calendar Mini-View */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">
                <h2 className="text-2xl font-black text-white mb-6">Next Up</h2>
                <div className="space-y-3">
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map((appointment) => {
                      const date = new Date(appointment.startTime);
                      return (
                        <div key={appointment.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-white">{appointment.customer_name || 'Customer'}</p>
                              <p className="text-sm text-slate-400">
                                {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              appointment.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {appointment.status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-slate-400 text-center py-8">No upcoming appointments</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Transactions (5 most recent) */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-black text-white mb-6">Recent Transactions</h2>
              <div className="space-y-3">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-white">{transaction.customer_name || 'Customer'}</p>
                          <p className="text-sm text-slate-400">{transaction.invoice_number}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-white">${parseFloat(transaction.total_amount || transaction.amount || '0').toFixed(2)}</p>
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Success
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-8">No transactions yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'ledger' && (
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
              <TheLedger tenant={tenant} />
            </div>
          </div>
        )}

        {activeView === 'settings' && (
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-black text-white mb-6">Branding Settings</h2>
              
              {/* Two-Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Controls */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-slate-300 mb-4">The Controls</h3>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Business Name</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Primary Color</label>
                    <div className="flex gap-4">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-20 h-12 rounded-xl border border-slate-800 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Secondary Color</label>
                    <div className="flex gap-4">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-20 h-12 rounded-xl border border-slate-800 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSaveBranding}
                    className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-xl py-4 font-semibold transition-all shadow-lg shadow-sky-500/20"
                  >
                    Save Changes
                  </button>
                </div>
                
                {/* Right Column: Customer View Mirror */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-slate-300 mb-4">Customer View</h3>
                  
                  {/* iPhone Mockup */}
                  <div className="relative">
                    <div className="mx-auto w-[280px] h-[580px] bg-slate-900 rounded-[3rem] p-2 shadow-2xl">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-10"></div>
                      
                      {/* Screen */}
                      <div 
                        className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden"
                        style={{ 
                          '--preview-primary': primaryColor,
                          '--preview-secondary': secondaryColor,
                        } as React.CSSProperties}
                      >
                        {/* Mobile Preview Content */}
                        <div className="h-full flex flex-col">
                          {/* Header */}
                          <header className="bg-white border-b border-slate-200 px-4 py-3">
                            <div className="flex items-center gap-2">
                              {tenant.logoUrl ? (
                                <img 
                                  src={tenant.logoUrl} 
                                  alt={businessName || tenant.name}
                                  className="w-8 h-8 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 font-black text-xs">
                                  {(businessName || tenant.name).charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="font-bold text-sm text-slate-900">{businessName || tenant.name}</span>
                            </div>
                          </header>
                          
                          {/* Hero Section */}
                          <div className="flex-1 bg-gradient-to-br from-slate-50 to-white px-4 py-8 text-center">
                            <h1 className="text-2xl font-black text-slate-900 mb-3">{businessName || tenant.name}</h1>
                            <p className="text-sm text-slate-600 mb-6">Book your appointment online</p>
                            
                            {/* CTA Button */}
                            <button
                              className="px-6 py-3 rounded-lg font-semibold text-white text-sm shadow-lg transition-all"
                              style={{ backgroundColor: primaryColor }}
                            >
                              Book Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* View My Site Buttons */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">View My Site</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <a
                        href={`https://vantakos.com/${tenant.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl py-3 px-4 font-semibold transition-all text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        Open My Public Webpage
                      </a>
                      <a
                        href={`https://vantakos.com/${tenant.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl py-3 px-4 font-semibold transition-all text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Preview Mobile Experience
                      </a>
                    </div>
                  </div>
                  
                  {/* SEO Preview Card */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Google Search Preview</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                        <p className="text-sm text-slate-700 font-medium truncate">
                          {businessName || tenant.name} - Book Online | VantakOS
                        </p>
                      </div>
                      <p className="text-xs text-emerald-700 truncate">https://vantakos.com/{tenant.slug}</p>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {tenant.seo?.description || `Book appointments with ${businessName || tenant.name}. Professional services, easy online booking.`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Ledger Upgrade Modal */}
      <UpgradeModal
        isOpen={showLedgerUpgradeModal}
        onClose={() => setShowLedgerUpgradeModal(false)}
        featureName="The Ledger"
        currentTier={tenant?.tier || 'starter'}
        targetTier="Business Suite"
        benefits={[
          'Everything in Pro: Recurring appointments, unlimited AI support.',
          'The Ledger: Track miles, expenses, and receipts all year. Download CSV files for your accountant in one click.',
          'Lowest transaction fees: Just 0.4% per transaction (vs 1.0% on Pro or 1.5% on Starter).',
          'Advanced features: Priority support, advanced analytics, and exclusive Business Suite tools.',
        ]}
        price="$79"
      />

      {/* Modals */}
      {isTerminalOpen && (
        <VantakTerminal
          tenant={tenant}
          isOpen={isTerminalOpen}
          onClose={() => setIsTerminalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {showInvoiceCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white">Create Invoice</h2>
              <button
                onClick={() => setShowInvoiceCreator(false)}
                className="text-slate-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <InvoiceCreator tenant={tenant} onInvoiceCreated={() => {
              setShowInvoiceCreator(false);
              if (tenant) fetchDashboardData(tenant.id, tenant);
            }} />
          </div>
        </div>
      )}

      {showEstimateCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white">Create Estimate</h2>
              <button
                onClick={() => setShowEstimateCreator(false)}
                className="text-slate-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-slate-400">Estimate creation coming soon...</p>
          </div>
        </div>
      )}

      {/* Installation Instructions Modal */}
      <AnimatePresence>
        {showInstallInstructions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInstallInstructions(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
                <div className="p-8">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-black text-white">Install the {tenant.name || tenant.business_name || 'Your Business'} App</h2>
                    <button
                      onClick={() => setShowInstallInstructions(false)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 mb-8 bg-slate-800/50 rounded-xl p-1">
                    <button
                      onClick={() => setInstallTab('ios')}
                      className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                        installTab === 'ios'
                          ? 'bg-slate-800 text-white shadow-lg'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      iOS (Safari)
                    </button>
                    <button
                      onClick={() => setInstallTab('android')}
                      className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                        installTab === 'android'
                          ? 'bg-slate-800 text-white shadow-lg'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Android (Chrome)
                    </button>
                  </div>

                  {/* iOS Instructions */}
                  {installTab === 'ios' && (
                    <div className="space-y-6">
                      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-sky-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl font-black text-sky-400">1</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-black text-white mb-2">Tap the Share Icon</h3>
                            <p className="text-slate-300 leading-relaxed">
                              In Safari, tap the <strong className="text-white">Share</strong> icon (the square with the up arrow) at the bottom of the screen.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-sky-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl font-black text-sky-400">2</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-black text-white mb-2">Add to Home Screen</h3>
                            <p className="text-slate-300 leading-relaxed">
                              Scroll down in the Share menu and tap <strong className="text-white">"Add to Home Screen"</strong>.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-sky-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl font-black text-sky-400">3</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-black text-white mb-2">Confirm Installation</h3>
                            <p className="text-slate-300 leading-relaxed">
                              Tap <strong className="text-white">"Add"</strong> in the top right corner to complete the installation.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Android Instructions */}
                  {installTab === 'android' && (
                    <div className="space-y-6">
                      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl font-black text-emerald-400">1</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-black text-white mb-2">Open Menu</h3>
                            <p className="text-slate-300 leading-relaxed">
                              In Chrome, tap the <strong className="text-white">three dots (⋮)</strong> in the top right corner of the browser.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl font-black text-emerald-400">2</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-black text-white mb-2">Install App</h3>
                            <p className="text-slate-300 leading-relaxed">
                              Tap <strong className="text-white">"Install App"</strong> or <strong className="text-white">"Add to Home Screen"</strong> from the menu.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl font-black text-emerald-400">3</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-black text-white mb-2">Confirm Installation</h3>
                            <p className="text-slate-300 leading-relaxed">
                              Tap <strong className="text-white">"Install"</strong> in the popup to add the app to your home screen.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Success Ding Overlay */}
      <PaymentReceivedOverlay
        isVisible={showPaymentReceived}
        amount={paymentData?.amount || 0}
        invoiceNumber={paymentData?.invoiceNumber}
        customerName={paymentData?.customerName}
        onClose={() => setShowPaymentReceived(false)}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
