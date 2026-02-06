
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TenantConfig, Service } from '../types';
import { supabase } from '../services/supabase';
import { MOCK_SERVICES, VANTAK } from '../constants';
import { BrandingEditor } from './BrandingEditor';
import { PaymentSettings } from './PaymentSettings';
import { ProductManager } from './ProductManager';
import { MarketingManager } from './MarketingManager';
import { TheLedger } from './TaxVault';
import { InvoiceManager } from './InvoiceManager';
import { OrderManager } from './OrderManager';
import { UpgradeModal } from './UpgradeModal';
import { VantakTerminal } from './VantakTerminal';
import { PaymentReceivedOverlay } from './PaymentReceivedOverlay';
import { hasMarketingEngineAccess, hasBusinessSuiteAccess } from '../lib/tierGating';
import { getTerminology } from '../lib/terminology';

interface OwnerDashboardProps {
  tenant: TenantConfig;
  onUpdateConfig: (newConfig: TenantConfig) => void;
}

type TabType = 'overview' | 'revenue' | 'invoices' | 'orders' | 'schedule' | 'branding' | 'products' | 'marketing' | 'taxvault' | 'settings';

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ tenant, onUpdateConfig }) => {
  const [config, setConfig] = useState<TenantConfig>(tenant);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [pwaHits, setPwaHits] = useState<number>(0);
  const [stripeStatus, setStripeStatus] = useState<'live' | 'pending' | 'disconnected'>('pending');
  const terms = getTerminology(tenant.business_type);
  
  // AI Support State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [aiUsageCount, setAiUsageCount] = useState<number | null>(null);
  const [aiUsageLimit, setAiUsageLimit] = useState<number | null>(tenant.tier === 'starter' ? 5 : null);
  const [aiChat, setAiChat] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: `Systems check complete. Vantak Guide online for ${tenant.name}. How can I assist your ${tenant.tier} tier operations today?` }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [upgradeModal, setUpgradeModal] = useState<{ isOpen: boolean; feature: string }>({ isOpen: false, feature: '' });
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: boolean }>({});
  const [notesValues, setNotesValues] = useState<{ [key: string]: string }>({});
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [showPaymentReceived, setShowPaymentReceived] = useState(false);
  const [paymentData, setPaymentData] = useState<{ amount: number; invoiceNumber?: string; customerName?: string } | null>(null);
  const dashboardChannelRef = useRef<any>(null);
  const autoResetTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setConfig(tenant);
    fetchData();
    
    // Check if returning from Stripe onboarding completion
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('onboarding_complete') === 'true' && urlParams.get('success') === 'true') {
      // Trigger subscription schedule creation (if not founding member)
      const handleOnboardingComplete = async () => {
        try {
          // Call subscription checkout creation API (will skip if founding member)
          const res = await fetch('/api/stripe/create-subscription-schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              tenantId: tenant.id,
              stripeAccountId: tenant.stripeConnectedId,
            }),
          });
          const data = await res.json();
          
          if (data.isFoundingMember) {
            console.log(`🏆 Founding Member - Annual fees waived for life`);
            alert('🏆 Founding Member! Your annual fees are waived for life.');
            // Clean up URL params
            window.history.replaceState({}, '', window.location.pathname);
          } else if (data.success && data.checkoutUrl) {
            // Redirect to Stripe Checkout for connectivity fee subscription
            console.log(`✅ Connectivity fee checkout session created - redirecting to checkout`);
            window.location.href = data.checkoutUrl;
            // Don't clean up URL params here - we'll be redirected to Stripe Checkout
            // The return URL will handle the success/cancel cases below
            return;
          } else if (data.success && !data.checkoutUrl) {
            // Subscription already exists
            console.log(`✅ Subscription already active`);
            // Clean up URL params
            window.history.replaceState({}, '', window.location.pathname);
          }
        } catch (err) {
          console.error('Error creating subscription checkout:', err);
          alert('Failed to create connectivity fee subscription. Please try again from the dashboard.');
          // Clean up URL params even on error
          window.history.replaceState({}, '', window.location.pathname);
        }
      };
      
      handleOnboardingComplete();
    }
    
    // Check if returning from connectivity fee subscription checkout
    if (urlParams.get('subscription') === 'success') {
      const sessionId = urlParams.get('session_id');
      console.log(`✅ Connectivity fee subscription completed: ${sessionId}`);
      alert('✅ Your connectivity fee subscription is now active! You have a 365-day free trial - your first $99 charge will occur in one year.');
      // Clean up URL params
      window.history.replaceState({}, '', window.location.pathname);
    } else if (urlParams.get('subscription') === 'cancelled') {
      console.log('❌ Connectivity fee subscription checkout was cancelled');
      alert('Subscription checkout was cancelled. You can set up your connectivity fee subscription anytime from Settings.');
      // Clean up URL params
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [tenant, activeTab]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiChat, isAiTyping]);

  // Set up Supabase Realtime listener for invoice payment updates (Dashboard-wide)
  useEffect(() => {
    // Create a channel for listening to invoice updates
    const channel = supabase
      .channel(`dashboard-invoices-${tenant.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'invoices',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        (payload) => {
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;

          // Check if status changed to 'paid'
          if (newRecord.status === 'paid' && oldRecord.status !== 'paid') {
            console.log('✅ Payment received via realtime (Dashboard):', newRecord);

            // Clear any existing auto-reset timer
            if (autoResetTimerRef.current) {
              clearTimeout(autoResetTimerRef.current);
            }

            // Show payment received overlay
            setPaymentData({
              amount: parseFloat(newRecord.total_amount || newRecord.amount || '0'),
              invoiceNumber: newRecord.invoice_number,
              customerName: newRecord.customer_name,
            });
            setShowPaymentReceived(true);

            // Refresh invoice list if on invoices tab
            if (activeTab === 'invoices' || activeTab === 'revenue') {
              fetchData();
            }

            // Auto-close after 4 seconds
            autoResetTimerRef.current = setTimeout(() => {
              setShowPaymentReceived(false);
              setPaymentData(null);
              autoResetTimerRef.current = null;
            }, 4000);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Dashboard subscribed to invoice updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Dashboard error subscribing to invoice updates');
        }
      });

    dashboardChannelRef.current = channel;

    // Handle visibility change for background/locked screen scenarios (PWA)
    const handleVisibilityChange = () => {
      if (!document.hidden && dashboardChannelRef.current) {
        console.log('Dashboard visible again - realtime subscription active');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      if (dashboardChannelRef.current) {
        supabase.removeChannel(dashboardChannelRef.current);
        dashboardChannelRef.current = null;
      }
      if (autoResetTimerRef.current) {
        clearTimeout(autoResetTimerRef.current);
        autoResetTimerRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [tenant.id, activeTab, fetchData]);

  const handlePaymentReceivedClose = () => {
    if (autoResetTimerRef.current) {
      clearTimeout(autoResetTimerRef.current);
      autoResetTimerRef.current = null;
    }
    setShowPaymentReceived(false);
    setPaymentData(null);
  };

  const triggerAiResponse = async (text: string) => {
    if (isAiTyping) return;
    
    setAiChat(prev => [...prev, { role: 'user', text }]);
    setIsAiTyping(true);
    setAttemptCount(prev => prev + 1);

    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text,
          tenantContext: tenant 
        }),
      });
      
      const data = await res.json();
      
      // Handle rate limit error (429)
      if (res.status === 429 && data.upgradeRequired) {
        const rateLimitMessage = `${data.message || 'Daily AI question limit reached.'}\n\n💡 Upgrade to Pro ($29/mo) for unlimited AI assistance.`;
        setAiChat(prev => [...prev, { 
          role: 'ai', 
          text: rateLimitMessage 
        }]);
        // Show upgrade modal
        setUpgradeModal({ isOpen: true, feature: 'Unlimited AI Assistance' });
      } else if (data.text) {
        setAiChat(prev => [...prev, { role: 'ai', text: data.text }]);
        // Update usage count if returned
        if (typeof data.usageCount === 'number') {
          setAiUsageCount(data.usageCount);
        }
        if (data.limit !== undefined) {
          setAiUsageLimit(data.limit);
        }
      } else {
        setAiChat(prev => [...prev, { role: 'ai', text: 'Core sync failed. Retrying connection...' }]);
      }
    } catch (err) {
      setAiChat(prev => [...prev, { role: 'ai', text: 'Vantak Network error. Please check your connection.' }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleSendAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiMessage.trim()) return;
    const msg = aiMessage;
    setAiMessage('');
    await triggerAiResponse(msg);
  };

  const fetchData = async () => {
    const { data: apps } = await supabase.from('appointments').select('*').eq('tenantId', tenant.id).order('startTime', { ascending: false });
    if (apps) {
      setAppointments(apps);
      // Initialize notes values
      const initialNotes: { [key: string]: string } = {};
      apps.forEach((app: any) => {
        initialNotes[app.id] = app.lesson_notes || '';
      });
      setNotesValues(initialNotes);
    }
    const { data: servs } = await supabase.from('services').select('*').eq('tenantId', tenant.id);
    if (servs && servs.length > 0) setServices(servs); else setServices(MOCK_SERVICES[tenant.id] || []);
    
    // Fetch PWA hits/installs (mock for now - replace with actual analytics when table exists)
    try {
      const { data: analytics, error } = await supabase
        .from('pwa_installs')
        .select('count')
        .eq('tenant_id', tenant.id)
        .single();
      
      if (!error && analytics?.count) {
        setPwaHits(analytics.count);
      } else {
        // Mock data for now - replace with real analytics
        setPwaHits(Math.floor(Math.random() * 150) + 50);
      }
    } catch (err) {
      // Table doesn't exist yet - use mock data
      setPwaHits(Math.floor(Math.random() * 150) + 50);
    }
    
    // Check Stripe status
    setStripeStatus(tenant.stripeConnectedId ? 'live' : 'pending');
  };
  
  const getTierDisplayName = (tier: string) => {
    const tierMap: Record<string, string> = {
      'starter': 'Vantak Free',
      'pro': 'Vantak Basic',
      'elite': 'Vantak Pro'
    };
    return tierMap[tier] || `Vantak ${tier.charAt(0).toUpperCase() + tier.slice(1)}`;
  };
  
  const handleEnablePayments = async () => {
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
        alert(`Failed to enable payments: ${data.error}`);
      }
    } catch (err: any) {
      console.error('Enable payments error:', err);
      alert('Failed to enable payments. Please try again.');
    }
  };

  const handleStripeDashboard = async () => {
    try {
      const res = await fetch('/api/stripe/login-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenant.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Stripe dashboard error:', err);
    }
  };

  const handleMenuItemClick = (itemId: string) => {
    // Check if feature is locked
    if (itemId === 'taxvault' && !hasBusinessSuiteAccess(tenant.tier) && tenant.tier !== 'business') {
      setUpgradeModal({ isOpen: true, feature: 'taxvault' });
      return;
    }
    setActiveTab(itemId as TabType);
  };

  const menuItems = [
    { id: 'overview', label: 'Command Center', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', locked: false },
    { id: 'schedule', label: 'Schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z', locked: false },
    { id: 'revenue', label: 'Financials', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', locked: false },
    // Show Invoices for Service/Education/Professional, Orders for Retail (Artisan maps to retail)
    ...(tenant.business_type === 'retail'
      ? [{ id: 'orders', label: 'Orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', locked: false }]
      : [{ id: 'invoices', label: 'Invoices', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', locked: false }]
    ),
    { id: 'branding', label: 'Branding DNA', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01', locked: false },
    { id: 'products', label: tenant.business_type === 'education' ? 'Lesson Packs' : 'Product Manager', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', locked: false },
    ...(hasMarketingEngineAccess(tenant.tier) ? [{ id: 'marketing', label: 'Marketing Engine', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', locked: false }] : []),
    { id: 'taxvault', label: 'The Ledger', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z', locked: !hasBusinessSuiteAccess(tenant.tier) && tenant.tier !== 'business' },
    { id: 'settings', label: 'OS Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37', locked: false },
  ];

  const totalRevenue = appointments.filter(a => a.paid).reduce((sum, a) => sum + (a.price || 0), 0);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-brand text-slate-900">
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-50">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-6 group cursor-pointer" onClick={() => window.location.href = '/'}>
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xl group-hover:scale-105 transition-transform">V</div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 leading-none">Vantak<span className="text-slate-600">OS</span></span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Command Center</span>
            </div>
          </div>

          {/* Pioneer Badge - Only for Founding Members */}
          {tenant.is_founding_member && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="mb-6 p-4 bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600 rounded-xl border-2 border-yellow-400 shadow-xl relative overflow-hidden"
            >
              {/* Background shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
              
              <div className="relative flex items-center gap-3">
                {/* Gold Star Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-400 border-2 border-yellow-500 shadow-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-900" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-0.5">
                    PIONEER BADGE
                  </div>
                  <div className="text-sm font-black text-white leading-tight">
                    Founding Member #{tenant.founding_member_number || '?'}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          <nav className="space-y-1.5">
            {menuItems.map((item) => (
              <button 
                key={item.id} 
                onClick={() => handleMenuItemClick(item.id)} 
                className={`w-full flex items-center justify-between gap-4 px-4 py-3 rounded-lg font-bold transition-all duration-200 text-sm group ${activeTab === item.id ? 'bg-slate-900 text-white border border-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'} ${item.locked ? 'opacity-75' : ''}`}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <svg className={`w-5 h-5 flex-shrink-0 ${activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} /></svg>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.locked && (
                  <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-8 pt-0">
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Health</span>
            </div>
            <p className="text-xs text-slate-600 font-medium">Synced with {VANTAK.parentCompany} Cloud.</p>
          </div>
        </div>
      </aside>

      <main className="flex-grow flex flex-col relative overflow-hidden">
        <header className="bg-white px-10 py-6 flex justify-between items-center border-b border-slate-200">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-slate-900 leading-none mb-1">{menuItems.find(m => m.id === activeTab)?.label}</h2>
            <div className="flex items-center gap-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Instance: {config.name}</p>
              {/* Pioneer Badge for Founding Members */}
              {tenant.is_founding_member && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-sky-400 to-sky-500 border-2 border-yellow-400 rounded-lg px-3 py-1 shadow-lg">
                  <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <span className="text-[9px] font-black text-white uppercase tracking-wider">PIONEER #{tenant.founding_member_number || '?'}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
             {/* Collect Payment Button */}
             {tenant.stripeConnectedId && (
               <button
                 onClick={() => setIsTerminalOpen(true)}
                 className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-sm transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                 </svg>
                 Collect Payment
               </button>
             )}
             <div className="text-right hidden sm:block">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OS Version</p>
               <div className="flex items-center gap-2 justify-end">
                 <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{getTierDisplayName(config.tier)}</p>
                 <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                 <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
               </div>
             </div>
             <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                {config.logoUrl ? (
                  <img 
                    src={config.logoUrl} 
                    className="w-full h-full object-cover" 
                    alt={config.name}
                    onError={(e) => {
                      console.error('Logo failed to load:', config.logoUrl);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-600 font-black text-sm">
                    {config.name.charAt(0).toUpperCase()}
                  </div>
                )}
             </div>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto p-10 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div {...({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "space-y-8" } as any)}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total Volume */}
                  <div className="bg-white p-8 rounded-lg border border-slate-200 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Volume</span>
                      <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+12.5%</span>
                    </div>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">${totalRevenue.toLocaleString()}</h3>
                  </div>
                  
                  {/* Active Schedule */}
                  <div className="bg-white p-8 rounded-lg border border-slate-200 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Schedule</span>
                      <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">High</span>
                    </div>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{appointments.length}</h3>
                  </div>
                  
                  {/* App Reach / PWA Hits */}
                  <div className="bg-white p-8 rounded-lg border border-slate-200 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">App Reach</span>
                      <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Growing</span>
                    </div>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{pwaHits.toLocaleString()}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-2">PWA opens & installs</p>
                  </div>
                  
                  {/* Stripe Status / Setup Payments Card */}
                  {!tenant.stripeConnectedId ? (
                    <div className="bg-white p-8 rounded-lg border border-slate-200 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Payment Setup</span>
                        <span className="text-[10px] font-black uppercase text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                          NOT SETUP
                        </span>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none mb-2">
                            Enable Payments
                          </h3>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
                            Accept credit cards and get paid directly to your bank. Stripe charges only apply when you're actively processing payouts.
                          </p>
                        </div>
                        <button
                          onClick={handleEnablePayments}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-lg font-black text-sm uppercase tracking-widest transition-all"
                        >
                          Enable Payments
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-8 rounded-lg border border-slate-200 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Stripe Status</span>
                        <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                          LIVE
                        </span>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                          Payments: <span className="text-emerald-600">LIVE</span>
                        </h3>
                        <button
                          onClick={handleStripeDashboard}
                          className="text-xs font-black text-slate-900 hover:text-slate-700 uppercase tracking-widest transition-colors"
                        >
                          → Stripe Dashboard
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            {activeTab === 'schedule' && (
              <motion.div {...({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "space-y-8" } as any)}>
                <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">
                    Appointment Schedule
                  </h2>
                  <p className="text-slate-500 font-medium">
                    Manage all your appointments.
                  </p>
                </div>
                
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <div className="p-8 space-y-6">
                    {appointments.length === 0 ? (
                      <div className="text-center py-20 text-slate-400">
                        <p className="text-lg font-medium">No appointments yet</p>
                      </div>
                    ) : (
                      appointments.map((appointment: any) => {
                        const service = services.find(s => s.id === appointment.serviceId);
                        const isEditing = editingNotes[appointment.id] || false;
                        const notesValue = notesValues[appointment.id] || appointment.lesson_notes || '';
                        
                        const handleSaveNotes = async () => {
                          const { error } = await supabase
                            .from('appointments')
                            .update({ lesson_notes: notesValue })
                            .eq('id', appointment.id);
                          
                          if (!error) {
                            setEditingNotes(prev => ({ ...prev, [appointment.id]: false }));
                            fetchData();
                          }
                        };
                        
                        return (
                          <div key={appointment.id} className="border border-slate-200 rounded-lg p-6 space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-xl font-black text-slate-900">{service?.name || 'Unknown Service'}</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                  {new Date(appointment.startTime).toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    month: 'long', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })} at {new Date(appointment.startTime).toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  appointment.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600' :
                                  appointment.status === 'COMPLETED' ? 'bg-blue-50 text-blue-600' :
                                  appointment.status === 'CANCELLED' ? 'bg-red-50 text-red-600' :
                                  'bg-yellow-50 text-yellow-600'
                                }`}>
                                  {appointment.status}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-black text-slate-900">${service?.price || 0}</p>
                              </div>
                            </div>
                            
                            {tenant.business_type === 'education' && appointment.status === 'COMPLETED' && (
                              <div className="pt-4 border-t border-slate-200">
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-sm font-black text-slate-900 uppercase tracking-wider">Lesson Notes</label>
                                  {!isEditing && (
                                    <button 
                                      onClick={() => {
                                        setEditingNotes(prev => ({ ...prev, [appointment.id]: true }));
                                        setNotesValues(prev => ({ ...prev, [appointment.id]: appointment.lesson_notes || '' }));
                                      }}
                                      className="text-xs font-black text-slate-900 hover:text-slate-700 uppercase tracking-wider"
                                    >
                                      {appointment.lesson_notes ? 'Edit' : 'Add Notes'}
                                    </button>
                                  )}
                                </div>
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <textarea
                                      value={notesValue}
                                      onChange={(e) => setNotesValues(prev => ({ ...prev, [appointment.id]: e.target.value }))}
                                      placeholder="e.g., Practice Page 14, Focus on scales..."
                                      className="w-full p-4 border border-slate-300 rounded-lg text-sm font-medium resize-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                                      rows={3}
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={handleSaveNotes}
                                        className="bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-black uppercase tracking-wider hover:bg-slate-800 transition-colors"
                                      >
                                        Save Notes
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingNotes(prev => ({ ...prev, [appointment.id]: false }));
                                          setNotesValues(prev => ({ ...prev, [appointment.id]: appointment.lesson_notes || '' }));
                                        }}
                                        className="bg-white border border-slate-200 text-slate-900 px-6 py-2 rounded-lg text-sm font-black uppercase tracking-wider hover:bg-slate-50 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-600 font-medium bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    {appointment.lesson_notes || 'No notes added yet.'}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </motion.div>
            )}
            {activeTab === 'revenue' && (
              <motion.div {...({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "space-y-8" } as any)}>
                <div className="bg-white p-8 rounded-lg border border-slate-200">
                  <h3 className="text-2xl font-black text-slate-900 mb-6">Financial Overview</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                        <div className="text-sm font-black uppercase tracking-widest text-slate-500 mb-2">Total Revenue</div>
                        <div className="text-3xl font-black text-slate-900">${totalRevenue.toFixed(2)}</div>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                        <div className="text-sm font-black uppercase tracking-widest text-slate-500 mb-2">Paid Appointments</div>
                        <div className="text-3xl font-black text-slate-900">{appointments.filter(a => a.paid).length}</div>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                        <div className="text-sm font-black uppercase tracking-widest text-slate-500 mb-2">Pending</div>
                        <div className="text-3xl font-black text-slate-900">{appointments.filter(a => !a.paid).length}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            {activeTab === 'invoices' && (tenant.business_type === 'service' || tenant.business_type === 'education' || tenant.business_type === 'professional') && (
              <InvoiceManager tenant={config} />
            )}
            {activeTab === 'orders' && tenant.business_type === 'retail' && (
              <OrderManager tenant={config} />
            )}
            {activeTab === 'branding' && <BrandingEditor tenant={config} onSaveSuccess={onUpdateConfig} />}
            {activeTab === 'products' && <ProductManager tenant={config} />}
            {activeTab === 'marketing' && hasMarketingEngineAccess(tenant.tier) && <MarketingManager tenant={config} />}
            {activeTab === 'taxvault' && (hasBusinessSuiteAccess(tenant.tier) || tenant.tier === 'business') && <TheLedger tenant={config} />}
            {activeTab === 'settings' && (
              <div className="space-y-8">
                <PaymentSettings tenant={config} />
                
                {/* Billing & Settings Section */}
                <motion.div
                  {...({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "bg-white p-6 rounded-lg border border-slate-200" } as any)}
                >
                  <h3 className="text-lg font-black text-slate-900 mb-4">Billing & Settings</h3>
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                      <p className="text-sm text-slate-700 font-medium leading-relaxed">
                        <span className="font-black text-slate-900">Current Plan: {getTierDisplayName(config.tier)} ($0/mo).</span> 
                        {' '}Your plan uses standard cloud processing at {config.platform_fee_percent}% to maintain your app and hosting. 
                        No monthly subscription required.
                      </p>
                    </div>
                    <div className="pt-2">
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                        You receive a professional app, payment system, and hosting infrastructure at no monthly cost. 
                        Standard Stripe processing fees apply separately to transactions.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Vantak Helper UI */}
        <div className="fixed bottom-12 right-8 z-[200] flex flex-col items-end gap-4">
          <AnimatePresence>
            {isAiOpen && (
              <motion.div
                {...({ initial: { opacity: 0, y: 30, scale: 0.9 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 30, scale: 0.9 }, className: "w-[400px] h-[600px] bg-white border border-slate-200 rounded-lg shadow-lg flex flex-col overflow-hidden" } as any)}
              >
                {/* AI Header */}
                <div className="p-8 pb-6 flex items-center justify-between border-b border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xl">V</div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Vantak Guide</h4>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Active</span>
                        {tenant.tier === 'starter' && aiUsageLimit !== null && (
                          <>
                            <span className="text-[10px] font-black text-slate-500">•</span>
                            <span className="text-[10px] font-black text-slate-400">
                              {aiUsageCount !== null ? `${aiUsageCount}/${aiUsageLimit}` : `0/${aiUsageLimit}`} today
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setIsAiOpen(false)} className="w-10 h-10 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>

                {/* AI Quick Actions */}
                <div className="px-8 py-5 flex gap-2 overflow-x-auto no-scrollbar border-b border-slate-200">
                   <button 
                    onClick={() => triggerAiResponse("How do I change my logo?")}
                    className="flex items-center gap-2 whitespace-nowrap bg-white border border-slate-200 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-900 hover:text-white transition-all"
                   >
                     🖼 Branding
                   </button>
                   <button 
                    onClick={() => triggerAiResponse("How do I get paid?")}
                    className="flex items-center gap-2 whitespace-nowrap bg-white border border-slate-200 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-900 hover:text-white transition-all"
                   >
                     💸 Payouts
                   </button>
                   <button 
                    onClick={() => triggerAiResponse("How do I install my app?")}
                    className="flex items-center gap-2 whitespace-nowrap bg-white border border-slate-200 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-900 hover:text-white transition-all"
                   >
                     📲 App PWA
                   </button>
                </div>

                {/* AI Chat Area */}
                <div ref={scrollRef} className="flex-grow p-8 overflow-y-auto space-y-5 no-scrollbar">
                  {aiChat.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-6 py-4 rounded-lg text-[14px] font-medium leading-relaxed ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900 border border-slate-200'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {isAiTyping && (
                    <div className="flex justify-start">
                      <div className="bg-slate-50 border border-slate-200 px-6 py-4 rounded-lg flex items-center gap-4">
                         <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">Computing</span>
                         <div className="flex gap-1.5">
                           <span className="w-2 h-2 bg-slate-900 rounded-full animate-bounce [animation-delay:-0.3s]" />
                           <span className="w-2 h-2 bg-slate-900 rounded-full animate-bounce [animation-delay:-0.15s]" />
                           <span className="w-2 h-2 bg-slate-900 rounded-full animate-bounce" />
                         </div>
                      </div>
                    </div>
                  )}

                  {attemptCount >= 2 && (
                    <motion.div {...({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "p-6 bg-slate-50 border border-slate-200 rounded-lg space-y-4" } as any)}>
                       <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Escalation Protocol</p>
                       <p className="text-xs text-slate-600 leading-snug">My intelligence is reaching its current limit. Connect with our engineering core at <a href="mailto:support@kcdevco.com" className="text-slate-900 font-black underline">support@kcdevco.com</a>.</p>
                    </motion.div>
                  )}
                </div>

                {/* AI Input Area */}
                <form onSubmit={handleSendAi} className="p-8 bg-slate-50 border-t border-slate-200 flex gap-4">
                  <input 
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                    placeholder="Ask about your OS..."
                    className="flex-grow bg-white border border-slate-200 px-6 py-5 rounded-lg text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 placeholder:text-slate-400 transition-all"
                  />
                  <button className="bg-slate-900 text-white w-16 h-16 rounded-lg flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating FAB Trigger */}
          <button 
            onClick={() => setIsAiOpen(!isAiOpen)}
            className={`w-20 h-20 rounded-lg shadow-lg flex items-center justify-center transition-all duration-700 group relative ${isAiOpen ? 'bg-white border border-slate-200 text-slate-900 rotate-90 scale-110' : 'bg-slate-900 text-white'}`}
          >
            <div className={`absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border-2 border-slate-900 flex items-center justify-center transition-transform ${isAiOpen ? 'scale-0' : 'scale-100'}`}>
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
            </div>
            {isAiOpen ? (
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
            ) : (
              <div className="flex flex-col items-center">
                <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                <span className="text-[8px] font-black uppercase tracking-[0.3em] mt-1">Guide</span>
              </div>
            )}
          </button>
        </div>

        <footer className="bg-white px-10 py-3 border-t border-slate-200 flex items-center justify-between z-40 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
           <div className="flex items-center gap-8">
              <div className="flex items-center gap-3 text-slate-500">
                 <div className="w-2 h-2 rounded-full bg-emerald-500" />
                 OS Kernel Operational
              </div>
              <div className="h-4 w-[1px] bg-slate-200" />
              <div className="flex items-center gap-2">Connect Link: Valid</div>
           </div>
           <div>{VANTAK.productName} Core v1.3.1-ignition</div>
        </footer>
      </main>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={upgradeModal.isOpen}
        onClose={() => setUpgradeModal({ isOpen: false, feature: '' })}
        featureName={upgradeModal.feature === 'Unlimited AI Assistance' ? 'Unlimited AI Assistance' : 'The Ledger'}
        currentTier={getTierDisplayName(tenant.tier)}
        targetTier={upgradeModal.feature === 'Unlimited AI Assistance' ? 'Pro' : 'Business Suite'}
        benefits={upgradeModal.feature === 'Unlimited AI Assistance' ? [
          'Ask unlimited questions to Vantak Guide every day.',
          'Get instant answers about your business operations 24/7.',
          'No more daily limits—use AI assistance whenever you need it.',
          'Plus all Pro tier benefits: Recurring appointments, lower transaction fees, and more.'
        ] : [
          'Everything in Pro: Recurring appointments, unlimited AI support.',
          'The Ledger: Track miles, expenses, and receipts all year. Download CSV files for your accountant in one click.',
          'Lowest transaction fees: Just 0.4% per transaction (vs 1.0% on Pro or 1.5% on Starter).',
          'Advanced features: Priority support, advanced analytics, and exclusive Business Suite tools.'
        ]}
        price={upgradeModal.feature === 'Unlimited AI Assistance' ? '$29' : '$79'}
      />

      {/* Vantak Terminal Modal */}
      <VantakTerminal
        tenant={config}
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        onPaymentSuccess={(paymentData) => {
          // Refresh dashboard data after successful payment
          // The webhook will handle creating invoice and ledger entry
          console.log('Payment successful:', paymentData);
          setIsTerminalOpen(false);
          // Refresh data to show new invoice/ledger entry
          fetchData();
        }}
      />

      {/* Payment Received Overlay (Dashboard-wide) */}
      {showPaymentReceived && paymentData && (
        <PaymentReceivedOverlay
          isVisible={showPaymentReceived}
          amount={paymentData.amount}
          invoiceNumber={paymentData.invoiceNumber}
          customerName={paymentData.customerName}
          onClose={handlePaymentReceivedClose}
        />
      )}
    </div>
  );
};
